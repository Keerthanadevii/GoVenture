import { ThemeColors, useTheme } from '@/src/context/ThemeContext';
import api from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface Trip {
    id: string;
    destination: string;
    dates: string;
    image: any;
}


export default function TripsScreen() {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();
    const colors = ThemeColors[theme];

    const [trips, setTrips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const fetchTrips = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/trips');
            setTrips(response.data);
        } catch (error) {
            console.error('Failed to fetch trips:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchTrips();
        }, [])
    );

    const handleDeleteTrip = (id: string, destination: string) => {
        Alert.alert(
            "Delete Trip",
            `Are you sure you want to delete your trip to ${destination}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(`/trips/${id}`);
                            setTrips(prev => prev.filter(t => t.id !== id));
                        } catch (error) {
                            console.error('Failed to delete trip:', error);
                            Alert.alert("Error", "Could not delete trip. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    const toggleSort = () => {
        const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        setSortOrder(newOrder);
        const sorted = [...trips].sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return newOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        setTrips(sorted);
    };

    const renderTrip = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.tripCard, { backgroundColor: colors.card }]}
            onPress={() => router.push(`/trip/${item.id}`)}
        >
            <Image
                source={item.image_url ? { uri: item.image_url } : { uri: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=400&auto=format&fit=crop' }}
                style={styles.tripImage}
            />
            <View style={styles.tripInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.tripDestination, { color: colors.text }]}>{item.destination}</Text>
                        <Text style={[styles.tripDates, { color: colors.textSecondary }]}>{item.start_date} - {item.end_date}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteTrip(item.id, item.destination)}
                    >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Adventures</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity style={styles.profileButton} onPress={toggleSort}>
                        <Ionicons name={sortOrder === 'desc' ? "arrow-down-outline" : "arrow-up-outline"} size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/profile')}>
                        <Ionicons name="person-circle" size={36} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {trips.length > 0 ? (
                <FlatList
                    data={trips}
                    renderItem={renderTrip}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onRefresh={fetchTrips}
                    refreshing={isLoading}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="map-outline" size={80} color={isDarkMode ? '#374151' : '#E5E7EB'} />
                    <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No upcoming trips</Text>
                    <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                        Your next adventure awaits! Start planning your dream vacation now.
                    </Text>
                </View>
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/create-trip')}
                activeOpacity={0.9}
            >
                <Ionicons name="add" size={30} color="#FFF" />
                <Text style={styles.fabText}>Plan a Trip</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 28, fontWeight: '700' },
    profileButton: { padding: 4 },
    listContent: { padding: 24 },
    tripCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    tripImage: { width: '100%', height: 180 },
    tripInfo: { padding: 16 },
    tripDestination: { fontSize: 18, fontWeight: '600' },
    tripDates: { fontSize: 14, marginTop: 4 },
    deleteBtn: {
        padding: 8,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
    },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyStateTitle: { fontSize: 20, fontWeight: '600', marginTop: 20 },
    emptyStateSubtitle: { fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 22 },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 24,
        backgroundColor: '#3B82F6',
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#3B82F6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    fabText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
