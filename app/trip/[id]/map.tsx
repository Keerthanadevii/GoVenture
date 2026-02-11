import { ThemeColors, useTheme } from '@/src/context/ThemeContext';
import api from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function TripMap() {
    const router = useRouter();
    const { id, day } = useLocalSearchParams();
    const activeDay = day !== undefined ? parseInt(Array.isArray(day) ? day[0] : day) : null;
    const { theme } = useTheme();
    const colors = ThemeColors[theme];
    const [blueprint, setBlueprint] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        const fetchBlueprint = async () => {
            try {
                const tripRes = await api.get(`/trips/${id}`);
                const trip = tripRes.data;
                if (trip && trip.itinerary_data) {
                    setBlueprint(trip.itinerary_data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBlueprint();
    }, [id]);

    const stays = blueprint?.suggested_stays?.filter((s: any) => s.latitude && s.longitude) || [];
    const food = blueprint?.top_rated_food?.filter((f: any) => f.latitude && f.longitude) || [];

    // Filter activities if a specific day is requested
    const activities = (activeDay !== null && blueprint?.daily_breakdown?.[activeDay])
        ? (blueprint.daily_breakdown[activeDay].activities || []).filter((a: any) => a.latitude && a.longitude)
        : (blueprint?.daily_breakdown?.flatMap((d: any) => d.activities || [])?.filter((a: any) => a.latitude && a.longitude) || []);

    const dayCentroids = (activeDay !== null && blueprint?.daily_breakdown?.[activeDay])
        ? [blueprint.daily_breakdown[activeDay]].filter((d: any) => d.latitude && d.longitude)
        : (blueprint?.daily_breakdown?.filter((d: any) => d.latitude && d.longitude) || []);

    const allMarkers = [...stays, ...food, ...activities, ...dayCentroids];

    useEffect(() => {
        if (!isLoading && mapRef.current && allMarkers.length > 0) {
            mapRef.current.fitToCoordinates(
                allMarkers.map((m: any) => ({
                    latitude: parseFloat(m.latitude),
                    longitude: parseFloat(m.longitude)
                })),
                {
                    edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
                    animated: true,
                }
            );
        }
    }, [isLoading, blueprint]);

    if (isLoading || !blueprint) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: parseFloat(stays[0]?.latitude || activities[0]?.latitude || blueprint?.lat || 0),
                    longitude: parseFloat(stays[0]?.longitude || activities[0]?.longitude || blueprint?.lng || 0),
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                }}
                customMapStyle={theme === 'dark' ? DARK_MAP_STYLE : []}
            >
                {stays.map((hotel: any, index: number) => (
                    <Marker
                        key={`stay-${index}`}
                        coordinate={{ latitude: parseFloat(hotel.latitude), longitude: parseFloat(hotel.longitude) }}
                        title={hotel.name}
                        description={hotel.price ? `${hotel.price}/night` : 'Hotel'}
                        pinColor="blue"
                    />
                ))}
                {food.map((rest: any, index: number) => (
                    <Marker
                        key={`food-${index}`}
                        coordinate={{ latitude: parseFloat(rest.latitude), longitude: parseFloat(rest.longitude) }}
                        title={rest.name}
                        description={rest.type}
                        pinColor="orange"
                    />
                ))}
                {activities.map((act: any, index: number) => (
                    <Marker
                        key={`act-${index}`}
                        coordinate={{ latitude: parseFloat(act.latitude), longitude: parseFloat(act.longitude) }}
                        title={act.title}
                        description={act.time}
                        pinColor="red"
                    />
                ))}
            </MapView>

            <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card }]} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.title, { color: colors.text }]}>Trip Map {activeDay !== null ? `- Day ${activeDay + 1}` : ''}</Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>
                    Showing {stays.length} stays, {food.length} food spots & {activities.length} activities
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
    backBtn: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    infoCard: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    title: { fontSize: 18, fontWeight: '700' },
    sub: { fontSize: 12 }
});

const DARK_MAP_STYLE = [
    {
        "elementType": "geometry",
        "stylers": [{ "color": "#242f3e" }]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#746855" }]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#242f3e" }]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#263c3f" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#6b9a76" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#38414e" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#212a37" }]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9ca5b3" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{ "color": "#746855" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#1f2835" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#f3d19c" }]
    },
    {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [{ "color": "#2f3948" }]
    },
    {
        "featureType": "transit.station",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#17263c" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#515c6d" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#17263c" }]
    }
];
