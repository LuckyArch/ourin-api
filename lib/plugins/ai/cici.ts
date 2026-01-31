import { registerPlugin, jsonResponse, errorResponse, getStartTime, httpClient } from "@/lib";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";

interface CiciSource {
    url: string;
    title: string;
}

interface CiciResult {
    chat: string;
    sources: CiciSource[];
}

function generateRandom(): number {
    return Math.floor(Math.random() * 100000000000000000) + 1;
}

function generateHex(): string {
    return Math.floor(Math.random() * 100000000000000000).toString(16);
}

function generateString(): string {
    return Math.random().toString(36).substring(7);
}

async function fetchCici(question: string): Promise<CiciResult> {
    const random = generateRandom();
    const cdid = "2" + generateHex().padStart(23, "0");
    const uid = generateRandom();
    const iid = generateRandom();
    const deviceId = generateRandom();

    const requestBody = {
        channel: 3,
        cmd: 100,
        sequence_id: randomUUID(),
        uplink_body: {
            send_message_body: {
                ack_only: false,
                applet_payload: {},
                bot_id: "7241547611541340167",
                bot_type: 1,
                client_controller_param: {
                    answer_with_suggest: true,
                    local_language_code: "en",
                    local_nickname: "User",
                    local_voice_id: "92",
                },
                content: JSON.stringify({ im_cmd: -1, text: question }),
                content_type: 1,
                conversation_id: "485805516280081",
                conversation_type: 3,
                create_time: Math.floor(Date.now() / 1000),
                ext: {
                    create_time_ms: Date.now().toString(),
                    record_status: "1",
                    wiki: "1",
                    search_engine_type: "1",
                    media_search_type: "0",
                    answer_with_suggest: "1",
                    system_language: "en",
                    is_audio: "false",
                    tts: "1",
                    need_deep_think: "0",
                    need_net_search: "0",
                    send_message_scene: "keyboard",
                },
                local_message_id: generateHex(),
                sender_id: "7584067883349640200",
                status: 0,
                unique_key: generateHex(),
            },
        },
        version: "1",
    };

    const response = await httpClient.post(
        "https://api-normal-i18n.ciciai.com/im/sse/send/message",
        requestBody,
        {
            params: {
                flow_im_arch: "v2",
                device_platform: "android",
                os: "android",
                ssmix: "a",
                _rticket: random,
                cdid: cdid,
                channel: "googleplay",
                aid: "489823",
                app_name: "nova_ai",
                version_code: Math.floor(Math.random() * 1000000) + 1,
                version_name: generateString(),
                uid: uid,
                iid: iid,
                device_id: deviceId,
                lang: "en",
                region: "US",
            },
            headers: {
                "Accept-Encoding": "gzip",
                "Content-Type": "application/json; encoding=utf-8",
                "Host": "api-normal-i18n.ciciai.com",
                "User-Agent": "com.larus.wolf/8090004 (Linux; U; Android 12; en_US; SM-S9180; Build/PQ3B.190801.10101846)",
                "X-Tt-Token": "0329aceacb51f4b2d468e8709307dcc44604a72f48ba71143b3403209f8f98cf37f4111f4fe8bac693d57dd0580c0e13a32d8d230813a3064feaf53b9d8fd9e5ae0256d50c4b29427687873645bd92d3b842a-1.0.0",
            },
            timeout: 60000,
        }
    );

    const rawData = response.data as string;
    const sources: CiciSource[] = [];
    const dataRegex = /data:\s*(\{[\s\S]*?\})(?=\n\s*id:|\n*$)/g;
    let match;

    while ((match = dataRegex.exec(rawData)) !== null) {
        try {
            const json = JSON.parse(match[1]);
            const body = json?.downlink_body?.fetch_chunk_message_downlink_body;
            if (!body) continue;

            const contentObj = JSON.parse(body.content);
            const tags = contentObj?.text_tags || [];

            for (const tag of tags) {
                const tagInfo = JSON.parse(tag.tag_info);
                if (tagInfo.url && tagInfo.title) {
                    sources.push({ url: tagInfo.url, title: tagInfo.title });
                }
            }
        } catch {
            continue;
        }
    }

    const originRegex = /"origin_content"\s*:\s*"([^"]*)"/g;
    const result: string[] = [];
    while ((match = originRegex.exec(rawData)) !== null) {
        result.push(match[1]);
    }

    return {
        chat: result.join(""),
        sources,
    };
}

registerPlugin({
    name: "CiCi AI",
    slug: "cici",
    category: "ai",
    description: "Chat with CiCi AI",
    endpoint: {
        title: "CiCi AI",
        description: "Get AI responses from CiCi with web search sources",
        path: "/api/ai/cici",
        method: "GET",
        responseType: "json",
        tags: ["ai", "cici", "chat", "search"],
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
                const result = await fetchCici(question);
                return jsonResponse(result, 200, startTime, "NONE");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to get CiCi response";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});