import { registerPlugin, jsonResponse, errorResponse, getStartTime, withCache, generateCacheKey, httpClient } from "@/lib";
import { NextRequest } from "next/server";
import * as cheerio from "cheerio";

interface PinterestMedia {
    type: "image" | "video";
    url: string;
    width?: number;
    height?: number;
}

interface PinterestResult {
    id: string;
    title: string;
    description: string;
    media: PinterestMedia;
    thumbnail: string;
    author: {
        name: string;
        username: string;
        avatar: string;
    };
    stats: {
        saves: number;
        comments: number;
    };
    source: string;
    createdAt: string;
}

const PINTEREST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Cache-Control": "max-age=0",
};

const CACHE_TTL = 1000 * 60 * 10;

async function extractPinId(url: string): Promise<string | null> {
    const patterns = [
        /pinterest\.com\/pin\/(\d+)/i,
        /pin\.it\/([a-zA-Z0-9]+)/i,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            if (pattern.source.includes("pin\\.it")) {
                try {
                    const response = await httpClient.get(url, {
                        maxRedirects: 5,
                        headers: PINTEREST_HEADERS,
                    });
                    const finalUrl = response.request?.res?.responseUrl || response.config.url || "";
                    const pinMatch = finalUrl.match(/pin\/(\d+)/);
                    return pinMatch ? pinMatch[1] : null;
                } catch {
                    return null;
                }
            }
            return match[1];
        }
    }

    return null;
}

