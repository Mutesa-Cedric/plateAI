import { View, Text, Image, SafeAreaView, ActivityIndicator } from 'react-native'
import React, { useEffect } from 'react'
import { useNavigation, useRouter } from 'expo-router';

export default function SettingUp() {
    const router = useRouter();
    useEffect(() => {
        setTimeout(() => {
            // router.push("")
        }, 4000);
    }, [])
    return (
        <SafeAreaView className='min-h-screen justify-even'>
            <View className='px-12 mt-10'>
                <Image
                    source={require('../../assets/vegetable-cutting.jpg')}
                    className='w-80 h-80 object-cover rounded-full'
                />
            </View>
            <View className='w-full items-center text-center px-6 mt-10'>
                <Text className='text-2xl  font-semibold text-gray-800 mt-4 max-w-xs text-center pb-3'>We are setting up everything for you</Text>
                <Text className='text-lg font-medium text-gray-600'>Customizing your plan...</Text>
                <ActivityIndicator
                    size={"large"}
                    color={"#10B981"}
                    className='mt-10'
                />
            </View>
        </SafeAreaView>
    )
}