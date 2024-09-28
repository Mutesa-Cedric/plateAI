import { View, Text, Image } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import { useRecoilState, useRecoilValue } from 'recoil';
import { mealBeingScannedState } from '@/atoms';
import { AIAxios } from '@/lib/axios.config';
import { LinearGradient } from 'expo-linear-gradient';
import MealLoadingView from '@/components/MealLoadingView';

export default function ScanResults() {
    const router = useRouter();
    const [mealBeingScanned, setMealBeingScanned] = useRecoilState(mealBeingScannedState);
    const [loading, setLoading] = useState(true);

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

        </View>
    )
}