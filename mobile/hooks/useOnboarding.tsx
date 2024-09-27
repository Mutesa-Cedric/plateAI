import React from 'react'
enum Purpose {
    LOSE,
    GAIN,
    MAINTAIN
}

export default function useOnboarding() {
    const [activeOnboardingStep, setActiveOnboardingStep] = React.useState<"get_started" | "goal" | "onboarding_questions" | "body_scan">("get_started");

    const [onboardingData, setOnboardingData] = React.useState<{
        goal?: Purpose,
        age?: number,
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
