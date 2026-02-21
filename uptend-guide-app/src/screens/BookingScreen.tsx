import React, { useState } from 'react';
import {
  View, Text, ScrollView, Alert, useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Input, Header, LoadingScreen, EmptyState } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { useAuth } from '../context/AuthContext';
import { fetchPricingQuote, createServiceRequest } from '../services/api';

const SERVICES = [
  { key: 'handyman', label: 'Handyman', icon: '🔧' },
  { key: 'home_cleaning', label: 'Home Cleaning', icon: '🧹' },
  { key: 'junk_removal', label: 'Junk Removal', icon: '🗑' },
  { key: 'landscaping', label: 'Landscaping', icon: '🌿' },
  { key: 'pressure_washing', label: 'Pressure Wash', icon: '💦' },
  { key: 'pool_cleaning', label: 'Pool Cleaning', icon: '🏊' },
  { key: 'gutter_cleaning', label: 'Gutter Cleaning', icon: '🏠' },
  { key: 'moving_labor', label: 'Moving Labor', icon: '📦' },
  { key: 'carpet_cleaning', label: 'Carpet Clean', icon: '🧶' },
  { key: 'garage_cleanout', label: 'Garage Cleanout', icon: '🚗' },
  { key: 'light_demolition', label: 'Demolition', icon: '🏗' },
  { key: 'ai_home_scan', label: 'AI Home Scan', icon: '🔍' },
];

type Step = 'select' | 'details' | 'quote' | 'confirmed';

export default function BookingScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const { requireAuth, user } = useAuth();
  const [selectedService, setSelectedService] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState((user as any)?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [step, setStep] = useState<Step>('select');

  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  const getQuote = async () => {
    if (!selectedService || !address.trim()) return;
    setQuoteLoading(true);
    setQuote(null);
    try {
      const svc = SERVICES.find(s => s.key === selectedService);
      const result = await fetchPricingQuote(selectedService, {
        address: address.trim(),
        description: description.trim(),
        serviceName: svc?.label,
      });
      setQuote(result);
      setStep('quote');
    } catch {
      setQuote({ estimate: 'Contact for pricing', note: 'A pro will provide a detailed quote.' });
      setStep('quote');
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (requireAuth({ type: 'book', payload: { service: selectedService } })) return;
    setLoading(true);
    try {
      const svc = SERVICES.find(s => s.key === selectedService);
      await createServiceRequest({
        serviceType: selectedService,
        serviceName: svc?.label,
        description: description.trim() || `${svc?.label} requested`,
        address: address.trim(),
        phone: phone.trim() || user?.phone,
      });
      setStep('confirmed');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // Confirmed state
  if (step === 'confirmed') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: dark ? colors.backgroundDark : colors.background }} edges={['top']}>
        <EmptyState
          icon="✅"
          title="You're all set!"
          description="A verified pro will be matched shortly. We'll keep you updated."
          ctaLabel="Done"
          onCta={() => navigation?.navigate('Home')}
        />
      </SafeAreaView>
    );
  }

  const selectedSvc = SERVICES.find(s => s.key === selectedService);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? colors.backgroundDark : colors.background }} edges={['top']}>
      <Header
        title="Book a Service"
        onBack={step !== 'select' ? () => setStep(step === 'quote' ? 'details' : 'select') : undefined}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* George intro */}
        <Card style={{ marginBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Text style={{ fontSize: 28 }}>🏠</Text>
          <Text style={{ flex: 1, fontSize: 14, color: mutedColor }}>
            {step === 'select'
              ? "I'll walk you through booking. What service do you need?"
              : step === 'details'
              ? `Great choice! Tell me about the ${selectedSvc?.label || 'service'} job.`
              : "Here's your estimate. Confirm when you're ready!"}
          </Text>
        </Card>

        {/* Step 1: Service selection chips */}
        {step === 'select' && (
          <>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginBottom: spacing.md }}>
              What do you need?
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {SERVICES.map(svc => (
                <Button
                  key={svc.key}
                  variant={selectedService === svc.key ? 'primary' : 'secondary'}
                  size="sm"
                  onPress={() => {
                    setSelectedService(svc.key);
                    setStep('details');
                  }}
                  accessibilityLabel={`Select ${svc.label}`}
                >
                  {`${svc.icon} ${svc.label}`}
                </Button>
              ))}
            </View>
          </>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <View style={{ gap: spacing.md }}>
            <Input
              label="What needs to be done?"
              placeholder="Describe the job..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              accessibilityLabel="Job description"
            />
            <Input
              label="Service address"
              variant="address"
              placeholder="123 Main St, Orlando, FL"
              value={address}
              onChangeText={setAddress}
              accessibilityLabel="Service address"
            />
            <Input
              label="Phone (optional)"
              variant="phone"
              placeholder="(555) 123-4567"
              value={phone}
              onChangeText={setPhone}
              accessibilityLabel="Phone number"
            />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={quoteLoading}
              disabled={!address.trim()}
              onPress={getQuote}
              accessibilityLabel="Get price quote"
            >
              Get Quote
            </Button>
          </View>
        )}

        {/* Step 3: Quote summary */}
        {step === 'quote' && quote && (
          <View style={{ gap: spacing.lg }}>
            <Card style={{
              alignItems: 'center',
              backgroundColor: dark ? '#064E3B' : '#F0FDF4',
              borderColor: dark ? '#10B981' : '#BBF7D0',
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>💰 Price Estimate</Text>
              <Text style={{ fontSize: 36, fontWeight: '900', color: colors.success, marginVertical: spacing.sm }}>
                {quote.price || quote.estimate || quote.total || 'Contact for pricing'}
              </Text>
              {quote.breakdown && Array.isArray(quote.breakdown) && (
                <View style={{ gap: 4, width: '100%' }}>
                  {quote.breakdown.map((item: any, i: number) => (
                    <Text key={i} style={{ fontSize: 13, color: mutedColor }}>
                      {item.label || item.name}: {item.amount || item.price}
                    </Text>
                  ))}
                </View>
              )}
              {(quote.note || quote.disclaimer) && (
                <Text style={{ fontSize: 12, color: mutedColor, marginTop: spacing.sm, textAlign: 'center', fontStyle: 'italic' }}>
                  {quote.note || quote.disclaimer}
                </Text>
              )}
            </Card>

            {/* Summary card */}
            <Card>
              <Text style={{ fontSize: 14, fontWeight: '600', color: mutedColor, marginBottom: spacing.sm }}>BOOKING SUMMARY</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>{selectedSvc?.icon} {selectedSvc?.label}</Text>
              {description ? <Text style={{ fontSize: 14, color: mutedColor, marginTop: 4 }}>{description}</Text> : null}
              <Text style={{ fontSize: 14, color: mutedColor, marginTop: 4 }}>📍 {address}</Text>
            </Card>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleSubmit}
              accessibilityLabel="Confirm booking"
            >
              Confirm Booking
            </Button>
            <Text style={{ fontSize: 12, color: mutedColor, textAlign: 'center' }}>
              No charge until you approve a quote from a verified pro.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
