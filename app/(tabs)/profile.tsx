import { ThemeColors, useTheme } from '@/src/context/ThemeContext';
import AuthService from '@/src/services/AuthService';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function ProfileScreen() {
    const router = useRouter();
    const { theme, toggleTheme, isDarkMode } = useTheme();
    const colors = ThemeColors[theme];

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Profile Data
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [tripsGenerated, setTripsGenerated] = useState(0);

    // Travel DNA
    const [budgetRange, setBudgetRange] = useState(1); // 0=Economy, 1=Mid-Range, 2=Luxury
    const [pace, setPace] = useState('Balanced');
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);



    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const user = await AuthService.getUser();
            if (user) {
                setName(user.name);
                setEmail(user.email);
                setTripsGenerated(user.trips_generated || 0);
                setBudgetRange(user.budget ?? 1);
                setPace(user.pace || 'Balanced');
                setSelectedInterests(user.interests || []);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Sign Out",
            `You are currently signed in as ${name}. Are you sure you want to sign out?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        await AuthService.logout();
                        router.replace('/login');
                    }
                }
            ]
        );
    };



    // Auto-save preferences when changed
    const updatePreference = async (key: string, value: any) => {
        try {
            await AuthService.updateProfile({ [key]: value });
        } catch (error) {
            console.error(`Failed to update ${key}:`, error);
        }
    };

    const handleBudgetChange = (value: number) => {
        setBudgetRange(value);
        // Debouncing would be better here, but for simplicity we save on end
    };

    const handleBudgetComplete = (value: number) => {
        updatePreference('budget', value);
    };

    const handlePaceChange = (newPace: string) => {
        setPace(newPace);
        updatePreference('pace', newPace);
    };

    const interests = ['Nature', 'Foodie', 'Culture', 'Nightlife', 'Relaxing', 'Shopping'];

    const toggleInterest = (interest: string) => {
        const newInterests = selectedInterests.includes(interest)
            ? selectedInterests.filter(i => i !== interest)
            : [...selectedInterests, interest];

        setSelectedInterests(newInterests);
        updatePreference('interests', newInterests);
    };

    const budgetLabels = ['Economy', 'Mid-Range ($$)', 'Luxury'];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Profile & Settings</Text>
                <TouchableOpacity onPress={handleLogout}>
                    <Ionicons name="exit-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* User Info */}
                <View style={styles.profileInfo}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop' }}
                            style={[styles.avatar, { borderColor: colors.card }]}
                        />

                    </View>

                    <Text style={[styles.userName, { color: colors.text }]}>{name}</Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{email}</Text>
                    <TouchableOpacity style={[styles.tripsTag, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EBF5FF' }]}>
                        <Ionicons name="boat-outline" size={14} color={colors.primary} />
                        <Text style={[styles.tripsTagText, { color: colors.primary }]}>{tripsGenerated} Trips Generated</Text>
                    </TouchableOpacity>
                </View>

                {/* Travel DNA */}
                <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconBg, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' }]}>
                        <Ionicons name="settings" size={18} color={colors.primary} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Travel DNA (AI Preferences)</Text>
                </View>

                <View style={[styles.dnaCard, { backgroundColor: colors.card }]}>
                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceHeader}>
                            <Text style={[styles.preferenceLabel, { color: colors.text }]}>Budget Range</Text>
                            <Text style={[styles.preferenceValue, { color: colors.primary }]}>{budgetLabels[budgetRange]}</Text>
                        </View>
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={0}
                            maximumValue={2}
                            step={1}
                            value={budgetRange}
                            onValueChange={handleBudgetChange}
                            onSlidingComplete={handleBudgetComplete}
                            minimumTrackTintColor={colors.primary}
                            maximumTrackTintColor={colors.divider}
                            thumbTintColor={colors.primary}
                        />
                        <View style={styles.sliderLabels}>
                            <Text style={styles.sliderLabelText}>Economy</Text>
                            <Text style={styles.sliderLabelText}>Luxury</Text>
                        </View>
                    </View>

                    <View style={styles.preferenceItem}>
                        <Text style={[styles.preferenceLabel, { color: colors.text }]}>Pace Preference</Text>
                        <View style={styles.paceContainer}>
                            {['Relaxed', 'Balanced', 'Fast'].map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.paceBtn,
                                        { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' },
                                        pace === item && { backgroundColor: colors.primary }
                                    ]}
                                    onPress={() => handlePaceChange(item)}
                                >
                                    <Text style={[
                                        styles.paceBtnText,
                                        { color: colors.textSecondary },
                                        pace === item && { color: '#FFF' }
                                    ]}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.preferenceItem}>
                        <Text style={[styles.preferenceLabel, { color: colors.text }]}>Interests</Text>
                        <View style={styles.interestsContainer}>
                            {interests.map((interest) => (
                                <TouchableOpacity
                                    key={interest}
                                    style={[
                                        styles.interestChip,
                                        { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' },
                                        selectedInterests.includes(interest) && { backgroundColor: colors.primary }
                                    ]}
                                    onPress={() => toggleInterest(interest)}
                                >
                                    <Text style={[
                                        styles.interestChipText,
                                        { color: colors.textSecondary },
                                        selectedInterests.includes(interest) && { color: '#FFF' }
                                    ]}>
                                        {interest}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Linked Accounts */}
                <TouchableOpacity style={[styles.linkedAccountsRow, { backgroundColor: colors.card }]} onPress={() => router.push('/linked-accounts')}>
                    <View style={[styles.linkedIconBg, { backgroundColor: isDarkMode ? '#4C1D95' : '#F5F3FF' }]}>
                        <Ionicons name="link-outline" size={20} color={isDarkMode ? '#A78BFA' : '#A855F7'} />
                    </View>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Linked Accounts</Text>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>

                {/* App Settings */}
                <Text style={styles.groupTitle}>APP SETTINGS</Text>
                <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
                    <View style={styles.settingItem}>
                        <View style={[styles.settingIconBg, { backgroundColor: '#FFF7ED' }]}>
                            <Ionicons name="notifications" size={20} color="#F97316" />
                        </View>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>Push Notifications</Text>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#D1D5DB', true: colors.primary }}
                            thumbColor="#FFF"
                        />
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/privacy-data')}>
                        <View style={[styles.settingIconBg, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                        </View>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>Privacy & Data</Text>
                        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <TouchableOpacity style={styles.settingItem} onPress={toggleTheme}>
                        <View style={[styles.settingIconBg, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' }]}>
                            <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color={isDarkMode ? "#60A5FA" : "#1E40AF"} />
                        </View>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
                        <Text style={[styles.settingValue, { color: colors.primary }]}>{isDarkMode ? 'On' : 'Off'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Support */}
                <Text style={styles.groupTitle}>SUPPORT</Text>
                <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
                    <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/help-center')}>
                        <View style={[styles.settingIconBg, { backgroundColor: '#FDF2F8' }]}>
                            <Ionicons name="help-circle" size={20} color="#EC4899" />
                        </View>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>Help Center</Text>
                        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.versionText, { color: colors.textSecondary }]}>TravelAI v1.0.2 • Build 8420</Text>
                <View style={{ height: 100 }} />
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
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    content: { paddingHorizontal: 20 },
    profileInfo: { alignItems: 'center', marginBottom: 30 },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#FFF' },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#1D85E6',
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    userName: { fontSize: 24, fontWeight: '700' },
    userEmail: { fontSize: 14, marginTop: 4 },
    tripsTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF5FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 16,
        gap: 6,
    },
    tripsTagText: { color: '#3B82F6', fontSize: 13, fontWeight: '600' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 10 },
    sectionIconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    dnaCard: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 20,
    },
    preferenceItem: { marginBottom: 20 },
    preferenceHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    preferenceLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
    preferenceValue: { fontSize: 14, fontWeight: '700', color: '#3B82F6' },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
    sliderLabelText: { fontSize: 12, color: '#9CA3AF' },
    paceContainer: { flexDirection: 'row', gap: 8, marginTop: 10 },
    paceBtn: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    paceBtnActive: { backgroundColor: '#3B82F6' },
    paceBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    paceBtnTextActive: { color: '#FFF' },
    interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    interestChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    interestChipActive: { backgroundColor: '#3B82F6' },
    interestChipText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    interestChipTextActive: { color: '#FFF' },
    linkedAccountsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    linkedIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F5F3FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    groupTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 12, marginTop: 10 },
    settingsCard: {
        borderRadius: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 20,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    settingIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
    settingValue: { fontSize: 14 },
    divider: { height: 1, backgroundColor: '#E5E7EB' },
    versionText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 20, marginBottom: 30 },
});
