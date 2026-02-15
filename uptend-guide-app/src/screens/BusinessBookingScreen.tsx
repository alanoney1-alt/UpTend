import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const PROPERTIES = [
  { id: '1', address: '123 Oak St, Unit A-D', type: 'Apartment Complex', image: '🏢' },
  { id: '2', address: '456 Elm Ave', type: 'Single Family', image: '🏠' },
  { id: '3', address: '789 Pine Plaza', type: 'Commercial', image: '🏬' },
  { id: '4', address: '321 Maple Gardens', type: 'Townhomes', image: '🏘️' },
  { id: '5', address: '555 Cedar Lane', type: 'Multi-Family', image: '🏢' },
];

const SERVICES = [
  { id: '1', name: 'Lawn Care', icon: '🌿', b2bPrice: '$65' },
  { id: '2', name: 'Pressure Wash', icon: '💦', b2bPrice: '$120' },
  { id: '3', name: 'Gutter Clean', icon: '🏠', b2bPrice: '$95' },
  { id: '4', name: 'Pool Service', icon: '🏊', b2bPrice: '$80' },
  { id: '5', name: 'HVAC Maint.', icon: '❄️', b2bPrice: '$150' },
  { id: '6', name: 'Plumbing', icon: '🔧', b2bPrice: '$130' },
  { id: '7', name: 'Electrical', icon: '⚡', b2bPrice: '$140' },
  { id: '8', name: 'Cleaning', icon: '🧹', b2bPrice: '$90' },
  { id: '9', name: 'Pest Control', icon: '🐛', b2bPrice: '$75' },
  { id: '10', name: 'Landscaping', icon: '🌳', b2bPrice: '$200' },
  { id: '11', name: 'Painting', icon: '🎨', b2bPrice: '$250' },
  { id: '12', name: 'Handyman', icon: '🔨', b2bPrice: '$85' },
];

const RECURRING_OPTIONS = ['One-time', 'Weekly', 'Bi-weekly', 'Monthly'];

const PREFERRED_PROS = [
  { id: '1', name: 'Carlos M.', rating: 4.9, specialty: 'Landscaping' },
  { id: '2', name: 'James R.', rating: 4.8, specialty: 'Pressure Washing' },
  { id: '3', name: 'Maria S.', rating: 5.0, specialty: 'Cleaning' },
];

type Step = 'property' | 'service' | 'schedule' | 'review';

