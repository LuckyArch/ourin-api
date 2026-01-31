import { registerPlugin, jsonResponse, errorResponse, getStartTime, withCache, generateCacheKey, httpClient } from "@/lib";
import { NextRequest } from "next/server";

interface CapcutResult {
    title: string;
    description: string;
    duration: number;
    thumbnail: string;
    videoUrl: string;
    originalVideoUrl: string;
}

const CACHE_TTL = 1000 * 60 * 10;

async function fetchCapcut(url: string): Promise<CapcutResult> {
    const response = await httpClient.post(
        "https://3bic.com/api/download",
        { url },
        { timeout: 30000 }
    );

    const data = response.data as Record<string, unknown>;

    if (!data) {
        throw new Error("Failed to fetch CapCut template");
    }

    let originalVideoUrl = data.originalVideoUrl as string;
    if (originalVideoUrl?.startsWith("/")) {
        originalVideoUrl = "https://3bic.com" + originalVideoUrl;
    }

    return {
        title: data.title as string,
        description: data.description as string,
        duration: data.duration as number,
        thumbnail: data.thumbnail as string,
        videoUrl: data.videoUrl as string,
        originalVideoUrl: originalVideoUrl,
    };
}

registerPlugin({
    name: "CapCut Downloader",
    slug: "capcut",
    category: "download",
    description: "Download CapCut templates",
    endpoint: {
        title: "CapCut Downloader",
        description: "Download video templates from CapCut",
        path: "/api/download/capcut",
        method: "GET",
        responseType: "json",
        tags: ["capcut", "download", "video", "template"],
        parameters: [
            {
                name: "url",
                required: true,
                description: "CapCut template URL",
                type: "string",
            },
        ],
        run: async (request: NextRequest) => {
            const startTime = getStartTime();
            const url = request.nextUrl.searchParams.get("url");

            if (!url) {
                return errorResponse("Parameter 'url' is required", 400, startTime);
            }

            if (!url.includes("capcut.com")) {
                return errorResponse("Invalid CapCut URL", 400, startTime);
            }

            try {
                const cacheKey = generateCacheKey("capcut", url);

                const result = await withCache<CapcutResult>(
                    cacheKey,
                    () => fetchCapcut(url),
                    CACHE_TTL
                );

                return jsonResponse(result, 200, startTime, "SHORT");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to download CapCut template";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});