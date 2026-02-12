import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { Colors } from '../theme/colors';
import BeforeAfterSlider from './BeforeAfterSlider';
import { Transformation } from '../data/mockTransformations';

interface Props {
  item: Transformation;
  onGetThisDone?: (serviceType: string) => void;
  onProTap?: (proName: string) => void;
}

export default function TransformationCard({ item, onGetThisDone, onProTap }: Props) {
  const [reactions, setReactions] = useState(item.reactions);

  const react = (type: 'heart' | 'fire' | 'love') => {
    setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const handleShare = () => {
    Share.share({ message: `Check out this ${item.serviceType} transformation in ${item.neighborhood} on UpTend! 🏠✨` });
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onProTap?.(item.proName)} style={styles.proInfo}>
          <View style={styles.proAvatar}>
            <Text style={styles.proInitial}>{item.proName[0]}</Text>
          </View>
          <View>
            <Text style={styles.proName}>Done by {item.proName} ⭐ {item.proRating}</Text>
            <Text style={styles.meta}>{item.neighborhood} · {item.timeAgo}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.serviceEmoji} {item.serviceType}</Text>
        </View>
      </View>

      {/* Slider */}
      <View style={styles.sliderWrap}>
        <BeforeAfterSlider beforeImage={item.beforeImage} afterImage={item.afterImage} height={260} />
      </View>

      {/* Description */}
      <Text style={styles.description}>{item.description}</Text>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.reactionsRow}>
          <TouchableOpacity onPress={() => react('heart')} style={styles.reactionBtn}>
            <Text style={styles.reactionText}>❤️ {reactions.heart}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => react('fire')} style={styles.reactionBtn}>
            <Text style={styles.reactionText}>🔥 {reactions.fire}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => react('love')} style={styles.reactionBtn}>
            <Text style={styles.reactionText}>😍 {reactions.love}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.reactionBtn}>
            <Text style={styles.reactionText}>↗️</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.ctaButton} onPress={() => onGetThisDone?.(item.serviceType)} activeOpacity={0.8}>
          <Text style={styles.ctaText}>Get this done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: 20, marginHorizontal: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 8 },
  proInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  proAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.purple, justifyContent: 'center', alignItems: 'center' },
  proInitial: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  proName: { fontWeight: '600', fontSize: 13, color: Colors.text },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  badge: { backgroundColor: Colors.primary + '18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  sliderWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  description: { paddingHorizontal: 16, fontSize: 14, color: Colors.text, fontWeight: '500', marginBottom: 10 },
  actions: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reactionsRow: { flexDirection: 'row', gap: 6 },
  reactionBtn: { backgroundColor: Colors.background, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  reactionText: { fontSize: 13, fontWeight: '500' },
  ctaButton: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  ctaText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
});
