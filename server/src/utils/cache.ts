/**
 * Content-addressed LRU cache for the public app server.
 *
 * Keys are SHA-256 of the canonical content (or a content fingerprint such
 * as `{id, updatedAt}`). When the underlying row changes the fingerprint
 * changes, so there is no invalidation API.
 */
import { createHash } from "crypto";
import { LRUCache } from "lru-cache";
import { log } from "./logger";

const MAX = Number(process.env.APP_CACHE_MAXSIZE || 500);

export function canonicalize(value: unknown): unknown {
    if (value === undefined || value === null) return null;
    if (value instanceof Date) return value.toISOString();
    if (Buffer.isBuffer(value)) return value.toString("hex");
    if (Array.isArray(value)) return value.map(canonicalize);
    if (typeof value === "object") {
        const src = value as Record<string, unknown>;
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(src).sort()) {
            out[key] = canonicalize(src[key]);
        }
        return out;
    }
    return value;
}

export function stableStringify(value: unknown): string {
    return JSON.stringify(canonicalize(value));
}

export function contentKey(namespace: string, ...parts: unknown[]): string {
    const payload = stableStringify({ ns: namespace, parts });
    return createHash("sha256").update(payload).digest("hex");
}

export class ContentCache {
    // lru-cache v10 values must extend `{}`; arrays/objects do.
    private readonly store: LRUCache<string, object>;

    constructor(maxsize = MAX) {
        this.store = new LRUCache<string, object>({ max: Math.max(1, maxsize) });
    }

    get<T>(key: string): T | undefined {
        return this.store.get(key) as T | undefined;
    }

    set(key: string, value: object): void {
        this.store.set(key, value);
    }

    has(key: string): boolean {
        return this.store.has(key);
    }

    get size(): number {
        return this.store.size;
    }

    /** Test helper — not used as production invalidation. */
    clear(): void {
        this.store.clear();
    }
}

export const appCache = new ContentCache();

export function resetAppCache(): void {
    appCache.clear();
}

export function logCache(
    event: "hit" | "miss",
    namespace: string,
    key: string,
    extra?: Record<string, unknown>
): void {
    log.info("cache", `cache ${event}`, {
        ns: namespace,
        key: key.slice(0, 16),
        ...(extra || {}),
    });
}

export function cachedGetOrSet<T extends object>(
    namespace: string,
    keyMaterial: unknown,
    producer: () => T
): T {
    const key = contentKey(namespace, keyMaterial);
    const hit = appCache.get<T>(key);
    if (hit !== undefined) {
        logCache("hit", namespace, key);
        return hit;
    }
    logCache("miss", namespace, key);
    const value = producer();
    appCache.set(key, value);
    return value;
}

export async function cachedGetOrSetAsync<T extends object>(
    namespace: string,
    keyMaterial: unknown,
    producer: () => Promise<T>
): Promise<T> {
    const key = contentKey(namespace, keyMaterial);
    const hit = appCache.get<T>(key);
    if (hit !== undefined) {
        logCache("hit", namespace, key);
        return hit;
    }
    logCache("miss", namespace, key);
    const value = await producer();
    appCache.set(key, value);
    return value;
}
