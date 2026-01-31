import { registerPlugin, jsonResponse, errorResponse, getStartTime, httpClient } from "@/lib";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

interface SearchResult {
    title: string;
    url: string;
    snippet: string;
}

interface PerplexityResult {
    answer: string;
    searchResults: SearchResult[];
}

const PERPLEXITY_HEADERS = {
    "Content-Type": "application/json",
    "Referer": "https://www.perplexity.ai/search/",
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
    "X-Perplexity-Request-Reason": "perplexity-query-state-provider",
};

async function fetchPerplexity(query: string): Promise<PerplexityResult> {
    const frontendUuid = uuidv4();

    const requestBody = {
        params: {
            attachments: [],
            language: "en-US",
            timezone: "Asia/Jakarta",
            search_focus: "internet",
            sources: ["web"],
            search_recency_filter: null,
            frontend_uuid: frontendUuid,
            mode: "concise",
            model_preference: "turbo",
            is_related_query: false,
            is_sponsored: false,
            visitor_id: uuidv4(),
            frontend_context_uuid: uuidv4(),
            prompt_source: "user",
            query_source: "home",
            is_incognito: false,
            time_from_first_type: 2273.9,
            local_search_enabled: false,
            use_schematized_api: true,
            send_back_text_in_streaming_api: false,
            supported_block_use_cases: [
                "answer_modes",
                "media_items",
                "knowledge_cards",
                "inline_entity_cards",
                "place_widgets",
                "finance_widgets",
                "sports_widgets",
                "shopping_widgets",
                "search_result_widgets",
                "inline_images",
                "inline_assets",
            ],
            client_coordinates: null,
            mentions: [],
            dsl_query: query,
            skip_search_enabled: true,
            is_nav_suggestions_disabled: false,
            version: "2.18",
        },
        query_str: query,
    };

    const response = await httpClient.post(
        "https://api.nekolabs.web.id/px?url=https://www.perplexity.ai/rest/sse/perplexity_ask",
        requestBody,
        {
            headers: {
                ...PERPLEXITY_HEADERS,
                "X-Request-Id": frontendUuid,
            },
            timeout: 60000,
        }
    );

    const data = response.data as Record<string, unknown>;
    const result = data.result as Record<string, unknown>;
    const content = result?.content as string;

    if (!content) {
        throw new Error("Failed to get Perplexity response");
    }

    const lines = content.split("\n").filter((l: string) => l.startsWith("data:"));
    const parsed = lines.map((l: string) => {
        try {
            return JSON.parse(l.slice(6));
        } catch {
            return null;
        }
    }).filter(Boolean);

    const finalMessage = parsed.find((l: Record<string, unknown>) => l.final_sse_message);
    if (!finalMessage?.text) {
        throw new Error("No answer found");
    }

    const info = JSON.parse(finalMessage.text);
    const finalStep = info.find((s: Record<string, unknown>) => s.step_type === "FINAL");
    const searchStep = info.find((s: Record<string, unknown>) => s.step_type === "SEARCH_RESULTS");

    let answer = "";
    try {
        const answerContent = finalStep?.content?.answer;
        if (answerContent) {
            const answerJson = JSON.parse(answerContent);
            answer = answerJson.answer || "";
        }
    } catch {
        answer = "";
    }

    const searchResults: SearchResult[] = [];
    try {
        const webResults = searchStep?.content?.web_results as Array<Record<string, unknown>> || [];
        for (const r of webResults) {
            searchResults.push({
                title: (r.title as string) || "",
                url: (r.url as string) || "",
                snippet: (r.snippet as string) || "",
            });
        }
    } catch {
        // ignore
    }

    if (!answer) {
        throw new Error("No answer found");
    }

    return { answer, searchResults };
}

registerPlugin({
    name: "Perplexity AI",
    slug: "perplexity",
    category: "ai",
    description: "Search and chat with Perplexity AI",
    endpoint: {
        title: "Perplexity AI",
        description: "Get AI-powered search answers from Perplexity",
        path: "/api/ai/perplexity",
        method: "GET",
        responseType: "json",
        tags: ["ai", "perplexity", "search", "chat"],
        parameters: [
            {
                name: "q",
                required: true,
                description: "Your search query or question",
                type: "string",
            },
        ],
        run: async (request: NextRequest) => {
            const startTime = getStartTime();
            const query = request.nextUrl.searchParams.get("q");

            if (!query) {
                return errorResponse("Parameter 'q' is required", 400, startTime);
            }

            try {
                const result = await fetchPerplexity(query);
                return jsonResponse(result, 200, startTime, "NONE");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to get Perplexity response";
                return errorResponse(message, 500, startTime);
            }
        },
    },
});