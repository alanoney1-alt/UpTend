import React, { useState } from 'react';
import { View, Text, ScrollView, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Button, Input, Card } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { createServiceRequest } from '../services/api';

const EMERGENCY_TYPES = [
  { id: 'burst_pipe', name: 'Burst Pipe', icon: '💧', desc: 'Water leak or flooding' },
  { id: 'no_power', name: 'No Power', icon: '⚡', desc: 'Electrical outage or sparking' },
  { id: 'gas_leak', name: 'Gas Leak', icon: '🔥', desc: 'Smell gas — leave immediately, call 911' },
  { id: 'no_ac', name: 'AC/Heat Down', icon: '❄️', desc: 'No cooling or heating' },
  { id: 'lockout', name: 'Locked Out', icon: '🔑', desc: 'Can\'t get into your home' },
  { id: 'other', name: 'Other Emergency', icon: '🚨', desc: 'Something else urgent' },
];

export default function EmergencyScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [selected, setSelected] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  const handleSubmit = async () => {
    if (!selected) { Alert.alert('Select Type', 'Please select the type of emergency.'); return; }
    setSubmitting(true);
    try {
      await createServiceRequest({ type: selected, description, priority: 'emergency', isEmergency: true });
      Alert.alert('Request Sent! 🚨', 'A pro will be dispatched to you ASAP. George is on it!', [{ text: 'OK', onPress: () => navigation?.goBack() }]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not submit request. Please call 911 for life-threatening emergencies.');
    } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="Emergency" subtitle="🚨 Priority service" onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}>
        {/* Warning banner */}
        <View style={{ backgroundColor: colors.error, borderRadius: radii.lg, padding: spacing.xl, marginBottom: spacing.xl }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' }}>🚨 Emergency Service</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 4 }}>
            For life-threatening emergencies, call 911 first.
          </Text>
        </View>

        {/* George triage */}
        <View style={{ backgroundColor: dark ? '#3B2A15' : '#FFF7ED', borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.primary }}>
          <Text style={{ fontSize: 15, color: textColor }}>💬 <Text style={{ fontWeight: '700' }}>George says:</Text> "Don't worry, I'll help you get this sorted fast. What's going on?"</Text>
        </View>

        {/* Emergency types */}
        <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: spacing.md }}>What's the emergency?</Text>
        {EMERGENCY_TYPES.map(type => (
          <Button
            key={type.id}
            variant={selected === type.id ? 'primary' : 'secondary'}
            size="lg"
            fullWidth
            style={{ marginBottom: spacing.sm }}
            onPress={() => setSelected(type.id)}
          >
            {type.icon} {type.name}
          </Button>
        ))}

        {selected && (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: textColor, marginBottom: spacing.sm }}>Describe what's happening:</Text>
            <Input
              placeholder="E.g., water pouring from ceiling..."
              value={description}
              onChangeText={setDescription}
              multiline
              accessibilityLabel="Emergency description"
            />
            <Button variant="destructive" size="lg" fullWidth loading={submitting} onPress={handleSubmit} style={{ marginTop: spacing.lg }}>
              🚨 Request Emergency Pro
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
