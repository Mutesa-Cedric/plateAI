import { View, Text, SafeAreaView, Touchable, TouchableOpacity, ScrollView } from 'react-native'
import React, { useState } from 'react'
import useMeals from '@/hooks/useMeals'
import { useRecoilValue } from 'recoil';
import { mostRecentMealState } from '@/atoms';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AIAxios } from '@/lib/axios.config';
import useAuth from '@/hooks/useAuth';


export default function MealRecommendation() {
    const { user } = useAuth();
    const router = useRouter();
    const { meals } = useMeals();
    const mostRecentMeal = useRecoilValue(mostRecentMealState);
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<string | null>(null);

    const fetchMealData = async () => {

        try {
            const { data } = await AIAxios.post("/advisor", {
                recent_meal: mostRecentMeal,
                past_meals: meals?.map(meal => meal.foodItems),
                user
            });
            if (data.advice) {
                setResult(data.advice);
            } else {
                console.log("data : ", data);
            }
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {

        fetchMealData();
    }, [])

    return (
        <SafeAreaView>
            <View className='mx-4 pb-5 border-b mb-4 mt-5'>
                <View className='flex-row justify-between pb-2'>
                    <TouchableOpacity onPress={() => router.push("/MealScan/ScanResults")}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity className='bg-primary  p-2 rounded-full '>
                        <Ionicons name="mic" size={28} color="white" />
                    </TouchableOpacity>
                </View>
                <View className=''>
                    <Text className='text-lg font-semibold'>What our AI says about your meal</Text>
                </View>
            </View>
            {
                result && (
                    <ScrollView className='px-4'>
                        <Text className='text-sm font-medium text-gray-800'>{result}</Text>
                    </ScrollView>
                )
            }

        </SafeAreaView>
    )
}