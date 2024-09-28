import { Stack } from 'expo-router'
import React from 'react'

const AuthLayout = () => {
    return (
        <>
            <Stack
            >
                <Stack.Screen
                    name='Login'
                    options={{
                        title: "Login",
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name='Register'
                    options={{
                        title: "Register",
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name='SettingUp'
                    options={{
                        title: "Setting Up",
                        headerShown: false
                    }}
                />
            </Stack>
        </>
    )
}

export default AuthLayout