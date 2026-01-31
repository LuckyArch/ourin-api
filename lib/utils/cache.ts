import { LRUCache } from "lru-cache";

interface CacheOptions {
    maxSize?: number;
    ttl?: number;
}

const DEFAULT_MAX_SIZE = 500;
const DEFAULT_TTL = 1000 * 60 * 5;

const globalCache = new LRUCache<string, any>({
    max: DEFAULT_MAX_SIZE,
    ttl: DEFAULT_TTL,
    allowStale: false,
    updateAgeOnGet: true,
    updateAgeOnHas: false,
});

export function createCache<T>(options: CacheOptions = {}) {
    const cache = new LRUCache<string, any>({
        max: options.maxSize || DEFAULT_MAX_SIZE,
        ttl: options.ttl || DEFAULT_TTL,
        allowStale: false,
        updateAgeOnGet: true,
    });

    return {
        get: (key: string): T | undefined => cache.get(key),
        set: (key: string, value: T, ttl?: number): void => {
            cache.set(key, value, { ttl });
        },
        has: (key: string): boolean => cache.has(key),
        delete: (key: string): boolean => cache.delete(key),
        clear: (): void => cache.clear(),
        size: (): number => cache.size,
    };
}

export function getCached<T>(key: string): T | undefined {
    return globalCache.get(key) as T | undefined;
}

export function setCached<T>(key: string, value: T, ttl?: number): void {
    globalCache.set(key, value, { ttl });
}

export function hasCached(key: string): boolean {
    return globalCache.has(key);
}

export function deleteCached(key: string): boolean {
    return globalCache.delete(key);
}

export function clearCache(): void {
    globalCache.clear();
}

export function getCacheSize(): number {
    return globalCache.size;
}

export function generateCacheKey(...parts: (string | number | undefined)[]): string {
    return parts.filter(Boolean).join(":");
}

export async function withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
): Promise<T> {
    const cached = getCached<T>(key);
    if (cached !== undefined) {
        return cached;
    }

    const result = await fetcher();
    setCached(key, result, ttl);
    return result;
}
