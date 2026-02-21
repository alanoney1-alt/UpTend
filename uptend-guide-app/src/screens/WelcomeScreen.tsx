import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Dimensions, KeyboardAvoidingView, Platform, useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAGLINE = 'Snap a photo, hire a pro, get it fixed. Now.';

const CAROUSEL_SLIDES = [
  { emoji: '📸', title: 'Snap a photo of anything', desc: 'Messy yard? Broken fence? Clogged gutter?\nJust take a picture.' },
  { emoji: '🤖', title: 'AI quotes it instantly', desc: 'George analyzes the photo and gives you\na price in seconds.' },
  { emoji: '⚡', title: 'Pro arrives, gets it done', desc: 'Verified pros near you accept the job\nand show up ready to work.' },
];

const FLOATING_ICONS = ['🌱', '🔧', '💦', '🏠', '🗑', '🔨', '🪣', '⚡', '🪜', '🧹'];

interface WelcomeScreenProps { navigation?: any; onComplete?: () => void; }

export default function WelcomeScreen({ navigation, onComplete }: WelcomeScreenProps) {
  const dark = useColorScheme() === 'dark';
  const [page, setPage] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [address, setAddress] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const floatAnims = useRef(FLOATING_ICONS.map(() => ({
    x: new Animated.Value(Math.random() * SCREEN_WIDTH),
    y: new Animated.Value(Math.random() * 600),
    opacity: new Animated.Value(Math.random() * 0.3 + 0.1),
  }))).current;

  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  useEffect(() => {
    if (page !== 0) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i <= TAGLINE.length) { setTypedText(TAGLINE.slice(0, i)); i++; } else { clearInterval(interval); }
    }, 45);
    return () => clearInterval(interval);
  }, [page]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    floatAnims.forEach((anim) => {
      const duration = 3000 + Math.random() * 4000;
      Animated.loop(Animated.sequence([
        Animated.parallel([
          Animated.timing(anim.y, { toValue: -50, duration, useNativeDriver: true }),
          Animated.timing(anim.opacity, { toValue: 0, duration, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(anim.y, { toValue: 600 + Math.random() * 200, duration: 0, useNativeDriver: true }),
          Animated.timing(anim.opacity, { toValue: Math.random() * 0.3 + 0.1, duration: 0, useNativeDriver: true }),
        ]),
      ])).start();
    });
  }, []);

  const animateToPage = (p: number) => {
    Animated.timing(slideAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
    setPage(p);
    Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
  };

  const scaleIn = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });

  if (page === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        {FLOATING_ICONS.map((icon, i) => (
          <Animated.Text key={i} style={{ position: 'absolute', fontSize: 24, transform: [{ translateX: floatAnims[i].x }, { translateY: floatAnims[i].y }], opacity: floatAnims[i].opacity }}>{icon}</Animated.Text>
        ))}
        <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, opacity: fadeAnim }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#fff', fontSize: 44, fontWeight: '800' }}>U</Text>
          </View>
          <Text accessibilityRole="header" style={{ fontSize: 40, fontWeight: '800', color: colors.primary, letterSpacing: -1, marginBottom: spacing.lg }}>UpTend</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 28 }}>
            <Text style={{ fontSize: 18, color: mutedColor, textAlign: 'center', lineHeight: 26 }}>{typedText}</Text>
            <Text style={{ fontSize: 18, color: colors.primary, fontWeight: '300' }}>|</Text>
          </View>
        </Animated.View>
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: 20, gap: 12, alignItems: 'center' }}>
          <Button variant="primary" size="lg" fullWidth onPress={() => animateToPage(1)}>Get Started</Button>
          <TouchableOpacity onPress={() => navigation?.navigate('Login')} style={{ paddingVertical: 8 }} accessibilityRole="link" accessibilityLabel="Sign in">
            <Text style={{ fontSize: 15, color: mutedColor }}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (page === 1) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <Animated.View style={{ flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, justifyContent: 'space-between', opacity: slideAnim, transform: [{ scale: scaleIn }] }}>
          <TouchableOpacity style={{ alignSelf: 'flex-end', paddingVertical: 12 }} onPress={() => animateToPage(2)} accessibilityRole="button" accessibilityLabel="Skip">
            <Text style={{ fontSize: 16, color: mutedColor, fontWeight: '600' }}>Skip</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: dark ? colors.surfaceDark : '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
              <Text style={{ fontSize: 72 }}>{CAROUSEL_SLIDES[carouselIndex].emoji}</Text>
            </View>
            <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '800', color: textColor, textAlign: 'center', marginBottom: 12 }}>{CAROUSEL_SLIDES[carouselIndex].title}</Text>
            <Text style={{ fontSize: 16, color: mutedColor, textAlign: 'center', lineHeight: 24 }}>{CAROUSEL_SLIDES[carouselIndex].desc}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.xl }}>
            {CAROUSEL_SLIDES.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setCarouselIndex(i)}>
                <View style={{ width: i === carouselIndex ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === carouselIndex ? colors.primary : (dark ? colors.borderDark : colors.border) }} />
              </TouchableOpacity>
            ))}
          </View>
          <Button variant="primary" size="lg" fullWidth onPress={() => {
            if (carouselIndex < CAROUSEL_SLIDES.length - 1) setCarouselIndex(carouselIndex + 1);
            else animateToPage(2);
          }}>
            {carouselIndex < CAROUSEL_SLIDES.length - 1 ? 'Next' : 'Continue'}
          </Button>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, gap: 16, alignItems: 'center', opacity: slideAnim, transform: [{ scale: scaleIn }] }}>
          <Text style={{ fontSize: 56, marginBottom: 8 }}>🏠</Text>
          <Text accessibilityRole="header" style={{ fontSize: 32, fontWeight: '800', color: textColor, textAlign: 'center' }}>Where's home?</Text>
          <Text style={{ fontSize: 16, color: mutedColor, textAlign: 'center', lineHeight: 24, marginBottom: 8 }}>
            This helps us find pros near you and personalize your experience
          </Text>
          <Input placeholder="Enter your address" value={address} onChangeText={setAddress} autoFocus accessibilityLabel="Home address" />
          <Button variant="primary" size="lg" fullWidth onPress={() => onComplete?.()} disabled={!address.trim()}>Let's Go</Button>
          <TouchableOpacity onPress={() => onComplete?.()} style={{ paddingVertical: 8 }} accessibilityRole="button" accessibilityLabel="Skip for now">
            <Text style={{ fontSize: 15, color: mutedColor }}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
