import { View, Text, Image } from 'react-native'
import React from 'react'

export default function Logo({ showText = true }: { showText?: boolean }) {
    return (
        <View className='flex flex-row items-center gap-1'>
            <Image
                source={require('../assets/logo.png')}
                className='w-12 h-12'
            />
            {
                showText &&
                <Text className='text-2xl font-bold text-primary'>PlateAI</Text>
            }
        </View>
    )
}