async function scrapePinterestPin(pinId: string): Promise<PinterestResult> {
    const pinUrl = `https://www.pinterest.com/pin/${pinId}/`;

    const response = await httpClient.get(pinUrl, {
        headers: PINTEREST_HEADERS,
        timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    let pinData: Record<string, unknown> | null = null;

    $('script[type="application/ld+json"]').each((_, element) => {
        try {
            const jsonText = $(element).html();
            if (jsonText) {
                const parsed = JSON.parse(jsonText);
                if (parsed["@type"] === "SocialMediaPosting" || parsed["@type"] === "ImageObject") {
                    pinData = parsed;
                }
            }
        } catch {
            return;
        }
    });

    if (!pinData) {
        $("script").each((_, element) => {
            const scriptContent = $(element).html() || "";
            if (scriptContent.includes("__PWS_DATA__")) {
                try {
                    const match = scriptContent.match(/__PWS_DATA__\s*=\s*(\{[\s\S]+?\});/);
                    if (match) {
                        const pwsData = JSON.parse(match[1]);
                        const resourceData = pwsData?.props?.initialReduxState?.pins;
                        if (resourceData && resourceData[pinId]) {
                            pinData = resourceData[pinId];
                        }
                    }
                } catch {
                    return;
                }
            }
        });
    }

    let mediaUrl = "";
    let mediaType: "image" | "video" = "image";
    let mediaWidth = 0;
    let mediaHeight = 0;

    const ogImage = $('meta[property="og:image"]').attr("content");
    const ogVideo = $('meta[property="og:video"]').attr("content");
    const ogTitle = $('meta[property="og:title"]').attr("content") || "";
    const ogDescription = $('meta[property="og:description"]').attr("content") || "";

    if (ogVideo) {
        mediaType = "video";
        mediaUrl = ogVideo;
    } else if (ogImage) {
        mediaType = "image";
        mediaUrl = ogImage.replace(/\/\d+x\d*\//, "/originals/").replace(/\/\d+x\//, "/originals/");
    }

    if (pinData) {
        const data = pinData as Record<string, unknown>;

        if (data.video && typeof data.video === "object") {
            const video = data.video as Record<string, unknown>;
            const videoList = video.video_list as Record<string, unknown>;
            if (videoList) {
                const v720p = videoList["V_720P"] as Record<string, unknown>;
                const v480p = videoList["V_480P"] as Record<string, unknown>;
                const vHlsv4 = videoList["V_HLSV4"] as Record<string, unknown>;

                if (v720p && v720p.url) {
                    mediaUrl = v720p.url as string;
                    mediaWidth = (v720p.width as number) || 0;
                    mediaHeight = (v720p.height as number) || 0;
                } else if (v480p && v480p.url) {
                    mediaUrl = v480p.url as string;
                    mediaWidth = (v480p.width as number) || 0;
                    mediaHeight = (v480p.height as number) || 0;
                } else if (vHlsv4 && vHlsv4.url) {
                    mediaUrl = vHlsv4.url as string;
                }
                mediaType = "video";
            }
        }

        if (!mediaUrl && data.images && typeof data.images === "object") {
            const images = data.images as Record<string, unknown>;
            const orig = images.orig as Record<string, unknown>;
            if (orig && orig.url) {
                mediaUrl = orig.url as string;
                mediaWidth = (orig.width as number) || 0;
                mediaHeight = (orig.height as number) || 0;
            }
        }
    }

    if (!mediaUrl) {
        const imgSrc = $('img[src*="pinimg.com"]').first().attr("src");
        if (imgSrc) {
            mediaUrl = imgSrc.replace(/\/\d+x\d*\//, "/originals/").replace(/\/\d+x\//, "/originals/");
        }
    }

    if (!mediaUrl) {
        throw new Error("Could not extract media from Pinterest pin");
    }

    const authorName = $('meta[name="author"]').attr("content") || "Unknown";
    const authorAvatar = $('link[rel="image_src"]').attr("href") || "";

    let username = "";
    const profileLink = $('a[href*="pinterest.com/"][data-test-id="pinnerName"]').attr("href");
    if (profileLink) {
        const usernameMatch = profileLink.match(/pinterest\.com\/([^/]+)/);
        if (usernameMatch) {
            username = usernameMatch[1];
        }
    }

    const result: PinterestResult = {
        id: pinId,
        title: ogTitle,
        description: ogDescription,
        media: {
            type: mediaType,
            url: mediaUrl,
            width: mediaWidth || undefined,
            height: mediaHeight || undefined,
        },
        thumbnail: ogImage || mediaUrl,
        author: {
            name: authorName,
            username: username,
            avatar: authorAvatar,
        },
        stats: {
            saves: 0,
            comments: 0,
        },
        source: pinUrl,
        createdAt: new Date().toISOString(),
    };

    return result;
}

registerPlugin({
    name: "Pinterest Downloader",
    slug: "pinterest",
    category: "download",
    description: "Download images and videos from Pinterest pins",
    endpoint: {
        title: "Pinterest Downloader",
        description: "Extract and download high-quality images or videos from Pinterest pin URLs",
        path: "/api/download/pinterest",
        method: "GET",
        responseType: "json",
        tags: ["pinterest", "download", "image", "video", "social media"],
        parameters: [
            {
                name: "url",
                required: true,
                description: "Pinterest pin URL (e.g., https://pinterest.com/pin/123456789)",
                type: "string",
            },
        ],
        run: async (request: NextRequest) => {
            const startTime = getStartTime();

            const url = request.nextUrl.searchParams.get("url");

            if (!url) {
                return errorResponse("Parameter 'url' is required", 400, startTime);
            }

            if (!url.includes("pinterest.com") && !url.includes("pin.it")) {
                return errorResponse("Invalid Pinterest URL", 400, startTime);
            }

            try {
                const pinId = await extractPinId(url);

                if (!pinId) {
                    return errorResponse("Could not extract pin ID from URL", 400, startTime);
                }

                const cacheKey = generateCacheKey("pinterest", pinId);
                
                const result = await withCache<PinterestResult>(
                    cacheKey,
                    () => scrapePinterestPin(pinId),
                    CACHE_TTL
                );

                return jsonResponse(result, 200, startTime, "SHORT");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to fetch Pinterest pin";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});
