import { mealBeingScannedState } from '@/atoms';
import MealLoadingView from '@/components/MealLoadingView';
import { AIAxios } from '@/lib/axios.config';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useRecoilState } from 'recoil';
import { useToast } from 'react-native-toast-notifications';
import MealScanError from '@/components/MealScanError';


export default function ScanResults() {
    const router = useRouter();
    const [mealBeingScanned, setMealBeingScanned] = useRecoilState(mealBeingScannedState);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const toast = useToast();

    const fetchMealData = async () => {
        try {
            const { data } = await AIAxios.post("/diet-check", mealBeingScanned);
            if (data.error) {
                setError(data.error);
                toast.show(data.error, { type: "error" });
                setLoading(false);
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
                error && <MealScanError error={error} />
            }
        </View>
    )
}