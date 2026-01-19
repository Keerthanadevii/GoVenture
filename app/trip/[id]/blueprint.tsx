import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    Modal,
    Switch,
    Share,
    Pressable,
} from 'react-native';
import { useState } from 'react';
import { useTheme, ThemeColors } from '@/src/context/ThemeContext';

const { width } = Dimensions.get('window');

export default function TripBlueprint() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { theme, isDarkMode } = useTheme();
    const colors = ThemeColors[theme];
    const [isAllExpanded, setIsAllExpanded] = useState(false);
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);

    // Settings state
    const [showTransit, setShowTransit] = useState(true);
    const [showBudget, setShowBudget] = useState(false);
    const [strictSchedule, setStrictSchedule] = useState(false);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out my trip blueprint for Tokyo Exploration! 🗼\nOct 14 - Oct 17 • 4 Days\n\nPlan includes:\n- Arrival & Omotesando\n- Historic Asakusa\n- Shibuya & Nightlife\n\nView full itinerary on GoVenture app!`,
            });
        } catch (error: any) {
            console.error(error.message);
        }
    };

    const activityDistribution = [
        { label: 'Culture & History', percentage: 40, color: '#A855F7' },
        { label: 'Food & Dining', percentage: 35, color: '#F97316' },
        { label: 'Shopping & City', percentage: 25, color: '#3B82F6' },
    ];

    const days = [
        {
            day: 1,
            date: 'OCT 14',
            title: 'Arrival & Omotesando',
            desc: 'Airport transfer followed by a relaxed afternoon at Cafe Kitsune and neighborhood...',
            images: ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=200'],
            type: 'Sun',
        },
        {
            day: 2,
            date: 'OCT 15',
            title: 'Historic Asakusa',
            desc: 'Full day exploring Senso-ji temple, Nakamise shopping street, and Ueno Park museums.',
            images: [
                'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=200',
                'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=200'
            ],
            type: 'Sun',
            tag: 'PACKED',
        },
        {
            day: 3,
            date: 'OCT 16',
            title: 'Shibuya & Nightlife',
            desc: 'Scramble crossing, modern shopping, and Izakaya hopping in the evening.',
            images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=200'],
            extra: 4,
            type: 'Sun',
        },
        {
            day: 4,
            date: 'OCT 17',
            title: 'Departure',
            desc: 'Hotel checkout and train to Narita Airport.',
            type: 'Departure',
        },
    ];

    const hotels = [
        {
            name: 'Hotel Gracery',
            area: 'Shinjuku Ward',
            rating: '4.8',
            ratingLabel: 'Excellent',
            distance: '0.2km to center',
            price: '$142',
            image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=200',
            selected: true,
        },
        {
            name: 'APA Hotel',
            area: 'Kabukicho',
            rating: '4.5',
            distance: '0.5km to center',
            image: 'https://images.unsplash.com/photo-1551882547-ff43c63faf79?q=80&w=200',
        }
    ];

    const food = [
        {
            name: 'Ichiran Ramen',
            type: 'Tonkotsu • Shibuya',
            rating: '4.9',
            distance: '0.5km away',
            image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=200',
            selected: true,
        },
        {
            name: 'Sushi Zanmai',
            type: 'Sushi • Tsukiji',
            rating: '4.7',
            distance: '1.2km away',
            image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=200',
        }
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerActionBtn} onPress={handleShare} activeOpacity={0.7}>
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

                <Text style={[styles.title, { color: colors.text }]}>Tokyo Exploration</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Oct 14 - Oct 17 • 4 Days</Text>

                {/* Map Preview */}
                <View style={styles.mapContainer}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop' }}
                        style={styles.mapImage}
                    />
                    <View style={styles.mapOverlay}>
                        <View style={styles.mapIconBg}>
                            <Ionicons name="map" size={16} color="#FFF" />
                        </View>
                        <View>
                            <Text style={styles.mapTextBold}>Full Route View</Text>
                            <Text style={styles.mapTextSub}>View all 12 locations</Text>
                        </View>
                    </View>
                </View>

                {/* Activity Distribution */}
                <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACTIVITY DISTRIBUTION</Text>
                        <TouchableOpacity>
                            <Text style={[styles.analysisLink, { color: colors.primary }]}>Analysis</Text>
                        </TouchableOpacity>
                    </View>
                    {activityDistribution.map((item, index) => (
                        <View key={index} style={styles.distItem}>
                            <View style={styles.distRow}>
                                <Ionicons name={item.label.includes('Food') ? 'restaurant' : item.label.includes('Culture') ? 'star' : 'bag'} size={14} color={item.color} />
                                <Text style={[styles.distLabel, { color: colors.text }]}>{item.label}</Text>
                                <Text style={[styles.distPercent, { color: colors.textSecondary }]}>{item.percentage}%</Text>
                            </View>
                            <View style={[styles.progressBarBg, { backgroundColor: colors.divider }]}>
                                <View style={[styles.progressBar, { width: `${item.percentage}%`, backgroundColor: item.color }]} />
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
                        This optimized route balances <Text style={[styles.bold, { color: colors.text }]}>Asakusa's history</Text> with <Text style={[styles.bold, { color: colors.text }]}>Shibuya's modern energy</Text>. Key focus on high-rated culinary spots and minimizing travel time between the 3 main districts.
                    </Text>
                </View>

                {/* Daily Breakdown */}
                <View style={styles.breakdownHeader}>
                    <Text style={[styles.breakdownTitle, { color: colors.text }]}>Daily Breakdown</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                            onPress={() => router.push({ pathname: `/trip/[id]/itinerary`, params: { id: id as string } })}
                        >
                            <Ionicons name="create-outline" size={14} color={colors.textSecondary} />
                            <Text style={[styles.actionTextGray, { color: colors.textSecondary }]}>Edit</Text>
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

                {days.map((day, index) => (
                    <View key={index} style={styles.dayRow}>
                        <View style={styles.timelineContainer}>
                            <View style={[styles.timelineDot, index === 0 && styles.timelineDotActive]} />
                            {index !== days.length - 1 && <View style={styles.timelineLine} />}
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
                            {day.images && (
                                <View style={styles.dayImages}>
                                    {day.images.map((img, i) => (
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

                {/* Suggested Stays */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitleBold, { color: colors.textSecondary }]}>SUGGESTED STAYS</Text>
                    <TouchableOpacity>
                        <Text style={[styles.actionTextBlue, { color: colors.primary }]}>View Map</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalGrid}>
                    {hotels.map((hotel, idx) => (
                        <TouchableOpacity key={idx} style={[styles.hotelCard, { backgroundColor: colors.card, borderColor: hotel.selected ? colors.primary : colors.divider }]}>
                            <View style={[styles.hotelIconBg, { backgroundColor: colors.background }]}>
                                <Ionicons name="bed" size={24} color={hotel.selected ? colors.primary : colors.textSecondary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.hotelName, { color: colors.text }]}>{hotel.name}</Text>
                                <Text style={[styles.hotelArea, { color: colors.textSecondary }]}>{hotel.area}</Text>
                                <View style={styles.ratingRow}>
                                    <View style={styles.ratingBadge}>
                                        <Text style={styles.ratingText}>{hotel.rating} ★</Text>
                                    </View>
                                    {hotel.ratingLabel && <Text style={styles.ratingLabel}>{hotel.ratingLabel}</Text>}
                                </View>
                                <View style={styles.hotelDistRow}>
                                    <Ionicons name="navigate-outline" size={12} color={colors.textSecondary} />
                                    <Text style={[styles.distText, { color: colors.textSecondary }]}>{hotel.distance}</Text>
                                    {hotel.price && <Text style={[styles.priceText, { color: colors.text }]}>{hotel.price}<Text style={[styles.priceSub, { color: colors.textSecondary }]}>/night</Text></Text>}
                                </View>
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
                    <TouchableOpacity onPress={() => setIsSettingsVisible(true)} activeOpacity={0.7}>
                        <Text style={[styles.actionTextBlue, { color: colors.primary }]}>Filter</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalGrid}>
                    {food.map((f, idx) => (
                        <TouchableOpacity key={idx} style={[styles.hotelCard, { backgroundColor: colors.card, borderColor: f.selected ? '#F97316' : colors.divider }]}>
                            <View style={[styles.hotelIconBg, { backgroundColor: colors.background }]}>
                                <Ionicons name="restaurant" size={24} color={f.selected ? '#F97316' : colors.textSecondary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.hotelName, { color: colors.text }]}>{f.name}</Text>
                                <Text style={[styles.hotelArea, { color: colors.textSecondary }]}>{f.type}</Text>
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

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.divider }]}>
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
                        onPress={handleShare}
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

            {/* Advanced Settings Modal */}
            <Modal
                visible={isSettingsVisible}
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
                            onPress={() => setIsSettingsVisible(false)}
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
    mapIconBg: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapTextBold: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    mapTextSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    sectionCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
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
    hotelCard: { width: width * 0.7, backgroundColor: '#FFF', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, borderWidth: 2, borderColor: '#F3F4F6' },
    hotelCardSelected: { borderColor: '#3B82F6' },
    hotelIconBg: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
    hotelName: { fontSize: 14, fontWeight: '700', color: '#111827' },
    hotelArea: { fontSize: 12, color: '#6B7280' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    ratingBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    ratingText: { fontSize: 11, color: '#10B981', fontWeight: '700' },
    ratingLabel: { fontSize: 11, color: '#9CA3AF' },
    hotelDistRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    distText: { fontSize: 11, color: '#6B7280' },
    priceText: { marginLeft: 'auto', fontSize: 15, fontWeight: '700', color: '#111827' },
    priceSub: { fontSize: 11, color: '#9CA3AF', fontWeight: '400' },
    checkInside: { position: 'absolute', top: 12, right: 12 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
    startBtn: { backgroundColor: '#1D85E6', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, borderRadius: 12, marginBottom: 12 },
    startBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    footerRow: { flexDirection: 'row', gap: 12 },
    shareBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
    shareBtnText: { fontSize: 14, fontWeight: '600' },
    optionsBtn: { width: 55, justifyContent: 'center', alignItems: 'center', borderRadius: 12, borderWidth: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    settingsGroup: { marginBottom: 32 },
    settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    settingLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
    settingSub: { fontSize: 12, color: '#6B7280' },
    divider: { height: 1, marginVertical: 8 },
    applyBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    applyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    headerRight: { flexDirection: 'row', gap: 16 },
    headerActionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
});
