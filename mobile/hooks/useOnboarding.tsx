import React from 'react'
export enum Purpose {
    LOSE,
    GAIN,
    MAINTAIN
}

export default function useOnboarding() {
    const [activeOnboardingStep, setActiveOnboardingStep] = React.useState<"get_started" | "goal" | "onboarding_questions">("get_started");

    const [onboardingData, setOnboardingData] = React.useState<{
        goal?: Purpose,
        age?: number,
        gender?: number,
        weight?: number,
        height?: number,
    }>({

    });

    return {
        activeOnboardingStep,
        setActiveOnboardingStep,
        onboardingData,
        setOnboardingData
    }
}
