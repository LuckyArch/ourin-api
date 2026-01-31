import { registerPlugin, jsonResponse, errorResponse, getStartTime, withCache, generateCacheKey, httpClient } from "@/lib";
import { NextRequest } from "next/server";

interface InstagramProfile {
    username: string;
    fullName: string;
    biography: string;
    followers: number;
    following: number;
    posts: number;
    profilePic: string;
    isVerified: boolean;
    isPrivate: boolean;
}

const INSTAGRAM_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
    "Content-Type": "application/json",
    "Origin": "https://www.boostfluence.com",
    "Referer": "https://www.boostfluence.com/",
};

const CACHE_TTL = 1000 * 60 * 5;

async function fetchInstagramProfile(username: string): Promise<InstagramProfile> {
    const response = await httpClient.post(
        "https://api.boostfluence.com/api/instagram-profile-v2",
        { username },
        { headers: INSTAGRAM_HEADERS, timeout: 15000 }
    );

    const data = response.data as Record<string, unknown>;

    if (!data) {
        throw new Error("Failed to fetch Instagram profile");
    }

    return {
        username: (data.username as string) || username,
        fullName: (data.full_name as string) || "",
        biography: (data.biography as string) || "",
        followers: (data.follower_count as number) || 0,
        following: (data.following_count as number) || 0,
        posts: (data.media_count as number) || 0,
        profilePic: (data.profile_pic_url_hd as string) || (data.profile_pic_url as string) || "",
        isVerified: (data.is_verified as boolean) || false,
        isPrivate: (data.is_private as boolean) || false,
    };
}

registerPlugin({
    name: "Instagram Stalker",
    slug: "instagram",
    category: "stalker",
    description: "Get Instagram user profile information",
    endpoint: {
        title: "Instagram Stalker",
        description: "Retrieve Instagram user profile stats and info",
        path: "/api/stalker/instagram",
        method: "GET",
        responseType: "json",
        tags: ["instagram", "stalker", "profile", "social media"],
        parameters: [
            {
                name: "username",
                required: true,
                description: "Instagram username (without @)",
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
                const cacheKey = generateCacheKey("instagram-stalk", username);

                const result = await withCache<InstagramProfile>(
                    cacheKey,
                    () => fetchInstagramProfile(username),
                    CACHE_TTL
                );

                return jsonResponse(result, 200, startTime, "SHORT");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to fetch Instagram profile";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});