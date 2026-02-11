import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

interface MemoryCardProps {
    item: any;
    colors: any;
    isDarkMode: boolean;
    onToggleFavorite: (id: number) => void;
    onDelete: (id: number) => void;
    onPress: (item: any) => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = memo(({
    item,
    colors,
    isDarkMode,
    onToggleFavorite,
    onDelete,
    onPress
}) => {
    const isNote = item.type === 'note';

    if (isNote) {
        return (
            <TouchableOpacity
                style={[styles.noteCard, { backgroundColor: isDarkMode ? '#452205' : '#FFFBEB' }]}
                onPress={() => onPress(item)}
                activeOpacity={0.9}
            >
                <View style={styles.noteHeader}>
                    <Ionicons name="document-text" size={16} color="#F97316" />
                    <Text style={[styles.noteHeaderText, { color: isDarkMode ? '#FDE68A' : '#92400E' }]}>
                        {(item.metadata?.activity || 'TRAVEL NOTE').toUpperCase()}
                    </Text>
                    <TouchableOpacity style={styles.cardAction} onPress={() => onDelete(item.id)}>
                        <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cardAction} onPress={() => onToggleFavorite(item.id)}>
                        <Ionicons
                            name={item.is_favorite ? "heart" : "heart-outline"}
                            size={18}
                            color={item.is_favorite ? "#EF4444" : colors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.noteText, { color: colors.text }]} numberOfLines={4}>
                    {item.content}
                </Text>
                <Text style={[styles.noteDate, { color: colors.textSecondary }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[styles.memoryCard, { backgroundColor: colors.card }]}
            onPress={() => onPress(item)}
            activeOpacity={0.9}
        >
            <Image
                source={{ uri: item.content }}
                style={[styles.memoryImage, { height: 220 }]}
                contentFit="cover"
                transition={100}
            />

            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.gradient}
            />

            <TouchableOpacity style={styles.deleteBadge} onPress={() => onDelete(item.id)}>
                <Ionicons name="trash-outline" size={14} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.favoriteBadge}
                onPress={() => onToggleFavorite(item.id)}
            >
                <Ionicons
                    name={item.is_favorite ? "heart" : "heart-outline"}
                    size={16}
                    color={item.is_favorite ? "#EF4444" : "#FFF"}
                />
            </TouchableOpacity>

            <View style={styles.memoryOverlay}>
                <Text style={styles.memoryTitle} numberOfLines={1}>
                    {item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Memory'}
                </Text>
                <View style={styles.memoryMeta}>
                    <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.memoryLocation}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    memoryCard: {
        width: CARD_WIDTH,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: '#000',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    memoryImage: {
        width: '100%',
        opacity: 0.9,
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    memoryOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    memoryTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    memoryMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    memoryLocation: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: '600',
    },
    favoriteBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noteCard: {
        width: CARD_WIDTH,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    noteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    noteHeaderText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        flex: 1,
    },
    cardFavorite: {
        padding: 2,
    },
    noteText: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    deleteBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    noteDate: {
        fontSize: 10,
        marginTop: 16,
    },
    cardAction: {
        padding: 4,
    },
});
