import { Ionicons } from '@expo/vector-icons';
import { cacheDirectory, downloadAsync, writeAsStringAsync } from 'expo-file-system/src/legacy/FileSystem';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MemoryViewerModalProps {
    visible: boolean;
    item: any;
    onClose: () => void;
    onToggleFavorite: (id: number) => void;
    colors: any;
}

export const MemoryViewerModal: React.FC<MemoryViewerModalProps> = ({
    visible,
    item,
    onClose,
    onToggleFavorite,
    colors
}) => {
    const [isSharing, setIsSharing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    if (!item) return null;

    const handleShare = async () => {
        if (isSharing) return;
        if (!(await Sharing.isAvailableAsync())) {
            Alert.alert("Error", "Sharing is not available on this device");
            return;
        }

        setIsSharing(true);
        try {
            let shareUri = item.content;

            if (item.content.startsWith('http')) {
                // Remote images must be downloaded before sharing
                const fileUri = cacheDirectory + `share_${Date.now()}.jpg`;
                const { uri } = await downloadAsync(item.content, fileUri);
                shareUri = uri;
            } else if (item.content.startsWith('data:')) {
                // Base64 must be saved to file
                const base64Data = item.content.split(',')[1];
                shareUri = cacheDirectory + `share_${Date.now()}.jpg`;
                await writeAsStringAsync(shareUri, base64Data, { encoding: 'base64' });
            }

            await Sharing.shareAsync(shareUri);
        } catch (error) {
            console.error('Share error:', error);
            Alert.alert("Error", "Failed to share memory.");
        } finally {
            setIsSharing(false);
        }
    };

    const handleDownload = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            // Passing true for writeOnly to avoid AUDIO permission request on Android 13+
            const { status } = await MediaLibrary.requestPermissionsAsync(true);
            if (status !== 'granted') {
                Alert.alert("Permission", "Permission to save photos is required");
                return;
            }

            if (item.content.startsWith('http')) {
                const fileUri = cacheDirectory + `save_${Date.now()}.jpg`;
                const { uri } = await downloadAsync(item.content, fileUri);
                await MediaLibrary.saveToLibraryAsync(uri);
            } else if (item.content.startsWith('data:')) {
                const base64Data = item.content.split(',')[1];
                const fileUri = cacheDirectory + `save_${Date.now()}.jpg`;
                await writeAsStringAsync(fileUri, base64Data, { encoding: 'base64' });
                await MediaLibrary.saveToLibraryAsync(fileUri);
            } else {
                await MediaLibrary.saveToLibraryAsync(item.content);
            }

            Alert.alert("Success", "Saved to gallery! 📥");
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to save photo");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <Image source={{ uri: item.content }} style={styles.fullImage} resizeMode="contain" />

                <SafeAreaView style={styles.overlay}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>

                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={handleDownload} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="download-outline" size={24} color="white" />}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={handleShare} disabled={isSharing}>
                                {isSharing ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="share-social-outline" size={24} color="white" />}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => onToggleFavorite(item.id)}>
                                <Ionicons
                                    name={item.is_favorite ? "heart" : "heart-outline"}
                                    size={24}
                                    color={item.is_favorite ? "#EF4444" : "white"}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.dateText}>
                            {new Date(item.created_at).toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Text>
                        <Text style={styles.locationText}>{item.category || 'Untitled Moment'}</Text>
                        {item.metadata?.caption && (
                            <Text style={styles.captionText}>{item.metadata.caption}</Text>
                        )}
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: 15,
    },
    actionBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        paddingBottom: 40,
        paddingHorizontal: 10,
    },
    dateText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    locationText: {
        color: 'white',
        fontSize: 24,
        fontWeight: '700',
        marginTop: 4,
    },
    captionText: {
        color: 'white',
        fontSize: 14,
        marginTop: 12,
        lineHeight: 20,
    },
});
