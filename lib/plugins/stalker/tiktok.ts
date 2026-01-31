import { registerPlugin, jsonResponse, errorResponse, getStartTime, withCache, generateCacheKey, httpClient } from "@/lib";
import { NextRequest } from "next/server";

interface TikTokProfile {
    username: string | null;
    name: string | null;
    bio: string | null;
    followers: string | null;
    following: string | null;
    likes: string | null;
    videoCount: string | null;
    avatar: string | null;
}

const TIKTOK_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
    "Accept": "text/html",
};

const CACHE_TTL = 1000 * 60 * 5;

function extractMatch(html: string, regex: RegExp): string | null {
    const match = html.match(regex);
    return match ? match[1] : null;
}

async function fetchTikTokProfile(username: string): Promise<TikTokProfile> {
    const response = await httpClient.get(`https://www.tiktok.com/@${username}`, {
        headers: TIKTOK_HEADERS,
        timeout: 15000,
    });

    const html = response.data as string;

    const avatar = extractMatch(html, /"avatarLarger":"([^"]+)"/);

    return {
        username: extractMatch(html, /"uniqueId":"([^"]+)"/),
        name: extractMatch(html, /"nickname":"([^"]+)"/),
        bio: extractMatch(html, /"signature":"([^"]*)"/),
        followers: extractMatch(html, /"followerCount":(\d+)/),
        following: extractMatch(html, /"followingCount":(\d+)/),
        likes: extractMatch(html, /"heartCount":(\d+)/),
        videoCount: extractMatch(html, /"videoCount":(\d+)/),
        avatar: avatar?.replace(/\\u002F/g, "/") || null,
    };
}

registerPlugin({
    name: "TikTok Stalker",
    slug: "tiktok",
    category: "stalker",
    description: "Get TikTok user profile information",
    endpoint: {
        title: "TikTok Stalker",
        description: "Retrieve TikTok user profile stats and info",
        path: "/api/stalker/tiktok",
        method: "GET",
        responseType: "json",
        tags: ["tiktok", "stalker", "profile", "social media"],
        parameters: [
            {
                name: "username",
                required: true,
                description: "TikTok username (without @)",
                type: "string",
            },
        ],
        run: async (request: NextRequest) => {
            const startTime = getStartTime();
            const username = request.nextUrl.searchParams.get("username");

            if (!username) {
                return errorResponse("Parameter 'username' is required", 400, startTime);
            }

            try {
                const cacheKey = generateCacheKey("tiktok-stalk", username);

                const result = await withCache<TikTokProfile>(
                    cacheKey,
                    () => fetchTikTokProfile(username),
                    CACHE_TTL
                );

                return jsonResponse(result, 200, startTime, "SHORT");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to fetch TikTok profile";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});