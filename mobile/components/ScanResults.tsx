import React from 'react';
import { View, Text, FlatList } from 'react-native';
import CustomButton from './CustomButton';

const NutritionItem = ({ label, value, unit }: any) => (
    <View className="w-1/2 mb-2">
        <Text className="text-sm text-gray-600">{label}</Text>
        <Text className="text-base font-bold text-gray-800">{value} {unit}</Text>
    </View>
);

const FoodItem = ({ item }: any): any => (
    <View className="bg-white rounded-lg p-4 mb-2 shadow">
        <Text className="text-lg font-bold mb-2 text-green-700">{item.food_item}</Text>
        <View className="flex-row flex-wrap">
            <NutritionItem label="Calories" value={item.calories} unit="kcal" />
            <NutritionItem label="Protein" value={item.proteins} unit="g" />
            <NutritionItem label="Carbs" value={item.carbohydrates} unit="g" />
            <NutritionItem label="Fat" value={item.fats} unit="g" />
            <NutritionItem label="Sodium" value={item.sodium} unit="mg" />
        </View>
    </View>
);

export default function MealScanResults({ data }: any) {
    const totalNutrition = data.reduce((acc: { calories: number; proteins: number; carbohydrates: number; fats: number; sodium: number; }, item: { calories: string; proteins: string; carbohydrates: string; fats: string; sodium: string; }) => ({
        calories: acc.calories + parseFloat(item.calories),
        proteins: acc.proteins + parseFloat(item.proteins),
        carbohydrates: acc.carbohydrates + parseFloat(item.carbohydrates),
        fats: acc.fats + parseFloat(item.fats),
        sodium: acc.sodium + parseFloat(item.sodium),
    }), { calories: 0, proteins: 0, carbohydrates: 0, fats: 0, sodium: 0 });

    return (
        <View className="p-4 bg-gray-100">

            <Text className="text-2xl font-bold mb-4 text-gray-800">Meal Analysis Results</Text>
            <View className="bg-white rounded-lg p-4 mb-4 shadow">
                <Text className="text-xl font-bold mb-2 text-green-700">Total Nutrition</Text>
                <View className="flex-row flex-wrap">
                    <NutritionItem label="Calories" value={totalNutrition.calories.toFixed(1)} unit="kcal" />
                    <NutritionItem label="Protein" value={totalNutrition.proteins.toFixed(1)} unit="g" />
                    <NutritionItem label="Carbs" value={totalNutrition.carbohydrates.toFixed(1)} unit="g" />
                    <NutritionItem label="Fat" value={totalNutrition.fats.toFixed(1)} unit="g" />
                    <NutritionItem label="Sodium" value={totalNutrition.sodium.toFixed(1)} unit="mg" />
                </View>
            </View>

            <Text className="text-xl font-bold mb-2 text-gray-800">Detected Food Items</Text>
            <FlatList
                data={data}
                renderItem={({ item }) => <FoodItem item={item} />}
                keyExtractor={(item,idx) => idx.toString()}
                getItemLayout={(data, index) => (
                    { length: 100, offset: 100 * index, index }
                )}
            />

        </View>
    );
}