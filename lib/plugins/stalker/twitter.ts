import { registerPlugin, jsonResponse, errorResponse, getStartTime, withCache, generateCacheKey, httpClient } from "@/lib";
import { NextRequest } from "next/server";
import crypto from "crypto";

interface TwitterProfile {
    id: string;
    username: string;
    name: string;
    bio: string;
    followers: number;
    following: number;
    tweets: number;
    avatar: string;
    banner: string;
    isVerified: boolean;
    createdAt: string;
}

const TWITTER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10)",
    "Accept": "application/json",
    "Origin": "https://snaplytics.io",
    "Referer": "https://snaplytics.io/",
};

const CACHE_TTL = 1000 * 60 * 5;

async function fetchTwitterProfile(username: string): Promise<TwitterProfile> {
    const challengeResponse = await httpClient.get(
        "https://twittermedia.b-cdn.net/challenge/",
        { headers: TWITTER_HEADERS, timeout: 10000 }
    );

    const challenge = challengeResponse.data as Record<string, unknown>;

    if (!challenge.challenge_id) {
        throw new Error("Failed to get challenge token");
    }

    const hash = crypto
        .createHash("sha256")
        .update(String(challenge.timestamp) + challenge.random_value)
        .digest("hex")
        .slice(0, 8);

    const profileResponse = await httpClient.get(
        `https://twittermedia.b-cdn.net/viewer/?data=${username}&type=profile`,
        {
            headers: {
                ...TWITTER_HEADERS,
                "X-Challenge-ID": challenge.challenge_id as string,
                "X-Challenge-Solution": hash,
            },
            timeout: 15000,
        }
    );

    const data = profileResponse.data as Record<string, unknown>;
    const profile = data.profile as Record<string, unknown>;

    if (!profile) {
        throw new Error("Twitter profile not found");
    }

    return {
        id: (profile.id as string) || "",
        username: (profile.screen_name as string) || username,
        name: (profile.name as string) || "",
        bio: (profile.description as string) || "",
        followers: (profile.followers_count as number) || 0,
        following: (profile.friends_count as number) || 0,
        tweets: (profile.statuses_count as number) || 0,
        avatar: (profile.profile_image_url_https as string) || "",
        banner: (profile.profile_banner_url as string) || "",
        isVerified: (profile.verified as boolean) || false,
        createdAt: (profile.created_at as string) || "",
    };
}

registerPlugin({
    name: "Twitter Stalker",
    slug: "twitter",
    category: "stalker",
    description: "Get Twitter/X user profile information",
    endpoint: {
        title: "Twitter Stalker",
        description: "Retrieve Twitter/X user profile stats and info",
        path: "/api/stalker/twitter",
        method: "GET",
        responseType: "json",
        tags: ["twitter", "x", "stalker", "profile", "social media"],
        parameters: [
            {
                name: "username",
                required: true,
                description: "Twitter username (without @)",
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
                const cacheKey = generateCacheKey("twitter-stalk", username);

                const result = await withCache<TwitterProfile>(
                    cacheKey,
                    () => fetchTwitterProfile(username),
                    CACHE_TTL
                );

                return jsonResponse(result, 200, startTime, "SHORT");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to fetch Twitter profile";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});
