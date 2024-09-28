import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function MealScanLayout() {
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
                    title: 'Meal Scan',
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="ScanResults"
                options={{
                    title: 'Scan Results',
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="AIAnalysis"
                options={{
                    title: 'AI Analysis',
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="MealRecommendation"
                options={{
                    title: 'Meal Recommendation',
                    headerShown: false
                }}
            />
        </Stack>
    );
}