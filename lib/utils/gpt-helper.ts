import { httpClient } from "@/lib";

export const GPT_HEADERS = {
    "Accept": "*/*",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Origin": "https://minitoolai.com",
    "Referer": "https://minitoolai.com/chatGPT/",
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
};

export async function fetchGPT(question: string, model: string): Promise<string> {
    const htmlResponse = await httpClient.get("https://minitoolai.com/chatGPT/", { timeout: 15000 });
    const html = htmlResponse.data as string;
    const cookies = htmlResponse.headers["set-cookie"] as string[];

    const cfResponse = await httpClient.post("https://api.nekolabs.web.id/tls/bypass/cf-turnstile", {
        url: "https://minitoolai.com/chatGPT/",
        siteKey: "0x4AAAAAABjI2cBIeVpBYEFi",
    }, { timeout: 30000 });

    const cfData = cfResponse.data as Record<string, unknown>;
    if (!cfData?.result) {
        throw new Error("Failed to bypass Cloudflare");
    }

    const safetyMatch = html.match(/var\s+safety_identifier\s*=\s*"([^"]*)"/);
    const utokenMatch = html.match(/var\s+utoken\s*=\s*"([^"]*)"/);

    if (!safetyMatch || !utokenMatch) {
        throw new Error("Failed to extract tokens");
    }

    const params = new URLSearchParams({
        messagebase64img1: "",
        messagebase64img0: "",
        safety_identifier: safetyMatch[1],
        select_model: model,
        temperature: "0.7",
        utoken: utokenMatch[1],
        message: question,
        umes1a: "",
        umes1stimg1a: "",
        umes2ndimg1a: "",
        bres1a: "",
        umes2a: "",
        umes1stimg2a: "",
        umes2ndimg2a: "",
        bres2a: "",
        cft: encodeURIComponent(cfData.result as string),
    });

    const cookieHeader = cookies?.join("; ") || "";

    const taskResponse = await httpClient.post(
        "https://minitoolai.com/chatGPT/chatgpt_stream.php",
        params.toString(),
        { headers: { ...GPT_HEADERS, cookie: cookieHeader }, timeout: 30000 }
    );

    const streamToken = taskResponse.data as string;

    const streamResponse = await httpClient.get("https://minitoolai.com/chatGPT/chatgpt_stream.php", {
        params: { streamtoken: streamToken },
        headers: { ...GPT_HEADERS, cookie: cookieHeader },
        timeout: 60000,
    });

    const streamData = streamResponse.data as string;
    const lines = streamData.split("\n\n").filter((line: string) => line);
    
    let result: unknown = null;
    for (const line of lines) {
        try {
            const parts = line.split("\n");
            if (parts[1]) {
                const json = JSON.parse(parts[1].substring(6));
                if (json.type === "response.completed" && json.response) {
                    result = json.response;
                    break;
                }
            }
        } catch {
            continue;
        }
    }

    if (!result) {
        throw new Error("No response received");
    }

    try {
        const parsed = typeof result === "string" ? JSON.parse(result) : result;
        const output = parsed?.output;
        if (Array.isArray(output)) {
            // Find the message output (not reasoning)
            const messageOutput = output.find((item: Record<string, unknown>) => item?.type === "message");
            if (messageOutput) {
                const content = (messageOutput as Record<string, unknown>)?.content;
                if (Array.isArray(content) && content.length > 0) {
                    const textContent = content.find((c: Record<string, unknown>) => c?.type === "output_text");
                    if (textContent?.text) {
                        return textContent.text as string;
                    }
                }
            }
        }
        return JSON.stringify(result);
    } catch {
        return typeof result === "string" ? result : JSON.stringify(result);
    }
}
