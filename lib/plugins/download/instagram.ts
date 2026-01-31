import { registerPlugin, jsonResponse, errorResponse, getStartTime, withCache, generateCacheKey, httpClient } from "@/lib";
import { NextRequest } from "next/server";
import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";

interface VideoTrack {
    url: string;
    bandwidth: number;
    codecs: string;
    mimeType: string;
    resolution: string;
    qualityLabel: string;
}

interface AudioTrack {
    url: string;
    bandwidth: number;
    codecs: string;
    mimeType: string;
}

interface InstagramResult {
    metadata: {
        id: string;
        code: string;
        caption: string;
        createTime: string;
    };
    author: {
        id: string;
        username: string;
        fullName: string;
        profilePic: string;
        verified: boolean;
    };
    media: {
        thumbnails: Array<{ url: string; resolution: string }>;
        videos: VideoTrack[];
        audios: AudioTrack[];
    };
}

const INSTAGRAM_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "max-age=0",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Upgrade-Insecure-Requests": "1",
};

const CACHE_TTL = 1000 * 60 * 10;

async function scrapeInstagram(url: string): Promise<InstagramResult> {
    const response = await httpClient.get(url, {
        headers: INSTAGRAM_HEADERS,
        timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    let scriptJson: Record<string, unknown> | null = null;

    $('script[type="application/json"]').each((_, el) => {
        const content = $(el).html();
        if (content && content.includes("xdt_api__v1__media__shortcode__web_info")) {
            try {
                scriptJson = JSON.parse(content);
            } catch {
                return;
            }
        }
    });

    if (!scriptJson) {
        throw new Error("Data not found. Instagram may have blocked this request or the URL is invalid.");
    }

    const jsonData = scriptJson as Record<string, unknown>;
    const requireArr = jsonData.require as unknown[];
    if (!requireArr || !Array.isArray(requireArr)) {
        throw new Error("Invalid data structure from Instagram.");
    }

    const nested = requireArr[0] as unknown[];
    const bbox1 = (nested?.[3] as unknown[])?.[0] as Record<string, unknown>;
    const bbox2 = (bbox1?.__bbox as Record<string, unknown>)?.require as unknown[];
    const bbox3 = (bbox2?.[0] as unknown[])?.[3] as unknown[];
    const bbox4 = (bbox3?.[1] as Record<string, unknown>)?.__bbox as Record<string, unknown>;
    const result = bbox4?.result as Record<string, unknown>;
    const data = result?.data as Record<string, unknown>;
    const webInfo = data?.xdt_api__v1__media__shortcode__web_info as Record<string, unknown>;
    const items = webInfo?.items as unknown[];
    const item = items?.[0] as Record<string, unknown>;

    if (!item) {
        throw new Error("Media item not found in Instagram response.");
    }

    const dashXml = item.video_dash_manifest as string;
    if (!dashXml) {
        throw new Error("This content does not contain video (only images are not supported yet).");
    }

    const parser = new XMLParser({ ignoreAttributes: false });
    const manifest = parser.parse(dashXml);

    const period = manifest.MPD?.Period;
    if (!period) {
        throw new Error("Invalid DASH manifest structure.");
    }

    const adaptationSets = Array.isArray(period.AdaptationSet) ? period.AdaptationSet : [period.AdaptationSet];
    const videoTracks: VideoTrack[] = [];
    const audioTracks: AudioTrack[] = [];

    adaptationSets.forEach((set: Record<string, unknown>) => {
        if (!set) return;

        const isVideo = set["@_contentType"] === "video";
        const isAudio = set["@_contentType"] === "audio";
        const representations = Array.isArray(set.Representation) ? set.Representation : [set.Representation];

        representations.forEach((rep: Record<string, unknown>) => {
            if (!rep) return;

            const track = {
                url: rep.BaseURL as string,
                bandwidth: parseInt(rep["@_bandwidth"] as string) || 0,
                codecs: (rep["@_codecs"] as string) || "",
                mimeType: (rep["@_mimeType"] as string) || "",
            };

            if (isVideo) {
                videoTracks.push({
                    ...track,
                    resolution: `${rep["@_width"]}x${rep["@_height"]}`,
                    qualityLabel: (rep["@_FBQualityLabel"] as string) || "",
                });
            } else if (isAudio) {
                audioTracks.push(track);
            }
        });
    });

    videoTracks.sort((a, b) => b.bandwidth - a.bandwidth);

    const user = item.user as Record<string, unknown>;
    const caption = item.caption as Record<string, unknown>;
    const imageVersions = item.image_versions2 as Record<string, unknown>;
    const candidates = (imageVersions?.candidates as unknown[]) || [];
    const hdProfilePic = user?.hd_profile_pic_url_info as Record<string, unknown>;

    return {
        metadata: {
            id: item.id as string,
            code: item.code as string,
            caption: (caption?.text as string) || "",
            createTime: new Date((item.taken_at as number) * 1000).toISOString(),
        },
        author: {
            id: user?.pk as string,
            username: (user?.username as string) || "Unknown",
            fullName: (user?.full_name as string) || "",
            profilePic: (hdProfilePic?.url as string) || "",
            verified: (user?.is_verified as boolean) || false,
        },
        media: {
            thumbnails: candidates.map((img: unknown) => {
                const imgData = img as Record<string, unknown>;
                return {
                    url: imgData.url as string,
                    resolution: `${imgData.width}x${imgData.height}`,
                };
            }),
            videos: videoTracks,
            audios: audioTracks,
        },
    };
}

registerPlugin({
    name: "Instagram Downloader",
    slug: "instagram",
    category: "download",
    description: "Download videos from Instagram Reels",
    endpoint: {
        title: "Instagram Downloader",
        description: "Extract and download videos from Instagram Reels URLs",
        path: "/api/download/instagram",
        method: "GET",
        responseType: "json",
        tags: ["instagram", "download", "video", "reels", "social media"],
        parameters: [
            {
                name: "url",
                required: true,
                description: "Instagram Reels URL (e.g., https://www.instagram.com/reel/xxx)",
                type: "string",
            },
        ],
        run: async (request: NextRequest) => {
            const startTime = getStartTime();
            const url = request.nextUrl.searchParams.get("url");

            if (!url) {
                return errorResponse("Parameter 'url' is required", 400, startTime);
            }

            if (!url.includes("instagram.com")) {
                return errorResponse("Invalid Instagram URL", 400, startTime);
            }

            try {
                const cacheKey = generateCacheKey("instagram", url);

                const result = await withCache<InstagramResult>(
                    cacheKey,
                    () => scrapeInstagram(url),
                    CACHE_TTL
                );

                return jsonResponse(result, 200, startTime, "SHORT");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to fetch Instagram content";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});