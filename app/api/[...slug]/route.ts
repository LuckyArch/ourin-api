import { NextRequest, NextResponse } from "next/server";
import { getPlugin, getAllPlugins, Plugin, jsonResponse, errorResponse, getStartTime, rateLimitMiddleware } from "@/lib";
import "@/lib/plugins";

function applyRateLimitHeaders(response: NextResponse, headers: Record<string, string>): NextResponse {
    Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string[] }> }
) {
    const startTime = getStartTime();
    const { slug } = await params;

    if (!slug || slug.length === 0) {
        return errorResponse("Invalid endpoint path", 400, startTime);
    }

    if (slug.length === 1) {
        const category = slug[0];
        const plugins = getAllPlugins().filter((p: Plugin) => p.category === category);

        if (plugins.length === 0) {
            return errorResponse(`Category '${category}' not found`, 404, startTime);
        }

        return jsonResponse({
            category: category,
            endpoints: plugins.map((p: Plugin) => ({
                name: p.name,
                slug: p.slug,
                path: p.endpoint.path,
                method: p.endpoint.method,
                description: p.description,
            })),
        }, 200, startTime, "SHORT");
    }

    const rateLimit = rateLimitMiddleware(request);
    if (!rateLimit.allowed) {
        return rateLimit.response!;
    }

    const [category, pluginSlug] = slug;
    const plugin = getPlugin(category, pluginSlug);

    if (!plugin) {
        return errorResponse(`Endpoint '${category}/${pluginSlug}' not found`, 404, startTime);
    }

    const response = await plugin.endpoint.run(request);
    return applyRateLimitHeaders(response, rateLimit.headers);
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string[] }> }
) {
    const startTime = getStartTime();
    const { slug } = await params;

    if (!slug || slug.length < 2) {
        return errorResponse("Invalid endpoint path", 400, startTime);
    }

    const rateLimit = rateLimitMiddleware(request);
    if (!rateLimit.allowed) {
        return rateLimit.response!;
    }

    const [category, pluginSlug] = slug;
    const plugin = getPlugin(category, pluginSlug);

    if (!plugin) {
        return errorResponse(`Endpoint '${category}/${pluginSlug}' not found`, 404, startTime);
    }

    if (plugin.endpoint.method !== "POST") {
        return errorResponse("Method not allowed. Use GET instead.", 405, startTime);
    }

    const response = await plugin.endpoint.run(request);
    return applyRateLimitHeaders(response, rateLimit.headers);
}
