import { registerPlugin, jsonResponse, errorResponse, getStartTime, withCache, generateCacheKey, httpClient } from "@/lib";
import { NextRequest } from "next/server";
import crypto from "crypto";

interface YouTubeDownload {
    quality: string;
    label: string;
    url: string;
}

interface YouTubeResult {
    title: string;
    duration: string;
    thumbnail: string;
    videos: YouTubeDownload[];
}

const AES_KEY = Buffer.from("C5D58EF67A7584E4A29F6C35BBC4EB12", "hex");

const SAVETUBE_HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Origin": "https://ytsave.savetube.me",
    "Referer": "https://ytsave.savetube.me/",
};

const CACHE_TTL = 1000 * 60 * 30;

function decryptData(encrypted: string): Record<string, unknown> {
    const buffer = Buffer.from(encrypted.replace(/\s/g, ""), "base64");
    const iv = buffer.subarray(0, 16);
    const data = buffer.subarray(16);
    const decipher = crypto.createDecipheriv("aes-128-cbc", AES_KEY, iv);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return JSON.parse(decrypted.toString());
}

async function fetchSavetube(url: string): Promise<YouTubeResult> {
    const cdnResponse = await httpClient.get("https://media.savetube.me/api/random-cdn");
    const cdn = cdnResponse.data.cdn;

    const infoResponse = await httpClient.post(
        `https://${cdn}/v2/info`,
        { url },
        { headers: SAVETUBE_HEADERS, timeout: 30000 }
    );

    if (!infoResponse.data?.status) {
        throw new Error("Failed to get video info from YouTube");
    }

    const videoData = decryptData(infoResponse.data.data);

    async function getDownloadUrl(type: string, quality: string): Promise<string | null> {
        try {
            const response = await httpClient.post(
                `https://${cdn}/download`,
                {
                    id: videoData.id,
                    key: videoData.key,
                    downloadType: type,
                    quality: String(quality),
                },
                { headers: SAVETUBE_HEADERS, timeout: 30000 }
            );
            return response.data?.data?.downloadUrl || null;
        } catch {
            return null;
        }
    }

    const videos: YouTubeDownload[] = [];

    const videoFormats = videoData.video_formats as Array<Record<string, unknown>>;
    const audioFormats = videoData.audio_formats as Array<Record<string, unknown>>;

    for (const v of videoFormats || []) {
        const downloadUrl = await getDownloadUrl("video", v.quality as string);
        if (downloadUrl) {
            videos.push({
                quality: v.quality as string,
                label: v.label as string,
                url: downloadUrl,
            });
        }
    }

    for (const a of audioFormats || []) {
        const downloadUrl = await getDownloadUrl("audio", a.quality as string);
        if (downloadUrl) {
            videos.push({
                quality: a.quality as string,
                label: `Audio - ${a.label}`,
                url: downloadUrl,
            });
        }
    }

    return {
        title: videoData.title as string,
        duration: videoData.duration as string,
        thumbnail: videoData.thumbnail as string,
        videos,
    };
}

registerPlugin({
    name: "YouTube Downloader V2",
    slug: "youtubev2",
    category: "download",
    description: "Download videos from YouTube (via Savetube)",
    endpoint: {
        title: "YouTube Downloader V2",
        description: "Download YouTube videos with multiple quality options",
        path: "/api/download/youtubev2",
        method: "GET",
        responseType: "json",
        tags: ["youtube", "download", "video", "mp4", "mp3", "savetube"],
        parameters: [
            {
                name: "url",
                required: true,
                description: "YouTube video URL",
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
                const cacheKey = generateCacheKey("youtubev2", url);

                const result = await withCache<YouTubeResult>(
                    cacheKey,
                    () => fetchSavetube(url),
                    CACHE_TTL
                );

                return jsonResponse(result, 200, startTime, "SHORT");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to download YouTube video";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});