import { View, Text, SafeAreaView } from 'react-native'
import React from 'react'
import useMeals from '@/hooks/useMeals'

export default function Meals() {
    const { meals, loading } = useMeals();
    return (
        <SafeAreaView>
            <View className='px-4'>
                <Text className='text-xl font-semibold'>Analysed Meals</Text>

            </View>
            {
                (meals && meals?.length > 0) && (
                    <View className='p-4'>
                        
                    </View>
                )
            }
        </SafeAreaView>
    )
}