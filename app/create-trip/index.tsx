import { ThemeColors, useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CURRENCIES } from '../../src/utils/currencies';

export default function CreateTrip() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const colors = ThemeColors[theme];

  // Destination
  const [destination, setDestination] = useState('');

  // Dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Calendar
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateTarget, setDateTarget] = useState<'start' | 'end'>('start');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Budget
  const [budgetIndex, setBudgetIndex] = useState(1); // 0=Economy, 1=Moderate, 2=Luxury
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]); // Default USD
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [manualCost, setManualCost] = useState<string | null>(null);

  // Sections
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedParties, setSelectedParties] = useState<string[]>(['Couple']);
  const [selectedTransport, setSelectedTransport] = useState<string>('Train');

  // AI Loading State
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Dirty State (for Reset Button)
  const isDirty =
    destination !== '' ||
    startDate !== '' ||
    endDate !== '' ||
    budgetIndex !== 1 ||
    selectedInterests.length > 0 ||
    (selectedParties.length === 1 && selectedParties[0] !== 'Couple') ||
    selectedParties.length > 1 ||
    selectedTransport !== 'Train' ||
    selectedCurrency.code !== 'USD';

  const interests = [
    { id: 'Nature', label: 'Nature', icon: 'leaf', color: '#DCFCE7' }, // Very light green
    { id: 'Foodie', label: 'Foodie', icon: 'restaurant', color: '#FEF9C3' }, // Very light yellow/orange
    { id: 'Culture', label: 'Culture', icon: 'library', color: '#E0E7FF' }, // Very light indigo
    { id: 'Nightlife', label: 'Nightlife', icon: 'wine', color: '#F3E8FF' }, // Very light violet
    { id: 'Relaxing', label: 'Relaxing', icon: 'flower', color: '#FCE7F3' }, // Very light pink
    { id: 'Shopping', label: 'Shopping', icon: 'bag-handle', color: '#FEE2E2' }, // Very light red
  ];

  const parties = [
    { id: 'Solo', icon: 'person', label: 'Solo', color: '#F3F4F6' }, // Very light gray
    { id: 'Couple', icon: 'heart', label: 'Couple', color: '#FCE7F3' }, // Very light pink
    { id: 'Family', icon: 'people', label: 'Family', color: '#F3E8FF' }, // Very light violet
    { id: 'Friends', icon: 'people', label: 'Friends', color: '#DBEAFE' }, // Very light blue
  ];

  const transports = [
    { id: 'Bus', icon: 'bus', label: 'Bus' },
    { id: 'Train', icon: 'train', label: 'Train', recommended: true },
    { id: 'Flight', icon: 'airplane', label: 'Flight' },
  ];

  // AI Simulation Effect
  useEffect(() => {
    if (destination.length > 3) {
      // Simulate AI thinking delay
      setIsAiLoading(true);
      const timer = setTimeout(() => {
        setIsAiLoading(false);
        // Simple deterministic "AI" logic based on string length
        const isFar = destination.length % 2 === 0;
        const isExpensive = destination.toLowerCase().includes('a') || destination.toLowerCase().includes('e');

        // Suggest Transport
        if (isFar) setSelectedTransport('Flight');
        else setSelectedTransport('Train');

        // Suggest Budget
        if (isExpensive) setBudgetIndex(2); // Luxury
        else setBudgetIndex(1); // Moderate

        setManualCost(null); // Reset manual cost when AI suggests new budget
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [destination]);


  const toggleInterest = (label: string) => {
    setSelectedInterests((prev) =>
      prev.includes(label)
        ? prev.filter((i) => i !== label)
        : [...prev, label]
    );
  };

  const toggleParty = (label: string) => {
    if (selectedParties.includes(label)) {
      if (selectedParties.length > 1) {
        setSelectedParties((prev) => prev.filter((p) => p !== label));
      }
    } else {
      setSelectedParties((prev) => [...prev, label]);
    }
  };

  // Reset Handler
  const handleReset = () => {
    setDestination('');
    setStartDate('');
    setEndDate('');
    setBudgetIndex(1);
    setSelectedInterests([]);
    setSelectedParties(['Couple']);
    setSelectedTransport('Train');
    setSelectedCurrency(CURRENCIES[0]);
    setManualCost(null);
  };

  // Calendar helpers
  const openCalendar = (target: 'start' | 'end') => {
    setDateTarget(target);
    setShowCalendar(true);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const handleDateSelect = (date: Date) => {
    // Format: DD Month YYYY (e.g. 12 Oct 2025)
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()].substring(0, 3);
    const year = date.getFullYear();
    const formatted = `${day} ${month} ${year}`;

    dateTarget === 'start' ? setStartDate(formatted) : setEndDate(formatted);
    setShowCalendar(false);
  };

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const renderCalendar = () => {
    if (!showCalendar) return null;

    const days = getDaysInMonth(currentMonth);

    return (
      <Modal transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.calendarModal, { backgroundColor: colors.card }]}>

            {/* Calendar Header with Navigation */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>
                {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <Ionicons name="chevron-forward" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Weekday Labels */}
            <View style={styles.weekRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Text key={index} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {days.map((d, i) =>
                d ? (
                  <TouchableOpacity
                    key={i}
                    style={styles.calendarDay}
                    onPress={() => handleDateSelect(d)}
                  >
                    <Text style={[styles.dayText, { color: colors.text }]}>{d.getDate()}</Text>
                  </TouchableOpacity>
                ) : (
                  <View key={i} style={styles.calendarDayEmpty} />
                )
              )}
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCalendar(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderCurrencyModal = () => {
    if (!showCurrencyModal) return null;
    return (
      <Modal transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.currencyModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Currency</Text>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.currencyItem, { borderBottomColor: colors.divider }]}
                  onPress={() => {
                    setSelectedCurrency(item);
                    setShowCurrencyModal(false);
                  }}
                >
                  <Text style={[styles.currencyText, { color: colors.text }]}>{item.code} ({item.symbol}) - {item.name}</Text>
                  {selectedCurrency.code === item.code && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              )}
              style={{ width: '100%', maxHeight: 400 }}
            />
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCurrencyModal(false)}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }

  const getBudgetDetails = () => {
    const s = selectedCurrency.symbol;
    // Simple placeholder logic for value scaling could be added here, 
    // but typically users just want the symbol changed.
    if (budgetIndex < 0.6) return { label: 'Economy', cost: `${s}400 - ${s}800`, color: '#6B7280' };
    if (budgetIndex > 1.4) return { label: 'Luxury', cost: `${s}2,000 - ${s}4,000`, color: '#F59E0B' };
    return { label: 'Moderate', cost: `${s}800 - ${s}1,200`, color: '#3B82F6' };
  };

  const budgetDetails = getBudgetDetails();

  return (
    <ImageBackground
      source={require('../../assets/images/scooty.jpg')}
      style={styles.container}
      resizeMode="cover"
      blurRadius={3} // Blurs the background details
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Adventure</Text>
        <TouchableOpacity onPress={handleReset} disabled={!isDirty}>
          <Text style={[styles.resetText, isDirty && [styles.resetTextActive, { color: colors.primary }]]}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Card 1: Destination & Dates */}
        <View style={styles.cardContainer}>
          {/* Destination */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Where to?</Text>
          <View style={[styles.searchContainer, { backgroundColor: '#F9FAFB', borderColor: 'transparent' }]}>
            {/* Using slightly gray input bg inside white card */}
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder="Search destination (e.g. Kyoto)"
              style={[styles.input, { color: colors.text }]}
              placeholderTextColor={colors.textSecondary}
            />
            <Ionicons name="mic-outline" size={20} color={colors.textSecondary} />
          </View>

          {/* Dates */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>When?</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.dateInput, { backgroundColor: '#F9FAFB', borderColor: 'transparent' }]}
              onPress={() => openCalendar('start')}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={startDate ? [styles.dateText, { color: colors.text }] : [styles.placeholderText, { color: colors.textSecondary }]}>
                {startDate || 'Start Date'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateInput, { backgroundColor: '#F9FAFB', borderColor: 'transparent' }]}
              onPress={() => openCalendar('end')}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={endDate ? [styles.dateText, { color: colors.text }] : [styles.placeholderText, { color: colors.textSecondary }]}>
                {endDate || 'End Date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 2: Interests */}
        <View style={styles.cardContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Select all that apply</Text>
          </View>
          <View style={styles.chipContainer}>
            {interests.map((item) => {
              const isSelected = selectedInterests.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  //@ts-ignore
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? item.color : '#F3F4F6', // Light gray default
                      borderColor: 'transparent',
                      borderWidth: 1
                    }
                  ]}
                  onPress={() => toggleInterest(item.id)}
                >
                  <Ionicons
                    //@ts-ignore
                    name={isActiveIcon(item.id, item.icon)}
                    size={16}
                    color={isSelected ? '#1F2937' : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.chipText, { color: isSelected ? '#1F2937' : colors.textSecondary }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Card 3: Who's Going */}
        <View style={styles.cardContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Who's going?</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Multiple allowed</Text>
          </View>
          <View style={styles.cardRow}>
            {parties.map((item) => {
              const isSelected = selectedParties.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.partyCard,
                    {
                      backgroundColor: isSelected ? item.color : '#F3F4F6',
                      borderColor: 'transparent',
                      borderWidth: 2
                    }
                  ]}
                  onPress={() => toggleParty(item.id)}
                >
                  {isSelected && <View style={[styles.blueDot, { backgroundColor: '#1F2937' }]} />}
                  <Ionicons
                    //@ts-ignore
                    name={item.icon}
                    size={24}
                    color={isSelected ? '#1F2937' : colors.textSecondary}
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={[styles.partyLabel, { color: isSelected ? '#1F2937' : colors.textSecondary }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Card 4: Budget */}
        <View style={styles.cardContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Budget</Text>
            <TouchableOpacity style={[styles.currencyButton, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' }]} onPress={() => setShowCurrencyModal(true)}>
              <Text style={[styles.currencyButtonText, { color: colors.primary }]}>{selectedCurrency.code} ({selectedCurrency.symbol})</Text>
              <Ionicons name="chevron-down" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.sliderContainer}>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={2}
              step={1}
              value={budgetIndex}
              onValueChange={setBudgetIndex}
              minimumTrackTintColor={colors.divider}
              maximumTrackTintColor={colors.divider}
              thumbTintColor={colors.primary}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>Economy</Text>
              <Text style={styles.sliderLabelText}>Moderate</Text>
              <Text style={styles.sliderLabelText}>Luxury</Text>
            </View>
          </View>

          <View style={[styles.costCard, { backgroundColor: '#F9FAFB' }, isAiLoading && { opacity: 0.7 }]}>
            {/* Inner card style for cost */}
            <View style={[styles.costIconBg, { backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5' }]}>
              <Text style={[styles.dollarSign, { color: isDarkMode ? '#34D399' : '#10B981' }]}>{selectedCurrency.symbol}</Text>
            </View>
            <View>
              <Text style={[styles.estCostLabel, { color: '#111827' }]}>{isAiLoading ? 'AI CALCULATING...' : 'EST. COST'}</Text>
              <Text style={[styles.estCostSub, { color: '#374151', opacity: 1 }]}>per person</Text>
            </View>
            <View style={styles.costInputWrapper}>
              <TextInput
                style={[styles.costValueInput, { color: colors.text }]}
                value={manualCost !== null ? manualCost : budgetDetails.cost.replace(selectedCurrency.symbol, '')}
                onChangeText={setManualCost}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Card 5: Transport & Footer */}
        <View style={[styles.cardContainer, { marginBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Best Mode of Travel</Text>
            {isAiLoading ? (
              <View style={styles.aiTag}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.aiTagText, { color: colors.primary }]}>Finding best...</Text>
              </View>
            ) : (
              <View style={styles.aiTag}>
                <Ionicons name="sparkles" size={12} color={colors.primary} />
                <Text style={[styles.aiTagText, { color: colors.primary }]}>AI Suggested</Text>
              </View>
            )}
          </View>
          <View style={styles.transportRow}>
            {transports.map((item) => {
              const isSelected = selectedTransport === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.transportCard,
                    {
                      backgroundColor: isSelected ? '#EFF6FF' : '#F9FAFB',
                      borderColor: isSelected ? colors.primary : 'transparent'
                    }
                  ]}
                  onPress={() => setSelectedTransport(item.id)}
                >
                  {
                    // @ts-ignore
                    item.recommended && isSelected && (
                      <View style={styles.bestTag}>
                        <Text style={styles.bestTagText}>BEST</Text>
                      </View>
                    )
                  }
                  {isSelected && <View style={[styles.blueDot, { backgroundColor: colors.primary }]} />}
                  <Ionicons
                    //@ts-ignore
                    name={item.icon}
                    size={24}
                    color={isSelected ? colors.primary : colors.textSecondary}
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={[styles.transportLabel, { color: isSelected ? colors.primary : colors.text }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={styles.aiFooter}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text style={[styles.aiFooterText, { color: colors.textSecondary }]}>AI is ready to plan your trip</Text>
          </View>

          {/* Submit Button Inside or Outside Card? Design implies outside usually, but let's keep it clean at bottom */}
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => router.push('/trip/1')}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>Create My Trip</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {renderCalendar()}
      {renderCurrencyModal()}
    </ImageBackground>
  );
}

// Helper for dynamic icons if needed (simple implementation)
function isActiveIcon(id: string, icon: string) {
  if (id === 'Nature') return 'leaf';
  return icon;
}


const styles = StyleSheet.create({
  container: { flex: 1 }, // Background handled by Gradient
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // More opaque for better readability
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF', // White border for glass edge
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  resetText: { color: '#9CA3AF', fontWeight: '500' },
  resetTextActive: { color: '#3B82F6', fontWeight: '700' },
  content: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#111827' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  sectionSubtitle: { fontSize: 12, color: '#6B7280' },

  searchContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: { flex: 1, fontSize: 16, color: '#111827' },

  row: { flexDirection: 'row', gap: 12 },
  dateInput: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: { color: '#111827', fontWeight: '500' },
  placeholderText: { color: '#9CA3AF' },

  // Chips
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  chipText: { fontSize: 14, fontWeight: '500', color: '#4B5563' },
  chipTextSelected: { color: '#FFF' },

  // Party Cards
  cardRow: { flexDirection: 'row', gap: 12 },
  partyCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  partyCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  partyLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginTop: 4 },
  partyLabelSelected: { color: '#3B82F6' },
  blueDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },

  // Budget
  budgetTag: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  budgetTagText: { color: '#3B82F6', fontSize: 12, fontWeight: '600' },
  sliderContainer: { marginBottom: 16 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  sliderLabelText: { fontSize: 12, color: '#111827', fontWeight: '600' },

  costCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  costIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dollarSign: { color: '#10B981', fontSize: 18, fontWeight: '700' },
  estCostLabel: { fontSize: 10, color: '#6B7280', fontWeight: '700', letterSpacing: 0.5 },
  estCostSub: { fontSize: 10, color: '#9CA3AF' },
  costInputWrapper: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' },
  costValueInput: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'right', minWidth: 80 },
  costValue: { marginLeft: 'auto', fontSize: 18, fontWeight: '700', color: '#111827' },

  // Currency Button
  currencyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  currencyButtonText: { color: '#3B82F6', fontSize: 12, fontWeight: '600' },

  // Transport
  aiTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aiTagText: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },
  transportRow: { flexDirection: 'row', gap: 12 },
  transportCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  transportCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  transportLabel: { fontSize: 12, fontWeight: '600', color: '#111827' },
  transportLabelSelected: { color: '#3B82F6' },
  bestTag: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bestTagText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  aiFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginVertical: 24 },
  aiFooterText: { color: '#4B5563', fontSize: 13 },

  createButton: {
    backgroundColor: '#1D85E6', // A nice blue
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#1D85E6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  createButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700', marginRight: 8 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: '#FFF',
    width: '90%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  currencyModal: {
    backgroundColor: '#FFF',
    width: '80%',
    maxHeight: '60%',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, textAlign: 'center' },
  currencyItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  currencyText: { fontSize: 16, color: '#374151' },

  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  calendarTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  weekRow: { flexDirection: 'row', width: '100%', marginBottom: 10, justifyContent: 'space-around' },
  weekDayText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', width: '14.28%', textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  calendarDay: { width: '14.28%', padding: 10, alignItems: 'center', justifyContent: 'center' },
  calendarDayEmpty: { width: '14.28%' },
  dayText: { fontSize: 16, color: '#111827' },
  cancelBtn: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'center' },
  cancelBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
});