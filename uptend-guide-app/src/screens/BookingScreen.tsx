import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { request } from '../services/api';
import ServiceCard from '../components/ServiceCard';

const SERVICES = [
  { key: 'ai_home_scan', label: 'AI Home Scan', emoji: '🏠', price: '$99 standard, $249 aerial' },
  { key: 'handyman', label: 'Handyman', emoji: '🔧', price: '$75/hr' },
  { key: 'junk_removal', label: 'Junk Removal', emoji: '🗑', price: 'From $99' },
  { key: 'garage_cleanout', label: 'Garage Cleanout', emoji: '🚗', price: '$299-$999' },
  { key: 'moving_labor', label: 'Moving Labor', emoji: '📦', price: '$80/hr per pro' },
  { key: 'home_cleaning', label: 'Home Cleaning', emoji: '🧹', price: '$99-$299' },
  { key: 'carpet_cleaning', label: 'Carpet Cleaning', emoji: '🛋️', price: '$39/room' },
  { key: 'landscaping', label: 'Landscaping', emoji: '🌱', price: 'From $49' },
  { key: 'gutter_cleaning', label: 'Gutter Cleaning', emoji: '🏠', price: '$129-$299' },
  { key: 'pressure_washing', label: 'Pressure Washing', emoji: '💦', price: 'From $120' },
  { key: 'pool_cleaning', label: 'Pool Cleaning', emoji: '🏊', price: '$89-$169/mo' },
  { key: 'light_demolition', label: 'Light Demolition', emoji: '🔨', price: 'From $199' },
  { key: 'auto_repair', label: 'Auto Repair', emoji: '🚗', price: 'From $79' },
];

export default function BookingScreen({ navigation }: any) {
  const { requireAuth, user } = useAuth();
  const [selectedService, setSelectedService] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async () => {
    if (requireAuth({ type: 'book', payload: { service: selectedService } })) return;
    if (!selectedService) { Alert.alert('Error', 'Please select a service.'); return; }
    if (!address.trim()) { Alert.alert('Error', 'Please enter your address.'); return; }

    setLoading(true);
    try {
      const selectedServiceObj = SERVICES.find(s => s.key === selectedService);
      await request('POST', '/api/service-requests', {
        serviceType: selectedService,
        serviceName: selectedServiceObj?.label,
        description: description.trim() || `${selectedServiceObj?.label} requested`,
        address: address.trim(),
        phone: phone.trim() || user?.phone,
      });
      setConfirmed(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.confirmationContainer}>
          <Text style={styles.confirmEmoji}>✅</Text>
          <Text style={styles.confirmTitle}>Booking Confirmed!</Text>
          <Text style={styles.confirmSubtitle}>
            A verified pro will be matched to your job shortly. You'll receive updates via SMS and app notifications.
          </Text>
          <View style={styles.guaranteeBadge}>
            <Text style={styles.guaranteeText}>🛡️ UpTend Satisfaction Guarantee</Text>
          </View>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation?.navigate('Home')}
          >
            <Text style={styles.primaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Orange Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Book a Service</Text>
        <Text style={styles.headerSub}>Select a service and tell us what you need</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Service Selection */}
        <Text style={styles.label}>Service Type</Text>
        <View style={styles.serviceGrid}>
          {SERVICES.map((s) => (
            <ServiceCard
              key={s.key}
              emoji={s.emoji}
              label={s.label}
              price={s.price}
              isActive={selectedService === s.key}
              activePros={(s.key.charCodeAt(0) % 7) + 5}
              onSelect={() => setSelectedService(s.key)}
            />
          ))}
        </View>

        {/* Description */}
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe what you need done..."
          placeholderTextColor={Colors.textLight}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        {/* Address */}
        <Text style={styles.label}>Service Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="123 Main St, City, State ZIP"
          placeholderTextColor={Colors.textLight}
          value={address}
          onChangeText={setAddress}
        />

        {/* Phone */}
        <Text style={styles.label}>Phone (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="(555) 123-4567"
          placeholderTextColor={Colors.textLight}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={[styles.primaryBtn, (!selectedService || !address.trim()) && styles.primaryBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading || !selectedService || !address.trim()}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>Request Quote</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By submitting, you agree to receive quotes from verified UpTend pros. No charge until you approve a quote.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: { backgroundColor: '#f97316', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  scroll: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 12 },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  // ServiceCard component handles individual card styles
  input: {
    backgroundColor: Colors.white, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    marginBottom: 12, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: '#F97316', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 20,
  },
  primaryBtnDisabled: { backgroundColor: Colors.border },
  primaryBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  disclaimer: { fontSize: 12, color: Colors.textLight, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  confirmationContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  confirmEmoji: { fontSize: 64, marginBottom: 16 },
  confirmTitle: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  confirmSubtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  guaranteeBadge: {
    backgroundColor: '#D1FAE5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 24,
  },
  guaranteeText: { fontSize: 14, fontWeight: '600', color: '#059669' },
});
