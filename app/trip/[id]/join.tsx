import { ThemeColors, useTheme } from '@/src/context/ThemeContext';
import api from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function JoinTrip() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { theme, isDarkMode } = useTheme();
    const colors = ThemeColors[theme];
    const insets = useSafeAreaInsets();

    const [trip, setTrip] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        const fetchTripDetails = async () => {
            try {
                // Fetch basic trip info (unguarded if possible or we use a public preview endpoint)
                // For now, testing with standard get (might fail if not joined yet, 
                // but we can adjust backend later if needed for 'preview')
                const res = await api.get(`/trips/${id}`);
                setTrip(res.data);
            } catch (err: any) {
                console.error('Fetch trip error:', err);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    Alert.alert(
                        'Login Required',
                        'You need to be logged in to view and join this squad.',
                        [{ text: 'Login', onPress: () => router.push('/login') }]
                    );
                } else {
                    Alert.alert('Error', 'This invitation link is invalid or expired.');
                    router.replace('/(tabs)');
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchTripDetails();
    }, [id]);

    const handleJoinSquad = async () => {
        setIsJoining(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            await api.post(`/trips/${id}/join`);
            Alert.alert(
                'Welcome to the Squad!',
                `You are now part of the trip to ${trip?.destination}.`,
                [{ text: 'Let\'s Go', onPress: () => router.replace(`/trip/${id}/dashboard`) }]
            );
        } catch (err: any) {
            console.error('Join squad error:', err);
            Alert.alert('Error', err.response?.data?.message || 'Failed to join squad. Please try again.');
        } finally {
            setIsJoining(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                {/* Hero Header */}
                <View style={styles.hero}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1506012733851-bb0755ee3850' }}
                        style={styles.heroImage}
                    />
                    <View style={styles.heroOverlay} />

                    <View style={[styles.heroContent, { paddingTop: insets.top + 20 }]}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.replace('/(tabs)')}
                        >
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>

                        <View style={styles.badge}>
                            <Ionicons name="sparkles" size={14} color="#FFF" />
                            <Text style={styles.badgeText}>SQUAD INVITE</Text>
                        </View>

                        <Text style={styles.heroTitle}>{trip?.destination}</Text>
                        <Text style={styles.heroSubtitle}>{trip?.start_date} - {trip?.end_date}</Text>
                    </View>
                </View>

                {/* Main Content */}
                <View style={[styles.main, { backgroundColor: colors.background }]}>
                    <View style={styles.hostSection}>
                        <View style={styles.hostInfo}>
                            <View style={styles.avatarLarge}>
                                <Ionicons name="person" size={30} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.hostLabel, { color: colors.textSecondary }]}>Invited by</Text>
                                <Text style={[styles.hostName, { color: colors.text }]}>{trip?.user?.name || 'Your Friend'}</Text>
                            </View>
                        </View>
                        <View style={styles.membersCount}>
                            <View style={styles.avatarsRow}>
                                {[1, 2].map(i => (
                                    <View key={i} style={[styles.avatarSmall, { marginLeft: i > 1 ? -12 : 0, borderColor: colors.background }]}>
                                        <Ionicons name="person" size={12} color={colors.textSecondary} />
                                    </View>
                                ))}
                            </View>
                            <Text style={[styles.membersText, { color: colors.textSecondary }]}>+{trip?.members?.length || 0} active members</Text>
                        </View>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Trip Highlights</Text>
                        {trip?.itinerary_data?.highlights ? (
                            <Text style={[styles.cardText, { color: colors.textSecondary }]}>{trip.itinerary_data.highlights}</Text>
                        ) : (
                            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                                Join the squad to see the full AI-generated blueprint for this adventure to {trip?.destination}!
                            </Text>
                        )}

                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Ionicons name="walk-outline" size={20} color={colors.primary} />
                                <Text style={[styles.statValue, { color: colors.text }]}>{trip?.pace || 'Balanced'}</Text>
                                <Text style={styles.statLabel}>Pace</Text>
                            </View>
                            <View style={styles.stat}>
                                <Ionicons name="wallet-outline" size={20} color={colors.primary} />
                                <Text style={[styles.statValue, { color: colors.text }]}>{trip?.budget_type || 'Moderate'}</Text>
                                <Text style={styles.statLabel}>Budget</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Planning together is better. Collaborative mode is enabled for this trip, allowing you to contribute to the itinerary and memory vault.
                    </Text>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Sticky Join Button */}
            <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 20) + 10 }]}>
                <TouchableOpacity
                    style={[styles.joinBtn, { backgroundColor: colors.primary }]}
                    onPress={handleJoinSquad}
                    disabled={isJoining}
                >
                    {isJoining ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="people" size={20} color="#FFF" />
                            <Text style={styles.joinBtnText}>Join the Squad</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    hero: { height: height * 0.45, position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    heroContent: {
        ...StyleSheet.absoluteFillObject,
        padding: 24,
        justifyContent: 'flex-end'
    },
    backBtn: {
        position: 'absolute',
        top: 60,
        right: 24,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12
    },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', marginLeft: 4 },
    heroTitle: { color: '#FFF', fontSize: 40, fontWeight: '900' },
    heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600' },
    main: {
        padding: 24,
        marginTop: -30,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        minHeight: 400
    },
    hostSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
    },
    hostInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarLarge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center'
    },
    hostLabel: { fontSize: 12 },
    hostName: { fontSize: 18, fontWeight: '700' },
    membersCount: { alignItems: 'flex-end', gap: 4 },
    avatarsRow: { flexDirection: 'row' },
    avatarSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center'
    },
    membersText: { fontSize: 11 },
    card: { padding: 20, borderRadius: 20, marginBottom: 20 },
    cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
    cardText: { fontSize: 15, lineHeight: 22 },
    statsRow: { flexDirection: 'row', gap: 24, marginTop: 20 },
    stat: { flex: 1, gap: 4 },
    statValue: { fontSize: 16, fontWeight: '700' },
    statLabel: { fontSize: 12, color: '#9CA3AF' },
    infoText: { textAlign: 'center', fontSize: 14, lineHeight: 20, paddingHorizontal: 20 },
    footer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)'
    },
    joinBtn: {
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8
    },
    joinBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' }
});
