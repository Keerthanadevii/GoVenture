import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CategoryChipsProps {
    categories: string[];
    activeCategory: string;
    onCategoryChange: (category: string) => void;
    colors: any;
    ScrollComponent?: any;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
    categories,
    activeCategory,
    onCategoryChange,
    colors,
    ScrollComponent = ScrollView
}) => {
    return (
        <View style={styles.outerContainer}>
            <ScrollComponent
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.container}
                decelerationRate="fast"
                overScrollMode="never"
            >
                {categories.map((item, index) => {
                    const isActive = activeCategory === item;
                    return (
                        <TouchableOpacity
                            key={item + index}
                            style={[
                                styles.chip,
                                {
                                    backgroundColor: isActive ? colors.primary : colors.card,
                                    borderColor: isActive ? colors.primary : colors.divider
                                }
                            ]}
                            onPress={() => onCategoryChange(item)}
                            activeOpacity={0.7}
                        >
                            {item === 'Favorites' && (
                                <Ionicons
                                    name="heart"
                                    size={14}
                                    color={isActive ? '#FFF' : '#EC4899'}
                                    style={{ marginRight: 6 }}
                                />
                            )}
                            {item === 'Food' && (
                                <Ionicons
                                    name="restaurant"
                                    size={14}
                                    color={isActive ? '#FFF' : '#F97316'}
                                    style={{ marginRight: 6 }}
                                />
                            )}
                            {item === 'Scenery' && (
                                <Ionicons
                                    name="image"
                                    size={14}
                                    color={isActive ? '#FFF' : '#10B981'}
                                    style={{ marginRight: 6 }}
                                />
                            )}
                            {item === 'Notes' && (
                                <Ionicons
                                    name="document-text"
                                    size={14}
                                    color={isActive ? '#FFF' : '#F97316'}
                                    style={{ marginRight: 6 }}
                                />
                            )}
                            <Text
                                style={[
                                    styles.chipText,
                                    { color: isActive ? '#FFF' : colors.textSecondary }
                                ]}
                            >
                                {item.charAt(0).toUpperCase() + item.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollComponent>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        gap: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        flexWrap: 'nowrap',
    },
    outerContainer: {
        height: 85, // Even larger for safety and better touch area
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
