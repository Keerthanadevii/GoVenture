import { ThemeColors, useTheme } from '@/src/context/ThemeContext';
import { useUser } from '@/src/context/UserContext';
import api from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function TripBlueprint() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { theme, isDarkMode } = useTheme();
    const { user } = useUser();
    const colors = ThemeColors[theme];
    const insets = useSafeAreaInsets();
    const [blueprint, setBlueprint] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tripCurrency, setTripCurrency] = useState<string | null>(null);

    const getSymbol = (code: string) => {
        const symbols: any = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'INR': '₹',
            'AUD': 'A$', 'CAD': 'C$', 'CHF': 'Fr', 'CNY': '¥', 'RUB': '₽',
            'KRW': '₩', 'BRL': 'R$', 'SGD': 'S$', 'AED': 'AED'
        };
        return symbols[code] || code;
    };

    const currencySymbol = tripCurrency ? getSymbol(tripCurrency) : (user?.currency_code === 'INR' ? '₹' : '$');

    const [isAllExpanded, setIsAllExpanded] = useState(false);
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const [isShareModalVisible, setIsShareModalVisible] = useState(false);

    // Settings state
    const [showTransit, setShowTransit] = useState(true);
    const [showBudget, setShowBudget] = useState(false);
    const [strictSchedule, setStrictSchedule] = useState(false);
    const [isCollaborative, setIsCollaborative] = useState(true);
    const [selectedTransportMode, setSelectedTransportMode] = useState<string | null>(null);

    useEffect(() => {
        const fetchBlueprint = async () => {
            try {
                // 1. Fetch trip details first to get the metadata
                const tripRes = await api.get(`/trips/${id}`);
                const trip = tripRes.data;

                if (!trip) throw new Error('Trip not found');

                if (trip.currency_code) setTripCurrency(trip.currency_code);

                // Set initial settings from trip
                if (trip.settings) {
                    setShowTransit(trip.settings.showTransit ?? true);
                    setShowBudget(trip.settings.showBudget ?? false);
                    setStrictSchedule(trip.settings.strictSchedule ?? false);
                    setIsCollaborative(trip.settings.isCollaborative ?? true);
                }

                // 2. Generate blueprint if not already in itinerary_data
                // Check if it has valid content (daily_breakdown), not just non-null
                const hasValidItinerary = trip.itinerary_data &&
                    (trip.itinerary_data.daily_breakdown || trip.itinerary_data.budgets);

                if (hasValidItinerary) {
                    console.log('Using existing itinerary data. Skipping generation.');
                    setBlueprint(trip.itinerary_data);
                } else {
                    console.log('Generating new itinerary data...');
                    const genRes = await api.post('/trip/generate', {
                        trip_id: id, // Pass ID for backend direct persistence
                        starting_point: trip.starting_point,
                        destination: trip.destination,
                        start_date: trip.start_date,
                        end_date: trip.end_date,
                        interests: trip.interests,
                        travelers: trip.parties,
                        budget_type: trip.budget_type,
                        lat: trip.lat,
                        lng: trip.lng,
                        currency_code: trip.currency_code || user?.currency_code || 'USD'
                    });
                    const generatedData = genRes.data;
                    setBlueprint(generatedData);

                    // 3. Save generated blueprint back to the trip
                    try {
                        await api.put(`/trips/${id}`, {
                            itinerary_data: generatedData
                        });
                    } catch (saveError) {
                        console.error('Failed to save itinerary:', saveError);
                        Alert.alert('Warning', 'Itinerary generated but failed to save. It may be lost on reload.');
                    }
                }
            } catch (err: any) {
                console.error('Fetch blueprint error:', err);
                setError(err.message || 'Failed to load blueprint');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchBlueprint();
    }, [id]);

    const handleApplyPreferences = async () => {
        setIsSettingsVisible(false);
        setIsLoading(true);
        try {
            const newSettings = { showTransit, showBudget, strictSchedule };
            await api.put(`/trips/${id}`, {
                settings: newSettings
            });

            if (newSettings.strictSchedule !== blueprint?.settings?.strictSchedule) {
                Alert.alert(
                    'Pace preference changed!',
                    'Would you like the AI to recalculate the daily plan to match this pace?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Recalculate',
                            onPress: async () => {
                                await handleRegenerate();
                            }
                        }
                    ]
                );
                return;
            }
            Alert.alert('Success', 'Preferences updated! ✨');
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerate = async () => {
        setIsLoading(true);
        try {
            const tripRes = await api.get(`/trips/${id}`);
            const trip = tripRes.data;

            const genRes = await api.post('/trip/generate', {
                starting_point: trip.starting_point,
                destination: trip.destination,
                start_date: trip.start_date,
                end_date: trip.end_date,
                interests: trip.interests,
                travelers: trip.parties,
                budget_type: trip.budget_type,
                pace: trip.settings?.strictSchedule ? 'Strict' : 'Balanced',
                lat: trip.lat,
                lng: trip.lng
            });

            await api.put(`/trips/${id}`, {
                itinerary_data: genRes.data
            });

            Alert.alert('Success', 'Great! AI has recalculated your plan with the new pace. ✨');
            // Refresh local state
            setBlueprint(genRes.data);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to regenerate blueprint.');
        } finally {
            setIsLoading(false);
        }
    };

    const activity_distribution = blueprint?.activity_distribution ?? [];
    const highlights = blueprint?.highlights ?? 'AI summary not available';
    const daily_breakdown = blueprint?.daily_breakdown ?? [];
    const suggested_stays = (blueprint?.suggested_stays ?? []).slice(0, 5);
    const top_rated_food = (blueprint?.top_rated_food ?? []).slice(0, 5);

    const formatCost = (cost: any) => {
        if (!cost || cost === 'Free' || cost === 'Local rates') return cost;
        if (typeof cost === 'string') {
            const num = cost.replace(/[^0-9.]/g, '');
            if (num && !isNaN(parseFloat(num))) {
                return `${currencySymbol}${num}`;
            }
        }
        if (typeof cost === 'number') return `${currencySymbol}${cost}`;
        return cost;
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 20, color: colors.textSecondary }}>Planning your adventure...</Text>
            </View>
        );
    }

    if (error || !blueprint) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text style={{ marginTop: 20, color: colors.text, fontSize: 18, fontWeight: 'bold' }}>Oops!</Text>
                <Text style={{ marginTop: 10, color: colors.textSecondary, textAlign: 'center' }}>{error || 'Something went wrong'}</Text>
                <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary, marginTop: 30, paddingHorizontal: 40 }]} onPress={() => router.back()}>
                    <Text style={styles.applyBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleSharePress = () => {
        setIsShareModalVisible(true);
    };

    const handleShareLink = async () => {
        setIsShareModalVisible(false);
        if (!blueprint) return;
        try {
            const tripLink = `https://goventure.app/trip/${id}`;
            await Share.share({
                message: `Check out my trip blueprint for ${blueprint.title || 'my adventure'}! 🗼\nView full itinerary here:\n${tripLink}`,
                url: tripLink,
            });
        } catch (error: any) {
            console.error(error.message);
        }
    };

    const handleSharePDF = async () => {
        setIsShareModalVisible(false);
        if (!blueprint) return;

        try {
            // Generate HTML for PDF
            const dailyBreakdownHtml = blueprint.daily_breakdown?.map((day: any) => `
                <div style="margin-bottom: 20px; page-break-inside: avoid;">
                    <h3 style="color: #3B82F6; margin-bottom: 8px;">Day ${day.day}: ${day.title || 'Activities'}</h3>
                    <p style="color: #6B7280; font-size: 14px; margin-bottom: 12px;">${day.desc || ''}</p>
                    ${day.activities?.map((act: any) => `
                        <div style="margin-left: 16px; margin-bottom: 8px; padding: 8px; background: #F9FAFB; border-radius: 8px;">
                            <strong>${act.time || ''}</strong> - ${act.title || 'Activity'}
                            <p style="color: #6B7280; font-size: 12px; margin: 4px 0 0 0;">${act.desc || ''}</p>
                            ${act.cost ? `<span style="color: #10B981; font-size: 12px;">Cost: ${act.cost}</span>` : ''}
                        </div>
                    `).join('') || ''}
                </div>
            `).join('') || '';

            const staysHtml = blueprint.suggested_stays?.slice(0, 3).map((stay: any) => `
                <div style="margin-bottom: 8px; padding: 8px; background: #F0F9FF; border-radius: 8px;">
                    <strong>${stay.name}</strong> - ${stay.area || 'Location'}
                    <span style="color: #3B82F6; margin-left: 8px;">★ ${stay.rating || 'N/A'}</span>
                </div>
            `).join('') || '';

            const foodHtml = blueprint.top_rated_food?.slice(0, 3).map((food: any) => `
                <div style="margin-bottom: 8px; padding: 8px; background: #FEF3C7; border-radius: 8px;">
                    <strong>${food.name}</strong> - ${food.type || 'Restaurant'}
                    <span style="color: #F59E0B; margin-left: 8px;">★ ${food.rating || 'N/A'}</span>
                </div>
            `).join('') || '';

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Trip Blueprint - ${blueprint.title || 'My Trip'}</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1F2937; }
                        h1 { color: #3B82F6; border-bottom: 2px solid #3B82F6; padding-bottom: 8px; }
                        h2 { color: #1F2937; margin-top: 24px; }
                        .highlight { background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); padding: 16px; border-radius: 12px; margin: 16px 0; }
                        .section { margin-bottom: 24px; }
                        .footer { margin-top: 32px; text-align: center; color: #9CA3AF; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <h1>🌍 ${blueprint.title || 'Trip Blueprint'}</h1>
                    
                    <div class="highlight">
                        <strong>Highlights:</strong> ${blueprint.highlights || 'An amazing trip awaits!'}
                    </div>

                    <div class="section">
                        <h2>📅 Daily Itinerary</h2>
                        ${dailyBreakdownHtml || '<p>No itinerary data available.</p>'}
                    </div>

                    ${staysHtml ? `
                    <div class="section">
                        <h2>🏨 Recommended Stays</h2>
                        ${staysHtml}
                    </div>` : ''}

                    ${foodHtml ? `
                    <div class="section">
                        <h2>🍽️ Food Recommendations</h2>
                        ${foodHtml}
                    </div>` : ''}

                    <div class="footer">
                        <p>Generated by GoVenture • Your AI Travel Companion</p>
                    </div>
                </body>
                </html>
            `;

            // Generate PDF
            const { uri } = await Print.printToFileAsync({ html });

            // Share PDF
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Share Trip Blueprint',
                    UTI: 'com.adobe.pdf'
                });
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error: any) {
            console.error('PDF Generation Error:', error.message);
            Alert.alert('Error', 'Failed to generate PDF. Please try again.');
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
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerActionBtn} onPress={handleSharePress} activeOpacity={0.7}>
                        <Ionicons name="share-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerActionBtn} onPress={() => setIsSettingsVisible(true)} activeOpacity={0.7}>
                        <Ionicons name="options-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.tagsRow}>
                    <View style={styles.tagBlue}>
                        <Text style={styles.tagBlueText}>TRIP BLUEPRINT</Text>
                    </View>
                    <View style={styles.tagGreen}>
                        <Ionicons name="checkmark-circle" size={12} color="#10B981" style={{ marginRight: 4 }} />
                        <Text style={styles.tagGreenText}>CONFIRMED</Text>
                    </View>
                </View>

                <Text style={[styles.title, { color: colors.text }]}>{blueprint.title || 'Your Adventure'}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{blueprint.dates || 'Plan details'}</Text>

                {/* Map Preview */}
                <TouchableOpacity
                    style={styles.mapContainer}
                    activeOpacity={0.9}
                    onPress={() => router.push(`/trip/${id}/map`)}
                >
                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={styles.mapImage}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        rotateEnabled={false}
                        pitchEnabled={false}
                        initialRegion={{
                            latitude: parseFloat(suggested_stays[0]?.latitude || daily_breakdown[0]?.latitude || blueprint?.lat || 0),
                            longitude: parseFloat(suggested_stays[0]?.longitude || daily_breakdown[0]?.longitude || blueprint?.lng || 0),
                            latitudeDelta: 0.2,
                            longitudeDelta: 0.2,
                        }}
                        customMapStyle={theme === 'dark' ? DARK_MAP_STYLE : []}
                    >
                        {suggested_stays.filter((s: any) => s.latitude && s.longitude).map((hotel: any, idx: number) => (
                            <Marker
                                key={`stay-${idx}`}
                                coordinate={{ latitude: parseFloat(hotel.latitude), longitude: parseFloat(hotel.longitude) }}
                                pinColor="blue"
                                title={hotel.name}
                            />
                        ))}
                        {top_rated_food.filter((f: any) => f.latitude && f.longitude).map((f: any, idx: number) => (
                            <Marker
                                key={`food-${idx}`}
                                coordinate={{ latitude: parseFloat(f.latitude), longitude: parseFloat(f.longitude) }}
                                pinColor="orange"
                                title={f.name}
                            />
                        ))}
                        {daily_breakdown.filter((d: any) => d.latitude && d.longitude).map((d: any, idx: number) => (
                            <Marker
                                key={`day-${idx}`}
                                coordinate={{ latitude: parseFloat(d.latitude), longitude: parseFloat(d.longitude) }}
                                pinColor="red"
                                title={d.title}
                            />
                        ))}
                    </MapView>
                    <View style={styles.mapOverlay}>
                        <View style={styles.mapIconBg}>
                            <Ionicons name="map" size={16} color="#FFF" />
                        </View>
                        <View>
                            <Text style={styles.mapTextBold}>Full Route View</Text>
                            <Text style={styles.mapTextSub}>View all locations</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Activity Distribution */}
                <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACTIVITY DISTRIBUTION</Text>
                        <TouchableOpacity>
                            <Text style={[styles.analysisLink, { color: colors.primary }]}>Analysis</Text>
                        </TouchableOpacity>
                    </View>
                    {activity_distribution.map((item: any, index: number) => (
                        <View key={index} style={styles.distItem}>
                            <View style={styles.distRow}>
                                <Ionicons name={item.label.toLowerCase().includes('food') ? 'restaurant' : item.label.toLowerCase().includes('culture') ? 'star' : 'bag'} size={14} color={item.color || colors.primary} />
                                <Text style={[styles.distLabel, { color: colors.text }]}>{item.label}</Text>
                                <Text style={[styles.distPercent, { color: colors.textSecondary }]}>{item.percentage}%</Text>
                            </View>
                            <View style={[styles.progressBarBg, { backgroundColor: colors.divider }]}>
                                <View style={[styles.progressBar, { width: `${item.percentage}%`, backgroundColor: item.color || colors.primary }]} />
                            </View>
                        </View>
                    ))}
                </View>

                {/* Blueprint Highlights */}
                <View style={[styles.highlightCard, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF', borderColor: colors.aiBannerBorder }]}>
                    <View style={[styles.highlightIconBg, { backgroundColor: colors.card }]}>
                        <Ionicons name="sparkles" size={18} color={colors.primary} />
                    </View>
                    <Text style={[styles.highlightTitle, { color: colors.text }]}>Blueprint Highlights</Text>
                    <Text style={[styles.highlightDesc, { color: colors.textSecondary }]}>
                        {highlights}
                    </Text>
                </View>


                {/* Daily Breakdown */}
                <View style={styles.breakdownHeader}>
                    <Text style={[styles.breakdownTitle, { color: colors.text }]}>Daily Breakdown</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                            onPress={() => router.push({ pathname: `/trip/[id]/itinerary`, params: { id: id as string } })}
                        >
                            <Ionicons name="create-outline" size={16} color={colors.primary} />
                            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Edit Plan</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            onPress={() => setIsAllExpanded(!isAllExpanded)}
                        >
                            <Text style={[styles.actionTextBlue, { color: colors.primary }]}>{isAllExpanded ? 'Collapse All' : 'Expand All'}</Text>
                            <Ionicons name={isAllExpanded ? "chevron-up" : "swap-vertical"} size={14} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {daily_breakdown.map((day: any, index: number) => (
                    <View key={index} style={styles.dayRow}>
                        <View style={styles.timelineContainer}>
                            <View style={[styles.timelineDot, index === 0 && styles.timelineDotActive]} />
                            {index !== daily_breakdown.length - 1 && <View style={styles.timelineLine} />}
                        </View>
                        <TouchableOpacity
                            style={[styles.dayCard, { backgroundColor: colors.card }]}
                            onPress={() => router.push({ pathname: `/trip/[id]/itinerary`, params: { id: id as string, initialDay: index.toString() } })}
                        >
                            <View style={styles.dayHeader}>
                                <View>
                                    <Text style={[styles.dayNum, { color: colors.primary }]}>DAY {day.day} • {day.date}</Text>
                                    <Text style={[styles.dayTitle, { color: colors.text }]}>{day.title}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                            </View>
                            {day.tag && (
                                <View style={[styles.dayTag, { backgroundColor: '#A855F7' }]}>
                                    <Ionicons name="sparkles" size={10} color="#FFF" />
                                    <Text style={styles.dayTagText}>{day.tag}</Text>
                                </View>
                            )}
                            {day.desc && <Text style={[styles.dayDesc, { color: colors.textSecondary }]} numberOfLines={isAllExpanded ? undefined : 2}>{day.desc}</Text>}

                            {isAllExpanded && day.activities && (
                                <View style={{ marginTop: 12, gap: 8 }}>
                                    {day.activities.map((act: any, aIdx: number) => (
                                        <View key={aIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                                            <View style={{ width: 40 }}>
                                                <Text style={{ fontSize: 10, color: colors.textSecondary }}>{act.time}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{act.title}</Text>
                                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                                                    {showTransit && act.transport && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                                            <Ionicons name="walk-outline" size={10} color={colors.textSecondary} />
                                                            <Text style={{ fontSize: 10, color: colors.textSecondary }}>{act.transport.duration}</Text>
                                                        </View>
                                                    )}
                                                    {showBudget && act.cost && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                                            <Ionicons name="cash-outline" size={10} color="#10B981" />
                                                            <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '600' }}>{formatCost(act.cost)}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {day.images && (
                                <View style={styles.dayImages}>
                                    {day.images.map((img: any, i: number) => (
                                        <Image key={i} source={{ uri: img }} style={styles.dayImage} />
                                    ))}
                                    {day.extra && (
                                        <View style={styles.extraImages}>
                                            <Text style={styles.extraText}>+{day.extra}</Text>
                                        </View>
                                    )}
                                    <View style={[styles.dayType, { backgroundColor: colors.background, borderColor: colors.divider }]}>
                                        <Ionicons name={day.type === 'Sun' ? 'sunny' : 'airplane'} size={12} color={colors.textSecondary} />
                                        <Text style={[styles.dayTypeText, { color: colors.textSecondary }]}>{day.type}</Text>
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                ))}

                {/* Edit Blueprint Card */}
                {isCollaborative && (
                    <TouchableOpacity
                        style={[styles.editBlueprintBtn, { backgroundColor: colors.card }]}
                        onPress={() => router.push(`/trip/${id}/edit-blueprint`)}
                    >
                        <View style={[styles.editIconBg, { backgroundColor: colors.background }]}>
                            <Ionicons name="options-outline" size={20} color={colors.textSecondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.editBtnTitle, { color: colors.text }]}>Edit Blueprint & Swap Spots</Text>
                            <Text style={[styles.editBtnSub, { color: colors.textSecondary }]}>Reorder activities or change locations</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}

                {/* Suggested Stays */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitleBold, { color: colors.textSecondary }]}>SUGGESTED STAYS</Text>
                    <TouchableOpacity onPress={() => router.push(`/trip/${id}/map`)}>
                        <Text style={[styles.actionTextBlue, { color: colors.primary }]}>View Map</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingRight: 20, paddingBottom: 10 }}>
                    {suggested_stays.map((hotel: any, idx: number) => (
                        <TouchableOpacity key={idx} style={[styles.hotelCard, { backgroundColor: colors.card, borderColor: hotel.selected ? colors.primary : colors.divider }]}>
                            <Image
                                source={{ uri: hotel.image }}
                                style={styles.hotelImage}
                                defaultSource={{ uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945' }}
                            />
                            <View style={styles.hotelContent}>
                                <Text style={[styles.hotelName, { color: colors.text }]} numberOfLines={1}>{hotel.name}</Text>
                                <Text style={[styles.hotelArea, { color: colors.textSecondary }]} numberOfLines={1}>{hotel.area}</Text>
                                <View style={styles.ratingRow}>
                                    <View style={styles.ratingBadge}>
                                        <Text style={styles.ratingText}>{hotel.rating} ★</Text>
                                    </View>
                                    {hotel.ratingLabel && <Text style={styles.ratingLabel}>{hotel.ratingLabel}</Text>}
                                </View>
                                <View style={styles.hotelDistRow}>
                                    <Ionicons name="navigate-outline" size={12} color={colors.textSecondary} />
                                    <Text style={[styles.distText, { color: colors.textSecondary }]}>{hotel.distance}</Text>
                                </View>
                                {hotel.price && <Text style={[styles.priceText, { color: colors.text }]}>{formatCost(hotel.price)}<Text style={[styles.priceSub, { color: colors.textSecondary }]}>/night</Text></Text>}
                            </View>
                            {hotel.selected && (
                                <View style={styles.checkInside}>
                                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Top Rated Food */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitleBold, { color: colors.textSecondary }]}>TOP RATED FOOD</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingRight: 20, paddingBottom: 10 }}>
                    {top_rated_food.map((f: any, idx: number) => (
                        <TouchableOpacity key={idx} style={[styles.hotelCard, { backgroundColor: colors.card, borderColor: f.selected ? '#F97316' : colors.divider }]}>
                            <Image
                                source={{ uri: f.image }}
                                style={styles.hotelImage}
                                defaultSource={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }}
                            />
                            <View style={styles.hotelContent}>
                                <Text style={[styles.hotelName, { color: colors.text }]} numberOfLines={1}>{f.name}</Text>
                                <Text style={[styles.hotelArea, { color: colors.textSecondary }]} numberOfLines={1}>{f.type}</Text>
                                <View style={styles.ratingRow}>
                                    <View style={styles.ratingBadge}>
                                        <Text style={styles.ratingText}>{f.rating} ★</Text>
                                    </View>
                                </View>
                                <View style={styles.hotelDistRow}>
                                    <Ionicons name="navigate-outline" size={12} color={colors.textSecondary} />
                                    <Text style={[styles.distText, { color: colors.textSecondary }]}>{f.distance}</Text>
                                </View>
                            </View>
                            {f.selected && (
                                <View style={styles.checkInside}>
                                    <Ionicons name="checkbox" size={20} color="#F97316" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={{ height: 180 + insets.bottom }} />
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, {
                backgroundColor: colors.card,
                borderTopColor: colors.divider,
                paddingBottom: Math.max(insets.bottom, 24) + 16
            }]}>
                {/* Increased paddingBottom to 40 to avoid overlap with system nav */}
                <TouchableOpacity
                    style={styles.startBtn}
                    onPress={() => router.push(`/trip/${id}/itinerary`)}
                >
                    <Text style={styles.startBtnText}>Next</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
                <View style={styles.footerRow}>
                    <TouchableOpacity
                        style={[styles.shareBtn, { borderColor: colors.border }]}
                        onPress={handleSharePress}
                    >
                        <Ionicons name="share-outline" size={20} color={colors.text} />
                        <Text style={[styles.shareBtnText, { color: colors.text }]}>Share Blueprint</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.optionsBtn, { borderColor: colors.border }]}
                        onPress={() => setIsSettingsVisible(true)}
                    >
                        <Ionicons name="options-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Share Options Modal */}
            <Modal
                visible={isShareModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsShareModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setIsShareModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: 50 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Share Trip</Text>
                            <TouchableOpacity onPress={() => setIsShareModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.shareOption} onPress={handleSharePDF}>
                            <View style={[styles.shareIconBg, { backgroundColor: '#FFE4E6' }]}>
                                <Ionicons name="document-text" size={24} color="#F43F5E" />
                            </View>
                            <View>
                                <Text style={[styles.shareOptionTitle, { color: colors.text }]}>Share as PDF</Text>
                                <Text style={styles.shareOptionSub}>Best for printing</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shareOption} onPress={handleShareLink}>
                            <View style={[styles.shareIconBg, { backgroundColor: '#DBEAFE' }]}>
                                <Ionicons name="link" size={24} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={[styles.shareOptionTitle, { color: colors.text }]}>Share Web Link</Text>
                                <Text style={styles.shareOptionSub}>Best for social media</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* Advanced Settings Modal */}
            <Modal
                visible={isSettingsVisible}
                // ... existing settings modal ...
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsSettingsVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setIsSettingsVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Advanced Settings</Text>
                            <TouchableOpacity onPress={() => setIsSettingsVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.settingsGroup}>
                            <View style={styles.settingRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.settingLabel, { color: colors.text }]}>Show Transit Times</Text>
                                    <Text style={styles.settingSub}>Display travel time between stops</Text>
                                </View>
                                <Switch
                                    value={showTransit}
                                    onValueChange={setShowTransit}
                                    trackColor={{ false: '#D1D5DB', true: colors.primary }}
                                    thumbColor="#FFF"
                                />
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                            <View style={styles.settingRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.settingLabel, { color: colors.text }]}>Budget Transparency</Text>
                                    <Text style={styles.settingSub}>Show estimated costs for all activities</Text>
                                </View>
                                <Switch
                                    value={showBudget}
                                    onValueChange={setShowBudget}
                                    trackColor={{ false: '#D1D5DB', true: colors.primary }}
                                    thumbColor="#FFF"
                                />
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                            <View style={styles.settingRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.settingLabel, { color: colors.text }]}>Strict Schedule</Text>
                                    <Text style={styles.settingSub}>Prioritize efficiency over relaxation</Text>
                                </View>
                                <Switch
                                    value={strictSchedule}
                                    onValueChange={setStrictSchedule}
                                    trackColor={{ false: '#D1D5DB', true: colors.primary }}
                                    thumbColor="#FFF"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                            onPress={handleApplyPreferences}
                        >
                            <Text style={styles.applyBtnText}>Apply Preferences</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 10,
    },
    iconBtn: { padding: 4 },
    content: { padding: 20 },
    tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    tagBlue: { backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    tagBlueText: { color: '#3B82F6', fontSize: 10, fontWeight: '700' },
    tagGreen: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
    tagGreenText: { color: '#10B981', fontSize: 10, fontWeight: '700' },
    title: { fontSize: 28, fontWeight: '700' },
    subtitle: { fontSize: 14, marginTop: 4, marginBottom: 20 },
    mapContainer: {
        height: 120,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    mapImage: { width: '100%', height: '100%' },
    mapOverlay: {
        position: 'absolute',
        top: 20,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    mapIconBg: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    mapTextBold: { color: '#FFF', fontWeight: '700', fontSize: 13 },
    mapTextSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
    costBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    costBadgeText: { fontSize: 13, fontWeight: '700' },
    modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, minWidth: 100 },
    modeBtnText: { fontSize: 13, fontWeight: '600' },
    modeCostText: { fontSize: 11 },
    modeInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 4 },
    modeInfoText: { fontSize: 12 },
    sectionCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 1 },
    analysisLink: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },
    distItem: { marginBottom: 14 },
    distRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    distLabel: { flex: 1, fontSize: 14, color: '#374151', marginLeft: 8 },
    distPercent: { fontSize: 14, color: '#9CA3AF' },
    progressBarBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3 },
    progressBar: { height: '100%', borderRadius: 3 },
    highlightCard: {
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    highlightIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    highlightTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
    highlightDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
    bold: { fontWeight: '700', color: '#111827' },
    breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    breakdownTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    actionTextBlue: { fontSize: 11, color: '#3B82F6', fontWeight: '700' },
    actionTextGray: { fontSize: 11, color: '#6B7280', fontWeight: '700' },
    dayRow: { flexDirection: 'row' },
    timelineContainer: { width: 30, alignItems: 'center' },
    timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E5E7EB', zIndex: 1, marginTop: 4 },
    timelineDotActive: { backgroundColor: '#3B82F6' },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },
    dayCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    dayNum: { fontSize: 10, color: '#3B82F6', fontWeight: '700', marginBottom: 2 },
    dayTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
    dayTag: { position: 'absolute', top: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#A855F7', borderBottomLeftRadius: 12 },
    dayTagText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    dayDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 12 },
    dayImages: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    dayImage: { width: 44, height: 44, borderRadius: 8 },
    extraImages: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
    extraText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
    dayType: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6' },
    dayTypeText: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
    editBlueprintBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 32,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    editIconBg: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
    editBtnTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
    editBtnSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 16 },
    sectionTitleBold: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5 },
    horizontalGrid: { gap: 16, paddingRight: 20 },
    hotelCard: { width: width * 0.6, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', flexDirection: 'column' },
    hotelCardSelected: { borderColor: '#3B82F6' },
    hotelImage: { width: '100%', height: 100 },
    hotelContent: { padding: 12 },
    hotelName: { fontSize: 13, fontWeight: '700', color: '#111827' },
    hotelArea: { fontSize: 11, color: '#6B7280' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    ratingBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    ratingText: { fontSize: 10, color: '#10B981', fontWeight: '700' },
    ratingLabel: { fontSize: 10, color: '#9CA3AF' },
    hotelDistRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    distText: { fontSize: 10, color: '#6B7280' },
    priceText: { marginTop: 4, fontSize: 14, fontWeight: '700', color: '#111827' },
    priceSub: { fontSize: 10, color: '#9CA3AF', fontWeight: '400' },
    checkInside: { position: 'absolute', top: 8, right: 8, backgroundColor: '#FFF', borderRadius: 10 },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 30, // Safe area
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
        gap: 16,
    },
    startBtn: {
        backgroundColor: '#3B82F6',
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    startBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    footerRow: {
        flexDirection: 'row',
        gap: 12,
    },
    shareBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFF',
        gap: 8,
    },
    shareBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    optionsBtn: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFF',
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    settingsGroup: { marginBottom: 24 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    settingLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
    settingSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
    applyBtn: { backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    applyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    headerRight: { flexDirection: 'row', gap: 12 },
    headerActionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    shareOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        marginBottom: 12,
        gap: 16,
    },
    shareIconBg: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareOptionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    shareOptionSub: {
        fontSize: 13,
        color: '#6B7280',
    },
});

const DARK_MAP_STYLE = [
    { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
    { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
    { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
    { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
    { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
    { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#2f3948" }] },
    { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
    { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];
