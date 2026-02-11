import { CategoryChips } from '@/src/components/CategoryChips';
import { MemoryCard } from '@/src/components/MemoryCard';
import { MemoryViewerModal } from '@/src/components/MemoryViewerModal';
import { SaveMemorySheet } from '@/src/components/SaveMemorySheet';
import { ThemeColors, useTheme } from '@/src/context/ThemeContext';
import api from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MemoryVault() {
    const router = useRouter();
    const { id, newItem, newCategory } = useLocalSearchParams();
    const { theme, isDarkMode } = useTheme();
    const colors = ThemeColors[theme];
    const insets = useSafeAreaInsets();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [memories, setMemories] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [trip, setTrip] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [selectedMemory, setSelectedMemory] = useState<any>(null);
    const [isViewerVisible, setIsViewerVisible] = useState(false);

    const sheetRef = useRef<BottomSheet>(null);
    const [galleryUris, setGalleryUris] = useState<string[]>([]);
    const [isBatchSaving, setIsBatchSaving] = useState(false);

    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const pageRef = useRef(1);
    const hasMoreRef = useRef(false);
    const isFetchingRef = useRef(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const isMounted = useRef(true);
    const isFirstLoad = useRef(true);

    const fetchMemories = useCallback(async (reset = false) => {
        if (isFetchingRef.current && !reset) {
            console.log('[Vault] Fetch already in progress, skipping load more.');
            return;
        }

        console.log(`[Vault] fetchMemories(reset=${reset}) called. page=${pageRef.current}`);

        // Cancel previous request if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        isFetchingRef.current = true;

        if (reset) {
            pageRef.current = 1;
            // Only set isLoading if this is the very first load
            if (isFirstLoad.current) {
                setIsLoading(true);
                isFirstLoad.current = false;
            } else {
                setIsRefreshing(true);
            }
        } else {
            setIsLoadingMore(true);
        }

        try {
            const res = await api.get(`/trips/${id}/memories`, {
                params: { category: activeCategory, page: pageRef.current },
                signal: controller.signal
            });

            // check if this request is still the latest one
            if (abortControllerRef.current !== controller) return;

            const newMemories = res.data?.memories || [];
            if (reset) {
                setMemories(newMemories);
            } else {
                setMemories(prev => [...prev, ...newMemories]);
            }

            setFolders(res.data?.folders || []);
            setTrip(res.data?.trip || null);
            hasMoreRef.current = res.data?.has_more || false;
            pageRef.current += 1;

            console.log(`[Vault] Fetch success. hasMore=${hasMoreRef.current}, next=${pageRef.current}`);
        } catch (err: any) {
            if (err.name === 'AbortError' || err.message === 'canceled') {
                console.log('[Vault] Fetch aborted.');
                return;
            }
            console.error('Fetch memories error:', err);
        } finally {
            // Safety net: ensure loading states are reset after a timeout even if something stalls
            const timeout = setTimeout(() => {
                if (isMounted.current && abortControllerRef.current === controller) {
                    setIsLoading(false);
                    setIsRefreshing(false);
                    setIsLoadingMore(false);
                    isFetchingRef.current = false;
                }
            }, 10000);

            // Only reset fetching state if this request is still the current one
            if (abortControllerRef.current === controller) {
                isFetchingRef.current = false;
                abortControllerRef.current = null;
                if (isMounted.current) {
                    clearTimeout(timeout);
                    setIsLoading(false);
                    setIsRefreshing(false);
                    setIsLoadingMore(false);
                }
            }
        }
    }, [id, activeCategory]);

    useFocusEffect(
        useCallback(() => {
            isMounted.current = true;
            if (id) {
                fetchMemories(true);
            }
            return () => {
                console.log('[Vault] blur/unmount - cleaning up');
                isMounted.current = false;
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                    abortControllerRef.current = null;
                }
                isFetchingRef.current = false;
                setIsLoading(false);
                setIsRefreshing(false);
                setIsLoadingMore(false);
                setIsBatchSaving(false); // Reset saving status on blur to prevent sticking
            };
        }, [id, fetchMemories])
    );

    useEffect(() => {
        if (newItem && newCategory) {
            const tempItem = {
                id: Date.now(),
                type: 'image',
                content: newItem as string,
                category: newCategory as string,
                is_favorite: false,
                created_at: new Date().toISOString()
            };

            setMemories(prev => prev.some(m => m.content === tempItem.content) ? prev : [tempItem, ...prev]);

            const timeout = setTimeout(() => {
                router.setParams({ newItem: undefined, newCategory: undefined });
            }, 300);

            return () => clearTimeout(timeout);
        }
    }, [newItem, newCategory]);

    const handlePickFromGallery = useCallback(async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.5,
        });

        if (!result.canceled) {
            setGalleryUris(result.assets.map(a => a.uri));
            sheetRef.current?.expand();
        }
    }, []);

    const handleAddCollection = useCallback(() => {
        Alert.alert("Add Memory", "Choose a source", [
            { text: "Choose from Gallery", onPress: handlePickFromGallery },
            { text: "Cancel", style: "cancel" }
        ]);
    }, [handlePickFromGallery]);

    const handleSaveGalleryMemory = useCallback(async (category: string, caption: string) => {
        if (galleryUris.length === 0) return;

        if (isMounted.current) {
            setIsBatchSaving(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        try {
            const uploadPromises = galleryUris.map(async (uri) => {
                const formData = new FormData();
                formData.append('type', 'image');
                formData.append('category', category);
                formData.append('metadata', JSON.stringify({ caption }));

                const filename = uri.split('/').pop() || 'photo.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                formData.append('image', {
                    uri: uri.startsWith('file://') ? uri : `file://${uri}`,
                    name: filename,
                    type,
                } as any);

                const response = await fetch(`${api.defaults.baseURL}/trips/${id}/memories`, {
                    method: 'POST',
                    body: formData,
                    headers: { Authorization: api.defaults.headers.common['Authorization'] as string },
                    signal: abortControllerRef.current?.signal,
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Upload failed');
                return data.memory;
            });

            const savedMemories = await Promise.all(uploadPromises);
            setMemories(prev => [...savedMemories, ...prev]);
            setGalleryUris([]);
            if (isMounted.current) {
                sheetRef.current?.close();
            }
        } catch (e) {
            if (isMounted.current) {
                Alert.alert('Upload Error', 'Some images failed to upload.');
            }
        } finally {
            if (isMounted.current) {
                setIsBatchSaving(false);
            }
        }
    }, [galleryUris, id]);

    const handleToggleFavorite = useCallback(async (memoryId: number) => {
        if (isMounted.current) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setMemories(prev => prev.map(m => m.id === memoryId ? { ...m, is_favorite: !m.is_favorite } : m));
        }
        try {
            await api.post(`/trips/${id}/memories/${memoryId}/favorite`);
        } catch (error) {
            console.error('Toggle favorite error:', error);
        }
    }, [id]);

    const handleDeleteMemory = useCallback((memoryId: number) => {
        Alert.alert("Delete Memory", "Are you sure you want to delete this memory?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    if (isMounted.current) {
                        setMemories(prev => prev.filter(m => m.id !== memoryId));
                    }
                    try {
                        await api.delete(`/trips/${id}/memories/${memoryId}`);
                    } catch {
                        if (isMounted.current) {
                            Alert.alert("Error", "Failed to delete.");
                        }
                    }
                }
            }
        ]);
    }, [id]);

    const handleMemoryPress = useCallback((item: any) => {
        console.log('[Vault] handleMemoryPress called', item.id);
        setSelectedMemory(item);
        setIsViewerVisible(true);
    }, []);

    const defaultCategories = ['All', 'Favorites', 'Notes'];
    const dynamicFolderNames = folders
        .filter(f => !defaultCategories.includes(f.name))
        .map(f => f.name);

    const categoriesList = useMemo(() => [
        ...defaultCategories,
        ...dynamicFolderNames.map(name => name.charAt(0).toUpperCase() + name.slice(1))
    ], [folders]);

    const saveCategories = useMemo(
        () => categoriesList.filter(c => c !== 'All' && c !== 'Favorites'),
        [categoriesList]
    );

    const filteredMemories = useMemo(() => {
        const lowerSearch = searchQuery.toLowerCase();
        return memories.filter(item => {
            if (!searchQuery) return true;
            return (
                item.category?.toLowerCase().includes(lowerSearch) ||
                (item.type === 'note' && item.content?.toLowerCase().includes(lowerSearch)) ||
                item.metadata?.caption?.toLowerCase().includes(lowerSearch)
            );
        });
    }, [memories, searchQuery]);

    const renderMemoryItem = useCallback(
        ({ item }: { item: any }) => (
            <MemoryCard
                item={item}
                colors={colors}
                isDarkMode={isDarkMode}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDeleteMemory}
                onPress={handleMemoryPress}
            />
        ),
        [colors, isDarkMode, handleToggleFavorite, handleDeleteMemory, handleMemoryPress]
    );

    if (isLoading && !isRefreshing) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                        {trip?.destination || 'Memory Vault'}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        Capture your journey
                    </Text>
                </View>
                <View style={styles.profileBtn} />
            </View>

            {/* Search & Chips */}
            <View style={[styles.filterSection, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.divider }]}>
                    <Ionicons name="search" size={18} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search memories..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <CategoryChips
                    categories={categoriesList}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    colors={colors}
                />
            </View>

            <FlatList
                data={filteredMemories}
                renderItem={renderMemoryItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
                columnWrapperStyle={{ gap: 20 }}
                showsVerticalScrollIndicator={false}
                onEndReached={() => {
                    if (hasMoreRef.current && !isFetchingRef.current) {
                        fetchMemories();
                    }
                }}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => fetchMemories(true)}
                        tintColor={colors.primary}
                    />
                }
                ListHeaderComponent={
                    activeCategory !== 'Notes' ? (
                        <TouchableOpacity
                            style={[styles.newCollectionCard, { backgroundColor: colors.card, borderColor: colors.primary, width: '100%' }]}
                            onPress={handleAddCollection}
                        >
                            <View style={[styles.newIconContainer, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="add" size={32} color={colors.primary} />
                            </View>
                            <Text style={[styles.newText, { color: colors.text }]}>New Collection</Text>
                            <Text style={[styles.newSubtext, { color: colors.textSecondary }]}>Add from gallery</Text>
                        </TouchableOpacity>
                    ) : null
                }
                ListFooterComponent={
                    isLoadingMore ? (
                        <View style={{ paddingVertical: 20 }}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    !isLoading && filteredMemories.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="images-outline" size={64} color={colors.divider} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No memories found in this category.</Text>
                        </View>
                    ) : null
                }
            />

            <MemoryViewerModal
                visible={isViewerVisible}
                item={selectedMemory}
                onClose={() => setIsViewerVisible(false)}
                onToggleFavorite={handleToggleFavorite}
                colors={colors}
            />

            <SaveMemorySheet
                sheetRef={sheetRef}
                onSave={handleSaveGalleryMemory}
                colors={colors}
                categories={saveCategories}
                count={galleryUris.length}
                initialCategory={activeCategory !== 'All' && activeCategory !== 'Favorites' ? activeCategory : undefined}
                isSaving={isBatchSaving}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 15,
        borderBottomWidth: 1,
    },
    backBtn: { width: 40 },
    headerTitleContainer: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerSubtitle: { fontSize: 12, marginTop: 2 },
    profileBtn: { width: 40 },
    filterSection: { borderBottomWidth: 1 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 15,
        paddingHorizontal: 15,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
    newCollectionCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
    },
    newIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    newText: {
        fontSize: 16,
        fontWeight: '700',
    },
    newSubtext: {
        fontSize: 12,
        marginTop: 4,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 100,
        gap: 15,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
});
