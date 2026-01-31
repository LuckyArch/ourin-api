import { registerPlugin, jsonResponse, errorResponse, getStartTime, httpClient } from "@/lib";
import { NextRequest } from "next/server";

interface GeminiResult {
    text: string;
    sessionId: string;
}

async function fetchGemini(message: string, instruction: string, sessionId: string | null): Promise<GeminiResult> {
    let resumeArray: unknown = null;
    let cookie: string | null = null;
    let savedInstruction = instruction;

    if (sessionId) {
        try {
            const sessionData = JSON.parse(Buffer.from(sessionId, "base64").toString());
            resumeArray = sessionData.resumeArray;
            cookie = sessionData.cookie;
            savedInstruction = instruction || sessionData.instruction || "";
        } catch {
            resumeArray = null;
        }
    }

    if (!cookie) {
        const initResponse = await httpClient.post(
            "https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&bl=boq_assistant-bard-web-server_20250814.06_p1&f.sid=-7816331052118000090&hl=en-US&_reqid=173780&rt=c",
            "f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&",
            { headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, timeout: 15000 }
        );
        const setCookie = initResponse.headers["set-cookie"] as string[] | undefined;
        cookie = setCookie?.[0]?.split("; ")[0] || "";
    }

    const requestBody = [
        [message, 0, null, null, null, null, 0],
        ["en-US"],
        resumeArray || ["", "", "", null, null, null, null, null, null, ""],
        null, null, null, [1], 1, null, null, 1, 0, null, null, null, null, null,
        [[0]], 1, null, null, null, null, null,
        ["", "", savedInstruction, null, null, null, null, null, 0, null, 1, null, null, null, []],
        null, null, 1, null, null, null, null, null, null, null,
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        1, null, null, null, null, [1],
    ];

    const payload = [null, JSON.stringify(requestBody)];

    const response = await httpClient.post(
        "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20250729.06_p0&f.sid=4206607810970164620&hl=en-US&_reqid=2813378&rt=c",
        new URLSearchParams({ "f.req": JSON.stringify(payload) }).toString(),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                "X-Goog-Ext-525001261-Jspb": '[1,null,null,null,"9ec249fc9ad08861",null,null,null,[4]]',
                "Cookie": cookie,
            },
            timeout: 60000,
        }
    );

    const data = response.data as string;
    const matches = Array.from(data.matchAll(/^\d+\n(.+?)\n/gm));
    const reversed = matches.reverse();
    const selectedArray = reversed[3]?.[1];

    if (!selectedArray) {
        throw new Error("Failed to parse Gemini response");
    }

    const realArray = JSON.parse(selectedArray);
    const parsed = JSON.parse(realArray[0][2]);

    const newResumeArray = [...parsed[1], parsed[4][0][0]];
    const text = parsed[4][0][1][0].replace(/\*\*(.+?)\*\*/g, "*$1*");

    const newSessionId = Buffer.from(
        JSON.stringify({
            resumeArray: newResumeArray,
            cookie: cookie,
            instruction: savedInstruction,
        })
    ).toString("base64");

    return { text, sessionId: newSessionId };
}

registerPlugin({
    name: "Google Gemini",
    slug: "gemini",
    category: "ai",
    description: "Chat with Google Gemini AI",
    endpoint: {
        title: "Google Gemini",
        description: "Get AI responses from Google Gemini with session support",
        path: "/api/ai/gemini",
        method: "GET",
        responseType: "json",
        tags: ["ai", "gemini", "google", "bard", "chat"],
        parameters: [
            {
                name: "q",
                required: true,
                description: "Your question or prompt",
                type: "string",
            },
            {
                name: "instruction",
                required: false,
                description: "System instruction for the AI",
                type: "string",
            },
            {
                name: "session",
                required: false,
                description: "Session ID for conversation continuity",
                type: "string",
            },
        ],
        run: async (request: NextRequest) => {
            const startTime = getStartTime();
            const question = request.nextUrl.searchParams.get("q");
            const instruction = request.nextUrl.searchParams.get("instruction") || "";
            const session = request.nextUrl.searchParams.get("session") || null;

            if (!question) {
                return errorResponse("Parameter 'q' is required", 400, startTime);
            }

            try {
                const result = await fetchGemini(question, instruction, session);
                return jsonResponse(result, 200, startTime, "NONE");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to get Gemini response";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});