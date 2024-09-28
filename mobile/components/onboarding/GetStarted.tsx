import { activeOnboardingStepState } from "@/atoms";
import { Link } from "expo-router";
import React from "react";
import { ImageBackground, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRecoilState } from "recoil";
import CustomButton from "../CustomButton";
import { StatusBar } from "expo-status-bar";

export default function GetStarted() {
  const [_, setActiveOnboardingStep] = useRecoilState(activeOnboardingStepState);

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
          <View className="flex items-center">
            <Text className="text-lg text-white font-bold">
              Already have an account?{" "}
              <Link href="/Login" push className="ml-10">
                <Text className="text-primary font-bold ">Login</Text>
              </Link>
            </Text>
          </View>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    </ImageBackground>
  );
}
