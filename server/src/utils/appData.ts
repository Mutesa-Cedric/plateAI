/**
 * Content-addressed reads for hot user/meal rows.
 *
 * A cheap `{id, updatedAt}` fingerprint is the key material. Creating a meal
 * or changing a profile produces a new fingerprint, so the next read misses
 * naturally — no invalidation path.
 */
import { appCache, contentKey, logCache } from "./cache";

export type MealStamp = { id: string; updatedAt: Date | string };
export type UserStamp = { id: string; updatedAt: Date | string };

export type MealHistoryRow = {
    id: string;
    foodItems: unknown;
    createdAt: Date | string;
    updatedAt: Date | string;
};

export type MealRow = {
    id: string;
    image: string;
    foodItems: unknown;
    createdAt: Date | string;
    updatedAt: Date | string;
    userId: string;
};

export type UserProfile = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    age: number | null;
    weight: number | null;
    height: number | null;
    purpose: string | null;
    gender: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
};

export type MealDb = {
    meal: {
        findMany: (args: unknown) => Promise<unknown>;
        findUnique: (args: unknown) => Promise<unknown>;
    };
};

export type UserDb = {
    user: {
        findUnique: (args: unknown) => Promise<unknown>;
    };
};

const HISTORY_SELECT = {
    id: true,
    foodItems: true,
    createdAt: true,
    updatedAt: true,
};

const PROFILE_SELECT = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    age: true,
    weight: true,
    height: true,
    purpose: true,
    gender: true,
    createdAt: true,
    updatedAt: true,
};

export async function getCachedMealHistory(
    db: MealDb,
    userId: string
): Promise<MealHistoryRow[]> {
    const fingerprint = (await db.meal.findMany({
        where: { userId },
        select: { id: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
    })) as MealStamp[];
    const key = contentKey("meal-history", userId, fingerprint);
    const hit = appCache.get<MealHistoryRow[]>(key);
    if (hit !== undefined) {
        logCache("hit", "meal-history", key, { userId, meals: fingerprint.length });
        return hit;
    }
    logCache("miss", "meal-history", key, { userId, meals: fingerprint.length });
    const meals = (await db.meal.findMany({
        where: { userId },
        select: HISTORY_SELECT,
        orderBy: { createdAt: "desc" },
    })) as MealHistoryRow[];
    appCache.set(key, meals);

    // Also publish the newest row under a recent-meals key derived from its stamp.
    if (meals[0] && fingerprint[0]) {
        const recentKey = contentKey("recent-meals", userId, fingerprint[0]);
        appCache.set(recentKey, meals[0]);
    }
    return meals;
}

export async function getCachedRecentMeal(
    db: MealDb,
    userId: string
): Promise<MealHistoryRow | null> {
    const fingerprint = (await db.meal.findMany({
        where: { userId },
        select: { id: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
    })) as MealStamp[];
    const stamp = fingerprint[0];
    if (!stamp) {
        return null;
    }
    const key = contentKey("recent-meals", userId, stamp);
    const hit = appCache.get<MealHistoryRow>(key);
    if (hit !== undefined) {
        logCache("hit", "recent-meals", key, { userId });
        return hit;
    }
    logCache("miss", "recent-meals", key, { userId });
    const meals = (await db.meal.findMany({
        where: { userId },
        select: HISTORY_SELECT,
        orderBy: { createdAt: "desc" },
        take: 1,
    })) as MealHistoryRow[];
    const recent = meals[0] ?? null;
    if (recent) {
        appCache.set(key, recent);
    }
    return recent;
}

export async function getCachedMeal(
    db: MealDb,
    mealId: string
): Promise<MealRow | null> {
    const stamp = (await db.meal.findUnique({
        where: { id: mealId },
        select: { id: true, updatedAt: true },
    })) as MealStamp | null;
    if (!stamp) {
        return null;
    }
    const key = contentKey("meal", stamp);
    const hit = appCache.get<MealRow>(key);
    if (hit !== undefined) {
        logCache("hit", "meal", key, { mealId });
        return hit;
    }
    logCache("miss", "meal", key, { mealId });
    const meal = (await db.meal.findUnique({
        where: { id: mealId },
    })) as MealRow | null;
    if (meal) {
        appCache.set(key, meal);
    }
    return meal;
}

export async function getCachedUserProfile(
    db: UserDb,
    userId: string
): Promise<UserProfile | null> {
    const stamp = (await db.user.findUnique({
        where: { id: userId },
        select: { id: true, updatedAt: true },
    })) as UserStamp | null;
    if (!stamp) {
        return null;
    }
    const key = contentKey("user-profile", stamp);
    const hit = appCache.get<UserProfile>(key);
    if (hit !== undefined) {
        logCache("hit", "user-profile", key, { userId });
        return hit;
    }
    logCache("miss", "user-profile", key, { userId });
    const user = (await db.user.findUnique({
        where: { id: userId },
        select: PROFILE_SELECT,
    })) as UserProfile | null;
    if (user) {
        appCache.set(key, user);
    }
    return user;
}
