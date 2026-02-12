import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { ProLocation } from '../services/ProAvailabilityAPI';

interface Props {
  pro: ProLocation;
  onHire?: (pro: ProLocation) => void;
  compact?: boolean;
}

export default function ProCard({ pro, onHire, compact }: Props) {
  const statusBadge = () => {
    switch (pro.status) {
      case 'available':
        return { label: 'Available Now', bg: '#E8F5E8', color: '#10B981' };
      case 'finishing_soon':
        return { label: `Done in ~${pro.estimatedDoneMin || 30} min`, bg: '#FFF8E1', color: '#F59E0B' };
      case 'busy':
        return { label: 'Currently Busy', bg: '#F3F4F6', color: '#9CA3AF' };
      default:
        return { label: 'Offline', bg: '#F3F4F6', color: '#D1D5DB' };
    }
  };

  const badge = statusBadge();

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.topRow}>
        {/* Photo */}
        <View style={styles.photoContainer}>
          <View style={[styles.photo, pro.status === 'available' && styles.photoAvailable]}>
            <Text style={styles.photoText}>
              {pro.firstName[0]}{pro.lastInitial}
            </Text>
          </View>
          {pro.status === 'available' && <View style={styles.onlineDot} />}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name}>{pro.firstName} {pro.lastInitial}.</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.star}>⭐</Text>
            <Text style={styles.rating}>{pro.rating.toFixed(1)}</Text>
            <Text style={styles.reviews}>({pro.reviewCount} reviews)</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.distance}>📍 {pro.distanceMiles?.toFixed(1)} mi</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.responseTime}>⚡ {pro.responseTimeMin} min response</Text>
          </View>
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: badge.color }]} />
          <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Service chips */}
      <View style={styles.servicesRow}>
        {pro.services.map(s => (
          <View key={s.id} style={styles.serviceChip}>
            <Text style={styles.serviceIcon}>{s.icon}</Text>
            <Text style={styles.serviceName}>{s.name}</Text>
          </View>
        ))}
      </View>

      {!compact && pro.bio && (
        <Text style={styles.bio} numberOfLines={2}>{pro.bio}</Text>
      )}

      {!compact && (
        <View style={styles.statsRow}>
          <Text style={styles.statItem}>✅ {pro.completedJobs} jobs</Text>
          <Text style={styles.statItem}>📅 Since {pro.memberSince}</Text>
        </View>
      )}

      {/* Hire button */}
      <TouchableOpacity
        style={[
          styles.hireBtn,
          pro.status !== 'available' && styles.hireBtnDisabled,
        ]}
        onPress={() => onHire?.(pro)}
        activeOpacity={0.8}
      >
        <Text style={[styles.hireBtnText, pro.status !== 'available' && styles.hireBtnTextDisabled]}>
          {pro.status === 'available' ? '🟢 Hire Now' : pro.status === 'finishing_soon' ? '🟡 Book When Free' : 'View Profile'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardCompact: {
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  photoAvailable: {
    borderColor: '#10B981',
  },
  photoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 3,
  },
  star: { fontSize: 13 },
  rating: { fontSize: 14, fontWeight: '700', color: Colors.text },
  reviews: { fontSize: 12, color: Colors.textSecondary },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  distance: { fontSize: 12, color: Colors.textSecondary },
  dot: { fontSize: 12, color: Colors.textLight },
  responseTime: { fontSize: 12, color: Colors.textSecondary },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E8',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  serviceIcon: { fontSize: 14 },
  serviceName: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  bio: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statItem: {
    fontSize: 12,
    color: Colors.textLight,
  },
  hireBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  hireBtnDisabled: {
    backgroundColor: '#F3F4F6',
    shadowOpacity: 0,
  },
  hireBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  hireBtnTextDisabled: {
    color: Colors.textSecondary,
  },
});
