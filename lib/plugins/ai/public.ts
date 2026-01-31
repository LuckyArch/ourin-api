import { registerPlugin, jsonResponse, errorResponse, getStartTime, httpClient } from "@/lib";
import { NextRequest } from "next/server";

interface PublicAIResult {
    response: string;
}

function generateId(length: number = 16): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * 62)]).join("");
}

async function fetchPublicAI(question: string): Promise<PublicAIResult> {
    const response = await httpClient.post(
        "https://publicai.co/api/chat",
        {
            tools: {},
            id: generateId(),
            messages: [
                {
                    id: generateId(),
                    role: "user",
                    parts: [{ type: "text", text: question }],
                },
            ],
            trigger: "submit-message",
        },
        {
            headers: {
                "Origin": "https://publicai.co",
                "Referer": "https://publicai.co/chat",
                "User-Agent": "Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36",
            },
            timeout: 60000,
        }
    );

    const data = response.data as string;
    const lines = data.split("\n\n").filter((line: string) => line && !line.includes("[DONE]"));
    
    let result = "";
    for (const line of lines) {
        try {
            const json = JSON.parse(line.substring(6));
            if (json.type === "text-delta" && json.delta) {
                result += json.delta;
            }
        } catch {
            continue;
        }
    }

    if (!result) {
        throw new Error("No response received");
    }

    return { response: result };
}

registerPlugin({
    name: "Public AI",
    slug: "public",
    category: "ai",
    description: "Chat with Public AI",
    endpoint: {
        title: "Public AI",
        description: "Get AI responses from Public AI chat",
        path: "/api/ai/public",
        method: "GET",
        responseType: "json",
        tags: ["ai", "public", "chat"],
        parameters: [
            {
                name: "q",
                required: true,
                description: "Your question or prompt",
                type: "string",
            },
        ],
        run: async (request: NextRequest) => {
            const startTime = getStartTime();
            const question = request.nextUrl.searchParams.get("q");

            if (!question) {
                return errorResponse("Parameter 'q' is required", 400, startTime);
            }

            try {
                const result = await fetchPublicAI(question);
                return jsonResponse(result, 200, startTime, "NONE");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to get Public AI response";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});