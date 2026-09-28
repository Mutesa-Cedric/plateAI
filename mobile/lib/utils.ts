
export const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

export const validatePassword = (password: string) => {
    return password.length >= 4;
}

/** Advisor prompt only interpolates the first 3 past meals. */
export const ADVISOR_PAST_MEALS_LIMIT = 3;

/**
 * Cook-for-me runs on an 8k-context model. Sending every historic meal
 * (plus images) both blows the window and changes the cache key on every
 * newly logged meal. Cap to a recent foodItems-only slice.
 */
export const COOK_MEAL_HISTORY_LIMIT = 20;

type MealLike = {
    foodItems?: unknown;
    createdAt?: string | Date;
};

type UserLike = {
    firstName?: string;
    lastName?: string;
    age?: number;
    weight?: number;
    height?: number;
    gender?: string;
    purpose?: string;
};

export function promptUserFields(user: UserLike | null | undefined) {
    if (!user) return user;
    return {
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        weight: user.weight,
        height: user.height,
        gender: user.gender,
        purpose: user.purpose,
    };
}

function recentFirst<T extends MealLike>(meals: T[] | null | undefined): T[] {
    const list = [...(meals || [])];
    if (list.every((m) => m && m.createdAt)) {
        list.sort(
            (a, b) =>
                new Date(b.createdAt as string | Date).getTime() -
                new Date(a.createdAt as string | Date).getTime()
        );
    }
    return list;
}

export function advisorPastMeals(meals: MealLike[] | null | undefined) {
    return recentFirst(meals)
        .slice(0, ADVISOR_PAST_MEALS_LIMIT)
        .map((meal) => meal.foodItems);
}

export function cookMealHistory(meals: MealLike[] | null | undefined) {
    return recentFirst(meals)
        .slice(0, COOK_MEAL_HISTORY_LIMIT)
        .map((meal) => ({ foodItems: meal.foodItems }));
}
