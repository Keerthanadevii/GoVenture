import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CameraCaptureScreen() {
    const router = useRouter();
    const { id, initialCategory } = useLocalSearchParams();
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<'front' | 'back'>('back');
    const [flash, setFlash] = useState<'off' | 'on'>('off');
    const [isCapturing, setIsCapturing] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    // Reset capturing state when screen is focused (e.g. coming back from preview)
    useFocusEffect(
        useCallback(() => {
            setIsCapturing(false);
        }, [])
    );

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
                    <Text style={styles.permissionBtnText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const toggleCameraFacing = () => {
        if (isCapturing) return;
        setFacing(current => (current === 'back' ? 'front' : 'back'));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const toggleFlash = () => {
        if (isCapturing) return;
        setFlash(current => (current === 'off' ? 'on' : 'off'));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const takePicture = async () => {
        if (cameraRef.current && !isCapturing) {
            setIsCapturing(true);
            try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                });

                if (!photo) throw new Error("Capture failed - no photo returned");

                console.log('[Capture] Photo taken:', photo.uri);

                // Navigate to preview with the image
                router.push({
                    pathname: "/trip/[id]/memory/preview",
                    params: {
                        id: id as string,
                        uri: photo.uri,
                        initialCategory: (initialCategory as string) || 'General'
                    }
                });
            } catch (err) {
                console.error("Failed to take picture:", err);
                setIsCapturing(false);
                Alert.alert("Error", "Failed to capture photo. Please try again.");
            }
        }
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing={facing}
                flash={flash}
                ref={cameraRef}
            >
                <SafeAreaView style={styles.overlay}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} disabled={isCapturing}>
                            <Ionicons name="close" size={30} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggleFlash} style={styles.iconBtn} disabled={isCapturing}>
                            <Ionicons
                                name={flash === 'on' ? "flash" : "flash-off"}
                                size={24}
                                color="white"
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={toggleCameraFacing} style={styles.secondaryBtn} disabled={isCapturing}>
                            <Ionicons name="camera-reverse-outline" size={30} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={takePicture}
                            style={[styles.shutterBtn, { opacity: isCapturing ? 0.5 : 1 }]}
                            disabled={isCapturing}
                        >
                            <View style={styles.shutterInner} />
                        </TouchableOpacity>

                        <View style={styles.secondaryBtn} />
                    </View>
                </SafeAreaView>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 40,
    },
    iconBtn: {
        padding: 10,
    },
    shutterBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shutterInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
    },
    secondaryBtn: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        color: 'white',
        fontSize: 16,
    },
    permissionBtn: {
        backgroundColor: '#1D85E6',
        padding: 15,
        borderRadius: 10,
        alignSelf: 'center',
    },
    permissionBtnText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
