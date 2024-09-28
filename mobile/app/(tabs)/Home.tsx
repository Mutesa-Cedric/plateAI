import { View, Text, SafeAreaView } from 'react-native'
import React from 'react'
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from "react-native";
import Logo from '@/components/Logo';
import CustomButton from '@/components/CustomButton';
const data = [
    {
        name: "Proteins",
        population: 25,
        color: "#4e7ed8",
        legendFontColor: "black",
        legendFontSize: 15
    },
    {
        name: "Fats",
        population: 45,
        color: "#d28484",
        legendFontColor: "black",
        legendFontSize: 15
    },
    {
        name: "carbohydrates",
        population: 30,
        color: "#ddbe7b",
        legendFontColor: "black",
        legendFontSize: 14
    },
];

const meals = [
    {
        name: "Proteins",
        percentage: 25,
    },
    {
        name: "Fats",
        percentage: 45,
    },
    {
        name: "Carbs",
        percentage: 30,
    },
]


export default function HomeScreen() {
    const screenWidth = Dimensions.get("window").width;


    return (
        <View className=''>
            <View className='h-[350px] w-full bg-primary/90 rounded-b-[50%] shadow-xl'>
                <SafeAreaView>
                    <View className='pl-4'>
                        {/* <Logo theme='light' /> */}
                        <Text className='text-xl text-white font-semibold'>
                            Weekly Report
                        </Text>
                    </View>
                    <View className='w-full px-4'>
                        <View className='bg-white p-4 rounded shadow mt-4'>
                            <Text className='text-lg font-semibold'>Total Calories</Text>
                            <Text className='text-gray-500 text-sm'>1300 Kcal</Text>
                        </View>
                    </View>
                    <View className='flex-row px-2 w-full'>
                        {
                            meals.map((meal, index) => (
                                <View key={index} className='w-1/3'>
                                    <View className='bg-white p-4 rounded shadow mt-4 mx-2'>
                                        <Text className='text-lg font-semibold'>{meal.name}</Text>
                                        <Text className='text-gray-500 text-sm'>{meal.percentage}%</Text>
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
                    handlePress={() => { }}
                    containerStyles='mt-4'
                    variant='outline'
                />
            </View>
        </View>
    )
}