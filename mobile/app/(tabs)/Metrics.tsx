import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRecoilValue } from 'recoil';
import { mealsState } from '@/atoms';

const MetricCard = ({ title, calories, protein, carbs, fat }: any) => (
  <View className="bg-gray-100 rounded-lg p-4 mb-6 shadow-md">
    <Text className="text-xl font-bold mb-3">{title}</Text>
    <View className="flex-row justify-between">
      <View className="items-center">
        <Text className="text-lg font-semibold">{calories}</Text>
        <Text className="text-sm text-gray-600">Calories</Text>
      </View>
      <View className="items-center">
        <Text className="text-lg font-semibold">{protein}</Text>
        <Text className="text-sm text-gray-600">Protein</Text>
      </View>
      <View className="items-center">
        <Text className="text-lg font-semibold">{carbs}</Text>
        <Text className="text-sm text-gray-600">Carbs</Text>
      </View>
      <View className="items-center">
        <Text className="text-lg font-semibold">{fat}</Text>
        <Text className="text-sm text-gray-600">Fat</Text>
      </View>
    </View>
  </View>
);

const safeParseFloat = (value:string) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

const calculateMetrics = (meals, startDate, endDate) => {
  const filteredMeals = meals.filter(meal => {
    const mealDate = new Date(meal.createdAt);
    return !isNaN(mealDate.getTime()) && mealDate >= startDate && mealDate <= endDate;
  });

  return filteredMeals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.foodItems?.reduce((sum, item) => sum + safeParseFloat(item.calories), 0) || 0),
    protein: acc.protein + (meal.foodItems?.reduce((sum, item) => sum + safeParseFloat(item.proteins), 0) || 0),
    carbs: acc.carbs + (meal.foodItems?.reduce((sum, item) => sum + safeParseFloat(item.carbohydrates), 0) || 0),
    fat: acc.fat + (meal.foodItems?.reduce((sum, item) => sum + safeParseFloat(item.fats), 0) || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
};

const formatMetric = (value) => {
  return isNaN(value) ? '0' : value.toFixed(1);
};

export default function Metrics() {
  const meals = useRecoilValue(mealsState);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const todayMetrics = calculateMetrics(meals, today, now);
  const weekMetrics = calculateMetrics(meals, weekStart, now);
  const allTimeMetrics = calculateMetrics(meals, new Date(0), now);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Text className="text-6xl font-[PeachMelon] text-center py-5">Metrics</Text>
      <ScrollView className="px-4">
        <MetricCard
          title="Today"
          calories={formatMetric(todayMetrics.calories)}
          protein={formatMetric(todayMetrics.protein)}
          carbs={formatMetric(todayMetrics.carbs)}
          fat={formatMetric(todayMetrics.fat)}
        />
        <MetricCard
          title="This Week"
          calories={formatMetric(weekMetrics.calories)}
          protein={formatMetric(weekMetrics.protein)}
          carbs={formatMetric(weekMetrics.carbs)}
          fat={formatMetric(weekMetrics.fat)}
        />
        <MetricCard
          title="All Time"
          calories={formatMetric(allTimeMetrics.calories)}
          protein={formatMetric(allTimeMetrics.protein)}
          carbs={formatMetric(allTimeMetrics.carbs)}
          fat={formatMetric(allTimeMetrics.fat)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}