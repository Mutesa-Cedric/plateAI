import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'

interface CustomButtonProps {
    title: string;
    handlePress: () => void;
    variant?: "primary" | "outline";
    containerStyles?: string;
    titleStyles?: string;
    isLoading?: boolean
}
const CustomButton = ({ title, handlePress, variant = "primary", containerStyles, titleStyles, isLoading }: CustomButtonProps) => {
    return (
        <TouchableOpacity
            disabled={isLoading}
            onPress={handlePress}
            className={`${variant === 'primary' ? "bg-cyan-500" : "bg-white border border-cyan-300"} w-full px-2 rounded-md flex flex-row justify-center items-center py-2 ${containerStyles}`}
        >
            <Text
                className={`${variant === "primary" ? "text-white" : "text-cyan-500"} text-lg font-semibold ${titleStyles}`}
            >{title}</Text>
            {
                isLoading &&
                <ActivityIndicator
                    size={"small"}
                    animating={isLoading}
                    color={variant === "primary" ? "white" : "cyan"}

                />
            }
        </TouchableOpacity>
    )
}

export default CustomButton