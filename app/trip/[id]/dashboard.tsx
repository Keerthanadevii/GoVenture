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
    Switch,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { useState } from 'react';
import { useTheme, ThemeColors } from '@/src/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function TripDashboard() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { theme, isDarkMode } = useTheme();
    const colors = ThemeColors[theme];
    const [isCollaborative, setIsCollaborative] = useState(false);
    const [showAIInsights, setShowAIInsights] = useState(true);

    const [folders, setFolders] = useState([
        { name: 'Food', count: 12, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=400', icon: 'restaurant' },
        { name: 'Scenery', count: 48, image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=400', icon: 'image' },
        { name: 'Tickets', count: 3, image: 'https://images.unsplash.com/photo-1544731612-de7f96afe55f?q=80&w=400', icon: 'ticket' },
    ]);

    const [squad, setSquad] = useState([
        { id: 1, name: 'You', image: 'https://i.pravatar.cc/150?u=you' },
        { id: 2, name: 'Mike', image: 'https://i.pravatar.cc/150?u=mike' },
        { id: 3, name: 'Sarah', image: 'https://i.pravatar.cc/150?u=sarah' },
    ]);

    const handleRemoveMember = (id: number) => {
        setSquad(prev => prev.filter(member => member.id !== id));
    };

    // Folder Management State
    const [modalVisible, setModalVisible] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const handleAddFolder = () => {
        setFolderName('');
        setEditingIndex(null);
        setModalVisible(true);
    };

    const handleEditFolder = (index: number) => {
        setFolderName(folders[index].name);
        setEditingIndex(index);
        setModalVisible(true);
    };

    const handleSaveFolder = () => {
        if (!folderName.trim()) {
            Alert.alert('Error', 'Please enter a folder name');
            return;
        }

        if (editingIndex !== null) {
            // Rename existing
            const updatedFolders = [...folders];
            updatedFolders[editingIndex].name = folderName;
            setFolders(updatedFolders);
        } else {
            // Create new
            const newFolder = {
                name: folderName,
                count: 0,
                image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400', // Default image
                icon: 'folder'
            };
            //@ts-ignore
            setFolders(prev => [...prev, newFolder]);
        }
        setModalVisible(false);
    };

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
                                onPress={() => router.push('/profile')}
                                style={[styles.profileBtn, { backgroundColor: 'rgba(255,255,255,0.2)', padding: 2, borderRadius: 20 }]}
                            >
                                <Ionicons name="person-circle" size={32} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.heroInfo}>
                        <Text style={styles.tripTitle}>Tokyo Tech Tour</Text>
                        <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={16} color="#FFF" />
                            <Text style={styles.tripDates}>Oct 12 - Oct 20, 2024</Text>
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
                    <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/create-trip')}>
                        <View style={[styles.actionIconBg, { backgroundColor: colors.card }]}>
                            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Dates</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionItem}>
                        <View style={[styles.actionIconBg, { backgroundColor: colors.card }]}>
                            <Ionicons name="download-outline" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Offline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionItem}>
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
                            <Ionicons name="cloud-outline" size={18} color={isDarkMode ? '#3B82F6' : '#2563EB'} style={styles.insightIcon} />
                            <Text style={[styles.aiText, { color: isDarkMode ? '#BFDBFE' : '#1E40AF' }]}>
                                Heavy rain predicted tomorrow afternoon. Consider swapping the outdoor garden walk with the indoor Digital Art Museum?
                            </Text>
                        </View>

                        <View style={styles.aiInsightItem}>
                            <Ionicons name="calendar-outline" size={18} color={isDarkMode ? '#3B82F6' : '#2563EB'} style={styles.insightIcon} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.aiText, { color: isDarkMode ? '#BFDBFE' : '#1E40AF' }]}>
                                    <Text style={styles.bold}>Jazz Night at Blue Note</Text> is happening nearby on Oct 14. Would you like to add it?
                                </Text>
                                <TouchableOpacity>
                                    <Text style={[styles.addLink, { color: colors.primary }]}>+ Add to Itinerary</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Itinerary Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Itinerary</Text>
                    <TouchableOpacity onPress={() => router.push(`/trip/${id}/itinerary`)}>
                        <Text style={[styles.viewAll, { color: colors.primary }]}>View Full</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.upNextCard, { backgroundColor: colors.card }]}
                    onPress={() => router.push(`/trip/${id}/itinerary`)}
                >
                    <View style={styles.upNextSidebar} />
                    <View style={styles.upNextInfo}>
                        <View style={styles.upNextHeader}>
                            <View style={styles.upNextTag}>
                                <Text style={styles.upNextTagText}>Up Next</Text>
                            </View>
                            <Text style={[styles.todayLabel, { color: colors.textSecondary }]}>Today, Oct 14</Text>
                        </View>
                        <Text style={[styles.activityName, { color: colors.text }]}>TeamLabs Planets</Text>
                        <Text style={[styles.activityDesc, { color: colors.textSecondary }]}>Interactive Digital Art Museum</Text>
                        <View style={styles.timeRow}>
                            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                            <Text style={[styles.timeText, { color: colors.textSecondary }]}>2:00 PM - 5:00 PM</Text>
                        </View>
                    </View>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=200' }}
                        style={styles.activityImage}
                    />
                </TouchableOpacity>

                {/* Travel Squad */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Travel Squad</Text>
                    <View style={styles.collabRow}>
                        <Text style={[styles.collabLabel, { color: colors.textSecondary }]}>Collaborative</Text>
                        <Switch
                            value={isCollaborative}
                            onValueChange={setIsCollaborative}
                            trackColor={{ false: '#767577', true: colors.primary + '80' }}
                            thumbColor={isCollaborative ? colors.primary : '#f4f3f4'}
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                        />
                    </View>
                </View>

                <View style={styles.squadList}>
                    <TouchableOpacity style={styles.inviteBtn} onPress={() => alert('Invite link copied to clipboard!')}>
                        <View style={[styles.inviteIconBg, { borderColor: colors.divider }]}>
                            <Ionicons name="add" size={24} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.squadName, { color: colors.textSecondary }]}>Invite</Text>
                    </TouchableOpacity>
                    {squad.map((member, idx) => (
                        <View key={idx} style={styles.squadMember}>
                            <View style={[styles.avatarBorder, { borderColor: colors.primary }]}>
                                <Image source={{ uri: member.image }} style={styles.avatar} />
                                {member.id !== 1 && (
                                    <TouchableOpacity
                                        style={styles.removeBadge}
                                        onPress={() => handleRemoveMember(member.id)}
                                    >
                                        <Ionicons name="close" size={10} color="#FFF" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Text style={[styles.squadName, { color: colors.text }]}>{member.name}</Text>
                        </View>
                    ))}
                </View>

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
                                    <Ionicons name={folder.icon as any} size={14} color="#FFF" />
                                    <Text style={styles.vaultTitle}>{folder.name}</Text>
                                </View>
                                <Text style={styles.vaultCount}>{folder.count} items</Text>
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

            {/* Start Guide Button */}
            <View style={[styles.footer, { backgroundColor: colors.background }]}>
                <TouchableOpacity style={[styles.startGuideBtn, { backgroundColor: colors.primary }]}>
                    <Ionicons name="navigate" size={20} color="#FFF" />
                    <Text style={styles.startGuideText}>Start Guide</Text>
                </TouchableOpacity>
            </View>
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
                            <TouchableOpacity onPress={handleSaveFolder} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
        width: '100%',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        elevation: 5,
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
});
