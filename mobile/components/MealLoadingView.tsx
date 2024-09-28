import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const LoadingIcon = ({ name, delay }: any) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.elastic(1),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.elastic(1),
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, [scaleAnim, delay]);

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <MaterialCommunityIcons name={name} size={28} color="#28785A" />
        </Animated.View>
    );
};

export default function MealLoadingView() {
    const loadingTextAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(loadingTextAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(loadingTextAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, [loadingTextAnim]);

    return (
        <View className="border border-dashed bg-white border-primary mx-4 mt-12 p-6 rounded-lg shadow-md">
            <Text className="text-xl font-semibold mb-4 text-center text-green-700">
                Analyzing your meal
            </Text>
            <View className="flex-row justify-around mb-6">
                <LoadingIcon name="silverware-fork-knife" delay={0} />
                <LoadingIcon name="food-apple" delay={200} />
                <LoadingIcon name="scale-bathroom" delay={400} />
                <LoadingIcon name="test-tube" delay={600} />
            </View>
            <Animated.View style={{ opacity: loadingTextAnim }}>
                <Text className="text-base text-gray-600 text-center">
                    Crunching numbers and counting calories...
                </Text>
            </Animated.View>
            <Text className="text-sm text-gray-500 mt-4 text-center">
                Our AI chef is working its magic!
            </Text>
        </View>
    );
}