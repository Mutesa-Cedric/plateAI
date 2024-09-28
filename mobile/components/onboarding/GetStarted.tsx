import { View, Text, ImageBackground } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import useOnboarding from "@/hooks/useOnboarding";
import CustomButton from "../CustomButton";
import { useRecoilState } from "recoil";
import { activeOnboardingStepState } from "@/atoms";

export default function GetStarted() {
  const [activeOnboardingStep, setActiveOnboardingStep] = useRecoilState(activeOnboardingStepState);

  return (
    <ImageBackground
      source={require("../../assets/images/get-started.jpg")}
      className="w-[100%] h-[100%]"
    >
      <SafeAreaView className="flex-1 justify-between items-center py-10 bg-black/20 m-0">
        <Text className="text-8xl font-[PeachMelon] text-white">Plate</Text>
        <View className="flex gap-5">
          <View className="flex items-center">
            <Text className="text-5xl font-[PeachMelon] text-white">
              Snap your Meal.
            </Text>
            <Text className="text-5xl font-[PeachMelon] text-white">
              Stay on track.
            </Text>
          </View>
          <View className="flex items-center">
            <CustomButton
              handlePress={() => {
                setActiveOnboardingStep("goal");
              }}
              title="Get Started"
            />
          </View>
          <Text className="text-lg text-white">
            Already have an account?{" "}
            <Link href="/Login" push className="ml-10">
              <Text className="text-primary ">Login</Text>
            </Link>
          </Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
