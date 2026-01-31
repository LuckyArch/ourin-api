import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import https from "https";
import http from "http";

const httpAgent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 30000,
});

const httpsAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 30000,
    rejectUnauthorized: true,
});

const DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
};

export const httpClient: AxiosInstance = axios.create({
    timeout: 30000,
    httpAgent,
    httpsAgent,
    headers: DEFAULT_HEADERS,
    maxRedirects: 5,
    validateStatus: (status) => status < 500,
    decompress: true,
});

httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === "ECONNABORTED") {
            throw new Error("Request timeout");
        }
        if (error.code === "ENOTFOUND") {
            throw new Error("Host not found");
        }
        throw error;
    }
);

export async function fetchJson<T>(
    url: string,
    config?: AxiosRequestConfig
): Promise<T> {
    const response = await httpClient.get<T>(url, {
        ...config,
        headers: {
            ...DEFAULT_HEADERS,
            Accept: "application/json",
            ...config?.headers,
        },
    });
    return response.data;
}

export async function fetchHtml(
    url: string,
    config?: AxiosRequestConfig
): Promise<string> {
    const response = await httpClient.get<string>(url, {
        ...config,
        responseType: "text",
        headers: {
            ...DEFAULT_HEADERS,
            Accept: "text/html",
            ...config?.headers,
        },
    });
    return response.data;
}

export async function fetchBuffer(
    url: string,
    config?: AxiosRequestConfig
): Promise<Buffer> {
    const response = await httpClient.get<ArrayBuffer>(url, {
        ...config,
        responseType: "arraybuffer",
        headers: {
            ...DEFAULT_HEADERS,
            ...config?.headers,
        },
    });
    return Buffer.from(response.data);
}

export async function postJson<T>(
    url: string,
    data: unknown,
    config?: AxiosRequestConfig
): Promise<T> {
    const response = await httpClient.post<T>(url, data, {
        ...config,
        headers: {
            ...DEFAULT_HEADERS,
            "Content-Type": "application/json",
            Accept: "application/json",
            ...config?.headers,
        },
    });
    return response.data;
}

export async function postForm<T>(
    url: string,
    data: Record<string, string>,
    config?: AxiosRequestConfig
): Promise<T> {
    const formData = new URLSearchParams(data);
    const response = await httpClient.post<T>(url, formData.toString(), {
        ...config,
        headers: {
            ...DEFAULT_HEADERS,
            "Content-Type": "application/x-www-form-urlencoded",
            ...config?.headers,
        },
    });
    return response.data;
}

export function getContentType(response: { headers: Record<string, string> }): string {
    return response.headers["content-type"] || "application/octet-stream";
}

export function isSuccessStatus(status: number): boolean {
    return status >= 200 && status < 300;
}

export { DEFAULT_HEADERS };
