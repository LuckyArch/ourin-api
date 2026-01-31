import { registerPlugin, jsonResponse, errorResponse, getStartTime, withCache, generateCacheKey, httpClient } from "@/lib";
import { NextRequest } from "next/server";

interface TwitterVideo {
    quality: string;
    url: string;
}

interface TwitterResult {
    title: string | null;
    duration: string | null;
    thumbnail: string | null;
    videos: TwitterVideo[];
}

const TWITTER_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Requested-With": "XMLHttpRequest",
    "Origin": "https://savetwitter.net",
    "Referer": "https://savetwitter.net/id3",
};

const CACHE_TTL = 1000 * 60 * 10;

async function fetchTwitter(url: string): Promise<TwitterResult> {
    const params = new URLSearchParams({
        q: url,
        lang: "id",
        cftoken: "",
    });

    const response = await httpClient.post(
        "https://savetwitter.net/api/ajaxSearch",
        params.toString(),
        { headers: TWITTER_HEADERS, timeout: 30000 }
    );

    const html = response.data?.data;
    if (!html) {
        throw new Error("Failed to fetch Twitter video");
    }

    const mp4Matches = [...html.matchAll(
        /href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)".*?MP4\s*\(([^)]+)\)/g
    )];

    const videos: TwitterVideo[] = mp4Matches.map((m: RegExpMatchArray) => ({
        quality: m[2],
        url: m[1],
    }));

    const titleMatch = html.match(/<h3>(.*?)<\/h3>/);
    const durationMatch = html.match(/<p>(\d+:\d+)<\/p>/);
    const thumbnailMatch = html.match(/<img src="([^"]+)"/);

    return {
        title: titleMatch?.[1] || null,
        duration: durationMatch?.[1] || null,
        thumbnail: thumbnailMatch?.[1] || null,
        videos,
    };
}

registerPlugin({
    name: "Twitter Downloader",
    slug: "twitter",
    category: "download",
    description: "Download videos from Twitter/X",
    endpoint: {
        title: "Twitter Downloader",
        description: "Download videos from Twitter/X posts",
        path: "/api/download/twitter",
        method: "GET",
        responseType: "json",
        tags: ["twitter", "x", "download", "video"],
        parameters: [
            {
                name: "url",
                required: true,
                description: "Twitter/X post URL",
                type: "string",
            },
        ],
        run: async (request: NextRequest) => {
            const startTime = getStartTime();
            const url = request.nextUrl.searchParams.get("url");

            if (!url) {
                return errorResponse("Parameter 'url' is required", 400, startTime);
            }

            if (!url.includes("twitter.com") && !url.includes("x.com")) {
                return errorResponse("Invalid Twitter/X URL", 400, startTime);
            }

            try {
                const cacheKey = generateCacheKey("twitter", url);

                const result = await withCache<TwitterResult>(
                    cacheKey,
                    () => fetchTwitter(url),
                    CACHE_TTL
                );

                return jsonResponse(result, 200, startTime, "SHORT");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to download Twitter video";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});