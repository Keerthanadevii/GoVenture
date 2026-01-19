import { ThemeColors, useTheme } from '@/src/context/ThemeContext';
import api from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function LinkedAccounts() {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();
    const colors = ThemeColors[theme];
    const [autoSync, setAutoSync] = useState(true);
    const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
    const [showSelection, setShowSelection] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Load primary from userInfo
                const userInfoData = await AsyncStorage.getItem('userInfo');
                let primaryEmail = '';
                let primaryAcc = null;
                if (userInfoData) {
                    const { user } = JSON.parse(userInfoData);
                    primaryEmail = user.email;
                    setAutoSync(user.auto_sync_data ?? true);
                    primaryAcc = {
                        id: 'primary',
                        email: user.email,
                        provider: 'google',
                        isPrimary: true
                    };
                }

                // Load secondary from backend
                const response = await api.get('/linked-accounts');
                const secondaryAccounts = response.data
                    .filter((acc: any) => acc.email !== primaryEmail) // Safeguard
                    .map((acc: any) => ({
                        ...acc,
                        isPrimary: false
                    }));

                setLinkedAccounts(primaryAcc ? [primaryAcc, ...secondaryAccounts] : secondaryAccounts);

                // Load login history for "Choose Account"
                const historyStr = await AsyncStorage.getItem('loginHistory');
                if (historyStr) {
                    const history = JSON.parse(historyStr);
                    // Filter out the current primary email from suggestions
                    setAvailableAccounts(history.filter((email: string) => email !== primaryEmail));
                }
            } catch (error) {
                console.error('Failed to fetch linked accounts:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const addAccount = () => {
        setShowSelection(true);
    };

    const linkSuggestedAccount = async (email: string) => {
        try {
            const response = await api.post('/linked-accounts', {
                email: email,
                provider: 'google'
            });

            setLinkedAccounts([...linkedAccounts, {
                ...response.data,
                isPrimary: false
            }]);
            setShowSelection(false);
            Alert.alert("Success", "Account linked successfully!");
        } catch (error: any) {
            console.error('Link Error:', error);
            const message = error.response?.data?.message || "Could not link account.";
            Alert.alert("Error", message);
        }
    };

    const unlinkAccount = (id: string, email: string) => {
        Alert.alert(
            "Unlink Account?",
            `This will stop the AI from learning from ${email}.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Unlink", style: "destructive", onPress: async () => {
                        try {
                            await api.delete(`/linked-accounts/${id}`);
                            setLinkedAccounts(linkedAccounts.filter(acc => acc.id !== id));
                            Alert.alert("Success", "Account unlinked.");
                        } catch (error) {
                            Alert.alert("Error", "Could not unlink account.");
                        }
                    }
                }
            ]
        );
    };


    const toggleAutoSync = async (value: boolean) => {
        setAutoSync(value);
        try {
            const response = await api.put('/user', { auto_sync_data: value });
            // Update local storage
            const data = await AsyncStorage.getItem('userInfo');
            if (data) {
                const parsed = JSON.parse(data);
                await AsyncStorage.setItem('userInfo', JSON.stringify({
                    ...parsed,
                    user: response.data
                }));
            }
        } catch (error) {
            console.error('Failed to sync auto-sync preference:', error);
            Alert.alert("Error", "Could not save preference.");
            setAutoSync(!value); // Revert UI
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => showSelection ? setShowSelection(false) : router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {showSelection ? 'Choose Account' : 'Linked Accounts'}
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={{ color: colors.text }}>Loading accounts...</Text>
                    </View>
                ) : showSelection ? (
                    <View>
                        <Text style={styles.selectionTitle}>Select an account to share data with GoVenture</Text>

                        {availableAccounts.length === 0 && (
                            <Text style={[styles.emptyText, { color: colors.text }]}>No other signed-in accounts found on this device.</Text>
                        )}

                        {availableAccounts.filter(email => !linkedAccounts.some(acc => acc.email === email)).map((email, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.selectionCard, { backgroundColor: colors.card }]}
                                onPress={() => linkSuggestedAccount(email)}
                            >
                                <View style={styles.accountRow}>
                                    <View style={[styles.iconBg, { backgroundColor: '#F1F5F9' }]}>
                                        <Ionicons name="logo-google" size={20} color="#64748B" />
                                    </View>
                                    <View style={styles.accountTextContainer}>
                                        <Text style={[styles.accountTitle, { color: colors.text, fontSize: 16 }]}>{email}</Text>
                                        <Text style={styles.accountSubtitle}>Signed in</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                                </View>
                            </TouchableOpacity>
                        ))}

                    </View>
                ) : (
                    <>
                        {/* AI Banner */}
                        <View style={[styles.aiBanner, { backgroundColor: isDarkMode ? '#1E293B' : '#E0F2FE' }]}>
                            <View style={[styles.robotIconBg, { backgroundColor: '#BFDBFE' }]}>
                                <Ionicons name="happy" size={24} color="#1D4ED8" />
                            </View>
                            <View style={styles.aiContent}>
                                <Text style={[styles.aiTitle, { color: isDarkMode ? '#BFDBFE' : '#1E40AF' }]}>Enhance your AI Assistant</Text>
                                <Text style={[styles.aiDesc, { color: isDarkMode ? '#94A3B8' : '#334155' }]}>
                                    Connect external accounts to let our AI learn from your preferences and past trips for hyper-personalized itineraries.
                                </Text>
                            </View>
                        </View>


                        {/* Social Profiles */}
                        <Text style={styles.sectionHeader}>CONNECTED GOOGLE PROFILES</Text>
                        {linkedAccounts.map((account) => (
                            <View key={account.id} style={[styles.card, { backgroundColor: colors.card, marginBottom: 12 }]}>
                                <View style={styles.accountRow}>
                                    <View style={[styles.iconBg, { backgroundColor: '#FFF7ED' }]}>
                                        <Ionicons name="logo-google" size={20} color="#EA580C" />
                                    </View>
                                    <View style={styles.accountTextContainer}>
                                        <Text style={[styles.accountTitle, { color: colors.text }]}>Google</Text>
                                        <View style={styles.statusRow}>
                                            <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                                            <Text style={styles.statusText}>{account.email}</Text>
                                        </View>
                                    </View>
                                    {!account.isPrimary && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.unlinkBtn, { borderColor: colors.divider }]}
                                            onPress={() => unlinkAccount(account.id, account.email)}
                                        >
                                            <Text style={[styles.actionBtnText, { color: colors.text }]}>Unlink</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity
                            style={[styles.addAccountBtn, { borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                            onPress={addAccount}
                        >
                            <Ionicons name="add" size={20} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                            <Text style={[styles.addAccountText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>Add Another Account</Text>
                        </TouchableOpacity>

                        <View style={{ height: 24 }} />

                        {/* Data & Privacy */}
                        <Text style={styles.sectionHeader}>DATA & PRIVACY</Text>

                        <View style={[styles.card, { backgroundColor: colors.card }]}>
                            <View style={styles.accountRow}>
                                <View style={styles.iconBg}>
                                    <Ionicons name="cloud-upload" size={24} color="#94A3B8" />
                                </View>
                                <View style={styles.accountTextContainer}>
                                    <Text style={[styles.accountTitle, { color: colors.text }]}>Auto-Sync Data</Text>
                                    <Text style={styles.accountSubtitle} numberOfLines={2}>
                                        Automatically refresh data from linked accounts daily.
                                    </Text>
                                </View>
                                <Switch
                                    value={autoSync}
                                    onValueChange={toggleAutoSync}
                                    trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
                                    thumbColor="#FFF"
                                />
                            </View>
                        </View>

                        {/* Security Footer */}
                        <View style={styles.footer}>
                            <Ionicons name="lock-closed" size={14} color="#94A3B8" />
                            <Text style={styles.footerText}>
                                Your data is encrypted and never posted to your accounts without permission.
                            </Text>
                        </View>

                    </>
                )}
            </ScrollView>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backBtn: { padding: 4, marginRight: 16 },
    headerTitle: { fontSize: 24, fontWeight: '700' },
    content: { paddingHorizontal: 20, paddingTop: 10 },
    aiBanner: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    robotIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    aiContent: { flex: 1 },
    aiTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    aiDesc: { fontSize: 14, lineHeight: 20 },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.5,
        marginBottom: 12,
        marginTop: 8,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    accountRow: { flexDirection: 'row', alignItems: 'center' },
    iconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: '#F1F5F9',
    },
    accountTextContainer: { flex: 1, paddingRight: 8 },
    accountTitle: { fontSize: 18, fontWeight: '700' },
    accountSubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 2 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
    statusText: { fontSize: 14, color: '#22C55E' },
    actionBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnText: { fontSize: 14, fontWeight: '600' },
    unlinkBtn: { borderWidth: 1, backgroundColor: 'transparent' },
    connectBtn: { backgroundColor: '#E0F2FE' },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 30,
        marginTop: 10,
    },
    footerText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
    addAccountBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        gap: 8,
    },
    addAccountText: { fontSize: 16, fontWeight: '600' },
    selectionTitle: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 20,
        lineHeight: 24,
    },
    selectionCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
        opacity: 0.6,
    },
    modalSubmitBtn: { backgroundColor: '#3B82F6' },
    modalBtnText: { fontSize: 16, fontWeight: '600' },
});

