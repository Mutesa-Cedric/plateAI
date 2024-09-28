import { activeOnboardingStepState, onboardingDataState } from "@/atoms";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableHighlight, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRecoilState } from "recoil";

export default function Goal() {
  const router = useRouter();
  const [_, setActiveOnboardingStep] = useRecoilState(activeOnboardingStepState);
  const [onboardingData, setOnboardingData] = useRecoilState(onboardingDataState)

  const goals = [
    { purpose: "LOSE", title: "Lose" },
    { purpose: "GAIN", title: "Gain" },
    { purpose: "MAINTAIN", title: "Maintain" },
  ] as const;

  return (
    <SafeAreaView className="bg-orange-100 w-[100%] h-[100%] p-5">
      <View className="flex flex-row justify-between">
        <Ionicons name="chevron-back" size={30} onPress={() => setActiveOnboardingStep("get_started")} />
      </View>
      <View className="flex-1 grow justify-center items-center">
        <Text className="text-4xl font-[PeachMelon] text-center px-10">
          What goal do you have in mind?
        </Text>
        <View className="flex w-full items-center gap-5 my-10">
          {goals.map((goal) => (
            <TouchableHighlight
              key={goal.purpose}
              className={`bg-white/70 p-10 w-[100%] flex items-center justify-center rounded-md shadow-md`}
              onPress={() => {
                setOnboardingData({ ...onboardingData, purpose: goal.purpose });
                setTimeout(() => {
                  setActiveOnboardingStep("onboarding_questions")
                }, 100)
              }}
              underlayColor={"green"}
            >
              <Text className="text-lg">{goal.title} Weight</Text>
            </TouchableHighlight>
          ))}
        </View>
        <Text className="text-center mb-10">
          We use this information to calculate and provide you with daily
          personalized recommendations.
        </Text>
        {/* {goal && ( */}
      </View>
    </SafeAreaView>
  );
}
