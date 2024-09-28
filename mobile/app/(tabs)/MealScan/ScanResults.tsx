import { mealBeingScannedState } from '@/atoms';
import MealLoadingView from '@/components/MealLoadingView';
import MealScanError from '@/components/MealScanError';
import MealScanResults from '@/components/ScanResults';
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
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        fetchMealData();
    }, [])

    return (
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
                error && <MealScanError error={error} />
            }
            {
                results && <MealScanResults data={results} />
            }
        </ScrollView>
    )
}