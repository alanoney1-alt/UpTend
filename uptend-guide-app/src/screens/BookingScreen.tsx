import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { request } from '../services/api';

const SERVICES = [
  { key: 'handyman', label: 'Handyman', icon: 'hammer-outline' as const, price: '$75/hr' },
  { key: 'home_cleaning', label: 'Home Cleaning', icon: 'sparkles-outline' as const, price: 'From $99' },
  { key: 'junk_removal', label: 'Junk Removal', icon: 'trash-outline' as const, price: 'From $99' },
  { key: 'landscaping', label: 'Landscaping', icon: 'leaf-outline' as const, price: 'From $49' },
  { key: 'pressure_washing', label: 'Pressure Wash', icon: 'water-outline' as const, price: 'From $120' },
  { key: 'pool_cleaning', label: 'Pool Cleaning', icon: 'fish-outline' as const, price: '$120/mo' },
  { key: 'gutter_cleaning', label: 'Gutter Cleaning', icon: 'home-outline' as const, price: 'From $150' },
  { key: 'moving_labor', label: 'Moving Labor', icon: 'cube-outline' as const, price: '$80/hr' },
  { key: 'carpet_cleaning', label: 'Carpet Clean', icon: 'layers-outline' as const, price: '$50/room' },
  { key: 'garage_cleanout', label: 'Garage Cleanout', icon: 'car-outline' as const, price: 'From $299' },
  { key: 'light_demolition', label: 'Demolition', icon: 'construct-outline' as const, price: 'From $199' },
  { key: 'ai_home_scan', label: 'Home DNA Scan', icon: 'scan-outline' as const, price: 'Free' },
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
    if (!selectedService) { Alert.alert('Select a Service', 'Please choose what you need.'); return; }
    if (!address.trim()) { Alert.alert('Address Required', 'Enter where the work will be done.'); return; }
    setLoading(true);
    try {
      const svc = SERVICES.find(s => s.key === selectedService);
      await request('POST', '/api/service-requests', {
        serviceType: selectedService,
        serviceName: svc?.label,
        description: description.trim() || `${svc?.label} requested`,
        address: address.trim(),
        phone: phone.trim() || user?.phone,
      });
      setConfirmed(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.confirmWrap}>
          <View style={s.confirmCheck}>
            <Ionicons name="checkmark" size={40} color={Colors.white} />
          </View>
          <Text style={s.confirmTitle}>You're all set</Text>
          <Text style={s.confirmSub}>A verified pro will be matched shortly. We'll keep you updated.</Text>
          <TouchableOpacity style={s.primaryBtn} onPress={() => navigation?.navigate('Home')}>
            <Text style={s.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Book a Service</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.sectionLabel}>What do you need?</Text>
        <View style={s.grid}>
          {SERVICES.map(svc => {
            const active = selectedService === svc.key;
            return (
              <TouchableOpacity
                key={svc.key}
                style={[s.serviceCard, active && s.serviceCardActive]}
                onPress={() => setSelectedService(svc.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={svc.icon} size={22} color={active ? Colors.white : Colors.gray900} />
                <Text style={[s.serviceName, active && s.serviceNameActive]}>{svc.label}</Text>
                <Text style={[s.servicePrice, active && s.servicePriceActive]}>{svc.price}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.sectionLabel}>Details</Text>
        <TextInput
          style={[s.input, s.textArea]}
          placeholder="What needs to be done?"
          placeholderTextColor={Colors.gray400}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <TextInput
          style={s.input}
          placeholder="Service address"
          placeholderTextColor={Colors.gray400}
          value={address}
          onChangeText={setAddress}
        />

        <TextInput
          style={s.input}
          placeholder="Phone (optional)"
          placeholderTextColor={Colors.gray400}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={[s.primaryBtn, (!selectedService || !address.trim()) && s.primaryBtnOff]}
          onPress={handleSubmit}
          disabled={loading || !selectedService || !address.trim()}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={s.primaryBtnText}>Get Quote</Text>
          )}
        </TouchableOpacity>

        <Text style={s.fine}>No charge until you approve a quote from a verified pro.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.gray900, letterSpacing: -0.5 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: Colors.gray900, marginTop: 16, marginBottom: 12, letterSpacing: -0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceCard: {
    width: '31%', backgroundColor: Colors.gray50, borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.gray150,
  },
  serviceCardActive: { backgroundColor: Colors.gray900, borderColor: Colors.gray900 },
  serviceName: { fontSize: 12, fontWeight: '600', color: Colors.gray900, textAlign: 'center', letterSpacing: -0.2 },
  serviceNameActive: { color: Colors.white },
  servicePrice: { fontSize: 11, color: Colors.gray500 },
  servicePriceActive: { color: Colors.gray300 },
  input: {
    backgroundColor: Colors.gray100, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    marginBottom: 10, color: Colors.gray900, letterSpacing: -0.2,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: Colors.gray900, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 20,
  },
  primaryBtnOff: { backgroundColor: Colors.gray200 },
  primaryBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  fine: { fontSize: 12, color: Colors.gray400, textAlign: 'center', marginTop: 14 },
  confirmWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  confirmCheck: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.success,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  confirmTitle: { fontSize: 26, fontWeight: '800', color: Colors.gray900, marginBottom: 8, letterSpacing: -0.5 },
  confirmSub: { fontSize: 15, color: Colors.gray500, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
});
