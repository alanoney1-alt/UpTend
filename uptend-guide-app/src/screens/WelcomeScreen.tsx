import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions,
  TextInput, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TAGLINE = 'Snap a photo, hire a pro, get it fixed. Now.';

const CAROUSEL_SLIDES = [
  { emoji: '📸', title: 'Snap a photo of anything', desc: 'Messy yard? Broken fence? Clogged gutter?\nJust take a picture.' },
  { emoji: '🤖', title: 'AI quotes it instantly', desc: 'Our Guide analyzes the photo and gives you\na price in seconds.' },
  { emoji: '⚡', title: 'Pro arrives, gets it done', desc: 'Verified pros near you accept the job\nand show up ready to work.' },
];

const FLOATING_ICONS = ['🌱', '🔧', '💦', '🏠', '🗑', '🔨', '🪣', '⚡', '🪜', '🧹'];

interface WelcomeScreenProps {
  navigation?: any;
  onComplete?: () => void;
}

export default function WelcomeScreen({ navigation, onComplete }: WelcomeScreenProps) {
  const [page, setPage] = useState(0); // 0=splash, 1=carousel, 2=address
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

  // Typewriter effect
  useEffect(() => {
    if (page !== 0) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i <= TAGLINE.length) {
        setTypedText(TAGLINE.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [page]);

  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  // Floating icon animations
  useEffect(() => {
    floatAnims.forEach((anim, i) => {
      const duration = 3000 + Math.random() * 4000;
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(anim.y, { toValue: -50, duration, useNativeDriver: true }),
            Animated.timing(anim.opacity, { toValue: 0, duration, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(anim.y, { toValue: 600 + Math.random() * 200, duration: 0, useNativeDriver: true }),
            Animated.timing(anim.opacity, { toValue: Math.random() * 0.3 + 0.1, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    });
  }, []);

  const animateToPage = (p: number) => {
    Animated.timing(slideAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
    setPage(p);
    Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
  };

  const handleGetStarted = () => animateToPage(1);
  const handleSkipToApp = () => onComplete?.();
  const handleAddressSubmit = () => onComplete?.();
  const handleSignIn = () => navigation?.navigate('Login');

  const scaleIn = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });

  // --- PAGE 0: Splash ---
  if (page === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Floating background icons */}
        {FLOATING_ICONS.map((icon, i) => (
          <Animated.Text
            key={i}
            style={[styles.floatingIcon, {
              transform: [{ translateX: floatAnims[i].x }, { translateY: floatAnims[i].y }],
              opacity: floatAnims[i].opacity,
            }]}
          >
            {icon}
          </Animated.Text>
        ))}

        <Animated.View style={[styles.splashContent, { opacity: fadeAnim }]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>U</Text>
          </View>
          <Text style={styles.logoTitle}>UpTend</Text>
          <View style={styles.taglineContainer}>
            <Text style={styles.tagline}>{typedText}</Text>
            <Text style={styles.cursor}>|</Text>
          </View>
        </Animated.View>

        <View style={styles.splashBottom}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleGetStarted} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignIn} style={styles.linkBtn}>
            <Text style={styles.linkText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- PAGE 1: Carousel ---
  if (page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.carouselContent, { opacity: slideAnim, transform: [{ scale: scaleIn }] }]}>
          {/* Skip button */}
          <TouchableOpacity style={styles.skipBtn} onPress={() => animateToPage(2)}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          {/* Current slide */}
          <View style={styles.slideContainer}>
            <View style={styles.slideIllustration}>
              <Text style={styles.slideEmoji}>{CAROUSEL_SLIDES[carouselIndex].emoji}</Text>
            </View>
            <Text style={styles.slideTitle}>{CAROUSEL_SLIDES[carouselIndex].title}</Text>
            <Text style={styles.slideDesc}>{CAROUSEL_SLIDES[carouselIndex].desc}</Text>
          </View>

          {/* Dot indicators */}
          <View style={styles.dots}>
            {CAROUSEL_SLIDES.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setCarouselIndex(i)}>
                <View style={[styles.dot, i === carouselIndex && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Next / Continue */}
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.8}
            onPress={() => {
              if (carouselIndex < CAROUSEL_SLIDES.length - 1) {
                setCarouselIndex(carouselIndex + 1);
              } else {
                animateToPage(2);
              }
            }}
          >
            <Text style={styles.primaryBtnText}>
              {carouselIndex < CAROUSEL_SLIDES.length - 1 ? 'Next' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // --- PAGE 2: Address Input ---
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Animated.View style={[styles.addressContent, { opacity: slideAnim, transform: [{ scale: scaleIn }] }]}>
          <Text style={styles.addressEmoji}>🏠</Text>
          <Text style={styles.addressTitle}>Where's home?</Text>
          <Text style={styles.addressSubtitle}>
            This helps us find pros near you and personalize your experience
          </Text>

          <TextInput
            style={styles.addressInput}
            placeholder="Enter your address"
            placeholderTextColor={Colors.textLight}
            value={address}
            onChangeText={setAddress}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.primaryBtn, !address.trim() && styles.primaryBtnDisabled]}
            onPress={handleAddressSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Let's Go</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkipToApp} style={styles.linkBtn}>
            <Text style={styles.linkText}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  // Floating icons
  floatingIcon: {
    position: 'absolute',
    fontSize: 24,
  },
  // Splash
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    color: Colors.white,
    fontSize: 44,
    fontWeight: '800',
  },
  logoTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.purple,
    letterSpacing: -1,
    marginBottom: 16,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },
  tagline: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  cursor: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '300',
  },
  splashBottom: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 12,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  linkBtn: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  // Carousel
  carouselContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideIllustration: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  slideEmoji: {
    fontSize: 72,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDesc: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  // Address
  addressContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
    alignItems: 'center',
  },
  addressEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  addressSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  addressInput: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
});
