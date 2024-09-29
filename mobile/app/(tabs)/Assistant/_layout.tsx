import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function AssistantLayout() {
    const colorScheme = useColorScheme();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                },
                headerTintColor: Colors[colorScheme ?? 'light'].text,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Assistant',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="Cook"
                options={{
                    title: 'Cook',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="Chat"
                options={{
                    title: 'Chat',
                    headerShown: false
                }}
            />
            {/* <Stack.Screen
                name="Voice"
                options={{
                    title: 'Voice',
                    headerShown: false
                }}
            /> */}
        </Stack>
    );
}