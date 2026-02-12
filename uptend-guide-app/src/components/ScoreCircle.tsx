import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
}

function getScoreColor(score: number): string {
  if (score < 40) return Colors.error;
  if (score < 60) return Colors.primary;
  if (score < 75) return Colors.warning;
  return Colors.success;
}

export default function ScoreCircle({ score, size = 180, strokeWidth = 14 }: Props) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const animatedScore = useRef(new Animated.Value(0)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedValue, { toValue: score / 100, duration: 1200, useNativeDriver: false }),
      Animated.timing(animatedScore, { toValue: score, duration: 1200, useNativeDriver: false }),
    ]).start();
  }, [score]);

  const color = getScoreColor(score);

  // We'll approximate the SVG circle with a border-based approach since we may not have react-native-svg
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const displayScore = animatedScore.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 100],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background circle */}
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth, borderColor: Colors.borderLight }]} />
      {/* Foreground - we use a simple animated approach */}
      <View style={[styles.innerContent, { width: size, height: size }]}>
        <Animated.Text style={[styles.scoreNumber, { color }]}>
          {animatedScore.interpolate({ inputRange: [0, 100], outputRange: ['0', '100'] }).interpolate({
            inputRange: [0, 100],
            outputRange: ['0', String(score)],
          })}
        </Animated.Text>
        <Text style={styles.scoreLabel}>Your Home Score</Text>
      </View>
      {/* Colored arc indicator */}
      <View style={[styles.arcContainer, { width: size, height: size }]}>
        <View style={[styles.arcTrack, {
          width: size - 4,
          height: size - 4,
          borderRadius: (size - 4) / 2,
          borderWidth: strokeWidth - 2,
          borderColor: 'transparent',
          borderTopColor: color,
          borderRightColor: score > 25 ? color : 'transparent',
          borderBottomColor: score > 50 ? color : 'transparent',
          borderLeftColor: score > 75 ? color : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  circle: { position: 'absolute' },
  innerContent: { justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  scoreNumber: { fontSize: 48, fontWeight: '800' },
  scoreLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
  arcContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  arcTrack: { position: 'absolute' },
});
