import assert = require("assert");
import { describe, it, beforeEach } from "node:test";
import {
    getCachedMeal,
    getCachedMealHistory,
    getCachedRecentMeal,
    getCachedUserProfile,
    MealDb,
    UserDb,
} from "./appData";
import { resetAppCache } from "./cache";

function mealRow(id: string, updatedAt: string, extra: Record<string, unknown> = {}) {
    return {
        id,
        foodItems: [{ food_item: id }],
        createdAt: updatedAt,
        updatedAt,
        image: `img-${id}`,
        userId: "u1",
        ...extra,
    };
}

describe("app-server content-addressed data cache", () => {
    beforeEach(() => {
        resetAppCache();
    });

    it("meal history misses then hits for the same fingerprint", async () => {
        const rows = [mealRow("m1", "2026-01-02"), mealRow("m2", "2026-01-01")];
        let fullFetches = 0;
        const db: MealDb = {
            meal: {
                findMany: async (args: any) => {
                    if (args?.select && args.select.foodItems) {
                        fullFetches += 1;
                        return rows.map(({ image, userId, ...rest }) => rest);
                    }
                    if (args?.take === 1) {
                        return [{ id: rows[0].id, updatedAt: rows[0].updatedAt }];
                    }
                    return rows.map((r) => ({ id: r.id, updatedAt: r.updatedAt }));
                },
                findUnique: async () => null,
            },
        };

        const logs: string[] = [];
        const orig = console.log;
        console.log = (...args: unknown[]) => {
            logs.push(args.map(String).join(" "));
        };
        try {
            const a = await getCachedMealHistory(db, "u1");
            const b = await getCachedMealHistory(db, "u1");
            assert.deepStrictEqual(a, b);
            assert.strictEqual(fullFetches, 1);
            const joined = logs.join("\n");
            assert.match(joined, /cache miss/);
            assert.match(joined, /cache hit/);
        } finally {
            console.log = orig;
        }
    });

    it("new meal stamp is a new key so no invalidation is required", async () => {
        let stamps = [{ id: "m1", updatedAt: "2026-01-01" }];
        let fullFetches = 0;
        const db: MealDb = {
            meal: {
                findMany: async (args: any) => {
                    if (args?.select && args.select.foodItems) {
                        fullFetches += 1;
                        return stamps.map((s) => ({
                            id: s.id,
                            foodItems: [{ food_item: s.id }],
                            createdAt: s.updatedAt,
                            updatedAt: s.updatedAt,
                        }));
                    }
                    return stamps;
                },
                findUnique: async () => null,
            },
        };

        const first = await getCachedMealHistory(db, "u1");
        assert.strictEqual(first.length, 1);
        stamps = [
            { id: "m2", updatedAt: "2026-01-02" },
            { id: "m1", updatedAt: "2026-01-01" },
        ];
        const second = await getCachedMealHistory(db, "u1");
        assert.strictEqual(second.length, 2);
        assert.strictEqual(fullFetches, 2);
    });

    it("caches a single meal and a user profile by content stamp", async () => {
        const meal = mealRow("m9", "2026-04-01");
        let mealFull = 0;
        const mealDb: MealDb = {
            meal: {
                findMany: async () => [],
                findUnique: async (args: any) => {
                    if (args?.select?.updatedAt && !args?.select?.foodItems) {
                        return { id: meal.id, updatedAt: meal.updatedAt };
                    }
                    mealFull += 1;
                    return meal;
                },
            },
        };
        const first = await getCachedMeal(mealDb, "m9");
        const second = await getCachedMeal(mealDb, "m9");
        assert.deepStrictEqual(first, second);
        assert.strictEqual(mealFull, 1);

        const profile = {
            id: "u1",
            email: "a@b.c",
            firstName: "Ada",
            lastName: "L",
            age: 30,
            weight: 60,
            height: 165,
            purpose: "LOSE",
            gender: "FEMALE",
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
        };
        let profileFull = 0;
        const userDb: UserDb = {
            user: {
                findUnique: async (args: any) => {
                    if (args?.select && args.select.email) {
                        profileFull += 1;
                        return profile;
                    }
                    return { id: profile.id, updatedAt: profile.updatedAt };
                },
            },
        };
        const p1 = await getCachedUserProfile(userDb, "u1");
        const p2 = await getCachedUserProfile(userDb, "u1");
        assert.deepStrictEqual(p1, p2);
        assert.strictEqual(profileFull, 1);
    });

    it("recent meals use the newest stamp only", async () => {
        const newest = mealRow("m-new", "2026-05-02");
        let tookOne = 0;
        const db: MealDb = {
            meal: {
                findMany: async (args: any) => {
                    if (args?.take === 1 && args?.select?.foodItems) {
                        tookOne += 1;
                        return [
                            {
                                id: newest.id,
                                foodItems: newest.foodItems,
                                createdAt: newest.createdAt,
                                updatedAt: newest.updatedAt,
                            },
                        ];
                    }
                    if (args?.take === 1) {
                        return [{ id: newest.id, updatedAt: newest.updatedAt }];
                    }
                    return [];
                },
                findUnique: async () => null,
            },
        };
        const a = await getCachedRecentMeal(db, "u1");
        const b = await getCachedRecentMeal(db, "u1");
        assert.strictEqual(a?.id, "m-new");
        assert.deepStrictEqual(a, b);
        assert.strictEqual(tookOne, 1);
    });
});
