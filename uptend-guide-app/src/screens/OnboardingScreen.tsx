import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Dimensions, FlatList,
  Animated, NativeSyntheticEvent, NativeScrollEvent, useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';

const { width } = Dimensions.get('window');

interface Slide { id: string; emoji: string; title: string; subtitle: string; bgColor: string; bgColorDark: string; }

const SLIDES: Slide[] = [
  { id: '1', emoji: '🏠✨', title: 'Meet Mr. George', subtitle: 'Your AI-powered home concierge. Just chat to get instant quotes, book pros, and manage your entire home.', bgColor: '#FFFBF5', bgColorDark: '#1A1A2E' },
  { id: '2', emoji: '🔧', title: '12 Services, One App', subtitle: 'From junk removal to lawn care, cleaning to handyman — 12 essential home services at your fingertips.', bgColor: '#FFF7ED', bgColorDark: '#2D2640' },
  { id: '3', emoji: '📍', title: 'Real-Time Tracking', subtitle: 'Uber-like tracking for every job. See your pro en route, watch progress live, and get instant updates.', bgColor: '#FFFBF5', bgColorDark: '#3B1D5A' },
  { id: '4', emoji: '🛡️', title: 'You Are Protected', subtitle: '$1M liability coverage on every job. All pros are background-checked, verified, and insured.', bgColor: '#FFF7ED', bgColorDark: '#1F2937' },
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const dark = useColorScheme() === 'dark';
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false });
  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const textColor = dark ? colors.textDark : colors.text;

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={{ width, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, backgroundColor: dark ? item.bgColorDark : item.bgColor }}>
      <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(245,158,11,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xxl, borderWidth: 2, borderColor: 'rgba(245,158,11,0.3)' }}>
        <Text style={{ fontSize: 64 }}>{item.emoji}</Text>
      </View>
      <Text accessibilityRole="header" style={{ fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: spacing.md, color: textColor }}>{item.title}</Text>
      <Text style={{ color: dark ? 'rgba(255,255,255,0.85)' : colors.textMuted, textAlign: 'center', lineHeight: 26, fontSize: 17, paddingHorizontal: 8 }}>{item.subtitle}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? colors.backgroundDark : '#FFFBF5' }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
        <TouchableOpacity onPress={onComplete} style={{ padding: spacing.sm }} accessibilityRole="button" accessibilityLabel="Skip onboarding">
          <Text style={{ fontSize: 16, fontWeight: '600', color: dark ? 'rgba(255,255,255,0.7)' : colors.textMuted }}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onScroll={onScroll} onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16} bounces={false}
      />

      {/* Dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: spacing.xl }}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
          return <Animated.View key={i} style={{ height: 8, borderRadius: 4, width: dotWidth, opacity, backgroundColor: colors.primary }} />;
        })}
      </View>

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
        <Button variant="primary" size="lg" fullWidth onPress={goNext}>
          {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </SafeAreaView>
  );
}
