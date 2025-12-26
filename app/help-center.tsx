import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    Share,
} from 'react-native';
import { useTheme, ThemeColors } from './context/ThemeContext';

export default function HelpCenter() {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();
    const colors = ThemeColors[theme];

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Need help with GoVenture? Check out their Help Center for FAQs and support! 🆘\n\nDownload the app to optimize your next adventure.`,
            });
        } catch (error: any) {
            console.error(error.message);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Help Center</Text>
                <TouchableOpacity onPress={handleShare} activeOpacity={0.7}>
                    <Ionicons name="share-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
                    <TextInput
                        placeholder="How can we help you today?"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.searchInput, { color: colors.text }]}
                    />
                </View>

                {/* Contact Support */}
                <Text style={styles.sectionTitle}>CONTACT SUPPORT</Text>
                <View style={styles.contactRow}>
                    <TouchableOpacity style={[styles.contactCard, { backgroundColor: colors.card }]}>
                        <View style={[styles.contactIconBg, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' }]}>
                            <Ionicons name="chatbubble" size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.contactTitle, { color: colors.text }]}>Live Chat</Text>
                        <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>Wait time: ~2 min</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.contactCard, { backgroundColor: colors.card }]}>
                        <View style={[styles.contactIconBg, { backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5' }]}>
                            <Ionicons name="mail" size={24} color="#10B981" />
                        </View>
                        <Text style={[styles.contactTitle, { color: colors.text }]}>Email Us</Text>
                        <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>Response in 24h</Text>
                    </TouchableOpacity>
                </View>

                {/* Common Questions */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>COMMON QUESTIONS</Text>
                    <TouchableOpacity>
                        <Text style={[styles.viewAllText, { color: colors.primary }]}>View all</Text>
                    </TouchableOpacity>
                </View>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <TouchableOpacity style={styles.questionItem}>
                        <Ionicons name="settings-outline" size={20} color={colors.textSecondary} style={styles.questionIcon} />
                        <Text style={[styles.questionText, { color: colors.text }]}>How does the AI optimize trips?</Text>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <TouchableOpacity style={styles.questionItem} onPress={handleShare} activeOpacity={0.7}>
                        <Ionicons name="share-outline" size={20} color={colors.textSecondary} style={styles.questionIcon} />
                        <Text style={[styles.questionText, { color: colors.text }]}>Can I share plans with friends?</Text>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <TouchableOpacity style={styles.questionItem}>
                        <Ionicons name="cloud-offline-outline" size={20} color={colors.textSecondary} style={styles.questionIcon} />
                        <Text style={[styles.questionText, { color: colors.text }]}>Does it work offline?</Text>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* Guides & Resources */}
                <Text style={styles.sectionTitle}>GUIDES & RESOURCES</Text>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <TouchableOpacity style={styles.resourceItem}>
                        <View style={[styles.resourceIconBg, { backgroundColor: isDarkMode ? '#7C2D12' : '#FFF7ED' }]}>
                            <Ionicons name="book" size={24} color="#F97316" />
                        </View>
                        <View style={styles.resourceInfo}>
                            <Text style={[styles.resourceTitle, { color: colors.text }]}>Getting Started Guide</Text>
                            <Text style={[styles.resourceDesc, { color: colors.textSecondary }]}>
                                Learn the basics of creating your first AI-generated trip and customizing...
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <TouchableOpacity style={styles.resourceItem}>
                        <View style={[styles.resourceIconBg, { backgroundColor: isDarkMode ? '#4C1D95' : '#F5F3FF' }]}>
                            <Ionicons name="wallet" size={24} color={isDarkMode ? '#A855F7' : '#8B5CF6'} />
                        </View>
                        <View style={styles.resourceInfo}>
                            <Text style={[styles.resourceTitle, { color: colors.text }]}>Billing & Subscriptions</Text>
                            <Text style={[styles.resourceDesc, { color: colors.textSecondary }]}>
                                Manage your Premium plan, payment methods, and billing history.
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* Knowledge Base Link */}
                <View style={styles.footerLinkContainer}>
                    <Text style={styles.footerLinkText}>Can't find what you're looking for?</Text>
                    <TouchableOpacity>
                        <Text style={styles.browseLink}>Browse Full Knowledge Base</Text>
                    </TouchableOpacity>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: '#111827' },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 0.8, marginBottom: 16, marginTop: 8 },
    contactRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    contactCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    contactIconBg: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    contactTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
    contactSubtitle: { fontSize: 13, color: '#6B7280' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    viewAllText: { fontSize: 13, fontWeight: '600', color: '#3B82F6' },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    questionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20 },
    questionIcon: { marginRight: 16 },
    questionText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
    divider: { height: 1, backgroundColor: '#F3F4F6' },
    resourceItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
    resourceIconBg: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    resourceInfo: { flex: 1 },
    resourceTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
    resourceDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
    footerLinkContainer: { alignItems: 'center', marginTop: 12 },
    footerLinkText: { fontSize: 14, color: '#9CA3AF', marginBottom: 8 },
    browseLink: { fontSize: 15, fontWeight: '700', color: '#3B82F6' },
});
