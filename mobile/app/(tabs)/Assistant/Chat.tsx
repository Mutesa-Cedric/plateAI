import { AIAxios } from '@/lib/axios.config'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useToast } from 'react-native-toast-notifications'

export default function Chat() {
    const toast = useToast();
    const [messages, setMessages] = React.useState<{
        message: string,
        fromAI: boolean
    }[]>([]);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [message, setMessage] = React.useState<string>('');

    const sendMessage = async () => {
        setLoading(true);
        try {
            if (message === '') {
                toast.show('Message cannot be empty', {
                    type: 'danger'
                });
                return;
            }
            const { data } = await AIAxios.post('/chat', {
                prompt: message
            });
            setMessages([...messages, {
                message,
                fromAI: false
            }, {
                message: data.response,
                fromAI: true
            }]);
            setMessage('');
        } catch (error) {
            console.log(error);
        }
        setLoading(false);
    }

    return (
        <SafeAreaView className='flex-1 justify-between'>
            <View className='px-4 pt-1'>
                <Text className='text-xl font-semibold'>Chat</Text>
                <Text className='font-medium'>Chat with our state-of-the-art AI model which knows you</Text>
            </View>
            <ScrollView className='flex-1 p-4 min-h-[40vh] bg-white mt-2 mx-4 rounded-md'>
                {messages.map((msg, index) => (
                    <View key={index} className='flex-row justify-end'>
                        <View className={`bg-gray-200 p-2 rounded-lg m-1
                        ${msg.fromAI ? 'bg-primary/50' : 'bg-gray-200'}
                            `}>
                            <Text>{msg.message}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
            <View className='flex-row p-4 pb-0'>
                <View className='flex-1 mr-2'>
                    <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder='Type a message'
                        className='border-2 bg-white border-gray-300 p-2 rounded-lg'
                    />
                </View>
                <TouchableOpacity onPress={sendMessage} disabled={loading} className='bg-primary p-2 rounded-lg'>
                    {loading ?
                        <ActivityIndicator size='small' color='white' /> :
                        <Ionicons name='send' size={24} color='white' />}
                </TouchableOpacity>
            </View>
        </SafeAreaView >
    )
}