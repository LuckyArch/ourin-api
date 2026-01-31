import { registerPlugin, jsonResponse, errorResponse, getStartTime, withCache, generateCacheKey, httpClient } from "@/lib";
import { NextRequest } from "next/server";
import crypto from "crypto";
import qs from "qs";

interface IgramMedia {
    url: string;
    type: string;
    thumb?: string;
}

interface IgramResult {
    url: IgramMedia[];
}

const IGRAM_CONFIG = {
    API_URL: "https://api-wh.igram.world/api/convert",
    SALT: "241c28282e4ce419ce73ca61555a5a0c7faf887c5ccf9305c55484f701ba883a",
    TS_FIXED: 1766415734394,
};

const IGRAM_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    "Origin": "https://igram.world",
    "Referer": "https://igram.world/",
};

const CACHE_TTL = 1000 * 60 * 10;

function generateSignature(url: string, ts: number): string {
    const signatureBase = `${url}${ts}${IGRAM_CONFIG.SALT}`;
    return crypto.createHash("sha256").update(signatureBase).digest("hex");
}

async function fetchIgram(url: string): Promise<IgramResult> {
    const ts = Date.now();
    const signature = generateSignature(url, ts);

    const payload = {
        sf_url: url,
        ts: ts,
        _ts: IGRAM_CONFIG.TS_FIXED,
        _tsc: 0,
        _s: signature,
    };

    const response = await httpClient.post(IGRAM_CONFIG.API_URL, qs.stringify(payload), {
        headers: IGRAM_HEADERS,
        timeout: 30000,
    });

    const data = response.data as unknown;

    if (!data || typeof data !== 'object' || !('url' in (data as Record<string, unknown>))) {
        throw new Error("Failed to fetch Instagram content");
    }

    return data as unknown as IgramResult;
}

registerPlugin({
    name: "Igram Downloader",
    slug: "igram",
    category: "download",
    description: "Download photos and videos from Instagram via Igram API",
    endpoint: {
        title: "Igram Downloader",
        description: "Download Instagram content (photos, videos, reels, stories)",
        path: "/api/download/igram",
        method: "GET",
        responseType: "json",
        tags: ["instagram", "igram", "download", "photo", "video", "reels"],
        parameters: [
            {
                name: "url",
                required: true,
                description: "Instagram post/reel URL",
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
                const cacheKey = generateCacheKey("igram", url);

                const result = await withCache<IgramResult>(
                    cacheKey,
                    () => fetchIgram(url),
                    CACHE_TTL
                );

                return jsonResponse(result, 200, startTime, "SHORT");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to download Instagram content";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});