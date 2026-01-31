import { registerPlugin, jsonResponse, errorResponse, getStartTime, withCache, generateCacheKey, httpClient } from "@/lib";
import { NextRequest } from "next/server";

interface FacebookResult {
    thumbnail: string | null;
    sd: string | null;
    hd: string | null;
}

const FACEBOOK_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
    "Accept": "application/json,text/javascript,*/*",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/x-www-form-urlencoded",
    "Origin": "https://likeedownloader.com",
    "Referer": "https://likeedownloader.com/facebook-video-downloader",
};

const CACHE_TTL = 1000 * 60 * 10;

async function fetchFacebook(url: string): Promise<FacebookResult> {
    const params = new URLSearchParams({
        id: url,
        locale: "en",
    });

    const response = await httpClient.post(
        "https://likeedownloader.com/process",
        params.toString(),
        { headers: FACEBOOK_HEADERS, timeout: 30000 }
    );

    const template = response.data?.template;
    if (!template) {
        throw new Error("Failed to fetch Facebook video");
    }

    const thumbMatch = template.match(/<img[^>]+src="([^"]+)"/);
    const linkMatches = [...template.matchAll(/href="([^"]+)"[^>]*download/g)];

    return {
        thumbnail: thumbMatch?.[1] || null,
        sd: linkMatches[0]?.[1] || null,
        hd: linkMatches[1]?.[1] || null,
    };
}

registerPlugin({
    name: "Facebook Downloader",
    slug: "facebook",
    category: "download",
    description: "Download videos from Facebook",
    endpoint: {
        title: "Facebook Downloader",
        description: "Download videos from Facebook posts",
        path: "/api/download/facebook",
        method: "GET",
        responseType: "json",
        tags: ["facebook", "download", "video", "social media"],
        parameters: [
            {
                name: "url",
                required: true,
                description: "Facebook video URL",
                type: "string",
            },
        ],
        run: async (request: NextRequest) => {
            const startTime = getStartTime();
            const url = request.nextUrl.searchParams.get("url");

            if (!url) {
                return errorResponse("Parameter 'url' is required", 400, startTime);
            }

            if (!url.includes("facebook.com") && !url.includes("fb.watch")) {
                return errorResponse("Invalid Facebook URL", 400, startTime);
            }

            try {
                const cacheKey = generateCacheKey("facebook", url);

                const result = await withCache<FacebookResult>(
                    cacheKey,
                    () => fetchFacebook(url),
                    CACHE_TTL
                );

                return jsonResponse(result, 200, startTime, "SHORT");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to download Facebook video";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});