import { ThemeColors, useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PrivacyPolicy() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = ThemeColors[theme];

    const sections = [
        {
            title: "1. Information We Collect",
            content: "GoVenture collects information you provide directly to us when you create an account, such as your name and email address. We also collect data about your travel preferences (Travel DNA) and linked accounts to provide personalized itineraries."
        },
        {
            title: "2. How We Use Your Data",
            content: "We use the information to generate travel suggestions, improve our AI models (if you've opted in), and sync your travel history across devices. Your data helps us refine the 'Travel DNA' which makes every suggestion more relevant to your style."
        },
        {
            title: "3. AI Training & Smart Suggestions",
            content: "If enabled, we use anonymized trip data to train our AI for better itinerary generation. Smart Suggestions analyze your past trips to suggest new destinations. You can opt-out of these at any time in settings."
        },
        {
            title: "4. Data Sharing",
            content: "We do not sell your personal data. We only share information with third-party providers necessary for providing our services (e.g., Google if linked) or when required by law."
        },
        {
            title: "5. Your Privacy Choices",
            content: "You have full control over your data. You can manage your profile visibility, toggle data sharing for AI training, and manage cookie preferences in the Privacy & Data section of your profile."
        }
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.introText, { color: colors.textSecondary }]}>
                    Last Updated: January 13, 2026
                </Text>

                <Text style={[styles.mainTitle, { color: colors.text }]}>
                    Your privacy is our priority.
                </Text>

                {sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                        <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                            {section.content}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    content: { padding: 20 },
    introText: { fontSize: 13, marginBottom: 12 },
    mainTitle: { fontSize: 24, fontWeight: '800', marginBottom: 24, lineHeight: 32 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    sectionContent: { fontSize: 15, lineHeight: 22 },
    footer: { marginTop: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 20 },
    footerText: { fontSize: 14, fontStyle: 'italic', textAlign: 'center' },
});
