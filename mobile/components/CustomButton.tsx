import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

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
            className={`${variant === 'primary' ? "bg-primary" : "bg-white border border-primary/75"} w-full px-2 rounded-md flex flex-row justify-center items-center py-2 shadow-none min-h-[50px] ${containerStyles}`}
        >
            <Text
                className={`${variant === "primary" ? "text-white" : "text-primary"} text-lg font-semibold ${titleStyles}`}
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