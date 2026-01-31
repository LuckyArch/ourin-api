import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    poweredByHeader: false,
    
    compress: true,
    
    reactStrictMode: true,

    experimental: {
        serverMinification: true,
    },

    headers: async () => [
        {
            source: "/api/:path*",
            headers: [
                { key: "Access-Control-Allow-Origin", value: "*" },
                { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
                { key: "Access-Control-Allow-Headers", value: "Content-Type" },
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "X-XSS-Protection", value: "1; mode=block" },
            ],
        },
        {
            source: "/:path*",
            headers: [
                { key: "X-DNS-Prefetch-Control", value: "on" },
            ],
        },
    ],
};

export default nextConfig;
