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

export default function HelpCenter() {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();
    const colors = ThemeColors[theme];

    const faqs = [
        {
            question: "How does GoVenture work?",
            answer: "GoVenture uses advanced AI to analyze your travel preferences (Travel DNA) and generate personalized, optimized itineraries in seconds."
        },
        {
            question: "Can I use the app offline?",
            answer: "While an active connection is required to generate new AI trips, you can view your saved itineraries offline once they are loaded."
        },
        {
            question: "Is my data secure?",
            answer: "Yes, we prioritize your privacy. Your data is encrypted and we only use it to improve your travel recommendations."
        }
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Help Center</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.title, { color: colors.text }]}>How can we help you?</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Find answers to common questions below.
                </Text>

                <View style={styles.faqContainer}>
                    {faqs.map((faq, index) => (
                        <View key={index} style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                            <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                            <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.answer}</Text>
                        </View>
                    ))}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 22, fontWeight: '700' },
    content: { padding: 24 },
    title: { fontSize: 26, fontWeight: '800', marginBottom: 12 },
    subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 32 },
    faqContainer: { gap: 16 },
    faqCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    faqQuestion: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    faqAnswer: { fontSize: 15, lineHeight: 22 },
});
