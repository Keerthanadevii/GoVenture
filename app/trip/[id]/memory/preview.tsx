import { SaveMemorySheet } from '@/src/components/SaveMemorySheet';
import { ThemeColors, useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import api from '@/src/services/api';

export default function MemoryPreviewScreen() {
    const router = useRouter();
    const { id, uri, initialCategory } = useLocalSearchParams();
    const { theme } = useTheme();
    const colors = ThemeColors[theme];
    const sheetRef = useRef<BottomSheet>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [folders, setFolders] = useState<string[]>([]);

    // Reset saving state when focusing this screen (e.g. user canceled or went back)
    useFocusEffect(
        useCallback(() => {
            setIsSaving(false);
        }, [])
    );

    React.useEffect(() => {
        const fetchFolders = async () => {
            try {
                const res = await api.get(`/trips/${id}/memories`);
                if (res.data?.folders) {
                    // Extract names and filter out virtual categories
                    const folderNames = res.data.folders
                        .map((f: any) => f.name)
                        .filter((n: string) => n !== 'All' && n !== 'Favorites');
                    setFolders(folderNames);
                }
            } catch (error) {
                console.error('Failed to fetch folders', error);
            }
        };
        if (id) fetchFolders();
    }, [id]);

    const handleUsePhoto = () => {
        sheetRef.current?.expand();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleSave = async (category: string, caption: string) => {
        if (isSaving) return;
        setIsSaving(true);
        console.log('[Preview] Starting save...', { category, uri });

        try {
            const formData = new FormData();
            formData.append('type', 'image');
            formData.append('category', category);
            formData.append('metadata', JSON.stringify({ caption }));

            const filename = (uri as string).split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const extension = match ? match[1].toLowerCase() : 'jpg';
            const type = `image/${extension === 'jpg' ? 'jpeg' : extension}`;

            console.log('[Preview] Uploading file:', { filename, type });

            formData.append('image', {
                uri: (uri as string).startsWith('file://') ? uri : `file://${uri}`,
                name: filename,
                type: type,
            } as any);

            const token = (api.defaults.headers.common['Authorization'] as string);
            if (!token) {
                console.error('[Preview] No auth token found in api defaults');
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch(`${api.defaults.baseURL}/trips/${id}/memories`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': token || '',
                    'Accept': 'application/json',
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log('[Preview] Server responded with status:', response.status);
            const data = await response.json();

            if (!response.ok) {
                console.error('[Preview] Upload failed JSON:', data);
                throw new Error(data.message || 'Upload failed');
            }

            console.log('[Preview] Save successful:', data.memory?.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "Memory saved to your vault! ✨");

            router.replace({
                pathname: `/trip/[id]/memory-vault`,
                params: {
                    id: id as string,
                    newItem: data.memory.content,
                    newCategory: data.memory.category
                }
            });
        } catch (err: any) {
            const isAbort = err.name === 'AbortError';
            console.error('[Preview] Save error:', isAbort ? 'Timed out' : err.message);
            Alert.alert("Error", isAbort ? "Upload timed out. Please check your connection." : "Failed to save memory: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            <Image source={{ uri: uri as string }} style={styles.previewImage} />

            <SafeAreaView style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                        onPress={() => router.back()}
                        disabled={isSaving}
                    >
                        <Ionicons name="refresh" size={20} color="white" />
                        <Text style={styles.actionText}>Retake</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]}
                        onPress={handleUsePhoto}
                        disabled={isSaving}
                    >
                        <Ionicons name="checkmark" size={20} color="white" />
                        <Text style={styles.actionText}>{isSaving ? 'Saving...' : 'Use Photo'}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <SaveMemorySheet
                sheetRef={sheetRef}
                onSave={handleSave}
                colors={colors}
                categories={folders}
                initialCategory={initialCategory as string}
                isSaving={isSaving}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    previewImage: {
        flex: 1,
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        padding: 20,
    },
    header: {
        alignItems: 'flex-end',
    },
    closeBtn: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        paddingBottom: 40,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
        gap: 8,
    },
    actionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
