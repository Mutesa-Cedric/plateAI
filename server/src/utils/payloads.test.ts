import assert = require("assert");
import { describe, it } from "node:test";
import {
    ADVISOR_PAST_MEALS_LIMIT,
    canonicalizeChatPrompt,
    canonicalizeCookHistory,
    canonicalizePastMeals,
    canonicalizeRecentMeal,
    canonicalizeUser,
} from "./payloads";

const user = {
    firstName: "Ada",
    lastName: "Lovelace",
    age: 36,
    weight: 60,
    height: 165,
    gender: "FEMALE",
    purpose: "MAINTAIN",
    email: "ada@example.com",
    id: "user-1",
    password: "secret",
};

describe("AI payload trimming", () => {
    it("keeps only prompt user fields", () => {
        const trimmed = canonicalizeUser(user);
        assert.deepStrictEqual(Object.keys(trimmed).sort(), [
            "age",
            "firstName",
            "gender",
            "height",
            "lastName",
            "purpose",
            "weight",
        ]);
        assert.strictEqual(trimmed.email, undefined);
        assert.strictEqual(trimmed.password, undefined);
    });

    it("advisor past meals are foodItems-only and capped", () => {
        const meals = [
            {
                foodItems: [{ food_item: "A" }],
                image: "huge-1",
                createdAt: "2026-03-03",
            },
            {
                foodItems: [{ food_item: "B" }],
                image: "huge-2",
                createdAt: "2026-03-02",
            },
            {
                foodItems: [{ food_item: "C" }],
                image: "huge-3",
                createdAt: "2026-03-01",
            },
            {
                foodItems: [{ food_item: "D" }],
                image: "huge-4",
                createdAt: "2026-02-01",
            },
        ];
        const trimmed = canonicalizePastMeals(meals);
        assert.strictEqual(trimmed.length, ADVISOR_PAST_MEALS_LIMIT);
        assert.deepStrictEqual(trimmed[0], [{ food_item: "A" }]);
        assert.ok(trimmed.every((item) => !("image" in (item as object))));
    });

    it("recent meal drops image and ids", () => {
        assert.deepStrictEqual(
            canonicalizeRecentMeal({
                foodItems: [1],
                image: "xxx",
                id: "m1",
            }),
            { foodItems: [1] }
        );
    });

    it("cook history is foodItems only and drops older meals", () => {
        const meals = Array.from({ length: 25 }, (_, i) => ({
            id: `m${i}`,
            image: `img-${i}`,
            foodItems: [{ food_item: `f${i}` }],
            createdAt: `2026-01-${String(i + 1).padStart(2, "0")}`,
        }));
        const trimmed = canonicalizeCookHistory(meals);
        assert.ok(trimmed.length <= 20);
        assert.ok(trimmed.every((m) => Object.keys(m as object).join() === "foodItems"));
        assert.deepStrictEqual(
            (trimmed[0] as { foodItems: { food_item: string }[] }).foodItems[0]
                .food_item,
            "f24"
        );
    });

    it("chat prompt is whitespace-canonical", () => {
        assert.strictEqual(
            canonicalizeChatPrompt("  hello   world \n"),
            "hello world"
        );
    });
});
