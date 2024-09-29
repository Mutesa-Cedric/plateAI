import { Meal } from '@/types';
import { atom } from 'recoil';

export const activeOnboardingStepState = atom<"get_started" | "goal" | "onboarding_questions">({
    key: 'activeOnboardingStep',
    default: 'get_started'
});


export const onboardingDataState = atom<{
    purpose?: "LOSE" | "GAIN" | "MAINTAIN",
    age?: number,
    gender?: "MALE" | "FEMALE",
    weight?: number,
    height?: number,
}>({
    key: 'OnboardingData',
    default: {}
});

export const mealBeingScannedState = atom<{
    base64: string;
    width: number;
    height: number;
    uri: string;
} | null>({
    key: 'MealBeingScanned',
    default: null
});

export const mostRecentMealState = atom<{
    foodItems: any[];
} | null>({
    key: 'MostRecentMeal',
    default: null
});

export const mealsState = atom<Meal[]>({
    key: 'Meals',
    default: []
});