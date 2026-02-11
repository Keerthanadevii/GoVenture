import { ThemeColors, useTheme } from '@/src/context/ThemeContext';
import api from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const { width } = Dimensions.get('window');

export default function EditBlueprint() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { theme, isDarkMode } = useTheme();
    const colors = ThemeColors[theme];

    const [blueprint, setBlueprint] = useState<any>(null);
    const [fullTrip, setFullTrip] = useState<any>(null);
    const [days, setDays] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [isDestModal, setIsDestModal] = useState(false);
    const [isThemeModal, setIsThemeModal] = useState(false);
    const [isSettingsModal, setIsSettingsModal] = useState(false);

    // Temp state for modals
    const [tempInterests, setTempInterests] = useState<string[]>([]);
    const [tempBudget, setTempBudget] = useState<string>('');
    const [tempParties, setTempParties] = useState<string[]>([]);

    const openThemeModal = () => {
        setTempInterests(fullTrip?.interests || []);
        setIsThemeModal(true);
    };

    const openSettingsModal = () => {
        setTempBudget(fullTrip?.budget_type || 'Standard');
        setTempParties(fullTrip?.parties || ['Solo']);
        setIsSettingsModal(true);
    };

    const applyThemeChange = () => {
        setIsThemeModal(false);
        handleRegenerate({ interests: tempInterests });
    };

    const applySettingsChange = () => {
        setIsSettingsModal(false);
        handleRegenerate({ budget_type: tempBudget, parties: tempParties });
    };

    useEffect(() => {
        const fetchBlueprint = async () => {
            try {
                const res = await api.get(`/trips/${id}`);
                const trip = res.data;
                if (trip && trip.itinerary_data) {
                    setFullTrip(trip);
                    setBlueprint(trip.itinerary_data);
                    const breakdown = trip.itinerary_data.daily_breakdown || [];
                    setDays(breakdown.map((d: any) => ({
                        id: d.day,
                        title: d.title || `Day ${d.day}`,
                        date: d.date || `Day ${d.day}`,
                        raw: d // keep the full day data
                    })));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBlueprint();
    }, [id]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const newBreakdown = days.map((d, index) => ({
                ...d.raw,
                day: index + 1
            }));
            const newItinerary = {
                ...blueprint,
                daily_breakdown: newBreakdown
            };
            await api.put(`/trips/${id}`, { itinerary_data: newItinerary });
            Alert.alert('Success', 'Timeline updated! ✨');
            router.back();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRegenerate = async (updatePkg: any) => {
        setIsSaving(true);
        try {
            // 1. Update Trip Meta
            const tripRes = await api.put(`/trips/${id}`, updatePkg);
            const updatedTrip = tripRes.data.trip;

            // 2. Call AI generate
            const genRes = await api.post('/trip/generate', {
                starting_point: updatedTrip.starting_point,
                destination: updatedTrip.destination,
                start_date: updatedTrip.start_date,
                end_date: updatedTrip.end_date,
                interests: updatedTrip.interests,
                travelers: updatedTrip.parties,
                budget_type: updatedTrip.budget_type,
                pace: updatedTrip.settings?.strictSchedule ? 'Strict' : 'Balanced',
                lat: updatedTrip.lat,
                lng: updatedTrip.lng
            });

            // 3. Update Trip with new Blueprint
            await api.put(`/trips/${id}`, {
                itinerary_data: genRes.data
            });

            Alert.alert('Success', 'Major changes applied! AI has recalculated your plan. ✨');
            router.push(`/trip/${id}/blueprint`);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to regenerate blueprint.');
        } finally {
            setIsSaving(false);
        }
    };

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

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <>

                    {/* Header */}
                    <View style={[styles.header, { backgroundColor: colors.background }]}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Macro Blueprint Editor</Text>
                        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                            {isSaving ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>}
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


                            <TouchableOpacity
                                style={[styles.macroAction, { backgroundColor: colors.card }]}
                                onPress={openThemeModal}
                            >
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
                                onPress={openSettingsModal}
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
                </>
            )}

            {/* Modal: Swap Destination */}
            <Modal visible={isDestModal} transparent animationType="slide">
                <Pressable style={styles.modalOverlay} onPress={() => setIsDestModal(false)}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitleMD, { color: colors.text }]}>Change Destination</Text>
                        <GooglePlacesAutocomplete
                            placeholder="Where to?"
                            fetchDetails
                            onPress={(data, details = null) => {
                                if (details) {
                                    setIsDestModal(false);
                                    handleRegenerate({
                                        destination: data.description,
                                        lat: details.geometry.location.lat,
                                        lng: details.geometry.location.lng
                                    });
                                }
                            }}
                            query={{ key: 'none', language: 'en' }}
                            requestUrl={{ useOnPlatform: 'all', url: `${api.defaults.baseURL}/places` }}
                            styles={{
                                textInput: { backgroundColor: colors.background, color: colors.text, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.divider },
                                listView: { backgroundColor: colors.card, zIndex: 1000 }
                            }}
                        />
                    </View>
                </Pressable>
            </Modal>

            {/* Modal: Trip Theme */}
            <Modal visible={isThemeModal} transparent animationType="slide">
                <Pressable style={styles.modalOverlay} onPress={() => setIsThemeModal(false)}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={[styles.modalTitleMD, { color: colors.text, marginBottom: 0 }]}>Choose Trip Theme</Text>
                            <TouchableOpacity onPress={applyThemeChange}>
                                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>Done</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.themeGrid}>
                            {['Relaxation', 'Adventure', 'Foodie', 'Culture', 'Luxury', 'Budget'].map(t => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.themeBtn, { backgroundColor: tempInterests.includes(t) ? colors.primary : colors.background }]}
                                    onPress={() => setTempInterests([t])}
                                >
                                    <Text style={[styles.themeText, { color: tempInterests.includes(t) ? '#FFF' : colors.text }]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={[styles.saveBtn, { marginTop: 30 }]} onPress={applyThemeChange}>
                            <Text style={styles.saveBtnText}>Apply Change</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* Modal: Global Settings */}
            <Modal visible={isSettingsModal} transparent animationType="slide">
                <Pressable style={styles.modalOverlay} onPress={() => setIsSettingsModal(false)}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={[styles.modalTitleMD, { color: colors.text, marginBottom: 0 }]}>Global Settings</Text>
                            <TouchableOpacity onPress={applySettingsChange}>
                                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>Done</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>BUDGET TYPE</Text>
                        <View style={styles.themeGrid}>
                            {['Economy', 'Standard', 'Luxury'].map(b => (
                                <TouchableOpacity
                                    key={b}
                                    style={[styles.themeBtn, { backgroundColor: tempBudget === b ? colors.primary : colors.background }]}
                                    onPress={() => setTempBudget(b)}
                                >
                                    <Text style={[styles.themeText, { color: tempBudget === b ? '#FFF' : colors.text }]}>{b}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.settingLabel, { color: colors.textSecondary, marginTop: 20 }]}>TRAVELERS</Text>
                        <View style={styles.themeGrid}>
                            {['Solo', 'Couple', 'Family', 'Friends'].map(p => (
                                <TouchableOpacity
                                    key={p}
                                    style={[styles.themeBtn, { backgroundColor: tempParties.includes(p) ? colors.primary : colors.background }]}
                                    onPress={() => setTempParties([p])}
                                >
                                    <Text style={[styles.themeText, { color: tempParties.includes(p) ? '#FFF' : colors.text }]}>{p}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={[styles.saveBtn, { marginTop: 30 }]} onPress={applySettingsChange}>
                            <Text style={styles.saveBtnText}>Apply Settings</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
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
    // New Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 60, minHeight: 400 },
    modalTitleMD: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
    themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
    themeBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    themeText: { fontWeight: '600' },
    settingLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 10 },
    saveBtn: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
