import PagerView, { PagerViewType } from '@/components/common/PagerView';
import { ThemeColors, useTheme } from '@/src/context/ThemeContext';
import { useUser } from '@/src/context/UserContext';
import api from '@/src/services/api';
import { getIconName } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');


export default function DayItinerary() {
    const router = useRouter();
    const { id, initialDay } = useLocalSearchParams();
    const pagerRef = useRef<PagerViewType>(null);
    const { theme, isDarkMode } = useTheme();
    const { user } = useUser();
    const colors = ThemeColors[theme];
    const currencySymbol = user?.currency_code === 'INR' ? '₹' : (user?.currency_code === 'EUR' ? '€' : '$');
    const insets = useSafeAreaInsets();

    const [blueprint, setBlueprint] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [allActivities, setAllActivities] = useState<any[][]>([]);
    const [days, setDays] = useState<any[]>([]);
    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const [isAllExpanded, setIsAllExpanded] = useState(false);
    const [editingNote, setEditingNote] = useState<{ dayIdx: number, activityIdx: number } | null>(null);
    const [editingActivity, setEditingActivity] = useState<{ dayIdx: number, activityIdx: number, data: any } | null>(null);
    const [isPromoteModalVisible, setIsPromoteModalVisible] = useState(false);
    const [isRatesLoading, setIsRatesLoading] = useState(false);

    // Memory Category Sync


    useEffect(() => {
        const fetchItinerary = async () => {
            try {
                const res = await api.get(`/trips/${id}`);
                const trip = res.data;

                if (trip && trip.itinerary_data) {
                    const data = trip.itinerary_data;
                    setBlueprint({
                        ...data,
                        title: trip.title || data.title,
                        lat: trip.lat,
                        lng: trip.lng,
                        settings: trip.settings // Add settings here
                    });

                    const breakdown = data.daily_breakdown || [];

                    // Map breakdown to activities
                    const activities = breakdown.map((day: any) => {
                        if (day.activities && day.activities.length > 0) {
                            return day.activities;
                        }
                        // Fallback: use day title/desc as a single activity
                        return [{
                            title: day.title || 'Sightseeing',
                            time: '09:00 AM',
                            desc: day.desc || 'Explore the area',
                            icon: 'walk',
                            type: 'sightseeing',
                            latitude: day.latitude,
                            longitude: day.longitude
                        }];
                    });
                    setAllActivities(activities);

                    // Map breakdown to days tabs
                    const daysData = breakdown.map((day: any) => ({
                        label: `Day ${day.day}`,
                        date: day.date ? day.date.split(' ')[0] : '', // e.g., "OCT" from "OCT 14"
                        fullDate: day.date || `Day ${day.day}`
                    }));
                    setDays(daysData);
                }
            } catch (err) {
                console.error('Fetch itinerary error:', err);
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchItinerary();
    }, [id]);

    const CURRENCY_SYMBOLS: any = {
        '$': 'USD',
        '₹': 'INR',
        '€': 'EUR',
        '£': 'GBP',
        '¥': 'JPY',
        'AED': 'AED'
    };

    const formatCost = (cost: any) => {
        if (!cost || cost === 'Free' || cost === 'Local rates') return cost;
        if (typeof cost === 'string') {
            const knownSymbols = Object.keys(CURRENCY_SYMBOLS);
            for (const sym of knownSymbols) {
                if (cost.startsWith(sym)) return cost;
            }
            const num = cost.replace(/[^0-9.]/g, '');
            if (num && !isNaN(parseFloat(num))) {
                return `${currencySymbol}${num}`;
            }
        }
        if (typeof cost === 'number') return `${currencySymbol}${cost}`;
        return cost;
    };

    const handleOptimizeSchedule = async () => {
        try {
            if (!days[activeDayIdx]) return;
            const currentDay = days[activeDayIdx];

            // Show loading state
            const previousActivities = allActivities[activeDayIdx]; // Backup

            // Optimistic / Loading indicator could be added here
            Alert.alert(
                "Optimize Schedule?",
                "Optimizing schedule with AI... This may take a few seconds.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Optimize",
                        onPress: async () => {
                            try {
                                setIsLoading(true);
                                const res = await api.post('/trip/auto-schedule', {
                                    starting_point: 'Current Location',
                                    destination: blueprint.title,
                                    start_date: blueprint.start_date || days[0].date,
                                    end_date: blueprint.end_date || days[days.length - 1].date,
                                    day_number: activeDayIdx + 1,
                                    date: currentDay.fullDate,
                                    current_places: allActivities[activeDayIdx].map(a => `${a.title} (${a.time})`).join(', ')
                                });

                                if (res.data && res.data.schedule) {
                                    const optimizedActivities = res.data.schedule.map((item: any) => ({
                                        title: item.place_name,
                                        time: item.visit_time,
                                        desc: item.reason_for_timing,
                                        icon: 'location',
                                        type: 'activity',
                                        latitude: '0',
                                        longitude: '0',
                                        reminder_minutes: item.reminder_before_minutes
                                    }));

                                    const merged = optimizedActivities.map((opt: any) => {
                                        const existing = previousActivities.find((p: any) => p.title === opt.title);
                                        return existing ? { ...existing, ...opt, time: opt.time, note: opt.desc } : opt;
                                    });

                                    const newActivities = [...allActivities];
                                    newActivities[activeDayIdx] = merged;
                                    setAllActivities(newActivities);
                                    Alert.alert("Success", "Schedule optimized!");
                                }
                            } catch (err) {
                                console.error(err);
                                Alert.alert("Error", "Failed to optimize schedule.");
                            } finally {
                                setIsLoading(false);
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error(error);
        }
    };

    const handlePredictCosts = async () => {
        try {
            const currentActivities = allActivities[activeDayIdx];
            if (!currentActivities || currentActivities.length === 0) return;

            setIsRatesLoading(true);
            const res = await api.post('/trip/predict-costs', {
                destination: blueprint?.title || 'this location',
                activities: currentActivities.map(a => ({ title: a.title, desc: a.desc })),
                currency: user?.currency_code || 'INR'
            });

            if (res.data) {
                const predictions = res.data;
                const updatedDayActivities = currentActivities.map(act => {
                    if (predictions[act.title]) {
                        return { ...act, cost: predictions[act.title] };
                    }
                    return act;
                });

                const newAllActivities = [...allActivities];
                newAllActivities[activeDayIdx] = updatedDayActivities;
                setAllActivities(newAllActivities);

                // Also update the blueprint if needed for persistence
                // Though usually allActivities is derived from blueprint on load
                Alert.alert("Success", "AI has estimated costs for today's activities! 🤖💰");
            }
        } catch (err) {
            console.error('Predict costs error:', err);
            Alert.alert("Error", "Failed to predict costs with AI");
        } finally {
            setIsRatesLoading(false);
        }
    };


    const handleShare = async () => {
        try {
            if (!days[activeDayIdx]) return;
            const currentDay = days[activeDayIdx];
            await Share.share({
                message: `Check out my itinerary for ${currentDay.label} in ${blueprint?.title || 'my trip'}! ✨\nDate: ${currentDay.fullDate}\n\nPlan includes:\n${allActivities[activeDayIdx].map(a => `- ${a.title} (${a.time})`).join('\n')}\n\nView full details on GoVenture!`,
            });
        } catch (error: any) {
            console.error(error.message);
        }
    };

    const handleUpdateNote = (dayIdx: number, activityIdx: number, newNote: string) => {
        const updated = [...allActivities];
        //@ts-ignore
        updated[dayIdx][activityIdx].note = newNote;
        setAllActivities(updated);
    };

    const saveNoteToVault = async (dayIdx: number, activityIdx: number, category: string = 'Notes') => {
        const activity = allActivities[dayIdx][activityIdx];
        if (!activity.note?.trim()) return;

        try {
            // 1. Update trip itinerary data
            const newBreakdown = (blueprint.daily_breakdown || []).map((day: any, dIdx: number) => {
                if (dIdx === dayIdx) {
                    return { ...day, activities: allActivities[dayIdx] };
                }
                return day;
            });

            await api.put(`/trips/${id}`, {
                itinerary_data: { ...blueprint, daily_breakdown: newBreakdown }
            });

            // 2. Sync to Memory Vault
            await api.post(`/trips/${id}/memories`, {
                type: 'note',
                content: activity.note,
                category: category,
                metadata: {
                    activity: activity.title,
                    day: dayIdx + 1
                }
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Save note to vault error:', error);
        }
    };

    const onPageSelected = (e: any) => {
        setActiveDayIdx(e.nativeEvent.position);
    };

    useEffect(() => {
        if (initialDay) {
            const dayIdx = parseInt(initialDay as string);
            if (!isNaN(dayIdx)) {
                setTimeout(() => setPage(dayIdx), 100);
            }
        }
    }, [initialDay]);

    const setPage = (idx: number) => {
        pagerRef.current?.setPage(idx);
        setActiveDayIdx(idx);
    };

    const saveActivityEdit = async () => {
        if (!editingActivity) return;
        const { dayIdx, activityIdx, data } = editingActivity;

        const newActivities = [...allActivities];
        newActivities[dayIdx][activityIdx] = data;
        setAllActivities(newActivities);

        try {
            const newBreakdown = (blueprint.daily_breakdown || []).map((day: any, dIdx: number) => {
                if (dIdx === dayIdx) {
                    return { ...day, activities: newActivities[dayIdx] };
                }
                return day;
            });

            await api.put(`/trips/${id}`, {
                itinerary_data: { ...blueprint, daily_breakdown: newBreakdown }
            });
            setEditingActivity(null);
        } catch (err) {
            console.error(err);
            Alert.alert("Error", 'Failed to save activity change.');
        }
    };

    const promoteItem = async (item: any) => {
        const newItem = {
            ...item,
            title: item.name,
            desc: item.type || item.area || 'Recommended spot',
            time: '07:00 PM', // Default time for added spots
            icon: item.price ? 'bed' : 'restaurant',
            type: item.price ? 'stay' : 'food',
            transport: { mode: 'Car', duration: '15 min drive' }
        };

        const newActivities = [...allActivities];
        newActivities[activeDayIdx].push(newItem);
        setAllActivities(newActivities);

        try {
            const newBreakdown = (blueprint.daily_breakdown || []).map((day: any, dIdx: number) => {
                if (dIdx === activeDayIdx) {
                    return { ...day, activities: newActivities[activeDayIdx] };
                }
                return day;
            });

            await api.put(`/trips/${id}`, {
                itinerary_data: { ...blueprint, daily_breakdown: newBreakdown }
            });
            setIsPromoteModalVisible(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleNavigateToItem = (item: any) => {
        if (item.latitude && item.longitude) {
            const lat = parseFloat(item.latitude);
            const lng = parseFloat(item.longitude);
            const label = encodeURIComponent(item.title);

            const url = Platform.select({
                ios: `maps://?daddr=${lat},${lng}&q=${label}`,
                android: `google.navigation:q=${lat},${lng}`
            });
            if (url) Linking.openURL(url);
        } else {
            Alert.alert("Error", "Location coordinates missing for this activity.");
        }
    };

    const handleStartNavigation = () => {
        const dayActivities = allActivities[activeDayIdx];
        if (!dayActivities || dayActivities.length === 0) {
            Alert.alert("Error", "No activities found for this day.");
            return;
        }

        // Find first activity with coordinates
        const targetActivity = dayActivities.find(a => a.latitude && a.longitude);

        if (targetActivity) {
            const lat = parseFloat(targetActivity.latitude);
            const lng = parseFloat(targetActivity.longitude);
            const label = encodeURIComponent(targetActivity.title);

            const url = Platform.select({
                ios: `maps://?daddr=${lat},${lng}&q=${label}`,
                android: `google.navigation:q=${lat},${lng}`
            });

            if (url) {
                Linking.openURL(url).catch(err => {
                    console.error('An error occurred', err);
                    Alert.alert("Error", "Could not open map app.");
                });
            }
        } else {
            Alert.alert("Error", "No location coordinates found for today's activities.");
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 20, color: colors.textSecondary }}>Opening your itinerary...</Text>
            </View>
        );
    }

    if (!blueprint || days.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text style={{ marginTop: 20, color: colors.text, fontSize: 18, fontWeight: 'bold' }}>No Itinerary Found</Text>
                <TouchableOpacity
                    style={{ backgroundColor: colors.primary, marginTop: 30, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12 }}
                    onPress={() => router.back()}
                >
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, paddingTop: Math.max(insets.top, 40) + 10 }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{blueprint.title}</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{days[activeDayIdx]?.fullDate} • {days.length} Days</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity
                        style={[styles.weatherTag, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
                        onPress={handlePredictCosts}
                        disabled={isRatesLoading}
                    >
                        <Ionicons name="sparkles" size={14} color={colors.primary} />
                        <Text style={[styles.weatherText, { color: colors.primary }]}>{isRatesLoading ? 'Predicting...' : 'Predict Costs'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.weatherTag, { backgroundColor: colors.card, borderColor: colors.divider }]}
                        onPress={() => setIsAllExpanded(!isAllExpanded)}
                    >
                        <Ionicons name={isAllExpanded ? "chevron-up" : "swap-vertical"} size={16} color={colors.primary} />
                        <Text style={[styles.weatherText, { color: colors.text }]}>{isAllExpanded ? "Collapse" : "Expand All"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/profile')}>
                        <Ionicons name="person-circle" size={32} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View style={[styles.tabsContainer, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
                {days.map((day, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={[styles.tab, activeDayIdx === idx && [styles.tabActive, { borderBottomColor: colors.primary }]]}
                        onPress={() => setPage(idx)}
                    >
                        <Text style={[styles.tabDate, { color: colors.textSecondary }]}>{day.date}</Text>
                        <Text style={[styles.tabTitle, { color: activeDayIdx === idx ? colors.primary : colors.textSecondary }]}>{day.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <PagerView
                style={styles.pagerView}
                initialPage={0}
                onPageSelected={onPageSelected}
                ref={pagerRef}
            >
                {allActivities.map((dayActivities, dayIdx) => (
                    <View key={dayIdx} style={styles.page}>
                        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                            {/* Map Preview */}
                            <TouchableOpacity
                                style={styles.mapContainer}
                                activeOpacity={0.9}
                                onPress={() => router.push({
                                    pathname: '/trip/[id]/map',
                                    params: { id: Array.isArray(id) ? id[0] : id, day: String(activeDayIdx) }
                                })}
                            >
                                <MapView
                                    provider={PROVIDER_GOOGLE}
                                    style={styles.mapImage}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                    rotateEnabled={false}
                                    pitchEnabled={false}
                                    initialRegion={{
                                        latitude: parseFloat(dayActivities[0]?.latitude || blueprint?.lat || 0),
                                        longitude: parseFloat(dayActivities[0]?.longitude || blueprint?.lng || 0),
                                        latitudeDelta: 0.1,
                                        longitudeDelta: 0.1,
                                    }}
                                    customMapStyle={theme === 'dark' ? DARK_MAP_STYLE : []}
                                >
                                    {dayActivities.filter((a: any) => a.latitude && a.longitude).map((activity: any, idx: number) => (
                                        <Marker
                                            key={`act-${idx}`}
                                            coordinate={{ latitude: parseFloat(activity.latitude), longitude: parseFloat(activity.longitude) }}
                                            pinColor={activity.type === 'food' ? 'orange' : 'red'}
                                            title={activity.title}
                                        />
                                    ))}
                                </MapView>
                            </TouchableOpacity>

                            {/* Timeline */}
                            <View style={styles.timeline}>
                                {dayActivities.map((item, index) => (
                                    <View key={index}>
                                        {/* Transport Step */}
                                        {index > 0 && (item.transport || (item as any).transport_mode) && blueprint?.settings?.showTransit !== false && (
                                            <View style={styles.transportRow}>
                                                <View style={[styles.timelineLine, { backgroundColor: colors.divider }]} />
                                                <View style={[styles.transportTag, { backgroundColor: colors.background, borderColor: colors.divider }]}>
                                                    <Ionicons
                                                        name={
                                                            (item.transport?.mode?.toLowerCase().includes('walk') || (item as any).transport_mode?.toLowerCase().includes('walk')) ? 'walk' :
                                                                (item.transport?.mode?.toLowerCase().includes('bus') || (item as any).transport_mode?.toLowerCase().includes('bus')) ? 'bus' :
                                                                    (item.transport?.mode?.toLowerCase().includes('train') || (item as any).transport_mode?.toLowerCase().includes('train') || (item as any).transport_mode?.toLowerCase().includes('metro')) ? 'train' :
                                                                        (item.transport?.mode?.toLowerCase().includes('cycl') || (item as any).transport_mode?.toLowerCase().includes('bike') || (item as any).transport_mode?.toLowerCase().includes('bicycle')) ? 'bicycle' : 'car'
                                                        }
                                                        size={14}
                                                        color={colors.textSecondary}
                                                    />
                                                    <Text style={[styles.transportText, { color: colors.textSecondary }]}>
                                                        {item.transport?.duration || (item as any).transport_duration || 'Travel time...'}
                                                    </Text>
                                                </View>
                                            </View>
                                        )}

                                        <View style={styles.activityRow}>
                                            <View style={styles.iconColumn}>
                                                <View style={[styles.activityIconBg, { backgroundColor: item.type === 'food' ? (isDarkMode ? '#7C2D12' : '#FFEDD5') : (isDarkMode ? '#1E3A8A' : '#DBEAFE') }]}>
                                                    <Ionicons name={getIconName(item.icon)} size={18} color={item.type === 'food' ? '#F97316' : colors.primary} />
                                                </View>
                                                {index !== dayActivities.length - 1 && <View style={[styles.timelineLineFull, { backgroundColor: colors.divider }]} />}
                                            </View>

                                            <View style={styles.cardContainer}>
                                                <TouchableOpacity
                                                    style={styles.cardHeader}
                                                    onPress={() => {
                                                        if (blueprint?.settings?.isCollaborative !== false) {
                                                            setEditingActivity({ dayIdx, activityIdx: index, data: { ...item } });
                                                        }
                                                    }}
                                                    activeOpacity={blueprint?.settings?.isCollaborative !== false ? 0.7 : 1}
                                                >
                                                    <View style={{ flex: 1, paddingRight: 8 }}>
                                                        <Text style={[styles.activityTitle, { color: colors.text }]}>{item.title}</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                                        <TouchableOpacity
                                                            onPress={() => handleNavigateToItem(item)}
                                                            style={{ padding: 4, backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.divider }}
                                                        >
                                                            <Ionicons name="navigate" size={14} color={colors.primary} />
                                                        </TouchableOpacity>
                                                        <Text style={[styles.activityTime, { color: colors.textSecondary }]}>{item.time}</Text>
                                                    </View>
                                                </TouchableOpacity>

                                                <TouchableOpacity style={[styles.activityCard, { backgroundColor: colors.card }]}>
                                                    {(item as any).badge && (
                                                        <View style={styles.aiBadge}>
                                                            <Ionicons name="sparkles" size={10} color="#FFF" />
                                                            <Text style={styles.aiBadgeText}>{(item as any).badge}</Text>
                                                        </View>
                                                    )}

                                                    {(item as any).image && <Image source={{ uri: (item as any).image }} style={[styles.cardImage, (item as any).badge && { height: 120 }]} />}

                                                    <View style={styles.cardContent}>
                                                        {((item as any).desc && isAllExpanded) && <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{(item as any).desc}</Text>}
                                                        {(item as any).duration && <Text style={[styles.cardDuration, { color: colors.textSecondary, opacity: 0.6 }]}>{(item as any).duration}</Text>}

                                                        {/* Budget/Cost Display */}
                                                        {blueprint?.settings?.showBudget && (item as any).cost && (
                                                            <TouchableOpacity
                                                                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}
                                                                onPress={() => setEditingActivity({ dayIdx, activityIdx: index, data: { ...item } })}
                                                            >
                                                                <Ionicons name="cash-outline" size={12} color="#10B981" />
                                                                <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '600' }}>{formatCost((item as any).cost)}</Text>
                                                            </TouchableOpacity>
                                                        )}

                                                        {((item as any).tags && isAllExpanded) && (
                                                            <View style={styles.tagRow}>
                                                                {(item as any).tags.map((t: any, i: any) => (
                                                                    <View key={i} style={[styles.miniTag, { backgroundColor: colors.background }]}>
                                                                        <Text style={[styles.miniTagText, { color: colors.textSecondary }]}>{t}</Text>
                                                                    </View>
                                                                ))}
                                                            </View>
                                                        )}

                                                        {(editingNote?.dayIdx === dayIdx && editingNote.activityIdx === index) ? (
                                                            <View style={styles.noteInputRow}>
                                                                <TextInput
                                                                    style={[styles.noteInput, { color: colors.text, borderColor: colors.primary }]}
                                                                    value={(item as any).note || ''}
                                                                    onChangeText={(text) => handleUpdateNote(dayIdx, index, text)}
                                                                    onBlur={() => {
                                                                        saveNoteToVault(dayIdx, index, 'Notes');
                                                                        setEditingNote(null);
                                                                    }}
                                                                    autoFocus
                                                                    placeholder="Add a tip or reminder..."
                                                                    placeholderTextColor={colors.textSecondary}
                                                                />
                                                                <TouchableOpacity onPress={() => {
                                                                    saveNoteToVault(dayIdx, index, 'Notes');
                                                                    setEditingNote(null);
                                                                }}>
                                                                    <Ionicons name="apps" size={24} color={colors.primary} />
                                                                </TouchableOpacity>
                                                            </View>
                                                        ) : (
                                                            ((item as any).note || isAllExpanded) && (
                                                                <TouchableOpacity
                                                                    style={styles.noteRow}
                                                                    onPress={() => setEditingNote({ dayIdx, activityIdx: index })}
                                                                >
                                                                    <Ionicons name="information-circle" size={14} color={colors.primary} />
                                                                    <Text style={[styles.noteText, { color: colors.textSecondary }]}>{(item as any).note || (blueprint?.settings?.isCollaborative !== false ? 'Add a custom note...' : '')}</Text>
                                                                </TouchableOpacity>
                                                            )
                                                        )}


                                                    </View>
                                                    {blueprint?.settings?.isCollaborative !== false && (
                                                        <View style={styles.cardActionButtons}>
                                                            {/* Edit Place Icon */}
                                                            <TouchableOpacity
                                                                style={[styles.editCardBtn, { backgroundColor: '#3B82F6' }]}
                                                                onPress={() => setEditingActivity({ dayIdx, activityIdx: index, data: item })}
                                                            >
                                                                <Ionicons name="location" size={16} color="#FFF" />
                                                            </TouchableOpacity>
                                                            {/* Add Note Icon */}
                                                            <TouchableOpacity
                                                                style={[styles.editCardBtn, { backgroundColor: '#F97316' }]}
                                                                onPress={() => setEditingNote({ dayIdx, activityIdx: index })}
                                                            >
                                                                <Ionicons name="document-text" size={16} color="#FFF" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                ))}

                                {blueprint?.settings?.isCollaborative !== false && (
                                    <View style={styles.activityRow}>
                                        <View style={styles.iconColumn}>
                                            <View style={[styles.activityIconBg, { backgroundColor: '#EFF6FF' }]}>
                                                <Ionicons name="restaurant" size={18} color="#3B82F6" />
                                            </View>
                                        </View>
                                        <View style={styles.cardContainer}>
                                            <View style={{ gap: 12 }}>
                                                <TouchableOpacity
                                                    style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.divider }]}
                                                    onPress={() => setIsPromoteModalVisible(true)}
                                                >
                                                    <View style={[styles.plusBg, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' }]}>
                                                        <Ionicons name="add" size={20} color={colors.primary} />
                                                    </View>
                                                    <Text style={[styles.addText, { color: colors.textSecondary }]}>Add Activity</Text>
                                                    <Text style={[styles.generateText, { color: colors.primary }]}>From recommendations or AI</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                            <View style={{ height: 120 }} />
                        </ScrollView >
                    </View >
                ))
                }
            </PagerView >

            {/* Footer Nav */}
            < View style={
                [styles.footer, {
                    backgroundColor: colors.card,
                    borderTopColor: colors.divider,
                    paddingBottom: Math.max(insets.bottom, 20) + 10,
                }]} >
                {
                    activeDayIdx < days.length - 1 ? (
                        <TouchableOpacity
                            style={[styles.nextBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                            onPress={() => setPage(activeDayIdx + 1)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.nextBtnText, { color: colors.text }]}>Next Day</Text>
                            <Ionicons name="arrow-forward" size={18} color={colors.text} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.nextBtn, { borderColor: colors.primary, backgroundColor: colors.primary }]}
                            onPress={() => router.push(`/trip/${id}/dashboard`)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.nextBtnText, { color: '#FFF' }]}>View Trip Dashboard</Text>
                            <Ionicons name="sparkles" size={18} color="#FFF" />
                        </TouchableOpacity>
                    )
                }
                < View style={styles.footerRow} >
                    <TouchableOpacity
                        style={[styles.navBtn, { backgroundColor: colors.primary }]}
                        activeOpacity={0.8}
                        onPress={handleStartNavigation}
                    >
                        <Ionicons name="navigate" size={20} color="#FFF" />
                        <Text style={styles.navBtnText}>Start Navigation</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.shareBtnMini, { borderColor: colors.border }]}
                        onPress={handleShare}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="share-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View >
            </View >
            {/* Editing Modal */}
            < Modal
                visible={!!editingActivity}
                transparent
                animationType="slide"
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.editModal, { backgroundColor: colors.card, maxHeight: '90%' }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Activity</Text>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SEARCH PLACE</Text>
                                <GooglePlacesAutocomplete
                                    placeholder='Search for a new location'
                                    fetchDetails={true}
                                    onPress={(data, details = null) => {
                                        if (details) {
                                            setEditingActivity(prev => ({
                                                ...prev!,
                                                data: {
                                                    ...prev!.data,
                                                    title: data.description.split(',')[0],
                                                    latitude: details.geometry.location.lat,
                                                    longitude: details.geometry.location.lng
                                                }
                                            }));
                                        }
                                    }}
                                    query={{
                                        key: 'dummy',
                                        language: 'en',
                                    }}
                                    requestUrl={{
                                        useOnPlatform: 'all',
                                        url: `${api.defaults.baseURL}/places`
                                    }}
                                    debounce={300}
                                    minLength={2}
                                    enablePoweredByContainer={false}
                                    styles={{
                                        container: { flex: 0 },
                                        textInput: [styles.modalInput, { color: colors.text, borderColor: colors.divider }],
                                        listView: { position: 'absolute', top: 50, zIndex: 9999, elevation: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.divider, borderRadius: 8 },
                                        row: { padding: 13, height: 44, flexDirection: 'row' },
                                        description: { color: colors.text }
                                    }}
                                    textInputProps={{
                                        placeholderTextColor: colors.textSecondary,
                                    }}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TITLE (CUSTOM)</Text>
                                <TextInput
                                    style={[styles.modalInput, { color: colors.text, borderColor: colors.divider }]}
                                    value={editingActivity?.data?.title}
                                    onChangeText={(text) => setEditingActivity(prev => ({ ...prev!, data: { ...prev!.data, title: text } }))}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TIME</Text>
                                <TextInput
                                    style={[styles.modalInput, { color: colors.text, borderColor: colors.divider }]}
                                    value={editingActivity?.data?.time}
                                    onChangeText={(text) => setEditingActivity(prev => ({ ...prev!, data: { ...prev!.data, time: text } }))}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DESCRIPTION</Text>
                                <TextInput
                                    style={[styles.modalInput, { color: colors.text, borderColor: colors.divider, height: 80 }]}
                                    multiline
                                    value={editingActivity?.data?.desc}
                                    onChangeText={(text) => setEditingActivity(prev => ({ ...prev!, data: { ...prev!.data, desc: text } }))}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>COST & CURRENCY</Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <View style={{ width: '100%' }}>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                            {Object.keys(CURRENCY_SYMBOLS).map(sym => (
                                                <TouchableOpacity
                                                    key={sym}
                                                    onPress={async () => {
                                                        const currentCost = (editingActivity?.data as any)?.cost || '';
                                                        const currentSymbol = Object.keys(CURRENCY_SYMBOLS).find(s => currentCost.startsWith(s)) || currencySymbol;
                                                        const currentValue = parseFloat(currentCost.replace(/[^0-9.]/g, '')) || 0;

                                                        let newValue = currentValue;
                                                        const baseCode = CURRENCY_SYMBOLS[currentSymbol];
                                                        const targetCode = CURRENCY_SYMBOLS[sym];

                                                        if (baseCode && targetCode && baseCode !== targetCode && currentValue > 0) {
                                                            setIsRatesLoading(true);
                                                            try {
                                                                const resp = await api.get('/currencies/rates', { params: { base: baseCode } });
                                                                const ratesResponse = resp.data;
                                                                if (ratesResponse && ratesResponse[targetCode]) {
                                                                    newValue = Math.round(currentValue * ratesResponse[targetCode]);
                                                                }
                                                            } catch (e) {
                                                                console.error(e);
                                                            } finally {
                                                                setIsRatesLoading(false);
                                                            }
                                                        }

                                                        setEditingActivity(prev => ({
                                                            ...prev!,
                                                            data: {
                                                                ...prev!.data,
                                                                cost: `${sym}${newValue === 0 ? '' : newValue}`
                                                            }
                                                        }));
                                                    }}
                                                    style={{
                                                        paddingVertical: 10,
                                                        paddingHorizontal: 12,
                                                        borderRadius: 12,
                                                        borderWidth: 1.5,
                                                        borderColor: ((editingActivity?.data as any)?.cost || '').startsWith(sym) ? colors.primary : colors.divider,
                                                        backgroundColor: ((editingActivity?.data as any)?.cost || '').startsWith(sym) ? colors.primary + '15' : colors.card,
                                                        minWidth: 46,
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <Text style={{
                                                        fontSize: 16,
                                                        fontWeight: 'bold',
                                                        color: ((editingActivity?.data as any)?.cost || '').startsWith(sym) ? colors.primary : colors.text
                                                    }}>{sym}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        <View style={{ position: 'relative' }}>
                                            <TextInput
                                                style={[styles.modalInput, { color: colors.text, borderColor: colors.divider, paddingLeft: 12, height: 56, fontSize: 18 }]}
                                                value={((editingActivity?.data as any)?.cost || '').replace(/[^0-9.]/g, '')}
                                                onChangeText={(text) => {
                                                    const costStr = (editingActivity?.data as any)?.cost || '';
                                                    const symbol = Object.keys(CURRENCY_SYMBOLS).find(s => costStr.startsWith(s)) || currencySymbol;
                                                    setEditingActivity(prev => ({
                                                        ...prev!,
                                                        data: { ...prev!.data, cost: `${symbol}${text}` }
                                                    }));
                                                }}
                                                placeholder="Enter amount"
                                                keyboardType="numeric"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                            {isRatesLoading && (
                                                <ActivityIndicator
                                                    size="small"
                                                    color={colors.primary}
                                                    style={{ position: 'absolute', right: 12, top: 18 }}
                                                />
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingActivity(null)}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveBtn} onPress={saveActivityEdit}>
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal >

            {/* Promote Recommendation Modal */}
            < Modal
                visible={isPromoteModalVisible}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.editModal, { backgroundColor: colors.card, height: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 0 }]}>Add Recommendation</Text>
                            <TouchableOpacity onPress={() => setIsPromoteModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            <Text style={[styles.promoSectionTitle, { color: colors.textSecondary }]}>SUGGESTED STAYS</Text>
                            {blueprint?.suggested_stays?.map((stay: any, idx: number) => (
                                <TouchableOpacity
                                    key={`stay-${idx}`}
                                    style={[styles.promoItem, { borderColor: colors.divider }]}
                                    onPress={() => promoteItem(stay)}
                                >
                                    <Image source={{ uri: stay.image }} style={styles.promoImage} />
                                    <View style={styles.promoInfo}>
                                        <Text style={[styles.promoName, { color: colors.text }]}>{stay.name}</Text>
                                        <Text style={styles.promoSub}>{stay.area} • {stay.price}</Text>
                                    </View>
                                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                                </TouchableOpacity>
                            ))}

                            <Text style={[styles.promoSectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>TOP RATED FOOD</Text>
                            {blueprint?.top_rated_food?.map((food: any, idx: number) => (
                                <TouchableOpacity
                                    key={`food-${idx}`}
                                    style={[styles.promoItem, { borderColor: colors.divider }]}
                                    onPress={() => promoteItem(food)}
                                >
                                    <Image source={{ uri: food.image }} style={styles.promoImage} />
                                    <View style={styles.promoInfo}>
                                        <Text style={[styles.promoName, { color: colors.text }]}>{food.name}</Text>
                                        <Text style={styles.promoSub}>{food.type} • {food.rating}★</Text>
                                    </View>
                                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal >


        </View >
    );
}


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

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 },
    headerInfo: { flex: 1, marginHorizontal: 12 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerSubtitle: { fontSize: 12, marginTop: 2 },
    weatherTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    weatherText: { fontSize: 12, fontWeight: '600' },
    tabsContainer: { flexDirection: 'row', overflow: 'scroll', borderBottomWidth: 1, paddingHorizontal: 16 },
    tab: { paddingVertical: 12, marginRight: 24, paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: '#2563EB' },
    tabDate: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
    tabTitle: { fontSize: 15, fontWeight: '600' },
    pagerView: { flex: 1 },
    page: { flex: 1 },
    content: { padding: 16, paddingBottom: 100 },
    mapContainer: { height: 160, borderRadius: 16, overflow: 'hidden', marginBottom: 20, position: 'relative' },
    mapImage: { width: '100%', height: '100%' },
    routeBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
    routeBtnText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
    timeline: { marginLeft: 16 },
    transportRow: { flexDirection: 'row', alignItems: 'center', height: 40, marginLeft: -7 },
    timelineLine: { width: 2, height: '100%', position: 'absolute', left: 24 },
    transportTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, marginLeft: 36, zIndex: 1 },
    transportText: { fontSize: 11, fontWeight: '500' },
    activityRow: { flexDirection: 'row', marginBottom: 24 },
    iconColumn: { alignItems: 'center', marginRight: 16, width: 48 },
    activityIconBg: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    timelineLineFull: { width: 2, flex: 1, position: 'absolute', top: 48, bottom: -24 },
    cardContainer: { flex: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    activityTitle: { fontSize: 16, fontWeight: '700' },
    activityTime: { fontSize: 12, fontWeight: '600' },
    activityCard: { borderRadius: 16, overflow: 'hidden', padding: 12 },
    cardImage: { width: '100%', height: 120, borderRadius: 12, marginBottom: 12 },
    aiBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 1 },
    aiBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    cardContent: {},
    cardDesc: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
    cardDuration: { fontSize: 12, marginBottom: 8 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    miniTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    miniTagText: { fontSize: 10, fontWeight: '600' },
    noteInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
    noteInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
    noteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, padding: 8, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 8 },
    noteText: { fontSize: 12, fontStyle: 'italic' },
    editCardBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3
    },
    cardActionButtons: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        gap: 8,
    },
    addCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', gap: 12, justifyContent: 'center' },
    plusBg: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    addText: { fontSize: 14, fontWeight: '600' },
    generateText: { fontSize: 12, fontWeight: '500' },
    footer: { borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 16 },
    nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    nextBtnText: { fontSize: 15, fontWeight: '700' },
    footerRow: { flexDirection: 'row', gap: 12 },
    navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16 },
    navBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    shareBtnMini: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    editModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
    modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
    cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#F3F4F6' },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#4B5563' },
    saveBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#2563EB' },
    saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
    promoSectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
    promoItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 12, gap: 12 },
    promoImage: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#E5E7EB' },
    promoInfo: { flex: 1 },
    promoName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    promoSub: { fontSize: 12, color: '#6B7280' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
    modalSubtitle: { fontSize: 14, marginBottom: 24 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    catOption: { width: (width - 60) / 2, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 10 },
    catOptionText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
    cancelBtnFull: { padding: 16, alignItems: 'center' },
});
