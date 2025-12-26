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
    Modal,
    Pressable,
} from 'react-native';
import { useTheme, ThemeColors } from './context/ThemeContext';

export default function PrivacyData() {
    const router = useRouter();
    const { theme, isDarkMode, toggleTheme } = useTheme();
    const colors = ThemeColors[theme];

    const [trainAI, setTrainAI] = useState(true);
    const [smartSuggestions, setSmartSuggestions] = useState(true);
    const [shareStats, setShareStats] = useState(false);
    const [profileVisibility, setProfileVisibility] = useState('Friends Only');
    const [isVisibilityModalVisible, setIsVisibilityModalVisible] = useState(false);

    const visibilityOptions = ['Public', 'Friends Only', 'Private'];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy & Data</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.introText, { color: colors.textSecondary }]}>
                    Manage how TravelAI uses your data to generate itineraries and what you share with others. We value your privacy and transparency.
                </Text>

                {/* AI Customization */}
                <Text style={styles.sectionTitle}>AI CUSTOMIZATION</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingName, { color: colors.text }]}>Use my trips for AI Training</Text>
                            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                                Help improve itinerary generation for everyone. Data is anonymized before processing.
                            </Text>
                        </View>
                        <Switch
                            value={trainAI}
                            onValueChange={setTrainAI}
                            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                            thumbColor="#FFF"
                        />
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingName, { color: colors.text }]}>Smart Suggestions</Text>
                            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                                Allow the app to analyze your past trips to suggest new destinations.
                            </Text>
                        </View>
                        <Switch
                            value={smartSuggestions}
                            onValueChange={setSmartSuggestions}
                            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

                {/* Sharing & Visibility */}
                <Text style={styles.sectionTitle}>SHARING & VISIBILITY</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity
                        style={styles.actionRow}
                        onPress={() => setIsVisibilityModalVisible(true)}
                    >
                        <Text style={[styles.settingName, { color: colors.text }]}>Profile Visibility</Text>
                        <View style={styles.actionValue}>
                            <Text style={styles.valueText}>{profileVisibility}</Text>
                            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                        </View>
                    </TouchableOpacity>
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingName, { color: colors.text }]}>Share Usage Statistics</Text>
                            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                                Share crash reports and analytics to help us build a better app.
                            </Text>
                        </View>
                        <Switch
                            value={shareStats}
                            onValueChange={setShareStats}
                            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

                {/* App Preferences */}
                <Text style={styles.sectionTitle}>APP PREFERENCES</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingName, { color: colors.text }]}>Dark Mode</Text>
                            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                                Enable dark theme for the application.
                            </Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

                {/* Your Data */}
                <Text style={styles.sectionTitle}>YOUR DATA</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity style={styles.actionItem}>
                        <View style={[styles.iconBg, { backgroundColor: colors.aiBanner }]}>
                            <Ionicons name="download-outline" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.text }]}>Download My Data</Text>
                        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <TouchableOpacity style={styles.actionItem}>
                        <View style={[styles.iconBg, { backgroundColor: colors.divider }]}>
                            <Ionicons name="browsers-outline" size={20} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.text }]}>Cookie Preferences</Text>
                        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <TouchableOpacity style={styles.actionItem}>
                        <View style={[styles.iconBg, { backgroundColor: colors.divider }]}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.text }]}>Privacy Policy</Text>
                        <Ionicons name="open-outline" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* Danger Zone */}
                <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>DANGER ZONE</Text>
                <TouchableOpacity style={[styles.dangerCard, { backgroundColor: colors.card, borderColor: colors.dangerBorder }]}>
                    <View style={[styles.dangerIconBg, { backgroundColor: colors.dangerBg }]}>
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </View>
                    <View style={styles.settingInfo}>
                        <Text style={[styles.settingName, { color: colors.danger }]}>Delete Account & Data</Text>
                        <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>This action cannot be undone.</Text>
                    </View>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Visibility Selection Modal */}
            <Modal
                visible={isVisibilityModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsVisibilityModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setIsVisibilityModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Profile Visibility</Text>
                        {visibilityOptions.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[styles.optionItem, { borderBottomColor: colors.divider }]}
                                onPress={() => {
                                    setProfileVisibility(option);
                                    setIsVisibilityModalVisible(false);
                                }}
                            >
                                <Text style={[
                                    styles.optionText,
                                    { color: colors.text },
                                    profileVisibility === option && styles.optionTextActive
                                ]}>
                                    {option}
                                </Text>
                                {profileVisibility === option && (
                                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
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
    introText: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 24 },
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
    settingRow: { flexDirection: 'row', alignItems: 'center' },
    settingInfo: { flex: 1, marginRight: 16 },
    settingName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    settingDesc: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 18 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
    actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    actionValue: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    valueText: { fontSize: 15, color: '#6B7280' },
    actionItem: { flexDirection: 'row', alignItems: 'center' },
    iconBg: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' },
    dangerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    dangerIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 20,
        textAlign: 'center',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    optionText: {
        fontSize: 16,
        color: '#374151',
    },
    optionTextActive: {
        color: '#3B82F6',
        fontWeight: '600',
    },
});
