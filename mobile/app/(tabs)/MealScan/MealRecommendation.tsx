import { mostRecentMealState } from '@/atoms';
import useAuth from '@/hooks/useAuth';
import useMeals from '@/hooks/useMeals';
import { AIAxios } from '@/lib/axios.config';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useRecoilValue } from 'recoil';

export default function MealRecommendation() {
    const { user } = useAuth();
    const router = useRouter();
    const { meals } = useMeals();
    const mostRecentMeal = useRecoilValue(mostRecentMealState);
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<string | null>(null);
    const [showSpeaker, setShowSpeaker] = useState(false);
    const [speech, setSpeech] = useState<any | null>(null);


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

    const getSpeech = async () => {
        try {
            const { data } = await AIAxios.post("/tts?language=en", {
                // text: result
                text: "Hello, I am your AI nutritionist. I have analyzed your meal and I recommend you to eat more fruits and vegetables. You can also try to reduce the amount of sugar in your diet. Remember to drink a lot of water."
            });
            console.log(data);
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (showSpeaker && !speech) {
            getSpeech();
        }
    }
        , [showSpeaker])

    React.useEffect(() => {
        fetchMealData();
    }, [])

    return (
        <SafeAreaView>
            <View className='mx-4 pb-5 border-b border-primary/75 mb-4 mt-5'>
                <View className='flex-row justify-between pb-2'>
                    <TouchableOpacity
                        onPress={() => router.push("/MealScan/ScanResults")}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    {/* <TouchableOpacity
                        onPress={() => setShowSpeaker(true)}
                        disabled={loading}
                        className='bg-primary  p-2 rounded-full '>
                        <Ionicons name="mic" size={28} color="white" />
                    </TouchableOpacity> */}
                </View>
                <View className=''>
                    <Text className='text-lg font-semibold'>What our AI says about your meal</Text>
                </View>
            </View>
            {
                result && (
                    <ScrollView >
                        <View
                            className='p-4  mx-3 border rounded-md border-dashed border-primary'
                        >
                            <Text className='text-sm font-medium text-gray-800'>{result}</Text>
                        </View>
                    </ScrollView>
                )
            }
            {
                loading && (
                    <View className='py-24 px-4 border rounded-sm border-dashed'>
                        <ActivityIndicator size="large" color="#28785A" />
                    </View>
                )
            }
            <Modal
                animationType="slide"
                // transparent={true}
                visible={showSpeaker}
                onRequestClose={() => {
                    setShowSpeaker(false)
                }}
            >
                <SafeAreaView className='items-center justify-center flex-1 m-5'>
                    <TouchableOpacity
                        onPress={() => setShowSpeaker(false)}
                        style={{ position: 'absolute', top: 40, right: 15 }}
                        className='p-2 rounded-full border-2 border-primary'
                    >
                        <Ionicons name="close" size={30} color="#28785A" />
                    </TouchableOpacity>
                    <View className="flex flex-row items-center justify-center">
                        {[...Array(5)].map((_, index) => (
                            <Animatable.View
                                key={index}
                                animation={{
                                    0: { scaleY: 1 },
                                    0.5: { scaleY: 2 }, // Increasing the height on pulse
                                    1: { scaleY: 1 }
                                }}
                                iterationCount="infinite"
                                duration={500 + index * 100} // Staggered animation for a wave effect
                                style={{
                                    width: 12, // Increased width
                                    height: 80, // Increased height for better visibility
                                    marginHorizontal: 7, // More space between the bars
                                    backgroundColor: '#28785A', // Primary color
                                    borderRadius: 5,
                                    transform: [{ scaleY: 1 }],
                                }}
                            />
                        ))}
                    </View>
                </SafeAreaView>
            </Modal>

        </SafeAreaView>
    )
}