import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchAvailableJobs } from '../services/api';

interface NearbyJob {
  id: string;
  service: string;
  address: string;
  distance: string;
  payout: string;
  urgency: string;
}

export default function ProDemandView() {
  const [jobs, setJobs] = useState<NearbyJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableJobs()
      .then(data => {
        const list = (data.jobs || data.requests || []).map((j: any) => ({
          id: j.id,
          service: j.service_type || j.serviceType || 'Service',
          address: j.pickup_address || j.address || '',
          distance: j.distance ? `${j.distance} mi` : 'Nearby',
          payout: j.payout ? `$${j.payout}` : j.estimated_price ? `$${j.estimated_price}` : 'TBD',
          urgency: j.urgency || (j.scheduled_date === new Date().toISOString().split('T')[0] ? 'Today' : 'Upcoming'),
        }));
        setJobs(list);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>📍 Available Jobs</Text>
        <Text style={styles.subtitle}>{jobs.length} jobs near you</Text>
      </View>

      {jobs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyTitle}>No Jobs Available</Text>
          <Text style={styles.emptyText}>New jobs will appear here as customers book services in your area.</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={j => j.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardService}>{item.service}</Text>
                <Text style={styles.cardPayout}>{item.payout}</Text>
              </View>
              <Text style={styles.cardAddress}>{item.address}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.cardDistance}>{item.distance}</Text>
                <View style={[styles.urgencyBadge, item.urgency === 'Today' && styles.urgentBadge]}>
                  <Text style={[styles.urgencyText, item.urgency === 'Today' && styles.urgentText]}>{item.urgency}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.textLight, textAlign: 'center' },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textLight, marginTop: 4 },
  list: { padding: 16, paddingTop: 8 },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardService: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardPayout: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  cardAddress: { fontSize: 13, color: Colors.textLight, marginTop: 6 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardDistance: { fontSize: 13, color: Colors.textLight },
  urgencyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.surface },
  urgentBadge: { backgroundColor: '#FF6B3520' },
  urgencyText: { fontSize: 12, fontWeight: '600', color: Colors.textLight },
  urgentText: { color: '#FF6B35' },
});
