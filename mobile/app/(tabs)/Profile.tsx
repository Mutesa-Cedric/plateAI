import CustomButton from "@/components/CustomButton";
import useAuth from "@/hooks/useAuth";
import React from "react";
import { Image, SafeAreaView, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";


export const Attribute = ({ label, value }: { label: string; value: any }) => (
  <View className="flex flex-col justify-between items-left  w-full mb-1">
    <Text className="text-lg text-primary font-bold">{label}</Text>
    <View className="border-b w-full border-gray-400 pb-2">
      <Text className="text-lg  w-full text-left mt-2">{value}</Text>
    </View>
  </View>
);

export default function Profile() {
  const { user, loggingOut, logout } = useAuth();
  
  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView className="px-6">
        <Image
          source={user?.gender === "MALE" ? require("@/assets/images/m.png") : require("@/assets/images/f.png")}
          style={{
            width: 150,
            height: 150,
            alignSelf: "center",
            marginTop: 20,
          }}
        />
        <View className="flex flex-col">
            <Attribute label="Name" value={user?.firstName+ " " + user?.lastName} />
            <Attribute label="Email" value={user?.email} />
            <Attribute label="Age" value={user?.age+ " (years)"} />
            <Attribute label="Height" value={user?.height+ " (cm)"} />
            <Attribute label="Weight" value={user?.weight+ " (kg)"} />
        </View>

        <CustomButton
          title="Logout"
          isLoading={loggingOut}
          handlePress={logout}
          containerStyles="mt-8 border-red-500 self-end"
          variant="outline"
          titleStyles="text-red-500"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
