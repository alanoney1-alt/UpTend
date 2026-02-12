import React, { useRef, useState } from 'react';
import { View, Image, PanResponder, Animated, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  beforeImage: string;
  afterImage: string;
  height?: number;
}

const SLIDER_WIDTH = Dimensions.get('window').width - 32;

export default function BeforeAfterSlider({ beforeImage, afterImage, height = 250 }: Props) {
  const [sliderPos] = useState(new Animated.Value(SLIDER_WIDTH / 2));
  const currentPos = useRef(SLIDER_WIDTH / 2);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        sliderPos.setOffset(currentPos.current);
        sliderPos.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const newPos = Math.max(0, Math.min(SLIDER_WIDTH, currentPos.current + gestureState.dx));
        sliderPos.setValue(gestureState.dx);
        // Clamp without offset for display
      },
      onPanResponderRelease: (_, gestureState) => {
        currentPos.current = Math.max(0, Math.min(SLIDER_WIDTH, currentPos.current + gestureState.dx));
        sliderPos.flattenOffset();
      },
    })
  ).current;

  const clampedPos = sliderPos.interpolate({
    inputRange: [0, SLIDER_WIDTH],
    outputRange: [0, SLIDER_WIDTH],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { height }]}>
      {/* After image (full width behind) */}
      <Image source={{ uri: afterImage }} style={[styles.image, { height }]} />
      {/* Before image (clipped) */}
      <Animated.View style={[styles.beforeContainer, { height, width: clampedPos }]}>
        <Image source={{ uri: beforeImage }} style={[styles.image, { height, width: SLIDER_WIDTH }]} />
      </Animated.View>
      {/* Divider */}
      <Animated.View
        style={[styles.divider, { height, transform: [{ translateX: Animated.subtract(clampedPos, new Animated.Value(1.5)) }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.handle}>
          <View style={styles.handleArrows}>
            <View style={[styles.arrow, styles.arrowLeft]} />
            <View style={[styles.arrow, styles.arrowRight]} />
          </View>
        </View>
      </Animated.View>
      {/* Labels */}
      <View style={[styles.label, styles.labelLeft]}>
        <View style={styles.labelBg}><Animated.Text style={styles.labelText}>BEFORE</Animated.Text></View>
      </View>
      <View style={[styles.label, styles.labelRight]}>
        <View style={styles.labelBg}><Animated.Text style={styles.labelText}>AFTER</Animated.Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: SLIDER_WIDTH, borderRadius: 16, overflow: 'hidden', position: 'relative', backgroundColor: '#E5E7EB' },
  image: { width: SLIDER_WIDTH, resizeMode: 'cover', position: 'absolute', top: 0, left: 0 },
  beforeContainer: { position: 'absolute', top: 0, left: 0, overflow: 'hidden' },
  divider: { position: 'absolute', top: 0, width: 3, backgroundColor: Colors.white, zIndex: 10, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  handleArrows: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  arrow: { width: 0, height: 0, borderTopWidth: 5, borderBottomWidth: 5, borderTopColor: 'transparent', borderBottomColor: 'transparent' },
  arrowLeft: { borderRightWidth: 7, borderRightColor: Colors.primary },
  arrowRight: { borderLeftWidth: 7, borderLeftColor: Colors.primary },
  label: { position: 'absolute', bottom: 12, zIndex: 5 },
  labelLeft: { left: 12 },
  labelRight: { right: 12 },
  labelBg: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  labelText: { color: Colors.white, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
