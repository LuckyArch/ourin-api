import { NextResponse } from "next/server";
import { siteConfig } from "../site";

export interface ApiResponse<T = unknown> {
    code: number;
    success: boolean;
    author: string;
    result?: T;
    error?: string;
    responseTime: string;
    timestamp: string;
}

const CACHE_HEADERS = {
    SHORT: "public, s-maxage=60, stale-while-revalidate=300",
    MEDIUM: "public, s-maxage=300, stale-while-revalidate=600",
    LONG: "public, s-maxage=3600, stale-while-revalidate=86400",
    STATIC: "public, max-age=86400, immutable",
    NONE: "no-store, no-cache, must-revalidate",
};

const COMMON_HEADERS = {
    "X-Author": siteConfig.name,
    "X-Powered-By": "Ourin API",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export function getStartTime(): number {
    return performance.now();
}

export function calculateResponseTime(startTime: number): string {
    const elapsed = performance.now() - startTime;
    return `${elapsed.toFixed(2)}ms`;
}

export function createResponse<T>(
    data: T,
    status: number,
    startTime?: number
): ApiResponse<T> {
    return {
        code: status,
        success: status >= 200 && status < 300,
        author: siteConfig.name,
        result: data,
        responseTime: startTime ? calculateResponseTime(startTime) : "0ms",
        timestamp: new Date().toISOString(),
    };
}

export function jsonResponse<T>(
    data: T,
    status = 200,
    startTime?: number,
    cacheType: keyof typeof CACHE_HEADERS = "SHORT"
): NextResponse {
    const response = createResponse(data, status, startTime);
    
    return new NextResponse(JSON.stringify(response), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": CACHE_HEADERS[cacheType],
            ...COMMON_HEADERS,
        },
    });
}

export function errorResponse(
    message: string,
    status = 400,
    startTime?: number
): NextResponse {
    const response: ApiResponse = {
        code: status,
        success: false,
        author: siteConfig.name,
        error: message,
        responseTime: startTime ? calculateResponseTime(startTime) : "0ms",
        timestamp: new Date().toISOString(),
    };

    return new NextResponse(JSON.stringify(response), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": CACHE_HEADERS.NONE,
            ...COMMON_HEADERS,
        },
    });
}

export function imageResponse(
    data: ArrayBuffer | Uint8Array,
    contentType = "image/png",
    cacheType: keyof typeof CACHE_HEADERS = "STATIC"
): NextResponse {
    const buffer = data instanceof Uint8Array ? Buffer.from(data) : Buffer.from(data);
    return new NextResponse(buffer, {
        status: 200,
        headers: {
            "Content-Type": contentType,
            "Content-Length": buffer.byteLength.toString(),
            "Cache-Control": CACHE_HEADERS[cacheType],
            ...COMMON_HEADERS,
        },
    });
}

export function audioResponse(
    data: ArrayBuffer | Uint8Array,
    contentType = "audio/mpeg",
    cacheType: keyof typeof CACHE_HEADERS = "STATIC"
): NextResponse {
    const buffer = data instanceof Uint8Array ? Buffer.from(data) : Buffer.from(data);
    return new NextResponse(buffer, {
        status: 200,
        headers: {
            "Content-Type": contentType,
            "Content-Length": buffer.byteLength.toString(),
            "Cache-Control": CACHE_HEADERS[cacheType],
            ...COMMON_HEADERS,
        },
    });
}

export function videoResponse(
    data: ArrayBuffer | Uint8Array,
    contentType = "video/mp4",
    cacheType: keyof typeof CACHE_HEADERS = "STATIC"
): NextResponse {
    const buffer = data instanceof Uint8Array ? Buffer.from(data) : Buffer.from(data);
    return new NextResponse(buffer, {
        status: 200,
        headers: {
            "Content-Type": contentType,
            "Content-Length": buffer.byteLength.toString(),
            "Cache-Control": CACHE_HEADERS[cacheType],
            ...COMMON_HEADERS,
        },
    });
}

export function streamResponse(
    stream: ReadableStream,
    contentType: string
): NextResponse {
    return new NextResponse(stream, {
        status: 200,
        headers: {
            "Content-Type": contentType,
            "Transfer-Encoding": "chunked",
            "Cache-Control": CACHE_HEADERS.NONE,
            ...COMMON_HEADERS,
        },
    });
}

export function redirectResponse(url: string, status: 301 | 302 | 307 | 308 = 302): NextResponse {
    return new NextResponse(null, {
        status,
        headers: {
            Location: url,
            ...COMMON_HEADERS,
        },
    });
}

export function getQueryParam(request: Request, key: string): string | null {
    const url = new URL(request.url);
    return url.searchParams.get(key);
}

export function getQueryParams(request: Request): Record<string, string> {
    const url = new URL(request.url);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
}

export async function getBodyJson<T>(request: Request): Promise<T | null> {
    try {
        return await request.json() as T;
    } catch {
        return null;
    }
}

export { CACHE_HEADERS };
