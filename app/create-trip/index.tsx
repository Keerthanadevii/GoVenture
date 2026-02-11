import { Toast } from '@/src/components/Toast';
import { ThemeColors, useTheme } from '@/src/context/ThemeContext';
import { useUser } from '@/src/context/UserContext';
import AuthService from '@/src/services/AuthService';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import api, { API_URL } from '../../src/services/api';
// CURRENCIES will be fetched dynamically

export default function CreateTrip() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { user, updateUserCurrency } = useUser();
  const colors = ThemeColors[theme];

  // Destination & Starting Point
  const [destination, setDestination] = useState('');
  const [destCoords, setDestCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [startingPoint, setStartingPoint] = useState('');
  const [startCoords, setStartCoords] = useState<{ lat: number, lng: number } | null>(null);

  // Dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Calendar
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateTarget, setDateTarget] = useState<'start' | 'end'>('start');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Budget & Currencies
  const [budgetIndex, setBudgetIndex] = useState(1); // 0=Economy, 1=Moderate, 2=Luxury
  const [availableCurrencies, setAvailableCurrencies] = useState<any[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState({ code: 'USD', symbol: '$', name: 'US Dollar' });
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [manualCost, setManualCost] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean, message: string, type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'success' });
  useFocusEffect(
    useCallback(() => {
      const loadDefaults = async () => {
        try {
          const user = await AuthService.getUser();
          if (user) {
            setBudgetIndex(user.budget ?? 1);
            setSelectedInterests(user.interests || []);
            // You could also set pace if needed
          }
        } catch (error) {
          console.error('Failed to load user defaults:', error);
        }
      };

      if (user?.currency_code) {
        const match = availableCurrencies.find(c => c.code === user.currency_code);
        if (match) setSelectedCurrency(match);
      }

      setDestination('');
      setDestCoords(null);
      setStartingPoint('');
      setStartCoords(null);
      setStartDate('');
      setEndDate('');
      // setBudgetIndex(1); // Removed to keep user DNA
      // setSelectedInterests([]); // Removed to keep user DNA
      setSelectedParties(['Couple']);
      setSelectedTransport('Train');
      setManualCost(null);
      setAiSuggestions(null);

      loadDefaults();
    }, [])
  );

  // Sections
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedParties, setSelectedParties] = useState<string[]>(['Couple']);
  const [selectedTransport, setSelectedTransport] = useState<string>('Train');

  // AI Loading State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiPredicting, setIsAiPredicting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

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
    { id: 'Others', label: 'Others', icon: 'ellipsis-horizontal', color: '#F3E8FF' }, // Light purple (vibrant)
  ];

  const parties = [
    { id: 'Solo', icon: 'person', label: 'Solo', color: '#DCFCE7' }, // Very light green
    { id: 'Couple', icon: 'heart', label: 'Couple', color: '#FCE7F3' }, // Very light pink
    { id: 'Family', icon: 'people', label: 'Family', color: '#F3E8FF' }, // Very light violet
    { id: 'Friends', icon: 'people', label: 'Friends', color: '#DBEAFE' }, // Very light blue
  ];

  const transports = [
    { id: 'Walk', icon: 'footsteps-outline', label: 'Walk' },
    { id: 'Bus', icon: 'bus', label: 'Bus' },
    { id: 'Car', icon: 'car-outline', label: 'Car' },
    { id: 'Bike', icon: 'bicycle-outline', label: 'Bike' },
    { id: 'Train', icon: 'train', label: 'Train' },
    { id: 'Flight', icon: 'airplane', label: 'Flight' },
  ];

  // Real AI Prediction Effect
  useEffect(() => {
    const triggerAi = async () => {
      // Relaxed condition: just destination and dates are enough to start suggesting
      const hasBasicInfo = destination.length > 2 && startDate && endDate;

      if (hasBasicInfo) {
        setIsAiPredicting(true);
        try {
          const response = await api.post('/trip/predict', {
            starting_point: startingPoint,
            destination,
            start_date: startDate,
            end_date: endDate,
            interests: selectedInterests,
            travelers: selectedParties,
            currency_code: user?.currency_code || selectedCurrency.code
          });

          const data = response.data;
          setAiSuggestions(data);

          // Auto-fill using the new 'suggested_budget_category'
          if (data.suggested_budget_category === 'Economy') setBudgetIndex(0);
          else if (data.suggested_budget_category === 'Moderate') setBudgetIndex(1);
          else if (data.suggested_budget_category === 'Luxury') setBudgetIndex(2);

          if (data.best_travel_mode) setSelectedTransport(data.best_travel_mode);

          // Match currency from AI prediction
          if (data.currency) {
            const code = data.currency.toUpperCase();
            let match = availableCurrencies.find(c => c.code === code);
            if (!match) {
              // If not in standard list, create ad-hoc currency object
              match = { code, name: code, symbol: getSymbol(code) };
              setAvailableCurrencies(prev => [...prev, match]);
            }
            setSelectedCurrency(match);
            updateUserCurrency(match.code);
          }

          setManualCost(null); // Clear manual if AI suggests new
        } catch (error) {
          console.error('AI Prediction Failed:', error);
        } finally {
          setIsAiPredicting(false);
        }
      }
    };

    // Low debounce for AI prediction
    const timer = setTimeout(triggerAi, 1000);
    return () => clearTimeout(timer);
  }, [startingPoint, destination, startDate, endDate, selectedInterests, selectedParties]);


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

  // Create Trip Handler
  const handleCreateTrip = async () => {
    if (!destination || !startDate || !endDate) {
      alert('Please fill in destination and dates!');
      return;
    }

    setIsAiLoading(true); // Reuse AI loading for submission
    try {
      const tripData = {
        starting_point: startingPoint,
        destination,
        start_date: startDate,
        end_date: endDate,
        interests: selectedInterests,
        parties: selectedParties,
        budget_type: budgetDetails.label,
        budget_value: manualCost !== null ? manualCost : budgetDetails.cost,
        currency_code: selectedCurrency.code,
        transport_mode: selectedTransport,
        lat: destCoords?.lat,
        lng: destCoords?.lng,
        start_lat: startCoords?.lat,
        start_lng: startCoords?.lng,
      };

      const response = await api.post('/trips', tripData);
      console.log('Trip created:', response.data);

      setToast({ visible: true, message: 'Trip Created Successfully! 🌍✨', type: 'success' });
      setTimeout(() => {
        router.replace(`/trip/${response.data.trip.id}/blueprint`);
      }, 1500);
    } catch (error: any) {
      console.error('Error creating trip:', error);
      const msg = error.response?.data?.message || 'Failed to create trip. Please try again.';
      setToast({ visible: true, message: msg, type: 'error' as const });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleReset = () => {
    setDestination('');
    setDestCoords(null);
    setStartingPoint('');
    setStartCoords(null);
    setStartDate('');
    setEndDate('');
    setBudgetIndex(1);
    setSelectedInterests([]);
    setSelectedParties(['Couple']);
    setSelectedTransport('Train');
    setSelectedCurrency(availableCurrencies[0]?.code === 'USD' ? availableCurrencies[0] : { code: 'USD', symbol: '$', name: 'US Dollar' });
    setManualCost(null);
  };

  // Reset Handler

  // Fetch Currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await api.get('/currencies');
        // Response format: { "USD": "United States Dollar", ... }
        const data = response.data;
        if (data && typeof data === 'object') {
          const formatted = Object.keys(data)
            .filter(code => typeof data[code] === 'string') // Only take valid currency names
            .map(code => ({
              code,
              name: data[code],
              symbol: getSymbol(code)
            }));
          setAvailableCurrencies(formatted);

          // Find USD as default if available
          const usd = formatted.find(c => c.code === 'USD');
          if (usd) setSelectedCurrency(usd);
        }
      } catch (error) {
        console.error('Error fetching currencies:', error);
      } finally {
        setIsLoadingCurrencies(false);
      }
    };
    fetchCurrencies();
  }, []);

  const getSymbol = (code: string) => {
    const symbols: any = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'INR': '₹',
      'AUD': 'A$', 'CAD': 'C$', 'CHF': 'Fr', 'CNY': '¥', 'RUB': '₽',
      'KRW': '₩', 'BRL': 'R$', 'SGD': 'S$', 'AED': 'AED'
    };
    return symbols[code] || code;
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

            {isLoadingCurrencies ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
            ) : availableCurrencies.length === 0 ? (
              <Text style={{ textAlign: 'center', color: colors.textSecondary, marginVertical: 20 }}>Failed to load currencies</Text>
            ) : (
              <FlatList
                data={availableCurrencies}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.currencyItem, { borderBottomColor: colors.divider }]}
                    onPress={() => {
                      setSelectedCurrency(item);
                      setShowCurrencyModal(false);
                    }}
                  >
                    <Text style={[styles.currencyText, { color: colors.text }]}>
                      {item.code} - {item.name}
                    </Text>
                    {selectedCurrency.code === item.code && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                )}
                style={{ width: '100%', maxHeight: 400 }}
              />
            )}

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
    const labels = ['Economy', 'Moderate', 'Luxury'];
    const currentLabel = labels[budgetIndex];

    // Calculate total headcount
    let headcount = 0;
    if (selectedParties.includes('Solo')) headcount += 1;
    if (selectedParties.includes('Couple')) headcount += 2;
    if (selectedParties.includes('Family')) headcount += 4;
    if (selectedParties.includes('Friends')) headcount += 3;
    if (headcount === 0) headcount = 1; // Fallback

    const parseCost = (costStr: string) => {
      const match = costStr.match(/(\d+)/);
      return match ? parseInt(match[0]) : 0;
    };

    // Get transport cost from AI suggestions based on selected transport mode
    let transportCost = 0;
    if (aiSuggestions?.travel_options && selectedTransport) {
      const transportOption = aiSuggestions.travel_options[selectedTransport];
      if (transportOption && transportOption.cost) {
        transportCost = Math.round(transportOption.cost);
      }
    }

    // Check if AI provided tiered budgets
    if (aiSuggestions && aiSuggestions.budgets && aiSuggestions.budgets[currentLabel]) {
      const b = aiSuggestions.budgets[currentLabel];
      const baseMin = Math.round(b.min);
      const baseMax = Math.round(b.max);

      // Add transport cost to the total
      const totalMin = (baseMin + transportCost) * headcount;
      const totalMax = (baseMax + transportCost) * headcount;

      return {
        label: currentLabel,
        cost: `${s}${baseMin} - ${s}${baseMax}`,
        color: budgetIndex === 0 ? '#6B7280' : budgetIndex === 1 ? '#3B82F6' : '#F59E0B',
        total: `${s}${totalMin} - ${s}${totalMax}`,
        headcount
      };
    }

    // Fallback values with transport cost
    const fallbackMin = budgetIndex < 0.6 ? 400 : budgetIndex > 1.4 ? 2000 : 800;
    const fallbackMax = budgetIndex < 0.6 ? 800 : budgetIndex > 1.4 ? 4000 : 1200;
    const totalMin = (fallbackMin + transportCost) * headcount;
    const totalMax = (fallbackMax + transportCost) * headcount;

    if (budgetIndex < 0.6) return { label: 'Economy', cost: `${s}400 - ${s}800`, color: '#6B7280', total: `${s}${totalMin} - ${s}${totalMax}`, headcount };
    if (budgetIndex > 1.4) return { label: 'Luxury', cost: `${s}2,000 - ${s}4,000`, color: '#F59E0B', total: `${s}${totalMin} - ${s}${totalMax}`, headcount };
    return { label: 'Moderate', cost: `${s}800 - ${s}1,200`, color: '#3B82F6', total: `${s}${totalMin} - ${s}${totalMax}`, headcount };
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
        <TouchableOpacity onPress={handleReset}>
          <Text style={[styles.resetText, { color: colors.primary }]}>Reset</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            {/* Card 1: Destination & Dates */}
            <View style={[styles.cardContainer, { zIndex: 1000 }]}>
              {/* Starting From */}
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 8 }]}>Starting From</Text>
              <View style={[styles.autocompleteWrapper, { zIndex: 2000, marginBottom: 15 }]}>
                <GooglePlacesAutocomplete
                  placeholder="Current Location / Origin"
                  fetchDetails={true}
                  onPress={(data, details = null) => {
                    setStartingPoint(data.description);
                    if (details?.geometry?.location) {
                      setStartCoords({
                        lat: details.geometry.location.lat,
                        lng: details.geometry.location.lng
                      });
                    }
                  }}
                  requestUrl={{
                    useOnPlatform: 'all',
                    url: `${API_URL}/places`,
                  }}
                  debounce={100}
                  minLength={2}
                  query={{
                    key: 'none',
                    language: 'en',
                  }}
                  renderRow={(data) => {
                    return (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="pin-outline" size={18} color={colors.primary} style={{ marginRight: 12 }} />
                        <Text style={{ fontSize: 16, color: colors.text }}>{data.description}</Text>
                      </View>
                    );
                  }}
                  styles={{
                    container: { flex: 0 },
                    textInput: [styles.input, { color: colors.text, backgroundColor: '#F9FAFB' }],
                    listView: {
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      marginTop: 5,
                      position: 'absolute',
                      top: 50,
                      width: '100%',
                      zIndex: 3000,
                      elevation: 10,
                    },
                  }}
                  enablePoweredByContainer={false}
                />
              </View>

              {/* Destination */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Where to?</Text>
              <View style={[styles.autocompleteWrapper, { zIndex: 1000 }]}>
                <GooglePlacesAutocomplete
                  placeholder="Search destination (e.g. Kyoto)"
                  fetchDetails={true}
                  onPress={(data, details = null) => {
                    console.log('Destination selected:', data.description);
                    setDestination(data.description);
                    if (details?.geometry?.location) {
                      setDestCoords({
                        lat: details.geometry.location.lat,
                        lng: details.geometry.location.lng
                      });
                    }
                  }}
                  onFail={(error) => {
                    console.error('Proxy Search Error details:', error);
                    // Add a small alert for debugging if needed
                  }}
                  requestUrl={{
                    useOnPlatform: 'all',
                    url: `${API_URL}/places`,
                  }}
                  debounce={100}
                  minLength={2}
                  query={{
                    key: 'none',
                    language: 'en',
                    // Removed types restriction to allow POIs, colleges, and global places
                  }}
                  renderRow={(data) => {
                    const parts = data.description.split(',');
                    const mainText = parts[0];
                    const secondaryText = parts.slice(1).join(',').trim();
                    return (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="location-sharp" size={18} color={colors.primary} style={{ marginRight: 12 }} />
                        <View>
                          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{mainText}</Text>
                          {secondaryText ? <Text style={{ fontSize: 13, color: colors.textSecondary }}>{secondaryText}</Text> : null}
                        </View>
                      </View>
                    );
                  }}
                  styles={{
                    container: { flex: 0 },
                    textInput: [styles.input, { color: colors.text, backgroundColor: '#F9FAFB' }],
                    listView: {
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      marginTop: 5,
                      position: 'absolute',
                      top: 50,
                      width: '100%',
                      zIndex: 2000,
                      elevation: 10,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    },
                    description: { color: colors.text },
                    row: { backgroundColor: 'transparent', padding: 15, borderBottomWidth: 0.5, borderBottomColor: colors.divider },
                    predefinedPlacesDescription: { color: colors.primary },
                  }}
                  textInputProps={{
                    placeholderTextColor: colors.textSecondary,
                  }}
                  enablePoweredByContainer={false}
                  keyboardShouldPersistTaps="handled"
                />
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
                      <Text
                        style={[styles.partyLabel, { color: isSelected ? '#1F2937' : colors.textSecondary }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                      >
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {aiSuggestions && aiSuggestions.suggested_budget_category === (budgetIndex === 0 ? 'Economy' : budgetIndex === 1 ? 'Moderate' : 'Luxury') && (
                    <View style={[styles.aiTag, { marginRight: 10 }]}>
                      <Ionicons name="sparkles" size={10} color={colors.primary} />
                      <Text style={[styles.aiTagText, { fontSize: 10 }]}>AI Suggested</Text>
                    </View>
                  )}
                  <TouchableOpacity style={[styles.currencyButton, { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' }]} onPress={() => setShowCurrencyModal(true)}>
                    <Text style={[styles.currencyButtonText, { color: colors.primary }]}>{selectedCurrency.code} ({selectedCurrency.symbol})</Text>
                    <Ionicons name="chevron-down" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
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

              <View style={[styles.costCard, { backgroundColor: '#F9FAFB', marginBottom: 12 }, isAiPredicting && { opacity: 0.7 }]}>
                {/* Inner card style for cost */}
                <View style={[styles.costIconBg, { backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5' }]}>
                  <Text style={[styles.dollarSign, { color: isDarkMode ? '#34D399' : '#10B981' }]}>{selectedCurrency.symbol}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.estCostLabel, { color: '#111827' }]}>{isAiPredicting ? 'AI CALCULATING...' : 'EST. COST'}</Text>
                  <Text style={[styles.estCostSub, { color: '#374151', opacity: 1 }]}>per person</Text>
                </View>
                <View style={styles.costInputWrapper}>
                  <TextInput
                    style={[styles.costValueInput, { color: colors.text }]}
                    value={manualCost !== null ? manualCost : budgetDetails.cost.replace(new RegExp('\\' + selectedCurrency.symbol, 'g'), '')}
                    onChangeText={setManualCost}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              {/* Total Trip Cost Section */}
              <View style={[styles.costCard, { backgroundColor: isDarkMode ? '#1E293B' : '#F0F9FF', borderColor: '#BAE6FD', borderWidth: 1 }]}>
                <View style={[styles.costIconBg, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="calculator" size={16} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.estCostLabel, { color: '#0369A1' }]}>EST. TOTAL TRIP COST</Text>
                  <Text style={[styles.estCostSub, { color: '#075985' }]}>for {budgetDetails.headcount} {budgetDetails.headcount > 1 ? 'travelers' : 'traveler'}</Text>
                </View>
                <View>
                  <Text style={[styles.totalCostValue, { color: '#0369A1', fontWeight: 'bold', fontSize: 16 }]}>
                    {manualCost !== null
                      ? `${selectedCurrency.symbol}${(parseFloat(manualCost) * budgetDetails.headcount).toLocaleString()}`
                      : budgetDetails.total}
                  </Text>
                </View>
              </View>

            </View>

            {/* Card 5: Transport & Footer */}
            <View style={[styles.cardContainer, { marginBottom: 100 }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Best Mode of Travel</Text>
                {isAiPredicting ? (
                  <View style={styles.aiTag}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.aiTagText, { color: colors.primary }]}>Finding best...</Text>
                  </View>
                ) : aiSuggestions && selectedTransport === aiSuggestions.best_travel_mode ? (
                  <View style={styles.aiTag}>
                    <Ionicons name="sparkles" size={12} color={colors.primary} />
                    <Text style={[styles.aiTagText, { color: colors.primary }]}>AI Suggested</Text>
                  </View>
                ) : null}
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
                        aiSuggestions && aiSuggestions.best_travel_mode === item.id && (
                          <View style={styles.bestTag}>
                            <Text style={styles.bestTagText} numberOfLines={1} adjustsFontSizeToFit={true}>BEST</Text>
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
                      <Text
                        style={[styles.transportLabel, { color: isSelected ? colors.primary : colors.text }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                      >
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
                style={[styles.createButton, { backgroundColor: '#8B5CF6' }, isAiLoading && { opacity: 0.7 }]}
                onPress={handleCreateTrip}
                disabled={isAiLoading}
                activeOpacity={0.8}
              >
                {isAiLoading ? (
                  <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
                ) : (
                  <>
                    <Text style={styles.createButtonText}>Create My Trip</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="always"
      />

      {renderCalendar()}
      {renderCurrencyModal()}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
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
  autocompleteWrapper: {
    zIndex: 1000,
    marginBottom: 10,
  },
  input: { flex: 1, fontSize: 16, color: '#111827', padding: 16, borderRadius: 12 },

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
  cardRow: { flexDirection: 'row', gap: 8 },
  partyCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 12, // Reduced from 16
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  partyCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  partyLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', marginTop: 4 }, // Reduced font size and increased weight
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
  totalCostValue: { fontSize: 18, fontWeight: '700', color: '#0369A1' },
  costValue: { marginLeft: 'auto', fontSize: 18, fontWeight: '700', color: '#111827' },

  // Currency Button
  currencyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  currencyButtonText: { color: '#3B82F6', fontSize: 12, fontWeight: '600' },

  // Transport
  aiTag: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center' },
  aiTagText: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },
  transportRow: { flexDirection: 'row', gap: 8 },
  transportCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 8,
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
  transportLabel: { fontSize: 10, fontWeight: '700', color: '#111827', marginTop: 4 },
  transportLabelSelected: { color: '#3B82F6' },
  bestTag: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'center',
    minWidth: 40,
    justifyContent: 'center',
    alignItems: 'center',
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