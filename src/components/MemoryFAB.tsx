import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ThemeColors, useTheme } from '../context/ThemeContext';

interface MemoryFABProps {
    onPress: () => void;
    bottomInset?: number;
}

export const MemoryFAB: React.FC<MemoryFABProps> = ({ onPress, bottomInset = 30 }) => {
    const { theme } = useTheme();
    const colors = ThemeColors[theme];

    return (
        <TouchableOpacity
            style={[styles.fab, { bottom: bottomInset, backgroundColor: colors.primary }]}
            activeOpacity={0.9}
            onPress={onPress}
        >
            <Ionicons name="camera" size={24} color="#FFF" />
            <Text style={styles.fabText}>Add Memory</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 30,
        gap: 10,
        shadowColor: '#1D85E6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    fabText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