export default function BusinessBookingScreen() {
  const [step, setStep] = useState<Step>('property');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [recurring, setRecurring] = useState('One-time');
  const [selectedDate, setSelectedDate] = useState('Feb 20, 2026');
  const [selectedTime, setSelectedTime] = useState('9:00 AM');
  const [proPreference, setProPreference] = useState<string>('any');
  const [bulkMode, setBulkMode] = useState(false);
  const [accessNotes, setAccessNotes] = useState('');

  const toggleProperty = (id: string) => {
    setSelectedProperties(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const service = SERVICES.find(s => s.id === selectedService);
  const steps: Step[] = ['property', 'service', 'schedule', 'review'];
  const stepIndex = steps.indexOf(step);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Text style={styles.title}>Business Booking</Text>

        {/* Step Indicator */}
        <View style={styles.stepRow}>
          {steps.map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, i <= stepIndex && { backgroundColor: Colors.primary }]} />
              <Text style={[styles.stepLabel, i <= stepIndex && { color: Colors.primary }]}>
                {s === 'property' ? 'Property' : s === 'service' ? 'Service' : s === 'schedule' ? 'Schedule' : 'Review'}
              </Text>
            </View>
          ))}
        </View>

        {/* Step: Property */}
        {step === 'property' && (
          <View>
            <View style={styles.bulkRow}>
              <Text style={styles.sectionTitle}>Select Properties</Text>
              <View style={styles.bulkToggle}>
                <Text style={styles.bulkLabel}>Bulk</Text>
                <Switch
                  value={bulkMode}
                  onValueChange={setBulkMode}
                  trackColor={{ true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>
            {PROPERTIES.map((prop) => (
              <TouchableOpacity
                key={prop.id}
                style={[styles.propertyCard, selectedProperties.includes(prop.id) && styles.propertyCardSelected]}
                activeOpacity={0.8}
                onPress={() => {
                  if (bulkMode) { toggleProperty(prop.id); }
                  else { setSelectedProperties([prop.id]); }
                }}
              >
                <Text style={{ fontSize: 28 }}>{prop.image}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.propertyAddr}>{prop.address}</Text>
                  <Text style={styles.propertyType}>{prop.type}</Text>
                </View>
                {selectedProperties.includes(prop.id) && <Text style={{ fontSize: 20 }}>✅</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.nextBtn, selectedProperties.length === 0 && { opacity: 0.4 }]}
              disabled={selectedProperties.length === 0}
              onPress={() => setStep('service')}
            >
              <Text style={styles.nextBtnText}>Next → Service</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step: Service */}
        {step === 'service' && (
          <View>
            <Text style={styles.sectionTitle}>Select Service</Text>
            <View style={styles.serviceGrid}>
              {SERVICES.map((svc) => (
                <TouchableOpacity
                  key={svc.id}
                  style={[styles.serviceCard, selectedService === svc.id && styles.serviceCardSelected]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedService(svc.id)}
                >
                  <Text style={{ fontSize: 24 }}>{svc.icon}</Text>
                  <Text style={styles.serviceName}>{svc.name}</Text>
                  <Text style={styles.servicePrice}>{svc.b2bPrice}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('property')}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, { flex: 1 }, !selectedService && { opacity: 0.4 }]}
                disabled={!selectedService}
                onPress={() => setStep('schedule')}
              >
                <Text style={styles.nextBtnText}>Next → Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step: Schedule */}
        {step === 'schedule' && (
          <View>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Date</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity style={styles.datePill}><Text style={styles.datePillText}>{selectedDate}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.datePill}><Text style={styles.datePillText}>{selectedTime}</Text></TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Recurring</Text>
              <View style={styles.recurRow}>
                {RECURRING_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.recurPill, recurring === opt && styles.recurPillActive]}
                    onPress={() => setRecurring(opt)}
                  >
                    <Text style={[styles.recurText, recurring === opt && { color: Colors.white }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Pro Preference</Text>
              <TouchableOpacity
                style={[styles.proPill, proPreference === 'any' && styles.proPillActive]}
                onPress={() => setProPreference('any')}
              >
                <Text style={[styles.proText, proPreference === 'any' && { color: Colors.white }]}>Any Available</Text>
              </TouchableOpacity>
              {PREFERRED_PROS.map(pro => (
                <TouchableOpacity
                  key={pro.id}
                  style={[styles.proPill, proPreference === pro.id && styles.proPillActive]}
                  onPress={() => setProPreference(pro.id)}
                >
                  <Text style={[styles.proText, proPreference === pro.id && { color: Colors.white }]}>
                    {pro.name} • ⭐ {pro.rating} • {pro.specialty}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Access Notes</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Gate codes, special instructions..."
                placeholderTextColor={Colors.textLight}
                value={accessNotes}
                onChangeText={setAccessNotes}
                multiline
              />
            </View>
            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('service')}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={() => setStep('review')}>
                <Text style={styles.nextBtnText}>Next → Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <View>
            <Text style={styles.sectionTitle}>Review & Confirm</Text>
            <View style={styles.card}>
              <Text style={styles.reviewLabel}>Properties</Text>
              {selectedProperties.map(id => {
                const p = PROPERTIES.find(pr => pr.id === id);
                return p ? <Text key={id} style={styles.reviewValue}>{p.image} {p.address}</Text> : null;
              })}

              <Text style={[styles.reviewLabel, { marginTop: 14 }]}>Service</Text>
              <Text style={styles.reviewValue}>{service?.icon} {service?.name} — {service?.b2bPrice}/property</Text>

              <Text style={[styles.reviewLabel, { marginTop: 14 }]}>Schedule</Text>
              <Text style={styles.reviewValue}>{selectedDate} at {selectedTime} • {recurring}</Text>

              <Text style={[styles.reviewLabel, { marginTop: 14 }]}>Pro</Text>
              <Text style={styles.reviewValue}>
                {proPreference === 'any' ? 'Any Available' : PREFERRED_PROS.find(p => p.id === proPreference)?.name}
              </Text>

              {accessNotes ? (
                <>
                  <Text style={[styles.reviewLabel, { marginTop: 14 }]}>Access Notes</Text>
                  <Text style={styles.reviewValue}>{accessNotes}</Text>
                </>
              ) : null}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Estimated Total</Text>
                <Text style={styles.totalValue}>
                  ${(parseInt(service?.b2bPrice?.replace('$', '') || '0') * selectedProperties.length).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.billingNote}>Billed to business account • Net-30 terms</Text>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('schedule')}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { flex: 1 }]} activeOpacity={0.8}>
                <Text style={styles.confirmBtnText}>
                  {selectedProperties.length > 1 ? `Book ${selectedProperties.length} Properties` : 'Confirm Booking'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 16 },

  // Steps
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.borderLight, marginBottom: 4 },
  stepLabel: { fontSize: 11, fontWeight: '600', color: Colors.textLight },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },

  // Bulk
  bulkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bulkToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulkLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },

  // Properties
  propertyCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14, flexDirection: 'row',
    alignItems: 'center', marginBottom: 10, borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  propertyCardSelected: { borderColor: Colors.primary },
  propertyAddr: { fontSize: 15, fontWeight: '600', color: Colors.text },
  propertyType: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  // Services
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  serviceCard: {
    width: '31%' as any, backgroundColor: Colors.white, borderRadius: 14, padding: 12,
    alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  serviceCardSelected: { borderColor: Colors.primary },
  serviceName: { fontSize: 12, fontWeight: '600', color: Colors.text, marginTop: 6, textAlign: 'center' },
  servicePrice: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 4 },

  // Card
  card: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  dateRow: { flexDirection: 'row', gap: 10 },
  datePill: { backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  datePillText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  recurRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recurPill: { backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  recurPillActive: { backgroundColor: Colors.primary },
  recurText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  proPill: { backgroundColor: Colors.background, borderRadius: 10, padding: 12, marginBottom: 8 },
  proPillActive: { backgroundColor: Colors.primary },
  proText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  textInput: {
    backgroundColor: Colors.inputBackground, borderRadius: 12, padding: 14, fontSize: 14,
    color: Colors.text, minHeight: 60, textAlignVertical: 'top',
  },

  // Review
  reviewLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
  reviewValue: { fontSize: 15, color: Colors.text, marginTop: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  billingNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },

  // Nav
  navRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  nextBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  backBtn: { backgroundColor: Colors.white, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, justifyContent: 'center' },
  backBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  confirmBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  confirmBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },
});
