import { registerPlugin, jsonResponse, errorResponse, getStartTime, withCache, generateCacheKey, httpClient } from "@/lib";
import { NextRequest } from "next/server";
import crypto from "crypto";
import qs from "qs";

interface YouTubeDownload {
    quality: string;
    format: string;
    size: string;
    url: string;
    audio: boolean;
}

interface YouTubeResult {
    meta: {
        id: string;
        title: string;
        duration: string;
        thumbnail: string;
    };
    downloads: YouTubeDownload[];
}

const SSYOUTUBE_CONFIG = {
    BASE_URL: "https://ssyoutube.com",
    API_PATH: "/api/convert",
    SALT: "384d5028ee4a399f6cae0175025a1708aa924fc0ccb08be1aa359cd856dd1639",
    FIXED_TS: "1765962059039",
};

const SSYOUTUBE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    "Origin": "https://ssyoutube.com",
    "Referer": "https://ssyoutube.com/",
};

const CACHE_TTL = 1000 * 60 * 30;

function generateSignature(url: string, timestamp: string): string {
    const rawString = url + timestamp + SSYOUTUBE_CONFIG.SALT;
    return crypto.createHash("sha256").update(rawString).digest("hex");
}

function formatFileSize(bytes: number | undefined): string {
    if (!bytes) return "Unknown";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

async function fetchYouTube(videoUrl: string): Promise<YouTubeResult> {
    const currentTs = Date.now().toString();
    const signature = generateSignature(videoUrl, currentTs);

    const payload = {
        sf_url: videoUrl,
        ts: currentTs,
        _ts: SSYOUTUBE_CONFIG.FIXED_TS,
        _tsc: "0",
        _s: signature,
    };

    const response = await httpClient.post(
        SSYOUTUBE_CONFIG.BASE_URL + SSYOUTUBE_CONFIG.API_PATH,
        qs.stringify(payload),
        { headers: SSYOUTUBE_HEADERS, timeout: 30000 }
    );

    const data = response.data as Record<string, unknown>;

    if (!data || !data.url) {
        throw new Error("Failed to fetch video data. The server may be blocking requests.");
    }

    const meta = data.meta as Record<string, unknown>;
    const urls = data.url as Array<Record<string, unknown>>;

    const result: YouTubeResult = {
        meta: {
            id: data.id as string,
            title: meta?.title as string,
            duration: meta?.duration as string,
            thumbnail: data.thumb as string,
        },
        downloads: [],
    };

    if (Array.isArray(urls)) {
        result.downloads = urls
            .filter((item) => !item.no_audio)
            .map((item) => ({
                quality: (item.quality as string) || (item.subname as string),
                format: item.ext as string,
                size: formatFileSize(item.filesize as number),
                url: item.url as string,
                audio: item.audio as boolean,
            }));
    }

    return result;
}

registerPlugin({
    name: "YouTube Downloader",
    slug: "youtube",
    category: "download",
    description: "Download videos from YouTube",
    endpoint: {
        title: "YouTube Downloader",
        description: "Extract and download videos from YouTube URLs",
        path: "/api/download/youtube",
        method: "GET",
        responseType: "json",
        tags: ["youtube", "download", "video", "mp4", "mp3"],
        parameters: [
            {
                name: "url",
                required: true,
                description: "YouTube video URL (e.g., https://youtube.com/watch?v=xxx or https://youtu.be/xxx)",
                type: "string",
            },
        ],
        run: async (request: NextRequest) => {
            const startTime = getStartTime();
            const url = request.nextUrl.searchParams.get("url");

            if (!url) {
                return errorResponse("Parameter 'url' is required", 400, startTime);
            }

            if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
                return errorResponse("Invalid YouTube URL", 400, startTime);
            }

            try {
                const cacheKey = generateCacheKey("youtube", url);

                const result = await withCache<YouTubeResult>(
                    cacheKey,
                    () => fetchYouTube(url),
                    CACHE_TTL
                );

                return jsonResponse(result, 200, startTime, "SHORT");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to fetch YouTube video";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});