import { View, Text, ActivityIndicator, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AIAxios } from '@/lib/axios.config'
import useAuth from '@/hooks/useAuth';
import { useRecoilValue } from 'recoil';
import { mealsState } from '@/atoms';
import { ScrollView } from 'react-native-gesture-handler';
import MarkDown from "react-native-markdown-display";
import { Ionicons } from '@expo/vector-icons';

export default function Cook() {
    const [loading, setLoading] = React.useState<boolean>(true);
    const { user } = useAuth();
    const meals = useRecoilValue(mealsState);
    const [image, setImage] = React.useState<string>('');
    const [response, setResponse] = React.useState<string>('');

    async function cook() {
        try {
            setLoading(true);
            const { data } = await AIAxios.post('/cook-for-me', {
                user,
                meal_history: meals
            });
            setImage(data.image);
            setResponse(data.response);

        } catch (error) {

        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        cook();
    }, []);
    return (
        <SafeAreaView className='flex-1'>
            <ScrollView>

                <View className='px-4 pt-4'>
                    <View className='flex-row justify-between'>
                        <Text className='text-xl font-semibold'>
                            AI Chef
                        </Text>
                        <TouchableOpacity
                            onPress={cook}
                            className='bg-gray-50 p-2 rounded-md'>
                            <Ionicons name='reload' size={24} color='#28785A' />
                        </TouchableOpacity>
                    </View>
                    <Text className='font-medium'>
                        Cook with our state-of-the-art AI model which knows what you have to eat next
                    </Text>
                </View>

                {
                    loading && (
                        <View className='mx-5 py-12 border border-dashed border-primary mt-12 items-center '>
                            <Text className='pb-4'>Cooking ...</Text>
                            <ActivityIndicator size='large' color='#28785A' />
                        </View>
                    )
                }


                {
                    (!loading && response) && (
                        <View className='mx-5 p-4 border border-dashed border-primary mt-6 bg-white rounded-md'>
                            <Text className='pb-4 font-semibold text-base'>Here is what you should eat next</Text>
                            <MarkDown>{response}</MarkDown>
                        </View>
                    )
                }

                {
                    (!loading && image) && (
                        <View className='px-4 p-4 rounded border border-dashed border-primary mx-4 mt-6 bg-white'>
                            <Text className='text-base pb-3 font-semibold '>Here is how your dish will look like</Text>
                            <Image source={{ uri: image }} className='rounded-md object-contain h-60'
                            />
                        </View>
                    )
                }
            </ScrollView>

        </SafeAreaView>
    )
}