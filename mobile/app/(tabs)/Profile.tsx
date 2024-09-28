import CustomButton from "@/components/CustomButton";
import useAuth from "@/hooks/useAuth";
import React from "react";
import { Image, SafeAreaView, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";


export const Attribute = ({ label, value }: { label: string; value: any }) => (
  <View className="flex flex-col justify-between items-left my-2 w-full">
    <Text className="text-xl text-green-600 font-bold">{label}</Text>
    <View className="border-b w-full border-gray-400 my-1 py-2">
      <Text className="text-lg  w-full text-left mt-2">{value}</Text>
    </View>
  </View>
);

export default function Profile() {
  const { user, loggingOut, logout } = useAuth();
  console.log(user);
  
  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView className="px-6">
        <Image
          source={user?.gender === "MALE" ? require("@/assets/images/m.png") : require("@/assets/images/f.png")}
          style={{
            width: 200,
            height: 200,
            alignSelf: "center",
            marginTop: 20,
          }}
        />
        <View className="flex flex-col">
            <Attribute label="Name" value={user?.firstName+ " " + user?.lastName} />
            <Attribute label="Email" value={user?.email} />
            <Attribute label="Age" value={user?.age} />
            <Attribute label="Height" value={user?.height} />
            <Attribute label="Weight" value={user?.weight} />
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
