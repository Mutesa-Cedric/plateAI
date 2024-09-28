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
    key: 'onboardingData',
    default: {}
})