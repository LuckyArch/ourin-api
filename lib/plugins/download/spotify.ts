import { registerPlugin, jsonResponse, errorResponse, getStartTime, withCache, generateCacheKey, httpClient } from "@/lib";
import { NextRequest } from "next/server";

interface SpotifyResult {
    metadata: {
        title: string;
        artist: string;
        album: string;
        cover: string;
        releaseDate: string;
    };
    download: {
        mp3: string;
        flac: string | null;
    };
}

const SPOTIFY_CONFIG = {
    BASE_URL: "https://api.spotidownloader.com",
};

const SPOTIFY_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Origin": "https://spotidownloader.com",
    "Referer": "https://spotidownloader.com/",
};

const CACHE_TTL = 1000 * 60 * 30;

function extractTrackId(url: string): string {
    const match = url.match(/(?:track|id)\/([a-zA-Z0-9]{22})/);
    return match ? match[1] : url;
}

async function fetchSpotify(url: string): Promise<SpotifyResult> {
    const trackId = extractTrackId(url);

    const metaResponse = await httpClient.post(
        `${SPOTIFY_CONFIG.BASE_URL}/metadata`,
        { type: "track", id: trackId },
        { headers: SPOTIFY_HEADERS, timeout: 30000 }
    );

    const metadata = metaResponse.data;
    if (!metadata.success) {
        throw new Error("Track not found on Spotify");
    }

    let isFlac = false;
    try {
        const flacResponse = await httpClient.post(
            `${SPOTIFY_CONFIG.BASE_URL}/isFlacAvailable`,
            { id: trackId },
            { headers: SPOTIFY_HEADERS, timeout: 10000 }
        );
        isFlac = flacResponse.data.flacAvailable;
    } catch {
        isFlac = false;
    }

    const downloadResponse = await httpClient.post(
        `${SPOTIFY_CONFIG.BASE_URL}/download`,
        { id: trackId },
        { headers: SPOTIFY_HEADERS, timeout: 30000 }
    );

    return {
        metadata: {
            title: metadata.title,
            artist: metadata.artists,
            album: metadata.album,
            cover: metadata.cover,
            releaseDate: metadata.releaseDate,
        },
        download: {
            mp3: downloadResponse.data.link,
            flac: isFlac ? downloadResponse.data.linkFlac : null,
        },
    };
}

registerPlugin({
    name: "Spotify Downloader",
    slug: "spotify",
    category: "download",
    description: "Download songs from Spotify",
    endpoint: {
        title: "Spotify Downloader",
        description: "Download Spotify tracks in MP3 or FLAC format",
        path: "/api/download/spotify",
        method: "GET",
        responseType: "json",
        tags: ["spotify", "download", "music", "mp3", "flac"],
        parameters: [
            {
                name: "url",
                required: true,
                description: "Spotify track URL or ID",
                type: "string",
            },
        ],
        run: async (request: NextRequest) => {
            const startTime = getStartTime();
            const url = request.nextUrl.searchParams.get("url");

            if (!url) {
                return errorResponse("Parameter 'url' is required", 400, startTime);
            }

            try {
                const trackId = extractTrackId(url);
                const cacheKey = generateCacheKey("spotify", trackId);

                const result = await withCache<SpotifyResult>(
                    cacheKey,
                    () => fetchSpotify(url),
                    CACHE_TTL
                );

                return jsonResponse(result, 200, startTime, "SHORT");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to download Spotify track";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});