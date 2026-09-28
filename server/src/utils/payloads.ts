/**
 * Canonical AI request shapes. Must match `core/payloads.py` so unused
 * fields never become part of a content-addressed cache key.
 */

export const ADVISOR_PAST_MEALS_LIMIT = 3;
export const COOK_MEAL_HISTORY_LIMIT = 20;

export const USER_PROMPT_FIELDS = [
    "firstName",
    "lastName",
    "age",
    "weight",
    "height",
    "gender",
    "purpose",
] as const;

export function canonicalizeUser(user: unknown): Record<string, unknown> {
    if (!user || typeof user !== "object") return {};
    const src = user as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const field of USER_PROMPT_FIELDS) {
        out[field] = src[field];
    }
    return out;
}

export function foodItemsOf(meal: unknown): unknown {
    if (meal && typeof meal === "object" && "foodItems" in (meal as object)) {
        return (meal as { foodItems: unknown }).foodItems;
    }
    return meal;
}

function asMealList(meals: unknown): unknown[] {
    if (meals == null) return [];
    return Array.isArray(meals) ? meals : [];
}

export function orderMealsRecentFirst(meals: unknown[]): unknown[] {
    if (
        meals.length &&
        meals.every(
            (m) => m && typeof m === "object" && (m as { createdAt?: unknown }).createdAt
        )
    ) {
        return [...meals].sort((a, b) => {
            const at = String((a as { createdAt: unknown }).createdAt);
            const bt = String((b as { createdAt: unknown }).createdAt);
            return bt.localeCompare(at);
        });
    }
    return meals;
}

export function canonicalizeRecentMeal(recentMeal: unknown): unknown {
    if (recentMeal == null) return null;
    if (recentMeal && typeof recentMeal === "object") {
        return { foodItems: (recentMeal as { foodItems?: unknown }).foodItems };
    }
    return recentMeal;
}

export function canonicalizePastMeals(
    pastMeals: unknown,
    limit = ADVISOR_PAST_MEALS_LIMIT
): unknown[] {
    const ordered = orderMealsRecentFirst(asMealList(pastMeals));
    return ordered.slice(0, Math.max(0, limit)).map(foodItemsOf);
}

export function canonicalizeCookHistory(
    mealHistory: unknown,
    limit = COOK_MEAL_HISTORY_LIMIT
): unknown[] {
    const ordered = orderMealsRecentFirst(asMealList(mealHistory));
    return ordered.slice(0, Math.max(0, limit)).map((meal) => ({
        foodItems: foodItemsOf(meal),
    }));
}

export function canonicalizeChatPrompt(prompt: unknown): string {
    return String(prompt ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .join(" ");
}
