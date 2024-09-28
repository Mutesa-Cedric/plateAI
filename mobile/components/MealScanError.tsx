import { mealBeingScannedState } from '@/atoms';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Animated, Text, View } from 'react-native';
import { useRecoilState } from 'recoil';
import CustomButton from './CustomButton';

const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);

export default function MealScanError({ error }: any) {
    const [_, setMealBeingScanned] = useRecoilState(mealBeingScannedState);
    const router = useRouter();
    const wobble = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(wobble, { toValue: 1, duration: 150, useNativeDriver: true }),
                Animated.timing(wobble, { toValue: -1, duration: 300, useNativeDriver: true }),
                Animated.timing(wobble, { toValue: 0, duration: 150, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const rotation = wobble.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-10deg', '10deg']
    });

    return (
        <View className="bg-white p-6 rounded-lg shadow-md m-4 border border-dashed border-red-400">
            <View className="items-center mb-4">
                <AnimatedIcon
                    name="food-off"
                    size={64}
                    color="#EF4444"
                    style={{ transform: [{ rotate: rotation }] }}
                />
            </View>
            <Text className="text-xl font-bold text-center text-red-500 mb-2">
                Oops! {error ?? "Something went wrong"}
            </Text>
            <Text className="text-sm text-gray-500 italic text-center mb-6">
                You can give it another shot by tapping the button below.
            </Text>
            <CustomButton
                title='Use a different image'
                handlePress={() => {
                    setMealBeingScanned(null);
                    router.push("/MealScan")
                }}
            />
        </View>
    );
}