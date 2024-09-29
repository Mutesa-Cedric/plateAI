import { mealsState } from '@/atoms';
import CustomButton from '@/components/CustomButton';
import useMeals from '@/hooks/useMeals';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, SafeAreaView, Text, View } from 'react-native';
import { useRecoilValue } from 'recoil';



export default function HomeScreen() {
    const { loading } = useMeals();
    const meals = useRecoilValue(mealsState);
    const router = useRouter();


    const stats = useMemo(() => {
        // Initialize totals
        let totalCalories = 0;
        let totalProteins = 0;
        let totalFats = 0;
        let totalCarbs = 0;

        // Loop through each meal and sum the nutrients
        meals?.forEach(meal => {
            meal?.foodItems?.forEach(foodItem => {
                totalCalories += parseFloat(foodItem.calories) || 0; // Fallback to 0 if invalid
                totalProteins += parseFloat(foodItem.proteins) || 0; // Fallback to 0 if invalid
                totalFats += parseFloat(foodItem.fats) || 0; // Fallback to 0 if invalid
                totalCarbs += parseFloat(foodItem.carbohydrates) || 0; // Fallback to 0 if invalid
            });
        });

        // Total grams of all macronutrients
        const totalGrams = totalProteins + totalFats + totalCarbs;

        // Calculate percentage of each macronutrient
        const percentages = {
            proteins: totalGrams > 0 ? ((totalProteins / totalGrams) * 100).toFixed(1) : 0,
            fats: totalGrams > 0 ? ((totalFats / totalGrams) * 100).toFixed(1) : 0,
            carbs: totalGrams > 0 ? ((totalCarbs / totalGrams) * 100).toFixed(1) : 0,
        };

        return {
            totalCalories,
            breakdown: [
                { name: 'Proteins', percentage: percentages.proteins },
                { name: 'Fats', percentage: percentages.fats },
                { name: 'Carbs', percentage: percentages.carbs },
            ]
        };
    }, [meals]);


    return (
        <View className=''>
            <View className='h-[350px] w-full bg-primary/90 rounded-b-[50%] shadow-xl'>
                <SafeAreaView>
                    <View className='pl-4'>
                        {/* <Logo theme='light' /> */}
                        <Text className='text-4xl text-center font-[PeachMelon] py-2 text-white font-semibold'>
                            Weekly Report
                        </Text>
                    </View>
                    <View className='w-full px-4'>
                        <View className='bg-white p-4 rounded shadow mt-4'>
                            <Text className='text-lg font-semibold'>Total Calories</Text>
                            {loading ?
                                <ActivityIndicator size='small' color='#28785A' /> :
                                <Text className='text-gray-500 text-sm'>{stats.totalCalories.toFixed(1)} KCal</Text>}
                        </View>
                    </View>
                    <View className='flex-row px-2 w-full'>
                        {
                            stats.breakdown.map((meal, index) => (
                                <View key={index} className='w-1/3'>
                                    <View className='bg-white p-4 rounded shadow mt-4 mx-2'>
                                        <Text className='text-base font-semibold'>{meal.name}</Text>
                                        {loading ?
                                            <ActivityIndicator size='small' color='#28785A' /> :
                                            <Text className='text-gray-500 text-sm'>{meal.percentage}%</Text>}
                                    </View>
                                </View>
                            ))
                        }
                    </View>
                </SafeAreaView>
            </View>

            <View className=' pl-4 pr-4  ml-4 mt-8 mr-4 border shadow-lg border-primary border-dashed rounded-md min-h-[200px] items-center justify-center'>
                <Text className='text-lg text-gray-700'>Analyse your first meal</Text>
                <CustomButton
                    title='Open Camera'
                    handlePress={() => router.push("/MealScan")}
                    containerStyles='mt-4'
                    variant='outline'
                />
            </View>
        </View>
    )
}