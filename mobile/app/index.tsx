import { activeOnboardingStepState } from "@/atoms";
import GetStarted from "@/components/onboarding/GetStarted";
import Goal from "@/components/onboarding/Goal";
import OnboardingQuestions from "@/components/onboarding/OnboardingQuestions";
import { View } from "react-native";
import { useRecoilValue } from "recoil";
import Meals from "./(tabs)/Meals";

export default function Onboarding() {
  const activeOnboardingStep = useRecoilValue(activeOnboardingStepState);

  return (
    <View>
      {
        activeOnboardingStep === "get_started" && <GetStarted />
      }
      {
        activeOnboardingStep === "goal" && <Goal />
      }
      {
        activeOnboardingStep === "onboarding_questions" && <OnboardingQuestions />
      }
      {/* <Meals /> */}
    </View>
  );
}
