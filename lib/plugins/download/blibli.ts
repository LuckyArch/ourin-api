import { registerPlugin, jsonResponse, errorResponse, getStartTime, withCache, generateCacheKey, httpClient } from "@/lib";
import { NextRequest } from "next/server";

interface BilibiliResult {
    aid: string;
    format: string;
    url: string;
}

const BILIBILI_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
    "Content-Type": "application/x-www-form-urlencoded",
    "Origin": "https://bilibili-video-downloader.com",
    "Referer": "https://bilibili-video-downloader.com/id/",
};

const CACHE_TTL = 1000 * 60 * 10;

async function fetchBilibili(url: string): Promise<BilibiliResult> {
    const match = url.match(/\/video\/(\d+)/);
    if (!match) {
        throw new Error("Invalid Bilibili URL format");
    }
    const aid = match[1];

    const htmlResponse = await httpClient.get("https://bilibili-video-downloader.com", { timeout: 15000 });
    const nonceMatch = htmlResponse.data.match(/const bilibiliNonce = '([a-z0-9]+)'/i);
    
    if (!nonceMatch) {
        throw new Error("Failed to get nonce from Bilibili downloader");
    }
    const nonce = nonceMatch[1];

    const params = new URLSearchParams({
        nonce,
        format: "mp4",
        action: "get_bilibili_tv_video",
        aid,
    });

    const response = await httpClient.post(
        "https://bilibili-video-downloader.com/wp-admin/admin-ajax.php",
        params.toString(),
        { headers: BILIBILI_HEADERS, timeout: 30000 }
    );

    const data = response.data?.data;
    if (!data?.video_url) {
        throw new Error("Failed to fetch Bilibili video");
    }

    return {
        aid,
        format: data.format,
        url: data.video_url,
    };
}

registerPlugin({
    name: "Bilibili Downloader",
    slug: "bilibili",
    category: "download",
    description: "Download videos from Bilibili",
    endpoint: {
        title: "Bilibili Downloader",
        description: "Download videos from Bilibili TV",
        path: "/api/download/bilibili",
        method: "GET",
        responseType: "json",
        tags: ["bilibili", "download", "video", "anime"],
        parameters: [
            {
                name: "url",
                required: true,
                description: "Bilibili video URL",
                type: "string",
            },
        ],
        run: async (request: NextRequest) => {
            const startTime = getStartTime();
            const url = request.nextUrl.searchParams.get("url");

            if (!url) {
                return errorResponse("Parameter 'url' is required", 400, startTime);
            }

            if (!url.includes("bilibili")) {
                return errorResponse("Invalid Bilibili URL", 400, startTime);
            }

            try {
                const cacheKey = generateCacheKey("bilibili", url);

                const result = await withCache<BilibiliResult>(
                    cacheKey,
                    () => fetchBilibili(url),
                    CACHE_TTL
                );

                return jsonResponse(result, 200, startTime, "SHORT");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to download Bilibili video";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});