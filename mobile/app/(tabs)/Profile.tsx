import { View, Text } from 'react-native'
import React from 'react'
import useAuth from '@/hooks/useAuth'

export default function Profile() {
    const { user } = useAuth();
    return (
        <View>
            <Text>Profile</Text>
        </View>
    )
}