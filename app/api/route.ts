import { NextRequest } from "next/server";
import { getAllPlugins, Plugin, jsonResponse, getStartTime } from "@/lib";
import { siteConfig } from "@/lib/site";
import "@/lib/plugins";

export async function GET(request: NextRequest) {
    const startTime = getStartTime();
    const plugins = getAllPlugins();
    const categories = [...new Set(plugins.map((p: Plugin) => p.category))];

    return jsonResponse({
        message: `${siteConfig.name} API`,
        version: siteConfig.api.version,
        categories: categories,
        totalEndpoints: plugins.length,
    }, 200, startTime, "SHORT");
}
