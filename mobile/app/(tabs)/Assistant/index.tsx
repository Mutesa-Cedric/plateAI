import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router';

const capabilities = [
    // {
    //     name: "Voice Assistant",
    //     icon: "mic",
    //     href: "/Assistant/Voice"
    // },
    {
        name: "Chat Assistant",
        icon: "chatbubbles",
        href: "/Assistant/Chat"
    },
    {
        name: "Cook for me",
        icon: "restaurant",
        href: "/Assistant/Cook"
    }
] as const;

export default function Assistant() {
    const router = useRouter();

    return (
        <SafeAreaView className='px-4'>
            <View>
                <Text className='text-2xl font-semibold  mt-12'>
                    Assistant
                </Text>
                <Text className='text-base'>
                    use our state-of-the-art AI assistant to help you with your diet and nutrition
                </Text>
            </View>

            <View className='mt-6'>
                {
                    capabilities.map((capability, index) => (
                        <TouchableOpacity onPress={() => router.push(capability.href)}
                            key={index} className='flex flex-row items-center justify-between border-b border-primary/50 py-4 my-1'>
                            <View className='flex flex-row items-center'>
                                <Ionicons name={capability.icon} size={24} color='black' />
                                <Text className='text-lg font-semibold ml-4'>
                                    {capability.name}
                                </Text>
                            </View>
                            <Ionicons name='chevron-forward' size={24} color='black' />
                        </TouchableOpacity>
                    ))
                }
            </View>

        </SafeAreaView>
    )
}