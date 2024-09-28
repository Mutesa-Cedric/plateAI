import { View, Text, Image } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import { useRecoilState, useRecoilValue } from 'recoil';
import { mealBeingScannedState } from '@/atoms';

export default function ScanResults() {
    const router = useRouter();
    const [mealBeingScanned, setMealBeingScanned] = useRecoilState(mealBeingScannedState);
    const [loading, setLoading] = useState(false);

    return (
        <View>
            <View>
                <Image
                    source={{ uri: mealBeingScanned?.uri }}
                    style={{ width: 300, height: 300 }}
                />
            </View>

        </View>
    )
}