import useOnboarding, { Purpose } from "@/hooks/useOnboarding";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableHighlight, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../CustomButton";

export default function Goal() {
  const router = useRouter();
  const {
    activeOnboardingStep,
    setActiveOnboardingStep,
    setOnboardingData,
    onboardingData,
  } = useOnboarding();
  const [goal, setGoal] = React.useState<Purpose>();

  return (
    <SafeAreaView className="bg-orange-100 w-[100%] h-[100%] p-5">
      <View className="flex flex-row justify-between">
        <Ionicons name="chevron-back" size={30} onPress={() => router.back()} />
      </View>
      <View className="flex-1 grow justify-center items-center">
        <Text className="text-4xl font-[PeachMelon] text-center px-10">
          What goal do you have in mind?
        </Text>
        <View className="flex w-full items-center gap-5 my-10">
          <TouchableHighlight
            className="bg-white/70 p-10 w-[100%] flex items-center justify-center rounded-md shadow-md"
            onPress={() => setGoal(Purpose.LOSE)}
          >
            <Text className="text-lg">Lose Weight</Text>
          </TouchableHighlight>
          <TouchableHighlight
            className="bg-white/70 p-10 w-[100%] flex items-center justify-center rounded-md shadow-md"
            onPress={() => setGoal(Purpose.MAINTAIN)}
          >
            <Text className="text-lg">Maintain Weight</Text>
          </TouchableHighlight>
          <TouchableHighlight
            className="bg-white/70 p-10 w-[100%] flex items-center justify-center rounded-md shadow-md"
            onPress={() => setGoal(Purpose.GAIN)}
          >
            <Text className="text-lg">Gain Weight</Text>
          </TouchableHighlight>
        </View>
        <Text className="text-center mb-10">
          We use this information to calculate and provide you with daily
          personalized recommendations.
        </Text>
        {goal && (
          <CustomButton
            handlePress={() => {
                setActiveOnboardingStep("onboarding_questions");
                setOnboardingData({ ...onboardingData, goal });
                console.log(onboardingData);
                console.log(activeOnboardingStep);
                
            }}
            title="Next"
        />
        ) }
      </View>
    </SafeAreaView>
  );
}
