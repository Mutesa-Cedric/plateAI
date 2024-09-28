import { mealBeingScannedState } from '@/atoms';
import CustomButton from '@/components/CustomButton';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useRecoilState } from 'recoil';

export default function NewScan() {
    const [permission, requestPermission] = useCameraPermissions();
    const [capturedImage, setCapturedImage] = useState(null);
    const cameraRef = useRef(null);
    const [_, setMealBeingScanned] = useRecoilState(mealBeingScannedState);
    const router = useRouter();

    if (!permission) {
        // Camera permissions are still loading
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet
        return (
            <SafeAreaView className='items-center justify-center min-h-screen px-4'>
                <View className='px-6 py-12 rounded-md border border-dashed border-primary w-full items-center justify-center'>
                    <Ionicons name='camera' size={100} color='gray' />
                    <Text className='text-lg text-center font-semibold pb-4 text-gray-700 mt-16'>
                        We need your permission to show the camera
                    </Text>
                    <CustomButton
                        handlePress={requestPermission}
                        title="Grant Permission"
                        containerStyles='w-full text-center'
                    />
                </View>
            </SafeAreaView>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            // @ts-ignore
            const photo = await cameraRef.current.takePictureAsync({
                base64: true,
                exif: false,
                quality: 0.5,
            });
            setCapturedImage(photo);
            console.log(Object.keys(photo));
        }
    };

    const retakePicture = () => {
        setCapturedImage(null);
    };

    const useImage = async () => {
        // Handle using the image (e.g., send to server, save locally, etc.)
        try {
            // const { data } = await AIAxios.post("/diet-check", capturedImage);
            // console.log(data)
            setMealBeingScanned(capturedImage);
            router.push("/MealScan/ScanResults");
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <SafeAreaView>
            <Text className="text-xl font-bold text-center pb-5 pt-3 text-gray-700">
                Take a picture of your meal
            </Text>

            {capturedImage ? (
                <View className="flex-1">
                    <Image
                        // @ts-ignore
                        source={{ uri: capturedImage.uri }}
                        className="h-[480px]"
                        resizeMode="cover"
                    />
                    <View className="my-4 w-full px-4">

                        <CustomButton
                            handlePress={retakePicture}
                            containerStyles="mb-4"
                            title="Retake"
                            variant='outline'
                        />
                        <CustomButton
                            handlePress={useImage}
                            containerStyles=""
                            title="Use this image"
                        />
                    </View>
                </View>
            ) : (
                <View className="flex-1">
                    <CameraView
                        ref={cameraRef}
                        // type={CameraType.back}
                        className=" h-[480px]"
                    >
                        <View className="flex-1 justify-end items-center mb-8">
                            <TouchableOpacity
                                onPress={takePicture}
                                className="w-20 h-20 bg-white rounded-full items-center justify-center"
                            >
                                <View className="w-16 h-16 bg-white rounded-full border-4 border-black" />
                            </TouchableOpacity>
                        </View>
                    </CameraView>
                </View>
            )}
        </SafeAreaView>
    );
}