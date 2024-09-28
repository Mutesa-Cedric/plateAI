import { onboardingDataState } from '@/atoms'
import CustomButton from '@/components/CustomButton'
import CustomInput from '@/components/CustomInput'
import Logo from '@/components/Logo'
import useAuth from '@/hooks/useAuth'
import { validateEmail } from '@/lib/utils'
import { Link } from 'expo-router'
import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useToast } from 'react-native-toast-notifications'
import { useRecoilState, useRecoilValue } from 'recoil'

const Register = () => {
    const toast = useToast();
    const { register, registering } = useAuth();
    const onboardingData = useRecoilValue(onboardingDataState)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: ""
    });

    const handleSubmit = () => {
        if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
            return toast.show("Please fill in all fields", {
                type: 'danger'
            });
        }
        if (!validateEmail(formData.email)) {
            return toast.show("Please enter a valid email", {
                type: 'danger'
            });
        }
        if (formData.password.length < 4) {
            return toast.show("Password must be at least 4 characters", {
                type: 'danger'
            });
        }
        if (formData.firstName.length < 2 || formData.lastName.length < 2) {
            return toast.show("Name must be at least 2 characters", {
                type: 'danger'
            });
        }
        register({
            ...formData,
            ...onboardingData
        });
    }

    return (
        <SafeAreaView>
            <View className='h-full  justify-center px-6'>
                <Logo />
                <Text className='text-2xl font-semibold pt-2'>Create account</Text>
                <Text className='text-gray-500 text-base'>Join thousands of other users today.</Text>
                <View className='w-full mt-5'>
                    <CustomInput
                        label='First Name'
                        value={formData.firstName}
                        onChangeText={(val) => setFormData({ ...formData, firstName: val })}
                    />
                    <CustomInput
                        label='Last Name'
                        value={formData.lastName}
                        onChangeText={(val) => setFormData({ ...formData, lastName: val })}
                        containerStyles='mt-3'
                    />
                    <CustomInput
                        label='Email'
                        value={formData.email}
                        onChangeText={(val) => setFormData({ ...formData, email: val })}
                        containerStyles='mt-3'
                    />
                    <CustomInput
                        label='Password'
                        secureTextEntry
                        onChangeText={(val) => setFormData({ ...formData, password: val })}
                        containerStyles='mt-3'
                    />
                </View>
                <CustomButton
                    title='Signup'
                    handlePress={handleSubmit}
                    containerStyles='mt-8'
                    isLoading={registering}
                />
                <View className='flex flex-row gap-1 mt-3'>
                    <Text className='text-base'>Already have an account?</Text>
                    {/* @ts-ignore */}
                    <Link href={'/Login'}>
                        <Text className='text-primary text-base'>login</Text>
                    </Link>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default Register
