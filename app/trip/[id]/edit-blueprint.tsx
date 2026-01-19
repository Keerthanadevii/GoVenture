import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
} from 'react-native';
import { useState } from 'react';
import { useTheme, ThemeColors } from '@/src/context/ThemeContext';

const { width } = Dimensions.get('window');

export default function EditBlueprint() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { theme, isDarkMode } = useTheme();
    const colors = ThemeColors[theme];

    const [days, setDays] = useState([
        { id: 1, title: 'Day 1: Arrival & Omotesando', date: 'Oct 14' },
        { id: 2, title: 'Day 2: Historic Asakusa', date: 'Oct 15' },
        { id: 3, title: 'Day 3: Shibuya & Nightlife', date: 'Oct 16' },
        { id: 4, title: 'Day 4: Departure', date: 'Oct 17' },
    ]);

    const moveDay = (index: number, direction: 'up' | 'down') => {
        const newDays = [...days];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= days.length) return;

        const temp = newDays[index];
        newDays[index] = newDays[targetIndex];
        newDays[targetIndex] = temp;
        setDays(newDays);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Macro Blueprint Editor</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>REORDER DAYS</Text>
                    <Text style={styles.sectionDesc}>Drag or use arrows to swap entire days of your trip.</Text>

                    {days.map((day, index) => (
                        <View key={day.id} style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                            <View style={styles.dayInfo}>
                                <Text style={[styles.dayDate, { color: colors.primary }]}>{day.date}</Text>
                                <Text style={[styles.dayTitle, { color: colors.text }]}>{day.title}</Text>
                            </View>
                            <View style={styles.dragControls}>
                                <TouchableOpacity onPress={() => moveDay(index, 'up')} disabled={index === 0}>
                                    <Ionicons name="chevron-up" size={20} color={index === 0 ? colors.divider : colors.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => moveDay(index, 'down')} disabled={index === days.length - 1}>
                                    <Ionicons name="chevron-down" size={20} color={index === days.length - 1 ? colors.divider : colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>STRUCTURAL CHANGES</Text>

                    <TouchableOpacity style={[styles.macroAction, { backgroundColor: colors.card }]}>
                        <View style={[styles.actionIconBg, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="earth" size={20} color="#3B82F6" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.actionTitle, { color: colors.text }]}>Swap Major Destination</Text>
                            <Text style={styles.actionSub}>Decided on Osaka instead of Tokyo?</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.macroAction, { backgroundColor: colors.card }]}>
                        <View style={[styles.actionIconBg, { backgroundColor: '#F5F3FF' }]}>
                            <Ionicons name="color-palette" size={20} color="#8B5CF6" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.actionTitle, { color: colors.text }]}>Change Trip Theme</Text>
                            <Text style={styles.actionSub}>Switch from "Adventure" to "Relaxation"</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.macroAction, { backgroundColor: colors.card }]}
                        onPress={() => router.push('/create-trip')}
                    >
                        <View style={[styles.actionIconBg, { backgroundColor: '#FEF3F2' }]}>
                            <Ionicons name="settings" size={20} color="#EF4444" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.actionTitle, { color: colors.text }]}>Global Settings</Text>
                            <Text style={styles.actionSub}>Adjust budget, party size, or dates</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    doneText: { fontSize: 16, fontWeight: '700' },
    content: { padding: 20 },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
    sectionDesc: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
    dayCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    dayInfo: { flex: 1 },
    dayDate: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
    dayTitle: { fontSize: 15, fontWeight: '600' },
    dragControls: { flexDirection: 'row', gap: 12 },
    macroAction: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        gap: 16,
    },
    actionIconBg: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    actionTitle: { fontSize: 15, fontWeight: '700' },
    actionSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
