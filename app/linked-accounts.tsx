import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Switch,
} from 'react-native';
import { useTheme, ThemeColors } from './context/ThemeContext';

export default function LinkedAccounts() {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();
    const colors = ThemeColors[theme];
    const [autoSync, setAutoSync] = useState(true);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Linked Accounts</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* AI Banner */}
                <View style={[styles.aiBanner, { backgroundColor: colors.aiBanner, borderColor: colors.aiBannerBorder }]}>
                    <View style={[styles.robotIconBg, { backgroundColor: isDarkMode ? '#1E3A8A' : '#DBEAFE' }]}>
                        <Ionicons name="apps" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.aiContent}>
                        <Text style={[styles.aiTitle, { color: colors.aiBannerText }]}>Enhance your AI Assistant</Text>
                        <Text style={[styles.aiDesc, { color: colors.aiBannerText }]}>
                            Connect external accounts to let our AI learn from your preferences, past trips, and social interactions for hyper-personalized itineraries.
                        </Text>
                    </View>
                </View>

                {/* Social Profiles */}
                <Text style={styles.sectionTitle}>SOCIAL PROFILES</Text>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    {/* Google */}
                    <View style={styles.accountItem}>
                        <View style={[styles.iconBg, { backgroundColor: isDarkMode ? '#7C2D12' : '#FFF7ED' }]}>
                            <Ionicons name="logo-google" size={20} color="#F97316" />
                        </View>
                        <View style={styles.accountInfo}>
                            <Text style={[styles.accountName, { color: colors.text }]}>Google</Text>
                            <View style={styles.statusRow}>
                                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                <Text style={[styles.statusText, { color: colors.textSecondary }]}>alex.v@example.com</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={[styles.unlinkBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
                            <Text style={[styles.unlinkBtnText, { color: colors.text }]}>Unlink</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                    {/* Instagram */}
                    <View style={styles.accountItem}>
                        <View style={[styles.iconBg, { backgroundColor: isDarkMode ? '#831843' : '#FDF2F8' }]}>
                            <Ionicons name="logo-instagram" size={20} color="#EC4899" />
                        </View>
                        <View style={styles.accountInfo}>
                            <Text style={[styles.accountName, { color: colors.text }]}>Instagram</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Import travel memories</Text>
                        </View>
                        <TouchableOpacity style={[styles.connectBtn, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' }]}>
                            <Text style={[styles.connectBtnText, { color: colors.primary }]}>Connect</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                    {/* Facebook */}
                    <View style={styles.accountItem}>
                        <View style={[styles.iconBg, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' }]}>
                            <Ionicons name="logo-facebook" size={20} color="#1D4ED8" />
                        </View>
                        <View style={styles.accountInfo}>
                            <Text style={[styles.accountName, { color: colors.text }]}>Facebook</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Find friends & events</Text>
                        </View>
                        <TouchableOpacity style={[styles.connectBtn, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' }]}>
                            <Text style={[styles.connectBtnText, { color: colors.primary }]}>Connect</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Travel Services */}
                <Text style={styles.sectionTitle}>TRAVEL SERVICES</Text>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    {/* Booking.com */}
                    <View style={styles.accountItem}>
                        <View style={[styles.iconBg, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EEF2FF' }]}>
                            <Ionicons name="bed" size={20} color={isDarkMode ? '#818CF8' : '#4338CA'} />
                        </View>
                        <View style={styles.accountInfo}>
                            <Text style={[styles.accountName, { color: colors.text }]}>Booking.com</Text>
                            <View style={styles.statusRow}>
                                <Ionicons name="refresh" size={14} color="#10B981" />
                                <Text style={[styles.statusText, { color: colors.textSecondary }]}>Syncing reservations</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={[styles.unlinkBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
                            <Text style={[styles.unlinkBtnText, { color: colors.text }]}>Unlink</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                    {/* Airbnb */}
                    <View style={styles.accountItem}>
                        <View style={[styles.iconBg, { backgroundColor: isDarkMode ? '#7F1D1D' : '#FEF2F2' }]}>
                            <Ionicons name="home" size={20} color="#EF4444" />
                        </View>
                        <View style={styles.accountInfo}>
                            <Text style={[styles.accountName, { color: colors.text }]}>Airbnb</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sync wishlists</Text>
                        </View>
                        <TouchableOpacity style={[styles.connectBtn, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' }]}>
                            <Text style={[styles.connectBtnText, { color: colors.primary }]}>Connect</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Data & Privacy */}
                <Text style={styles.sectionTitle}>DATA & PRIVACY</Text>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.accountItem}>
                        <View style={[styles.iconBg, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}>
                            <Ionicons name="sync" size={20} color={colors.textSecondary} />
                        </View>
                        <View style={styles.accountInfo}>
                            <Text style={[styles.accountName, { color: colors.text }]}>Auto-Sync Data</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Automatically refresh data from linked accounts daily.</Text>
                        </View>
                        <Switch
                            value={autoSync}
                            onValueChange={setAutoSync}
                            trackColor={{ false: '#D1D5DB', true: colors.primary }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

                {/* Footer Note */}
                <View style={styles.footerNote}>
                    <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
                    <Text style={styles.footerNoteText}>
                        Your data is encrypted and never posted to your accounts without permission.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#F9FAFB',
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    content: { padding: 20 },
    aiBanner: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    robotIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    aiContent: { flex: 1 },
    aiTitle: { fontSize: 16, fontWeight: '700', color: '#1E40AF', marginBottom: 4 },
    aiDesc: { fontSize: 13, color: '#1E40AF', opacity: 0.8, lineHeight: 18 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 0.8, marginBottom: 12, marginTop: 8 },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    accountItem: { flexDirection: 'row', alignItems: 'center' },
    iconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    accountInfo: { flex: 1 },
    accountName: { fontSize: 16, fontWeight: '700', color: '#111827' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    statusText: { fontSize: 13, color: '#10B981', fontWeight: '500' },
    subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    connectBtn: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    connectBtnText: { color: '#3B82F6', fontSize: 13, fontWeight: '700' },
    unlinkBtn: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    unlinkBtnText: { color: '#111827', fontSize: 13, fontWeight: '700' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
    footerNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
        paddingHorizontal: 40,
    },
    footerNoteText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
});
