import assert = require("assert");
import { describe, it, beforeEach } from "node:test";
import {
    ContentCache,
    appCache,
    cachedGetOrSet,
    contentKey,
    resetAppCache,
    stableStringify,
} from "./cache";

describe("content-addressed cache keys", () => {
    it("hashes object key order stably", () => {
        assert.strictEqual(
            contentKey("user-profile", { b: 2, a: 1 }),
            contentKey("user-profile", { a: 1, b: 2 })
        );
    });

    it("changes when content changes", () => {
        assert.notStrictEqual(
            contentKey("meal-history", "u1", [{ id: "m1", updatedAt: "1" }]),
            contentKey("meal-history", "u1", [{ id: "m1", updatedAt: "2" }])
        );
    });

    it("namespaces isolate entries", () => {
        assert.notStrictEqual(contentKey("meal", 1), contentKey("user-profile", 1));
    });

    it("stableStringify sorts nested keys", () => {
        assert.strictEqual(
            stableStringify({ z: 1, a: { d: 1, c: 2 } }),
            stableStringify({ a: { c: 2, d: 1 }, z: 1 })
        );
    });
});

describe("ContentCache hit/miss", () => {
    beforeEach(() => {
        resetAppCache();
    });

    it("logs miss then hit and only produces once", () => {
        const logs: string[] = [];
        const orig = console.log;
        console.log = (...args: unknown[]) => {
            logs.push(args.map(String).join(" "));
        };
        try {
            let n = 0;
            const a = cachedGetOrSet("user-profile", { id: "u" }, () => {
                n += 1;
                return { name: "Ada" };
            });
            const b = cachedGetOrSet("user-profile", { id: "u" }, () => {
                n += 1;
                return { name: "other" };
            });
            assert.deepStrictEqual(a, b);
            assert.strictEqual(n, 1);
            const joined = logs.join("\n");
            assert.match(joined, /cache miss/);
            assert.match(joined, /cache hit/);
        } finally {
            console.log = orig;
        }
    });

    it("exposes no invalidation API", () => {
        const cache = new ContentCache(8);
        assert.strictEqual(
            typeof (cache as unknown as { invalidate?: unknown }).invalidate,
            "undefined"
        );
        assert.strictEqual(
            typeof (cache as unknown as { delete?: unknown }).delete,
            "undefined"
        );
        assert.ok(appCache);
    });
});
