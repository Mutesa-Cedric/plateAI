import BodyScan from "@/components/onboarding/BodyScan";
import GetStarted from "@/components/onboarding/GetStarted";
import Goal from "@/components/onboarding/Goal";
import OnboardingQuestions from "@/components/onboarding/OnboardingQuestions";
import useOnboarding from "@/hooks/useOnboarding";
import { View } from "react-native";

export default function Onboarding() {
  const { activeOnboardingStep } = useOnboarding();
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
      {
        activeOnboardingStep === "body_scan" && <BodyScan />
      }
      {/* <Login /> */}
    </View>
  );
}
