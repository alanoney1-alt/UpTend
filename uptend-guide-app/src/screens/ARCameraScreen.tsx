import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, useColorScheme, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Button, EmptyState } from '../components/ui';
import { colors } from '../components/ui/tokens';

const { width, height } = Dimensions.get('window');

type ARState = 'permission' | 'scanning' | 'coming_soon';

export default function ARCameraScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [state, setState] = useState<ARState>('coming_soon');
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate scan line
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
    // Pulse corners
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const bg = dark ? colors.backgroundDark : '#000';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header
          title="AR Camera"
          subtitle="Scan & Measure"
          onBack={() => navigation.goBack()}
          transparent
        />

        <View style={styles.content}>
          {/* Simulated camera viewfinder */}
          <Animated.View style={[styles.viewfinder, { transform: [{ scale: pulseAnim }] }]}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{
                    translateY: scanAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 200],
                    }),
                  }],
                },
              ]}
            />

            {/* Center crosshair */}
            <View style={styles.crosshair}>
              <View style={[styles.crosshairLine, styles.crosshairH]} />
              <View style={[styles.crosshairLine, styles.crosshairV]} />
            </View>
          </Animated.View>

          {/* Measurement overlay concept */}
          <View style={styles.measureOverlay}>
            <View style={styles.measureBadge}>
              <Text style={styles.measureIcon}>📏</Text>
              <Text style={styles.measureText}>Point at a surface to measure</Text>
            </View>
          </View>

          {/* Coming Soon overlay */}
          <View style={styles.comingSoon}>
            <View style={styles.georgeCard}>
              <Text style={styles.georgeAvatar}>🏠</Text>
              <Text style={styles.georgeTitle}>AR Features Coming Soon!</Text>
              <Text style={styles.georgeText}>
                Mr. George is learning to see through your camera! Soon you'll be able to:
              </Text>
              <View style={styles.featureList}>
                {[
                  '📏 Measure rooms & spaces instantly',
                  '🔍 Identify appliances & materials',
                  '🎨 Visualize paint colors & finishes',
                  '📋 Scan & assess condition issues',
                  '💡 Get instant repair estimates',
                ].map((f, i) => (
                  <Text key={i} style={styles.featureItem}>{f}</Text>
                ))}
              </View>
              <Button
                onPress={() => navigation.navigate('GeorgeChat')}
                style={{ marginTop: 16 }}
              >Chat with George Instead</Button>
            </View>
          </View>
        </View>

        {/* Bottom controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} accessibilityRole="button" accessibilityLabel="Gallery">
            <Text style={styles.controlIcon}>🖼️</Text>
            <Text style={styles.controlLabel}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureBtn} accessibilityRole="button" accessibilityLabel="Capture">
            <View style={styles.captureInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} accessibilityRole="button" accessibilityLabel="Switch mode">
            <Text style={styles.controlIcon}>📐</Text>
            <Text style={styles.controlLabel}>Measure</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  viewfinder: {
    width: width * 0.75, height: width * 0.75, position: 'relative',
    justifyContent: 'center', alignItems: 'center',
  },
  corner: {
    position: 'absolute', width: 30, height: 30,
    borderColor: colors.primary, borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  scanLine: {
    position: 'absolute', top: 20, left: 10, right: 10,
    height: 2, backgroundColor: colors.primary, opacity: 0.6,
  },
  crosshair: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  crosshairLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.5)' },
  crosshairH: { width: 24, height: 1 },
  crosshairV: { width: 1, height: 24 },
  measureOverlay: { position: 'absolute', bottom: 140, alignItems: 'center' },
  measureBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, gap: 8,
  },
  measureIcon: { fontSize: 16 },
  measureText: { fontSize: 13, color: '#fff', fontWeight: '500' },
  comingSoon: {
    ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)', padding: 30,
  },
  georgeCard: {
    backgroundColor: '#1C1C1E', borderRadius: 24, padding: 28, alignItems: 'center',
    width: '100%', maxWidth: 340,
  },
  georgeAvatar: { fontSize: 48, marginBottom: 12 },
  georgeTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  georgeText: { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  featureList: { alignSelf: 'stretch' },
  featureItem: { fontSize: 14, color: '#ddd', paddingVertical: 6, lineHeight: 20 },
  controls: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 20, paddingBottom: 30,
  },
  controlBtn: { alignItems: 'center', width: 60 },
  controlIcon: { fontSize: 24 },
  controlLabel: { fontSize: 11, color: '#999', marginTop: 4 },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
});
