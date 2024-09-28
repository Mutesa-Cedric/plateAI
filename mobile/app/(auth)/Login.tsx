import CustomButton from '@/components/CustomButton'
import CustomInput from '@/components/CustomInput'
import Logo from '@/components/Logo'
import useAuth from '@/hooks/useAuth'
import { validateEmail, validatePassword } from '@/lib/utils'
import { Link } from 'expo-router'
import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useToast } from 'react-native-toast-notifications'

const Login = () => {
    const toast = useToast();
    const { loggingIn, login } = useAuth();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const handleSubmit = () => {
        if (!formData.email || !formData.password) {
            return toast.show("Please fill in all fields", {
                type: 'danger'
            });
        }
        if (!validateEmail(formData.email)) {
            return toast.show("Please enter a valid email", {
                type: 'danger'
            });
        }
        if (!validatePassword(formData.password)) {
            return toast.show("Password must be at least 4 characters", {
                type: 'danger'
            });
        }
        login(formData.email, formData.password);
    }
    return (
        <SafeAreaView>
            <View className='h-full  justify-center px-6'>
                <View className='pb-2'>
                    <Logo />
                </View>
                <Text className='text-2xl font-semibold'>Login to your account</Text>
                <Text className='text-gray-500 text-base'>Enter your email and password below</Text>
                <View className='w-full mt-10'>
                    <CustomInput
                        label='Email'
                        value={formData.email}
                        onChangeText={(val) => setFormData({ ...formData, email: val })}
                    />
                    <CustomInput
                        label='Password'
                        secureTextEntry
                        onChangeText={(val) => setFormData({ ...formData, password: val })}
                        containerStyles='mt-3'
                    />
                </View>
                <CustomButton
                    title='Login'
                    handlePress={handleSubmit}
                    isLoading={loggingIn}
                    containerStyles='mt-8'
                />
                <View className='flex flex-row gap-1 mt-3'>
                    <Text className='text-base'>Don't have an account?</Text>
                    {/* @ts-ignore */}
                    <Link href={'/'}>
                        <Text className='text-primary text-base'>signup</Text>
                    </Link>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default Login