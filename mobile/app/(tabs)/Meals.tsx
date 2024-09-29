import { View, Text, Image, ActivityIndicator } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList } from "react-native-gesture-handler";
import useMeals from "@/hooks/useMeals";
import { Meal } from "@/types";

export const Measurement = ({
  name,
  value,
}: {
  name: string;
  value: number;
}) => {
  return (
    <View className="flex px-2 items-center justify-between">
      <Text className="text-base ">{name}</Text>
      <Text className="text-sm text-gray-500">
        {value} {name == "Cal" ? "" : "g"}
      </Text>
    </View>
  );
};

export const MealCard = ({
  foodItems,
  image,
  createdAt,
}: Meal) => {
  return (
    <View className="px-4 flex flex-row justify-start py-4">
      <Image
        source={{ uri: `data:image/jpeg;base64,${image}` }}
        className="w-24 h-24 rounded-full bg-center bg-contain"
      />
      <View className="grow px-2">
        {/* <Text className="text-xl text-green-700 font-bold">{name}</Text> */}
        <View className="flex flex-row items-start justify-between mt-2">
          <Measurement name="Cal" value={foodItems[0].calories} />
          <Measurement name="Protein" value={foodItems[0].proteins} />
          <Measurement name="Carbs" value={foodItems[0].carbohydrates} />
          <Measurement name="Fat" value={foodItems[0].fats} />
        </View>
      </View>
    </View>
  );
};

export default function Meals() {
  const { meals, loading } = useMeals();
  if (meals) {
    console.log(meals[0].foodItems);
  }
  
  return (
    <SafeAreaView>
      <Text className="text-6xl font-[PeachMelon] text-center py-5">Meals</Text>
      <View className="px-2 overflow-hidden">
      { loading ? (
        <ActivityIndicator size="large" color="#28785A" />
      ) : (
         <FlatList
          data={meals}
          renderItem={({ item }) => <MealCard {...item} />}
          keyExtractor={(item, idx) => idx.toString()}
          ItemSeparatorComponent={() => (
            <View className="h-0.5 bg-gray-200 mx-4" />
          )}
          showsVerticalScrollIndicator={false}
        />
      )
      }
      </View>
    </SafeAreaView>
  );
}
