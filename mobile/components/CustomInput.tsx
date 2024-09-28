import React from 'react';
import { Text, TextInput, View } from 'react-native';

interface CustomInputProps extends React.ComponentProps<typeof TextInput> {
    label: string;
    containerStyles?: string;
    inputStyles?: string;
}

const CustomInput = ({ label, containerStyles, inputStyles, ...props }: CustomInputProps) => {
    return (
        <View className={`${containerStyles}`}>
            <Text className='text-lg font-medium text-gray-800 pb-1'>{label}</Text>
            <TextInput
                className={`border-[0.5px] py-2 px-2 text-base rounded-md border-gray-400 focus:border-primary ${inputStyles}`}
                autoCapitalize='none'
                {...props}

            />
        </View>
    )
}

export default CustomInput