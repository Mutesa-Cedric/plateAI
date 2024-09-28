import { View, Text, Image } from 'react-native'
import React from 'react'

export default function Logo({ showText = true, theme = "dark" }: { showText?: boolean, theme?: 'light' | 'dark' }) {
    return (
        <View className='flex flex-row items-center gap-1'>
            {
                theme === 'light' ?
                    <Image
                        source={require('../assets/logo-light.png')}
                        className='w-12 h-12'
                    />
                    :
                    <Image
                        source={require('../assets/logo.png')}
                        className='w-12 h-12'
                    />
            }
            {
                showText &&
                <Text className={`text-2xl font-bold ${theme === "light" ? "text-white" : "text-primary"}`}>PlateAI</Text>
            }
        </View>
    )
}