import {
  moderateScale,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  verticalScale,
} from '@/src/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* CARD SIZE */
const CARD_MARGIN = moderateScale(16);
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;

/* SLIDES */
const SLIDES = [
  require('@/assets/images/sunrise.jpg'),
  require('@/assets/images/route.jpg'),
  require('@/assets/images/map.jpg'),
];

let lastActiveSlide = 0;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [activeSlide, setActiveSlide] = useState<number>(lastActiveSlide);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);

  const scrollStartX = useRef(0);

  /* �️ AUTH CHECK */
  /* Auth check disabled */
  // useEffect(() => {
  //   const checkSession = async () => {
  //     const token = await AuthService.getToken();
  //     if (token) {
  //       router.replace('/(tabs)');
  //     }
  //   };
  //   checkSession();
  // }, []);

  const activeSlideRef = useRef(activeSlide);
  useEffect(() => {
    activeSlideRef.current = activeSlide;
  }, [activeSlide]);

  /* 🔁 AUTOPLAY */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isAutoPlay) {
      interval = setInterval(() => {
        const nextIndex = activeSlideRef.current + 1;
        moveToSlide(nextIndex);
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlay]); // Removed activeSlide dependency

  const moveToSlide = useCallback((index: number) => {
    const safeIndex = (index + SLIDES.length) % SLIDES.length;

    scrollRef.current?.scrollTo({
      x: safeIndex * CARD_WIDTH,
      animated: true,
    });

    setActiveSlide(safeIndex);
    lastActiveSlide = safeIndex;
  }, []);

  /* Restore slide */
  useEffect(() => {
    if (lastActiveSlide > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          x: lastActiveSlide * CARD_WIDTH,
          animated: false,
        });
      }, 50);
    }
  }, []);

  const pauseAutoPlay = () => setIsAutoPlay(false);

  const onScrollBeginDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    pauseAutoPlay();
    scrollStartX.current = e.nativeEvent.contentOffset.x;
  };

  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const diff = e.nativeEvent.contentOffset.x - scrollStartX.current;

    // Threshold to decide swipe
    if (Math.abs(diff) < CARD_WIDTH * 0.15) {
      moveToSlide(activeSlide);
    } else if (diff > 0) {
      moveToSlide(activeSlide + 1);
    } else {
      moveToSlide(activeSlide - 1);
    }

    setIsAutoPlay(true);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + verticalScale(30) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 🌄 IMAGE SLIDER */}
        <View style={styles.heroWrapper}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled
            decelerationRate="fast"
            pagingEnabled={true}
            onScrollBeginDrag={onScrollBeginDrag}
            onScrollEndDrag={onScrollEndDrag}
            scrollEventThrottle={16}
          >
            {SLIDES.map((slide, index) => (
              <View key={index} style={styles.page}>
                <Image
                  source={slide}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Pagination */}
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, activeSlide === i && styles.activeDot]}
            />
          ))}
        </View>
        {/* CONTENT */}
        <View style={styles.content}>
          <Text style={styles.title}>Your Personal</Text>
          <Text style={styles.highlight}>AI Travel Agent</Text>

          <Text style={styles.subtitle}>
            Generate optimized itineraries in seconds using advanced AI
            recommendations tailored just for you.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={() => router.push('/signup')}
          >
            <Text style={styles.primaryText}>Create Free Account</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.secondaryText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ECECEC', // Light gray bg
  },
  scrollContent: {
    paddingBottom: verticalScale(40),
  },
  heroWrapper: {
    height: SCREEN_HEIGHT * 0.5, // 50% height
    marginHorizontal: CARD_MARGIN,
    marginBottom: verticalScale(20),
    borderRadius: moderateScale(32),
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  page: {
    width: CARD_WIDTH,
    height: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(32),
    marginBottom: verticalScale(16),
    justifyContent: 'center', // Center pagination dots
  },
  dot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#CBD5E1',
    marginRight: moderateScale(8),
  },
  activeDot: {
    width: moderateScale(22),
    backgroundColor: '#3B82F6',
  },
  content: {
    paddingHorizontal: moderateScale(32),
    paddingTop: verticalScale(8),
  },
  title: {
    fontSize: moderateScale(30),
    fontWeight: '800',
    color: '#111827',
  },
  highlight: {
    fontSize: moderateScale(30),
    fontWeight: '800',
    color: '#3B82F6',
    marginBottom: verticalScale(12),
  },
  subtitle: {
    fontSize: moderateScale(15),
    color: '#6B7280',
    lineHeight: verticalScale(22),
    marginBottom: verticalScale(28),
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    shadowColor: '#3B82F6',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primaryText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginRight: moderateScale(8),
  },
  secondaryText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: moderateScale(18),
    fontWeight: '600',
  },
});
