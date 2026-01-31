import { registerPlugin, jsonResponse, errorResponse, getStartTime, withCache, generateCacheKey, httpClient } from "@/lib";
import { NextRequest } from "next/server";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import axios from "axios";

interface TikTokResult {
    metadata: {
        id: string;
        description: string;
        createTime: string;
        region: string;
        hashtags: Array<{ id: string; name: string }>;
    };
    video: {
        duration: number;
        resolution: string;
        cover: string;
        playUrl: string;
        downloadUrl: string;
    };
    author: {
        id: string;
        uniqueId: string;
        nickname: string;
        avatar: string;
        verified: boolean;
    };
    music: {
        id: string;
        title: string;
        author: string;
        cover: string;
        playUrl: string;
    };
    stats: {
        views: number;
        likes: number;
        comments: number;
        shares: number;
        saves: number;
    };
}

const TIKTOK_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
};

const CACHE_TTL = 1000 * 60 * 5;

async function scrapeTikTok(url: string): Promise<TikTokResult> {
    const jar = new CookieJar();
    const client = wrapper(axios.create({
        jar,
        withCredentials: true,
        headers: TIKTOK_HEADERS,
        timeout: 20000,
    }));

    const response = await client.get(url);
    const $ = cheerio.load(response.data);

    const scriptContent = $("#__UNIVERSAL_DATA_FOR_REHYDRATION__").html() || $("#SIGI_STATE").html();
    if (!scriptContent) {
        throw new Error("TikTok data not found. The video may be private or the URL is invalid.");
    }

    const jsonData = JSON.parse(scriptContent);
    const defaultScope = jsonData?.__DEFAULT_SCOPE__;
    const itemStruct = defaultScope?.["webapp.video-detail"]?.itemInfo?.itemStruct 
        || Object.values(jsonData.ItemModule || {})[0] as Record<string, unknown>;

    if (!itemStruct) {
        throw new Error("Video data structure not found");
    }

    const item = itemStruct as Record<string, unknown>;
    const videoData = item.video as Record<string, unknown>;
    const authorData = item.author as Record<string, unknown>;
    const musicData = item.music as Record<string, unknown>;
    const statsData = (item.statsV2 || item.stats) as Record<string, unknown>;
    const challenges = item.challenges as Array<Record<string, unknown>> || [];

    let playUrl = (videoData?.playAddr || videoData?.downloadAddr) as string;
    
    if (videoData?.bitrateInfo && Array.isArray(videoData.bitrateInfo)) {
        const bitrateInfo = videoData.bitrateInfo as Array<Record<string, unknown>>;
        const sorted = bitrateInfo.sort((a, b) => (b.Bitrate as number) - (a.Bitrate as number));
        const best = sorted[0];
        if (best) {
            const playAddr = best.PlayAddr as Record<string, unknown>;
            const urlList = playAddr?.UrlList as string[];
            if (urlList?.length) {
                playUrl = urlList.find(u => u.includes("aweme/v1/play")) || urlList[urlList.length - 1];
            }
        }
    }

    return {
        metadata: {
            id: item.id as string,
            description: item.desc as string,
            createTime: new Date((item.createTime as number) * 1000).toISOString(),
            region: (item.locationCreated as string) || "Unknown",
            hashtags: challenges.map(tag => ({
                id: tag.id as string,
                name: tag.title as string,
            })),
        },
        video: {
            duration: videoData?.duration as number,
            resolution: `${videoData?.width}x${videoData?.height}`,
            cover: videoData?.cover as string,
            playUrl: playUrl,
            downloadUrl: (videoData?.downloadAddr || playUrl) as string,
        },
        author: {
            id: authorData?.id as string,
            uniqueId: authorData?.uniqueId as string,
            nickname: authorData?.nickname as string,
            avatar: (authorData?.avatarLarger || authorData?.avatarThumb) as string,
            verified: authorData?.verified as boolean,
        },
        music: {
            id: musicData?.id as string,
            title: musicData?.title as string,
            author: musicData?.authorName as string,
            cover: musicData?.coverLarge as string,
            playUrl: musicData?.playUrl as string,
        },
        stats: {
            views: (statsData?.playCount as number) || 0,
            likes: (statsData?.diggCount as number) || 0,
            comments: (statsData?.commentCount as number) || 0,
            shares: (statsData?.shareCount as number) || 0,
            saves: (statsData?.collectCount as number) || 0,
        },
    };
}

registerPlugin({
    name: "TikTok Downloader",
    slug: "tiktok",
    category: "download",
    description: "Download videos from TikTok",
    endpoint: {
        title: "TikTok Downloader",
        description: "Extract and download videos from TikTok URLs",
        path: "/api/download/tiktok",
        method: "GET",
        responseType: "json",
        tags: ["tiktok", "download", "video", "social media"],
        parameters: [
            {
                name: "url",
                required: true,
                description: "TikTok video URL",
                type: "string",
            },
        ],
        run: async (request: NextRequest) => {
            const startTime = getStartTime();
            const url = request.nextUrl.searchParams.get("url");

            if (!url) {
                return errorResponse("Parameter 'url' is required", 400, startTime);
            }

            if (!url.includes("tiktok.com")) {
                return errorResponse("Invalid TikTok URL", 400, startTime);
            }

            try {
                const cacheKey = generateCacheKey("tiktok", url);

                const result = await withCache<TikTokResult>(
                    cacheKey,
                    () => scrapeTikTok(url),
                    CACHE_TTL
                );

                return jsonResponse(result, 200, startTime, "SHORT");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to download TikTok video";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});