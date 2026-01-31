import { LRUCache } from "lru-cache";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "./response";

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const GLOBAL_LIMIT = {
    windowMs: 60 * 1000,
    maxRequests: 200,
};

const rateLimitCache = new LRUCache<string, RateLimitEntry>({
    max: 50000,
    ttl: 60 * 1000,
});

export function getClientIdentifier(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwarded?.split(",")[0] || realIp || "unknown";
    return ip.trim();
}

export function checkRateLimit(identifier: string): { 
    allowed: boolean; 
    remaining: number; 
    resetIn: number 
} {
    const now = Date.now();
    let entry = rateLimitCache.get(identifier);

    if (!entry || now > entry.resetTime) {
        entry = {
            count: 1,
            resetTime: now + GLOBAL_LIMIT.windowMs,
        };
        rateLimitCache.set(identifier, entry);
        return {
            allowed: true,
            remaining: GLOBAL_LIMIT.maxRequests - 1,
            resetIn: Math.ceil(GLOBAL_LIMIT.windowMs / 1000),
        };
    }

    if (entry.count >= GLOBAL_LIMIT.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: Math.ceil((entry.resetTime - now) / 1000),
        };
    }

    entry.count++;
    rateLimitCache.set(identifier, entry);

    return {
        allowed: true,
        remaining: GLOBAL_LIMIT.maxRequests - entry.count,
        resetIn: Math.ceil((entry.resetTime - now) / 1000),
    };
}

export function rateLimitMiddleware(request: NextRequest): {
    allowed: boolean;
    response?: NextResponse;
    headers: Record<string, string>;
} {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId);

    const headers: Record<string, string> = {
        "X-RateLimit-Limit": GLOBAL_LIMIT.maxRequests.toString(),
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-RateLimit-Reset": rateLimit.resetIn.toString(),
    };

    if (!rateLimit.allowed) {
        const response = errorResponse(
            `Rate limit exceeded. Try again in ${rateLimit.resetIn} seconds.`,
            429
        );

        Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
        });

        return { allowed: false, response, headers };
    }

    return { allowed: true, headers };
}

export { GLOBAL_LIMIT };
