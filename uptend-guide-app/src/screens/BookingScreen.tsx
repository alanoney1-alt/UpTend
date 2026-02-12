import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../theme/colors';
import { createBooking } from '../services/bookings';
import { useAuth } from '../context/AuthContext';

const SERVICE_TYPES = [
  { key: 'lawn', label: 'Lawn Care', emoji: '🌱' },
  { key: 'cleaning', label: 'Cleaning', emoji: '🧹' },
  { key: 'junk', label: 'Junk Removal', emoji: '🗑' },
  { key: 'handyman', label: 'Handyman', emoji: '🔧' },
  { key: 'pressure_wash', label: 'Pressure Washing', emoji: '💦' },
  { key: 'moving', label: 'Moving Help', emoji: '📦' },
  { key: 'tree', label: 'Tree Service', emoji: '🌳' },
  { key: 'gutter', label: 'Gutter Cleaning', emoji: '🏠' },
];

export default function BookingScreen({ navigation }: any) {
  const { requireAuth } = useAuth();
  const [selectedService, setSelectedService] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleSubmit = async () => {
    if (requireAuth({ type: 'book', payload: { service: selectedService } })) return;
    if (!selectedService) { Alert.alert('Error', 'Please select a service type.'); return; }
    if (!address.trim()) { Alert.alert('Error', 'Please enter your address.'); return; }

    setLoading(true);
    try {
      await createBooking({
        serviceType: selectedService,
        description: description.trim(),
        address: address.trim(),
        scheduledDate: date.trim() || undefined,
        scheduledTime: time.trim() || undefined,
        photos: photos.length > 0 ? photos : undefined,
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
            A verified pro will be matched to your job shortly.
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Book a Service</Text>
        <Text style={styles.subtitle}>Select a service and tell us what you need</Text>

        {/* Service Selection */}
        <Text style={styles.label}>Service Type</Text>
        <View style={styles.serviceGrid}>
          {SERVICE_TYPES.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.serviceCard, selectedService === s.key && styles.serviceCardActive]}
              onPress={() => setSelectedService(s.key)}
            >
              <Text style={styles.serviceEmoji}>{s.emoji}</Text>
              <Text style={[styles.serviceLabel, selectedService === s.key && styles.serviceLabelActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
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
        <Text style={styles.label}>Service Address</Text>
        <TextInput
          style={styles.input}
          placeholder="123 Main St, City, State ZIP"
          placeholderTextColor={Colors.textLight}
          value={address}
          onChangeText={setAddress}
        />

        {/* Date & Time */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Date (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/DD/YYYY"
              placeholderTextColor={Colors.textLight}
              value={date}
              onChangeText={setDate}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Time (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="10:00 AM"
              placeholderTextColor={Colors.textLight}
              value={time}
              onChangeText={setTime}
            />
          </View>
        </View>

        {/* Photos */}
        <Text style={styles.label}>Photos (optional)</Text>
        <View style={styles.photoRow}>
          {photos.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.photoThumb} />
          ))}
          <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhoto}>
            <Text style={styles.addPhotoText}>📷+</Text>
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>Submit Booking</Text>
          )}
        </TouchableOpacity>

        <View style={styles.guaranteeBadge}>
          <Text style={styles.guaranteeText}>🛡️ UpTend Satisfaction Guarantee</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 4, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceCard: {
    width: '23%', backgroundColor: Colors.white, borderRadius: 14, padding: 12,
    alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  serviceCardActive: { borderColor: Colors.primary, backgroundColor: '#FFF7F0' },
  serviceEmoji: { fontSize: 24, marginBottom: 4 },
  serviceLabel: { fontSize: 11, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  serviceLabelActive: { color: Colors.primary },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  photoRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  photoThumb: { width: 72, height: 72, borderRadius: 10 },
  addPhotoBtn: {
    width: 72, height: 72, borderRadius: 10, backgroundColor: Colors.white,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
  addPhotoText: { fontSize: 24 },
  primaryBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 24,
  },
  primaryBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  guaranteeBadge: {
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 16,
  },
  guaranteeText: { fontSize: 14, fontWeight: '600', color: '#059669' },
  confirmationContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  confirmEmoji: { fontSize: 64, marginBottom: 16 },
  confirmTitle: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  confirmSubtitle: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
});
