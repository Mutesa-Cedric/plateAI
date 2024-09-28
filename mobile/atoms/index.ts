import { atom } from 'recoil';

export enum Purpose {
    LOSE,
    GAIN,
    MAINTAIN
}

export const activeOnboardingStepState = atom<"get_started" | "goal" | "onboarding_questions">({
    key: 'activeOnboardingStep',
    default: 'get_started'
});


export const onboardingDataState = atom<{
    goal?: Purpose,
    age?: number,
    gender?: number,
    weight?: number,
    height?: number,
}>({
    key: 'onboardingData',
    default: {}
})