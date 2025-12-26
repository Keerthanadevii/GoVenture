import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
} from 'react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function TripMap() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { theme } = useTheme();
    const colors = ThemeColors[theme];
    const insets = useSafeAreaInsets();

    const markers = [
        { id: 1, name: 'Asakusa', type: 'History', lat: 35.7147, lng: 139.7967, x: '70%', y: '30%' },
        { id: 2, name: 'Shibuya', type: 'Modern', lat: 35.6580, lng: 139.7016, x: '40%', y: '65%' },
        { id: 3, name: 'Omotesando', type: 'Cafe', lat: 35.6652, lng: 139.7125, x: '50%', y: '55%' },
        { id: 4, name: 'Hotel Gracery', type: 'Stay', lat: 35.6943, lng: 139.7028, x: '45%', y: '40%' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" />

            {/* Map Background (Mockup Image) */}
            <Image
                source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200&auto=format&fit=crop' }}
                style={styles.mapBase}
            />

            {/* Back Button */}
            <TouchableOpacity
                style={[styles.backBtn, { top: insets.top + 10 }]}
                onPress={() => router.back()}
                activeOpacity={0.8}
            >
                <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            {/* Markers */}
            {markers.map((marker) => (
                <View key={marker.id} style={[styles.markerContainer, { left: marker.x as any, top: marker.y as any }]}>
                    <View style={styles.markerPoint}>
                        <Ionicons
                            name={marker.type === 'Stay' ? 'bed' : marker.type === 'History' ? 'star' : 'location'}
                            size={12}
                            color="#FFF"
                        />
                    </View>
                    <View style={styles.markerLabel}>
                        <Text style={styles.markerText}>{marker.name}</Text>
                    </View>
                </View>
            ))}

            {/* Bottom Card */}
            <View style={[styles.bottomCard, { bottom: insets.bottom + 20, backgroundColor: colors.card }]}>
                <View style={styles.handle} />
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Tokyo Overview</Text>
                        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>4 Days • 12 Locations</Text>
                    </View>
                    <TouchableOpacity style={[styles.directionsBtn, { backgroundColor: colors.primary }]}>
                        <Ionicons name="navigate" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View style={[styles.statsRow, { borderTopColor: colors.divider }]}>
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.text }]}>8.4km</Text>
                        <Text style={styles.statLabel}>Total Range</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.text }]}>45min</Text>
                        <Text style={styles.statLabel}>Avg Transit</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.text }]}>3 Zones</Text>
                        <Text style={styles.statLabel}>Districts</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    mapBase: { width: width, height: height, resizeMode: 'cover' },
    backBtn: {
        position: 'absolute',
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    markerContainer: { position: 'absolute', alignItems: 'center' },
    markerPoint: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        borderWidth: 2,
        borderColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    markerLabel: {
        marginTop: 4,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    markerText: { fontSize: 10, fontWeight: '700', color: '#111827' },
    bottomCard: {
        position: 'absolute',
        left: 20,
        right: 20,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        alignSelf: 'center',
        marginBottom: 16,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    cardTitle: { fontSize: 18, fontWeight: '700' },
    cardSub: { fontSize: 12, marginTop: 2 },
    directionsBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    statsRow: { flexDirection: 'row', paddingTop: 16, borderTopWidth: 1 },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 16, fontWeight: '700' },
    statLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
    statDivider: { width: 1, height: 24 },
});
