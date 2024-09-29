import { activeOnboardingStepState, onboardingDataState } from "@/atoms";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRecoilState } from "recoil";
import CustomButton from "../CustomButton";
import { Ionicons } from "@expo/vector-icons";

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (input: string) => void;
  placeholder?: string;
}) => (
  <View className="w-full flex gap-2 my-1">
    <Text className="text-xl text-center px-10">
      {label}
    </Text>
    <TextInput
      className="border w-full py-2 text-center flex justify-center items-center text-xl rounded-md border-gray-500 focus:border-cyan-600"
      keyboardType="numeric"
      value={value}
      placeholder={placeholder}
      onChangeText={onChangeText}
    />
  </View>
);

export default function OnBoardingQuestions() {
  const router = useRouter();
  const [onboardingData, setOnboardingData] = useRecoilState(onboardingDataState);
  const [onboardingStep, setOnboardingStep] = useRecoilState(activeOnboardingStepState);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | undefined>(undefined);

  const handleNumericInput =
    (setter: (val: string) => void) => (input: string) => {
      const numericValue = input.replace(/[^0-9]/g, "");
      setter(numericValue);
    };

  const handleNext = () => {
    setOnboardingData({
      ...onboardingData,
      height: parseInt(height),
      weight: parseInt(weight),
      age: parseInt(age),
      gender: gender
    });
    router.push("/Register");
  };

  return (
    <SafeAreaView className="bg-orange-100 w-full h-full justify-center items-center">
      <ScrollView className="p-5">
        <View className="flex flex-row justify-between">
          <Ionicons
            name="chevron-back"
            size={30}
            onPress={() => setOnboardingStep("goal")}
          />
        </View>
        <View className="justify-center items-center">
          <InputField
            label="How tall are you? (cm)"
            value={height}
            onChangeText={handleNumericInput(setHeight)}
          />
          <InputField
            label="How much do you weigh? (kg)"
            value={weight}
            onChangeText={handleNumericInput(setWeight)}
          />
          <InputField
            label="How old are you?"
            value={age}
            onChangeText={handleNumericInput(setAge)}
          />

          <View className="w-full flex my-2">
            <Text className="text-2xl text-center px-10">
              What gender are you?
            </Text>
            <View>
              {gender ? (
                <TouchableOpacity
                  className="my-3"
                  onPress={() => setGender(undefined)}
                >
                  <View className="border w-full py-4 text-center flex justify-center items-center rounded-md border-gray-500 focus:border-cyan-600">
                    <Text className="text-xl">
                      {gender === "MALE" ? "Male" : "Female"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <Picker
                  selectedValue={gender}
                  onValueChange={(itemValue) => setGender(itemValue)}
                >
                  <Picker.Item label="Select gender" value="" />
                  <Picker.Item label="Male" value="MALE" />
                  <Picker.Item label="Female" value="FEMALE" />
                </Picker>
              )}
            </View>
          </View>

          <Text className="text-center mb-10">
            We use this information to calculate and provide you with daily
            personalized recommendations.
          </Text>

          {gender && height && weight && age && (
            <CustomButton handlePress={handleNext} title="Next" />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
