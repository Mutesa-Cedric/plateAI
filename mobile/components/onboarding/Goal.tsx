import { activeOnboardingStepState, onboardingDataState } from "@/atoms";
import { Purpose } from "@/hooks/useOnboarding";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableHighlight, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRecoilState } from "recoil";
import CustomButton from "../CustomButton";

export default function Goal() {
  const router = useRouter();
  const [color, setColor] = useState("white");
  const [_, setActiveOnboardingStep] = useRecoilState(activeOnboardingStepState);
  const [onboardingData, setOnboardingData] = useRecoilState(onboardingDataState)

  const goals = [
    { purpose: Purpose.LOSE, title: "Lose" },
    { purpose: Purpose.GAIN, title: "Gain" },
    { purpose: Purpose.MAINTAIN, title: "Maintain" },
  ];

  return (
    <SafeAreaView className="bg-orange-100 w-[100%] h-[100%] p-5">
      {/* <View className="flex flex-row justify-between">
        <Ionicons name="chevron-back" size={30} onPress={() => router.back()} />
      </View> */}
      <View className="flex-1 grow justify-center items-center">
        <Text className="text-4xl font-[PeachMelon] text-center px-10">
          What goal do you have in mind?
        </Text>
        <View className="flex w-full items-center gap-5 my-10">
          {goals.map((goal) => (
            <TouchableHighlight
              className={`bg-white/70 p-10 w-[100%] flex items-center justify-center rounded-md shadow-md`}
              onPress={() => {
                setOnboardingData({ ...onboardingData, goal: goal.purpose });
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
        {/* <CustomButton
            handlePress={() => {
              // setActiveOnboardingStep("onboarding_questions");
              // setOnboardingData({ ...onboardingData, goal });
            }}
            title="Next"
          /> */}
        {/* )} */}
      </View>
    </SafeAreaView>
  );
}
