import { mealBeingScannedState } from '@/atoms';
import CustomButton from '@/components/CustomButton';
import MealLoadingView from '@/components/MealLoadingView';
import MealScanError from '@/components/MealScanError';
import MealScanResults from '@/components/ScanResults';
import useMeals from '@/hooks/useMeals';
import { AIAxios } from '@/lib/axios.config';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import { useRecoilState } from 'recoil';


export default function ScanResults() {
    const router = useRouter();
    const [mealBeingScanned, setMealBeingScanned] = useRecoilState(mealBeingScannedState);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const toast = useToast();
    const [results, setResults] = useState<any | null>(null);
    const { createMeal } = useMeals();

    const fetchMealData = async () => {
        try {
            const { data } = await AIAxios.post("/diet-check", mealBeingScanned);
            console.log(data)
            if (data.error) {
                setError(data.error);
                toast.show(data.error, { type: "error" });
                setLoading(false);
            } else {
                setResults(data);
                setLoading(false);
                createMeal({
                    foodItems: data,
                    image: mealBeingScanned!.base64,
                });
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        fetchMealData();
    }, [])

    return (
        <View>
            {results &&
                <View className='absolute  bottom-4 z-10 px-4 w-full mx-auto items-center'>
                    <CustomButton
                        title='See What we recommend'
                        handlePress={() => router.push("/MealScan/MealRecommendation")}
                        containerStyles='w-full mx-auto shadow-xl'
                    />
                </View>
            }
            <ScrollView>
                <View className="relative rounded-b-xl">
                    <Image
                        source={{ uri: mealBeingScanned?.uri }}
                        className="w-full h-72 rounded-b-xl"
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: 0,
                            height: '100%',
                        }}
                        className="rounded-b-xl"
                    />
                </View>

                {
                    loading && <MealLoadingView />
                }

                {
                    (error && !loading && !results) && <MealScanError error={error} />
                }
                {
                    results && <MealScanResults data={results} />
                }
            </ScrollView>

        </View>

    )
}