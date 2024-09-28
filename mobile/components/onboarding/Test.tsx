import { View, Text, Image } from "react-native";
import React from "react";
import useAuth from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const { user } = useAuth();
  return (
    <SafeAreaView>
      {/* avatar should be f-avatar for female and m-avatar for male */}
      <Image source={require("../../assets/images/f-avatar.svg")} />
      <View>
        <Text>{user?.firstName}</Text>
        <Text>{user?.email}</Text>
      </View>
    </SafeAreaView>
  );
}
