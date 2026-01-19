import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    TextInput,
    Share,
} from 'react-native';
import PagerView, { PagerViewType } from '@/components/common/PagerView';
import { useTheme, ThemeColors } from '@/src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function DayItinerary() {
    const router = useRouter();
    const { id, initialDay } = useLocalSearchParams();
    const pagerRef = useRef<PagerViewType>(null);
    const { theme, isDarkMode } = useTheme();
    const colors = ThemeColors[theme];
    const insets = useSafeAreaInsets();

    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const [isAllExpanded, setIsAllExpanded] = useState(false);
    const [editingNote, setEditingNote] = useState<{ dayIdx: number, activityIdx: number } | null>(null);

    const days = [
        { label: 'Day 1', date: 'TUE', fullDate: 'Oct 14' },
        { label: 'Day 2', date: 'WED', fullDate: 'Oct 15' },
        { label: 'Day 3', date: 'THU', fullDate: 'Oct 16' },
        { label: 'Day 4', date: 'FRI', fullDate: 'Oct 17' },
    ];

    const initialActivities = [
        [ // Day 1
            {
                time: '09:00 AM',
                title: 'Cafe Kitsune',
                desc: 'Famous for minimalist aesthetic and quality...',
                duration: '1h duration',
                icon: 'cafe',
                type: 'food',
                image: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=200',
            },
            {
                time: '10:30 AM',
                title: 'Senso-ji Temple',
                badge: 'AI PICK',
                image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=400',
                tags: ['Historic', 'Must See'],
                note: 'Suggested early to avoid peak crowds.',
                icon: 'library',
                type: 'activity',
            },
            {
                time: '01:00 PM',
                title: 'Sushi Zanmai',
                desc: 'Top rated sushi chain known for tuna...',
                duration: '1h 30m duration',
                image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=200',
                icon: 'restaurant',
                type: 'food',
            },
        ],
        [ // Day 2
            {
                time: '10:00 AM',
                title: 'Ueno Park',
                desc: 'Spacious public park with museums...',
                duration: '2h duration',
                icon: 'leaf',
                type: 'activity',
                image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=400',
            },
            {
                time: '01:00 PM',
                title: 'Akihabara Lunch',
                desc: 'Explore the electric town and grab lunch.',
                duration: '1h 30m duration',
                icon: 'restaurant',
                type: 'food',
                image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=400',
            }
        ],
        [ // Day 3
            {
                time: '11:00 AM',
                title: 'Shibuya Crossing',
                desc: 'The world\'s busiest pedestrian intersection.',
                duration: '45m duration',
                icon: 'walk',
                type: 'activity',
                image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=200',
            }
        ],
        [ // Day 4
            {
                time: '09:00 AM',
                title: 'Hotel Check-out',
                desc: 'Packing and final preparations.',
                icon: 'exit',
                type: 'activity',
            },
            {
                time: '11:00 AM',
                title: 'Narita Express',
                desc: 'Heading to the airport.',
                icon: 'train',
                type: 'activity',
            }
        ]
    ];

    const [allActivities, setAllActivities] = useState(initialActivities);

    const handleShare = async () => {
        try {
            const currentDay = days[activeDayIdx];
            await Share.share({
                message: `Check out my itinerary for ${currentDay.label} in Tokyo Exploration! ✨\nDate: ${currentDay.fullDate}\n\nPlan includes:\n${allActivities[activeDayIdx].map(a => `- ${a.title} (${a.time})`).join('\n')}\n\nView full details on GoVenture!`,
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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Tokyo Exploration</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{days[activeDayIdx].fullDate} • 4 Days</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
                            <View style={styles.mapContainer}>
                                <Image
                                    source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop' }}
                                    style={styles.mapImage}
                                />
                                <TouchableOpacity style={styles.routeBtn}>
                                    <Ionicons name="git-branch" size={14} color="#FFF" />
                                    <Text style={styles.routeBtnText}>Optimized Route</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Timeline */}
                            <View style={styles.timeline}>
                                {dayActivities.map((item, index) => (
                                    <View key={index}>
                                        {/* Transport Step */}
                                        {index > 0 && (
                                            <View style={styles.transportRow}>
                                                <View style={[styles.timelineLine, { backgroundColor: colors.divider }]} />
                                                <View style={[styles.transportTag, { backgroundColor: colors.background, borderColor: colors.divider }]}>
                                                    <Ionicons name={index === 1 ? 'walk' : 'bus'} size={14} color={colors.textSecondary} />
                                                    <Text style={[styles.transportText, { color: colors.textSecondary }]}>{index === 1 ? '15 min' : '20 min'}</Text>
                                                </View>
                                            </View>
                                        )}

                                        <View style={styles.activityRow}>
                                            <View style={styles.iconColumn}>
                                                <View style={[styles.activityIconBg, { backgroundColor: item.type === 'food' ? (isDarkMode ? '#7C2D12' : '#FFEDD5') : (isDarkMode ? '#1E3A8A' : '#DBEAFE') }]}>
                                                    <Ionicons name={item.icon as any} size={18} color={item.type === 'food' ? '#F97316' : colors.primary} />
                                                </View>
                                                {index !== dayActivities.length - 1 && <View style={[styles.timelineLineFull, { backgroundColor: colors.divider }]} />}
                                            </View>

                                            <View style={styles.cardContainer}>
                                                <View style={styles.cardHeader}>
                                                    <Text style={[styles.activityTitle, { color: colors.text }]}>{item.title}</Text>
                                                    <Text style={[styles.activityTime, { color: colors.textSecondary }]}>{item.time}</Text>
                                                </View>

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
                                                                    onBlur={() => setEditingNote(null)}
                                                                    autoFocus
                                                                    placeholder="Add a tip or reminder..."
                                                                    placeholderTextColor={colors.textSecondary}
                                                                />
                                                                <TouchableOpacity onPress={() => setEditingNote(null)}>
                                                                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                                                </TouchableOpacity>
                                                            </View>
                                                        ) : (
                                                            ((item as any).note || isAllExpanded) && (
                                                                <TouchableOpacity
                                                                    style={styles.noteRow}
                                                                    onPress={() => setEditingNote({ dayIdx, activityIdx: index })}
                                                                >
                                                                    <Ionicons name="information-circle" size={14} color={colors.primary} />
                                                                    <Text style={[styles.noteText, { color: colors.textSecondary }]}>{(item as any).note || 'Add a custom note...'}</Text>
                                                                </TouchableOpacity>
                                                            )
                                                        )}
                                                    </View>

                                                    <TouchableOpacity
                                                        style={styles.editCardBtn}
                                                        onPress={() => setEditingNote({ dayIdx, activityIdx: index })}
                                                    >
                                                        <Ionicons name="pencil" size={14} color={colors.primary} />
                                                    </TouchableOpacity>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                ))}

                                {/* Add Activity */}
                                <View style={styles.activityRow}>
                                    <View style={styles.iconColumn}>
                                        <View style={[styles.activityIconBg, { backgroundColor: '#EFF6FF' }]}>
                                            <Ionicons name="restaurant" size={18} color="#3B82F6" />
                                        </View>
                                    </View>
                                    <View style={styles.cardContainer}>
                                        <TouchableOpacity style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
                                            <View style={[styles.plusBg, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' }]}>
                                                <Ionicons name="add" size={20} color={colors.primary} />
                                            </View>
                                            <Text style={[styles.addText, { color: colors.textSecondary }]}>Afternoon slot open</Text>
                                            <Text style={[styles.generateText, { color: colors.primary }]}>Generate Activity</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                            <View style={{ height: 120 }} />
                        </ScrollView>
                    </View>
                ))
                }
            </PagerView >

            {/* Footer Nav */}
            <View style={[styles.footer, {
                backgroundColor: colors.card,
                borderTopColor: colors.divider,
                paddingBottom: Math.max(insets.bottom, 20) + 10,
            }]}>
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
                <View style={styles.footerRow}>
                    <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
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
                </View>
            </View>
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    pagerView: { flex: 1 },
    page: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 10,
    },
    headerInfo: { flex: 1, marginLeft: 16 },
    headerTitle: { fontSize: 22, fontWeight: '700' },
    headerSubtitle: { fontSize: 13, marginTop: 2 },
    weatherTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    weatherText: { fontSize: 13, fontWeight: '600', color: '#111827' },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 3, borderBottomColor: '#3B82F6' },
    tabDate: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
    tabTitle: { fontSize: 14, fontWeight: '700', marginTop: 2 },
    tabTitleActive: { color: '#3B82F6' },
    content: { padding: 0 },
    mapContainer: {
        height: 180,
        position: 'relative',
        marginBottom: 20,
    },
    mapImage: { width: '100%', height: '100%' },
    routeBtn: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#1D85E6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    routeBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    timeline: { paddingHorizontal: 20, paddingTop: 20 },
    activityRow: { flexDirection: 'row', position: 'relative' },
    iconColumn: { width: 44, alignItems: 'center' },
    activityIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    timelineLine: { width: 2, height: 20, backgroundColor: '#E5E7EB', position: 'absolute', left: 21, zIndex: 1 },
    timelineLineFull: { width: 2, flex: 1, backgroundColor: '#E5E7EB', position: 'absolute', top: 36, bottom: 0, left: 21, zIndex: 1 },
    transportRow: { flexDirection: 'row', height: 60, position: 'relative' },
    transportTag: {
        position: 'absolute',
        left: 10,
        top: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        zIndex: 3,
    },
    transportText: { fontSize: 11, fontWeight: '700' },
    cardContainer: { flex: 1, marginLeft: 12, marginBottom: 24 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    activityTitle: { fontSize: 18, fontWeight: '700' },
    activityTime: { fontSize: 12, fontWeight: '500' },
    activityCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        position: 'relative',
    },
    aiBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#A855F7',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderBottomLeftRadius: 12,
        zIndex: 5,
    },
    aiBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    cardImage: { width: '100%', height: 70 },
    cardContent: { padding: 12 },
    cardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
    cardDuration: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
    tagRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
    miniTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    miniTagText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
    noteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
    noteText: { fontSize: 11, color: '#6B7280', fontStyle: 'italic' },
    editCardBtn: { position: 'absolute', bottom: 12, right: 12, padding: 4 },
    noteInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
    noteInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13 },
    addCard: {
        backgroundColor: '#FFF',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    plusBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    addText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    generateText: { fontSize: 12, color: '#3B82F6', fontWeight: '700', marginTop: 4 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
    nextBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
    nextBtnText: { fontSize: 16, fontWeight: '700', marginRight: 8 },
    footerRow: { flexDirection: 'row', gap: 12 },
    navBtn: { flex: 1, backgroundColor: '#1D85E6', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
    navBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    shareBtnMini: { width: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 12, borderWidth: 1 },
});
