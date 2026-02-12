import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { Colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  emoji: string;
  title: string;
  subtitle: string;
  onClose: () => void;
  onShare?: () => void;
}

const CONFETTI_COLORS = [Colors.primary, Colors.purple, '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];
const CONFETTI_COUNT = 30;

function ConfettiPiece({ delay, color }: { delay: number; color: string }) {
  const y = useRef(new Animated.Value(-20)).current;
  const x = useRef(new Animated.Value(Math.random() * width)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: height + 20, duration: 2500 + delay * 500, delay: delay * 100, useNativeDriver: true }),
      Animated.timing(x, { toValue: (Math.random() - 0.5) * width * 0.5 + Math.random() * width, duration: 2500 + delay * 500, delay: delay * 100, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 1, duration: 2500, delay: delay * 100, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 2500, delay: delay * 100 + 1500, useNativeDriver: true }),
    ]).start();
  }, []);

  const rotateStr = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${360 + Math.random() * 360}deg`] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 8 + Math.random() * 6,
        height: 8 + Math.random() * 6,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? 10 : 1,
        transform: [{ translateY: y }, { translateX: x }, { rotate: rotateStr }],
        opacity,
      }}
    />
  );
}

export default function CelebrationModal({ visible, emoji, title, subtitle, onClose, onShare }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Confetti */}
        {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
          <ConfettiPiece key={i} delay={i} color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]} />
        ))}

        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {onShare && (
            <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
              <Text style={styles.shareBtnText}>📤 Share Achievement</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', marginHorizontal: 30, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  shareBtn: { backgroundColor: Colors.purple, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 20 },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  closeBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, marginTop: 12 },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
