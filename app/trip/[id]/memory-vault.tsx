import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    Share,
} from 'react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

export default function MemoryVault() {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();
    const colors = ThemeColors[theme];
    const insets = useSafeAreaInsets();

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out my travel memories from Kyoto Spring 2024! 🌸\n\nI've captured ${memories.length} special moments, including:\n- ${memories[0].title}\n- ${memories[2].title}\n\nReliving the journey on GoVenture!`,
            });
        } catch (error: any) {
            console.error(error.message);
        }
    };

    const categories = ['All', 'Favorites', 'Food', 'Scenery'];
    const [activeCategory, setActiveCategory] = useState('All');

    const memories = [
        {
            id: '1',
            title: 'Sushi at Tsukiji Market',
            location: 'TOKYO • DAY 1',
            image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=400',
            icon: 'sparkles',
            category: 'Food',
            isFavorite: true,
        },
        {
            id: '2',
            type: 'note',
            text: '"The matcha ice cream near the bamboo grove was incredible. Must try the sesame flavor next time!"',
            date: 'April 12, 2:30 PM',
            category: 'Food',
        },
        {
            id: '3',
            title: 'Kinkaku-ji',
            image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=400',
            category: 'Scenery',
            isFavorite: true,
        },
        {
            id: '4',
            title: 'Ninenzaka Slope',
            image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=400',
            icon: 'sparkles',
            category: 'Scenery',
        },
        {
            id: '5',
            title: 'Fushimi Inari Hike',
            image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=400',
            icon: 'location',
            category: 'Scenery',
            isFavorite: true,
        },
        {
            id: '6',
            title: 'Arashiyama',
            image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=400',
            category: 'Scenery',
        },
    ];

    const filteredMemories = memories.filter(item => {
        if (activeCategory === 'All') return true;
        if (activeCategory === 'Favorites') return item.isFavorite;
        return item.category === activeCategory;
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider, borderBottomWidth: 1 }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Kyoto Spring 2024</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Apr 10 - Apr 24</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={handleShare} activeOpacity={0.7}>
                        <Ionicons name="share-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.7}>
                        <Ionicons name="person-circle" size={32} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Categories */}
            <View style={[styles.categoriesContainer, { backgroundColor: colors.card }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
                    {categories.map((cat, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.categoryBtn, { backgroundColor: activeCategory === cat ? colors.primary : colors.card, borderColor: activeCategory === cat ? colors.primary : colors.divider }]}
                            onPress={() => setActiveCategory(cat)}
                        >
                            {cat === 'Favorites' && <Ionicons name="heart" size={16} color={activeCategory === cat ? '#FFF' : '#EC4899'} />}
                            <Text style={[styles.categoryText, { color: activeCategory === cat ? '#FFF' : colors.textSecondary }]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                    {/* Left Column */}
                    <View style={styles.column}>
                        {/* New Collection Card */}
                        <TouchableOpacity style={[styles.newCollectionCard, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF', borderColor: colors.primary }]}>
                            <View style={[styles.folderIconBg, { backgroundColor: isDarkMode ? '#172554' : '#DBEAFE' }]}>
                                <Ionicons name="folder-open" size={24} color={colors.primary} />
                            </View>
                            <Text style={[styles.newCollectionText, { color: colors.primary }]}>New Collection</Text>
                        </TouchableOpacity>

                        {/* Memory Items */}
                        {filteredMemories.filter((_, i) => i % 2 === 0).map((item) => (
                            item.type === 'note' ? (
                                <View key={item.id} style={[styles.noteCard, { backgroundColor: isDarkMode ? '#452205' : '#FFFBEB' }]}>
                                    <View style={styles.noteHeader}>
                                        <Ionicons name="document-text" size={16} color="#F97316" />
                                        <Text style={[styles.noteHeaderText, { color: isDarkMode ? '#FDE68A' : '#92400E' }]}>TRAVEL NOTE</Text>
                                    </View>
                                    <Text style={[styles.noteText, { color: colors.text }]}>{item.text}</Text>
                                    <Text style={[styles.noteDate, { color: colors.textSecondary }]}>{item.date}</Text>
                                </View>
                            ) : (
                                <TouchableOpacity key={item.id} style={styles.memoryCard}>
                                    <Image source={{ uri: item.image }} style={[styles.memoryImage, { height: item.id === '1' ? 180 : 250 }]} />
                                    <View style={styles.memoryOverlay}>
                                        {item.icon && <Ionicons name={item.icon as any} size={16} color="#FFF" style={styles.memoryIcon} />}
                                        <Text style={styles.memoryTitle}>{item.title}</Text>
                                        {item.location && <Text style={styles.memoryLocation}>{item.location}</Text>}
                                    </View>
                                </TouchableOpacity>
                            )
                        ))}
                    </View>

                    {/* Right Column */}
                    <View style={styles.column}>
                        {filteredMemories.filter((_, i) => i % 2 !== 0).map((item) => (
                            item.type === 'note' ? (
                                <View key={item.id} style={styles.noteCard}>
                                    <View style={styles.noteHeader}>
                                        <Ionicons name="document-text" size={16} color="#F97316" />
                                        <Text style={styles.noteHeaderText}>TRAVEL NOTE</Text>
                                    </View>
                                    <Text style={styles.noteText}>{item.text}</Text>
                                    <Text style={styles.noteDate}>{item.date}</Text>
                                </View>
                            ) : (
                                <TouchableOpacity key={item.id} style={styles.memoryCard}>
                                    <Image source={{ uri: item.image }} style={[styles.memoryImage, { height: item.id === '4' ? 180 : 220 }]} />
                                    <View style={styles.memoryOverlay}>
                                        {item.icon && <Ionicons name={item.icon as any} size={16} color="#FFF" style={styles.memoryIcon} />}
                                        <Text style={styles.memoryTitle}>{item.title}</Text>
                                        {item.location && <Text style={styles.memoryLocation}>{item.location}</Text>}
                                    </View>
                                </TouchableOpacity>
                            )
                        ))}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating Add Button */}
            <TouchableOpacity
                style={[styles.fab, { bottom: Math.max(insets.bottom, 20) + 10 }]}
                activeOpacity={0.9}
            >
                <Ionicons name="camera" size={24} color="#FFF" />
                <Text style={styles.fabText}>Add Memory</Text>
            </TouchableOpacity>
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
        paddingBottom: 20,
    },
    headerTitleContainer: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerSubtitle: { fontSize: 12, marginTop: 2 },
    categoriesContainer: { paddingVertical: 12 },
    categoriesContent: { paddingHorizontal: 20, gap: 10 },
    categoryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    categoryBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    categoryText: { fontSize: 14, fontWeight: '600' },
    categoryTextActive: { color: '#FFF' },
    content: { padding: 20 },
    grid: { flexDirection: 'row', gap: 20 },
    column: { flex: 1, gap: 20 },
    newCollectionCard: {
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
        height: 150,
    },
    folderIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    newCollectionText: { fontSize: 13, color: '#3B82F6', fontWeight: '700' },
    memoryCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
    memoryImage: { width: '100%', opacity: 0.8 },
    memoryOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
    memoryIcon: { position: 'absolute', top: -140, right: 10 },
    memoryTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    memoryLocation: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2, fontWeight: '600' },
    noteCard: { backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    noteHeaderText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    noteText: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
    noteDate: { fontSize: 10, marginTop: 16 },
    fab: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        backgroundColor: '#1D85E6',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 30,
        gap: 10,
        shadowColor: '#1D85E6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    fabText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
