import { Toast } from '@/src/components/Toast';
import { ThemeColors, useTheme } from '@/src/context/ThemeContext';
import api from '@/src/services/api';
import { getIconName } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function TripDashboard() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { theme, isDarkMode } = useTheme();
    const colors = ThemeColors[theme];
    const [showAIInsights, setShowAIInsights] = useState(true);
    const [trip, setTrip] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [connectError, setConnectError] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });
    const [isDateModalVisible, setIsDateModalVisible] = useState(false);
    const [isShareModalVisible, setIsShareModalVisible] = useState(false);
    const [isSavingDates, setIsSavingDates] = useState(false);
    const [tempStartDate, setTempStartDate] = useState<string | null>(null);
    const [tempEndDate, setTempEndDate] = useState<string | null>(null);

    // RBAC & Content state
    const [myRole, setMyRole] = useState<string | null>(null);
    const [folders, setFolders] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [folderName, setFolderName] = useState('');

    // Share Handlers
    const handleShare = () => {
        setIsShareModalVisible(true);
    };

    const handleShareLink = async () => {
        setIsShareModalVisible(false);
        try {
            const tripLink = `https://goventure.app/trips/${id}`;
            await Share.share({
                message: `Check out my trip to ${trip?.destination}! 🌍\nFrom ${trip?.start_date} to ${trip?.end_date}.\nView full itinerary here:\n${tripLink}`,
                url: tripLink,
                title: trip?.title || 'My Trip'
            });
        } catch (error: any) {
            Alert.alert(error.message);
        }
    };

    const handleSharePDF = async () => {
        setIsShareModalVisible(false);
        const blueprint = trip?.itinerary_data;
        if (!blueprint) {
            Alert.alert("Error", "No itinerary data available to export.");
            return;
        }

        try {
            // Generate HTML for PDF (Reusing logic from blueprint.tsx)
            const dailyBreakdownHtml = blueprint.daily_breakdown?.map((day: any) => `
                <div style="margin-bottom: 20px; page-break-inside: avoid;">
                    <h3 style="color: #3B82F6; margin-bottom: 8px;">Day ${day.day}: ${day.title || 'Activities'}</h3>
                    <p style="color: #6B7280; font-size: 14px; margin-bottom: 12px;">${day.desc || ''}</p>
                    ${day.activities?.map((act: any) => `
                        <div style="margin-left: 16px; margin-bottom: 8px; padding: 12px; background: #F9FAFB; border-radius: 8px; border-left: 4px solid #3B82F6;">
                            <div style="display: flex; justify-content: space-between;">
                                <strong>${act.time || ''}</strong>
                                ${act.cost ? `<span style="color: #10B981; font-size: 11px; font-weight: bold;">${act.cost}</span>` : ''}
                            </div>
                            <div style="margin-top: 4px; font-weight: bold;">${act.title || 'Activity'}</div>
                            <p style="color: #6B7280; font-size: 12px; margin: 4px 0 0 0;">${act.desc || ''}</p>
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

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>${trip?.title || 'Trip Plan'}</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #1F2937; line-height: 1.5; }
                        .header { text-align: center; margin-bottom: 40px; }
                        h1 { color: #3B82F6; font-size: 28px; margin-bottom: 8px; }
                        .dates { color: #6B7280; font-size: 14px; margin-bottom: 24px; }
                        .highlight { background: #EBF5FF; padding: 20px; border-radius: 12px; margin-bottom: 32px; border: 1px solid #BFDBFE; }
                        .section { margin-bottom: 32px; }
                        h2 { font-size: 20px; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; margin-bottom: 16px; }
                        .footer { margin-top: 60px; text-align: center; color: #9CA3AF; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>🌍 ${trip?.title || 'Trip Plan'}</h1>
                        <div class="dates">${trip?.start_date} - ${trip?.end_date} | ${trip?.destination}</div>
                    </div>
                    
                    <div class="highlight">
                        <strong style="color: #3B82F6;">AI Overview:</strong><br/>
                        ${blueprint.highlights || 'An amazing trip awaits!'}
                    </div>

                    <div class="section">
                        <h2>📅 Daily Itinerary</h2>
                        ${dailyBreakdownHtml || '<p>No itinerary data available.</p>'}
                    </div>

                    ${staysHtml ? `
                    <div class="section">
                        <h2>🏨 Stay Recommendations</h2>
                        ${staysHtml}
                    </div>` : ''}

                    <div class="footer">
                        <p>Generated by <strong>GoVenture</strong> • Your AI Travel Companion</p>
                        <p>https://goventure.app</p>
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });

            // Try to use printAsync for a cleaner "Save as PDF" experience on mobile
            await Print.printAsync({ html });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error: any) {
            console.error('PDF Error:', error);
            Alert.alert('Download Failed', 'Failed to generate itinerary. Please try again.');
        }
    };

    const handleOffline = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        handleSharePDF();
    };

    const fetchTripData = async () => {
        try {
            const res = await api.get(`/trips/${id}`);
            setTrip(res.data);

            const vaultRes = await api.get(`/trips/${id}/memories?dashboard=true`);
            const loadedFolders = vaultRes.data?.folders || [];

            // Only show user-created folders on Dashboard
            setFolders(loadedFolders);
            setMyRole(res.data.my_role);

        } catch (err: any) {
            console.error('[Dashboard] Fetch data error details:', {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
                url: err.config?.url,
                tripId: id
            });
            console.error('Fetch dashboard data error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (id) fetchTripData();
        }, [id])
    );


    const handleShiftDates = (days: number) => {
        if (!trip?.start_date || !trip?.end_date) return;

        const shift = (dateStr: string) => {
            const d = new Date(dateStr);
            d.setDate(d.getDate() + days);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        };

        const newStart = shift(tempStartDate || trip.start_date);
        const newEnd = shift(tempEndDate || trip.end_date);
        setTempStartDate(newStart);
        setTempEndDate(newEnd);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleUpdateDates = async () => {
        if (!tempStartDate || !tempEndDate) {
            setIsDateModalVisible(false);
            return;
        }

        setIsSavingDates(true);
        try {
            await api.put(`/trips/${id}`, {
                start_date: tempStartDate,
                end_date: tempEndDate
            });
            setTrip((prev: any) => ({ ...prev, start_date: tempStartDate, end_date: tempEndDate }));
            setIsDateModalVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "Trip dates updated! ✨");
        } catch (error) {
            console.error('Error updating dates:', error);
            Alert.alert("Error", "Failed to update trip dates.");
        } finally {
            setIsSavingDates(false);
            setTempStartDate(null);
            setTempEndDate(null);
        }
    };


    const handleAddFolder = () => {
        setEditingIndex(null);
        setFolderName('');
        setModalVisible(true);
    };

    const handleEditFolder = (index: number) => {
        setEditingIndex(index);
        setFolderName(folders[index].name);
        setModalVisible(true);
    };

    const handleSaveFolder = async () => {
        if (!folderName.trim()) return;

        try {
            if (editingIndex !== null) {
                // Update
                const folderId = folders[editingIndex].id;
                const res = await api.put(`/trips/${id}/folders/${folderId}`, { name: folderName });
                const updated = [...folders];
                updated[editingIndex] = { ...updated[editingIndex], ...res.data.folder };
                setFolders(updated);
            } else {
                // Create
                const res = await api.post(`/trips/${id}/folders`, { name: folderName });
                setFolders(prev => [...prev, { ...res.data.folder, count: 0 }]);
            }
            setModalVisible(false);
            setFolderName('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to save folder");
        }
    };

    const handleDeleteFolder = async () => {
        if (editingIndex === null) return;
        const folder = folders[editingIndex];

        Alert.alert(
            "Delete Folder",
            `Are you sure you want to delete "${folder.name}"? This will not delete the memories inside, they will move to "All".`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(`/trips/${id}/folders/${folder.id}`);
                            setFolders(prev => prev.filter((_, i) => i !== editingIndex));
                            setModalVisible(false);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (err) {
                            console.error(err);
                            Alert.alert("Error", "Failed to delete folder");
                        }
                    }
                }
            ]
        );
    };


    // --- SMART ITINERARY LOGIC ---
    // In a real app, this would come from Geolocation.watchPosition()
    const [mockLocationState, setMockLocationState] = useState<'at_event_1' | 'moving' | 'at_event_2'>('at_event_1');

    const blueprint = trip?.itinerary_data;
    const dailyActivities = blueprint?.daily_breakdown?.[0]?.activities || [];

    // We assume the first two activities for this demo
    const event1 = dailyActivities[0];
    const event2 = dailyActivities[1];

    let currentActivity = event1;
    let nextActivity = event2;
    let statusLabel = null;
    let statusColor = colors.textSecondary;
    let showAlert = false;
    let alertMessage = "";

    // "Smart" Logic
    if (mockLocationState === 'at_event_1') {
        // User is still at Event 1
        currentActivity = event1;
        // Check if "late" (Mocking time check: assume it's past start time of Event 2)
        const isLate = true; // Hardcoded for demo
        if (isLate && event2) {
            statusLabel = `Still at ${event1?.title || 'Location'}`;
            statusColor = '#F59E0B'; // Amber

            // Show Event 2 as "Upcoming" with alert
            showAlert = true;
            const travelDuration = event2?.transport?.duration || (event2 as any)?.transport_duration || "15 min";
            alertMessage = `Scheduled to start now • ${travelDuration} travel`;
        }
    } else if (mockLocationState === 'moving') {
        // User left Event 1, moving to Event 2
        // Event 2 becomes "Current" target
        currentActivity = event2 || event1;
        statusLabel = "En route";
        statusColor = '#3B82F6'; // Blue
    } else if (mockLocationState === 'at_event_2') {
        // Arrived at Event 2
        currentActivity = event2 || event1;
        statusLabel = "You are here";
        statusColor = '#10B981'; // Green
    }

    const configMockLocation = () => {
        Alert.alert(
            "Debug: Location Simulation",
            `Current State: ${mockLocationState}\n\nLong press the 'Up Next' card or this icon to simulate moving to the next location.`,
            [{ text: "OK" }]
        );
    };

    const handleSimulateMovement = () => {
        if (mockLocationState === 'at_event_1') {
            setMockLocationState('moving');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("GPS Update", "Detected movement towards next location. updating itinerary...");
        } else if (mockLocationState === 'moving') {
            setMockLocationState('at_event_2');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("GPS Update", "You have arrived at the destination.");
        } else {
            setMockLocationState('at_event_1'); // Reset
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const handleReschedule = () => {
        Alert.alert(
            "Reschedule Itinerary",
            "Since you are staying longer at the current location, would you like to push subsequent events by 30 mins?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Reschedule",
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert("Itinerary Updated", "Events pushed forward by 30 mins.");
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800' }}
                        style={styles.heroImage}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.heroGradient}
                    />

                    <View style={styles.heroHeader}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Trip Details</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => configMockLocation()}
                                onLongPress={handleSimulateMovement} // Hidden implementation for demo
                                delayLongPress={1000}
                                style={[styles.profileBtn, { backgroundColor: 'rgba(255,255,255,0.2)', padding: 2, borderRadius: 20 }]}
                            >
                                <Ionicons name="location-outline" size={20} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => router.push('/profile')}
                                style={[styles.profileBtn, { backgroundColor: 'rgba(255,255,255,0.2)', padding: 2, borderRadius: 20 }]}
                            >
                                <Ionicons name="person-circle" size={32} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.heroInfo}>
                        <Text style={styles.tripTitle}>{trip?.title || 'Trip Details'}</Text>
                        <View style={styles.dateRow}>
                            <View style={{ width: 4 }} />
                            <Text style={styles.tripDates}>{trip?.start_date} - {trip?.end_date}</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.actionItem} onPress={() => router.push(`/trip/${id}`)}>
                        <View style={[styles.actionIconBg, { backgroundColor: colors.card }]}>
                            <Ionicons name="map-outline" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Blueprint</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={handleOffline}>
                        <View style={[styles.actionIconBg, { backgroundColor: colors.card }]}>
                            <Ionicons name="download-outline" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Offline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
                        <View style={[styles.actionIconBg, { backgroundColor: colors.card }]}>
                            <Ionicons name="share-social-outline" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Share</Text>
                    </TouchableOpacity>
                </View>

                {/* AI Insights banner */}
                {showAIInsights && (
                    <View style={[styles.aiBanner, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF', borderColor: isDarkMode ? '#172554' : '#DBEAFE' }]}>
                        <View style={styles.aiHeader}>
                            <View style={styles.aiTitleRow}>
                                <View style={[styles.aiIconBg, { backgroundColor: isDarkMode ? '#172554' : '#DBEAFE' }]}>
                                    <Ionicons name="sparkles" size={16} color={colors.primary} />
                                </View>
                                <Text style={[styles.aiTitle, { color: isDarkMode ? '#DBEAFE' : '#1E40AF' }]}>AI Insights</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowAIInsights(false)}>
                                <Ionicons name="close" size={20} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.aiInsightItem}>
                            <Ionicons name="bulb-outline" size={18} color={isDarkMode ? '#3B82F6' : '#2563EB'} style={styles.insightIcon} />
                            <Text style={[styles.aiText, { color: isDarkMode ? '#BFDBFE' : '#1E40AF' }]}>
                                {blueprint?.highlights || "Your AI-powered itinerary is ready. Explore the best of Coimbatore with a balanced mix of nature, culture, and food."}
                            </Text>
                        </View>

                        {blueprint?.daily_breakdown?.[0]?.tag && (
                            <View style={styles.aiInsightItem}>
                                <Ionicons name="sparkles-outline" size={18} color={isDarkMode ? '#3B82F6' : '#2563EB'} style={styles.insightIcon} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.aiText, { color: isDarkMode ? '#BFDBFE' : '#1E40AF' }]}>
                                        <Text style={styles.bold}>{blueprint.daily_breakdown[0].tag}</Text> is the theme for Day 1. Perfect for your interests!
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Itinerary Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Itinerary</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {/* Debug Indicator */}
                        <View style={{ paddingHorizontal: 8, paddingVertical: 2, backgroundColor: statusColor + '20', borderRadius: 8, borderWidth: 1, borderColor: statusColor + '50' }}>
                            <Text style={{ fontSize: 10, color: statusColor, fontWeight: '700' }}>
                                {mockLocationState === 'at_event_1' ? 'GPS: Stopped' : mockLocationState === 'moving' ? 'GPS: Moving' : 'GPS: Arrived'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push(`/trip/${id}/itinerary`)}>
                            <Text style={[styles.viewAll, { color: colors.primary }]}>View Full</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Current Activity Card */}
                <TouchableOpacity
                    style={[styles.upNextCard, { backgroundColor: colors.card, borderColor: statusColor, borderWidth: 1 }]}
                    onPress={() => router.push(`/trip/${id}/itinerary`)}
                    onLongPress={handleSimulateMovement}
                >
                    <View style={[styles.upNextSidebar, { backgroundColor: statusColor }]} />
                    <View style={styles.upNextInfo}>
                        <View style={styles.upNextHeader}>
                            <Text style={[styles.todayLabel, { color: colors.textSecondary }]}>{trip?.start_date}</Text>
                            {statusLabel && (
                                <View style={{ backgroundColor: statusColor + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                                    <Text style={{ color: statusColor, fontSize: 10, fontWeight: '700' }}>{statusLabel}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.activityName, { color: colors.text }]}>{currentActivity?.title || 'First Stop'}</Text>
                        <Text style={[styles.activityDesc, { color: colors.textSecondary }]} numberOfLines={1}>{currentActivity?.desc || 'Start your adventure'}</Text>

                        <View style={styles.timeRow}>
                            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                            <Text style={[styles.timeText, { color: colors.textSecondary }]}>{currentActivity?.time || 'Morning'}</Text>
                        </View>

                        {/* Smart Alert / Reschedule Action */}
                        {showAlert && mockLocationState === 'at_event_1' && (
                            <View style={[styles.alertCard, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}>
                                <View style={styles.alertHeader}>
                                    <View style={styles.alertBadge}>
                                        <Ionicons name="notifications" size={14} color="#EF4444" />
                                        <Text style={styles.alertBadgeText}>Smart Alert</Text>
                                    </View>
                                    <Text style={styles.alertSummary}>{alertMessage}</Text>
                                </View>

                                {event2 && (
                                    <View style={styles.nextEventSection}>
                                        <View style={styles.timelineConnector}>
                                            <View style={[styles.connectorDot, { borderColor: isDarkMode ? '#EF4444' : '#FECACA' }]} />
                                            <View style={[styles.connectorLine, { backgroundColor: isDarkMode ? '#EF4444' : '#FECACA' }]} />
                                            <View style={[styles.connectorDot, { backgroundColor: '#EF4444', borderColor: '#EF4444' }]} />
                                        </View>
                                        <View style={styles.nextEventInfo}>
                                            <Text style={[styles.nextEventLabel, { color: colors.textSecondary }]}>Next Activity</Text>
                                            <Text style={[styles.nextEventTitle, { color: colors.text }]}>{event2.title}</Text>
                                            <View style={styles.nextEventMeta}>
                                                <Ionicons name="time" size={12} color="#EF4444" />
                                                <Text style={styles.nextEventTime}>
                                                    {event2.time} • {event2.transport?.duration || (event2 as any)?.transport_duration || "15 min"} {event2.transport?.mode?.toLowerCase() || 'travel'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[styles.rescheduleBtn, { backgroundColor: colors.primary }]}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleReschedule();
                                    }}
                                >
                                    <Ionicons name="calendar-outline" size={16} color="#FFF" />
                                    <Text style={styles.rescheduleBtnText}>Push day by 30 mins</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                    <Image
                        source={{ uri: currentActivity?.image || 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=200' }}
                        style={styles.activityImage}
                    />
                </TouchableOpacity>


                {/* Memory Vault */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Memory Vault</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => router.push(`/trip/${id}/memory-vault`)}>
                        <Ionicons name="camera-outline" size={18} color={colors.primary} />
                        <Text style={[styles.addBtnText, { color: colors.primary }]}>Add</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.vaultGrid}>
                    {folders.map((folder, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.vaultCard, { backgroundColor: colors.card }]}
                            onPress={() => router.push({ pathname: '/trip/[id]/memory-vault', params: { id: id as string, folderName: folder.name } })}
                        >
                            <Image source={{ uri: folder.image }} style={styles.vaultImage} />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.7)']}
                                style={styles.vaultGradient}
                            />
                            {/* Edit Menu Button */}
                            <TouchableOpacity
                                style={styles.editFolderBtn}
                                onPress={(e) => {
                                    e.stopPropagation(); // Prevent navigating when clicking edit
                                    handleEditFolder(idx);
                                }}
                            >
                                <Ionicons name="ellipsis-horizontal" size={20} color="#FFF" />
                            </TouchableOpacity>
                            <View style={styles.vaultInfo}>
                                <View style={styles.vaultTitleRow}>
                                    <Ionicons name={getIconName(folder.icon || 'folder-outline')} size={14} color="#FFF" />
                                    <Text style={styles.vaultTitle} numberOfLines={1}>{folder.name || 'Untitled'}</Text>
                                </View>
                                <Text style={styles.vaultCount}>{folder.count || 0} items</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={[styles.newFolderCard, { borderColor: colors.divider, borderStyle: 'dotted' }]}
                        onPress={handleAddFolder}
                    >
                        <View style={[styles.newFolderIconBg, { backgroundColor: colors.card }]}>
                            <Ionicons name="add" size={24} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.newFolderText, { color: colors.textSecondary }]}>New Folder</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Folder Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {editingIndex !== null ? 'Rename Folder' : 'New Folder'}
                        </Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.divider, backgroundColor: colors.background }]}
                            placeholder="Folder Name"
                            placeholderTextColor={colors.textSecondary}
                            value={folderName}
                            onChangeText={setFolderName}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBtn}>
                                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            {editingIndex !== null && (
                                <TouchableOpacity onPress={handleDeleteFolder} style={[styles.modalBtn, { backgroundColor: '#FEE2E2' }]}>
                                    <Text style={[styles.modalBtnText, { color: '#EF4444' }]}>Delete</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={handleSaveFolder} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Improved Date Edit Modal (Bottom Sheet Style) */}
            <Modal
                visible={isDateModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsDateModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsDateModalVisible(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.bottomSheet, { backgroundColor: colors.card }]}
                    >
                        <View style={styles.sheetHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text, marginTop: 10 }]}>Edit Trip Dates</Text>

                        <View style={styles.dateControlRow}>
                            <View style={styles.dateDisplayBox}>
                                <Text style={styles.dateLabel}>START DATE</Text>
                                <Text style={[styles.dateValue, { color: colors.text }]}>{tempStartDate || trip?.start_date}</Text>
                            </View>
                            <Ionicons name="arrow-forward" size={24} color={colors.divider} />
                            <View style={styles.dateDisplayBox}>
                                <Text style={styles.dateLabel}>END DATE</Text>
                                <Text style={[styles.dateValue, { color: colors.text }]}>{tempEndDate || trip?.end_date}</Text>
                            </View>
                        </View>

                        <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />

                        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Quick Adjustments</Text>

                        <View style={styles.adjustRow}>
                            <TouchableOpacity
                                style={[styles.adjustBtn, { borderColor: colors.divider }]}
                                onPress={() => handleShiftDates(-1)}
                            >
                                <Ionicons name="chevron-back" size={20} color={colors.primary} />
                                <Text style={[styles.adjustBtnText, { color: colors.text }]}>Shift -1 Day</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.adjustBtn, { borderColor: colors.divider }]}
                                onPress={() => handleShiftDates(1)}
                            >
                                <Text style={[styles.adjustBtnText, { color: colors.text }]}>Shift +1 Day</Text>
                                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handleUpdateDates}
                            disabled={isSavingDates}
                            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                        >
                            {isSavingDates ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Text style={styles.confirmBtnText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Share Trip Modal */}
            <Modal
                visible={isShareModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsShareModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsShareModalVisible(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.bottomSheet, { backgroundColor: colors.card }]}
                    >
                        <View style={styles.sheetHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text, marginTop: 10 }]}>Share Trip</Text>

                        <View style={styles.shareOptions}>
                            <TouchableOpacity
                                style={[styles.shareOption, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}
                                onPress={handleShareLink}
                            >
                                <View style={[styles.shareIconContainer, { backgroundColor: '#3B82F6' }]}>
                                    <Ionicons name="link" size={24} color="#FFF" />
                                </View>
                                <Text style={[styles.shareOptionTitle, { color: colors.text }]}>Share Link</Text>
                                <Text style={[styles.shareOptionDesc, { color: colors.textSecondary }]}>Send trip link to friends</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.shareOption, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}
                                onPress={handleSharePDF}
                            >
                                <View style={[styles.shareIconContainer, { backgroundColor: '#EF4444' }]}>
                                    <Ionicons name="document-text" size={24} color="#FFF" />
                                </View>
                                <Text style={[styles.shareOptionTitle, { color: colors.text }]}>Export PDF</Text>
                                <Text style={[styles.shareOptionDesc, { color: colors.textSecondary }]}>Download as a portable guide</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => setIsShareModalVisible(false)}
                            style={[styles.confirmBtn, { backgroundColor: colors.divider, marginTop: 10 }]}
                        >
                            <Text style={[styles.confirmBtnText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
            {connectError && (
                <View style={styles.errorBanner}>
                    <Ionicons name="cloud-offline" size={20} color="#EF4444" />
                    <Text style={styles.errorText}>Server Offline. Check backend or ngrok.</Text>
                </View>
            )}

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, visible: false })}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    errorBanner: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#FECACA',
        zIndex: 100,
    },
    errorText: {
        color: '#B91C1C',
        fontSize: 12,
        fontWeight: '600',
    },
    scrollContent: { paddingBottom: 20 },
    heroSection: {
        height: 300,
        width: '100%',
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    heroHeader: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backBtn: { padding: 8 },
    menuBtn: { padding: 8 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    heroInfo: {
        position: 'absolute',
        bottom: 30,
        left: 20,
    },
    tripTitle: { color: '#FFF', fontSize: 32, fontWeight: '700' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    tripDates: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    actionItem: { alignItems: 'center', gap: 8 },
    actionIconBg: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    actionLabel: { fontSize: 12, fontWeight: '600' },
    aiBanner: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    aiIconBg: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    aiTitle: { fontSize: 15, fontWeight: '700' },
    aiInsightItem: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    insightIcon: { marginTop: 2 },
    aiText: { flex: 1, fontSize: 13, lineHeight: 18 },
    bold: { fontWeight: '700' },
    addLink: { fontSize: 13, fontWeight: '700', marginTop: 8 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '700' },
    viewAll: { fontSize: 14, fontWeight: '600' },
    upNextCard: {
        marginHorizontal: 20,
        borderRadius: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 24,
    },
    upNextSidebar: { width: 6, backgroundColor: '#3B82F6' },
    upNextInfo: { flex: 1, padding: 16 },
    upNextHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    upNextTag: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    upNextTagText: { color: '#16A34A', fontSize: 10, fontWeight: '700' },
    todayLabel: { fontSize: 12 },
    activityName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    activityDesc: { fontSize: 13, marginBottom: 10 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    timeText: { fontSize: 12 },
    activityImage: { width: 80, height: '100%', borderRadius: 8 },
    collabRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    collabLabel: { fontSize: 12 },
    squadList: { flexDirection: 'row', paddingHorizontal: 20, gap: 20, marginBottom: 24 },
    squadMember: { alignItems: 'center', gap: 4 },
    avatarBorder: { padding: 2, borderRadius: 30, borderWidth: 2 },
    avatar: { width: 44, height: 44, borderRadius: 22 },
    squadName: { fontSize: 12, fontWeight: '500' },
    inviteBtn: { alignItems: 'center', gap: 4 },
    inviteIconBg: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderStyle: 'dotted', justifyContent: 'center', alignItems: 'center' },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    addBtnText: { fontSize: 14, fontWeight: '600' },
    vaultGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 },
    vaultCard: { width: (width - 52) / 2, height: 140, borderRadius: 16, overflow: 'hidden', position: 'relative' },
    vaultImage: { width: '100%', height: '100%' },
    vaultGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
    editFolderBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    vaultInfo: { position: 'absolute', bottom: 12, left: 12 },
    vaultTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    vaultTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    vaultCount: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },
    newFolderCard: { width: (width - 52) / 2, height: 140, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    newFolderIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    newFolderText: { fontSize: 12, fontWeight: '600' },
    footer: { position: 'absolute', bottom: 30, left: 0, right: 0, paddingHorizontal: 20 },
    startGuideBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 18,
        borderRadius: 30,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    startGuideText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    removeBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFF',
    },
    profileBtn: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '85%',
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
    },
    bottomSheet: {
        width: '100%',
        padding: 24,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
    },
    sheetHandle: {
        width: 40,
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 3,
        marginBottom: 10,
    },
    dateControlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    dateDisplayBox: {
        alignItems: 'center',
        flex: 1,
    },
    dateLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#999',
        letterSpacing: 1,
        marginBottom: 4,
    },
    dateValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    dividerLine: {
        height: 1,
        width: '100%',
        marginVertical: 20,
    },
    sectionSubtitle: {
        fontSize: 12,
        fontWeight: '700',
        alignSelf: 'flex-start',
        letterSpacing: 1,
        marginBottom: 15,
    },
    adjustRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginBottom: 30,
    },
    adjustBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    adjustBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    confirmBtn: {
        width: '100%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    confirmBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBtnText: {
        fontWeight: '600',
        fontSize: 16,
    },
    shareOptions: {
        width: '100%',
        gap: 12,
        marginVertical: 20,
    },
    shareOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 16,
    },
    shareIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareOptionTitle: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    shareOptionDesc: {
        fontSize: 12,
    },
    // New Alert Styles
    alertCard: {
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    alertHeader: {
        marginBottom: 12,
    },
    alertBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    alertBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    alertSummary: {
        fontSize: 14,
        fontWeight: '700',
        color: '#B91C1C',
    },
    nextEventSection: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    timelineConnector: {
        alignItems: 'center',
        width: 12,
        paddingVertical: 4,
    },
    connectorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 2,
    },
    connectorLine: {
        width: 2,
        flex: 1,
        marginVertical: 2,
    },
    nextEventInfo: {
        flex: 1,
    },
    nextEventLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    nextEventTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    nextEventMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    nextEventTime: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '600',
    },
    rescheduleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    rescheduleBtnText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },
});
