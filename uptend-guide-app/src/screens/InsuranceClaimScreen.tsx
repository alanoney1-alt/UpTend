import React, { useState } from 'react';
import { View, Text, ScrollView, useColorScheme, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Button, Input } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { submitInsuranceClaim } from '../services/api';

export default function InsuranceClaimScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [jobId, setJobId] = useState('');
  const [description, setDescription] = useState('');
  const [damageType, setDamageType] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  const handleSubmit = async () => {
    if (!description.trim()) { Alert.alert('Required', 'Please describe the damage.'); return; }
    setSubmitting(true);
    try {
      await submitInsuranceClaim({ jobId, description, damageType, estimatedCost: parseFloat(estimatedCost) || undefined });
      Alert.alert('Claim Submitted ✅', 'George is reviewing your claim. We\'ll get back to you within 48 hours.', [{ text: 'OK', onPress: () => navigation?.goBack() }]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not submit claim. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="File a Claim" subtitle="Damage protection" onBack={() => navigation?.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* George helper */}
          <View style={{ backgroundColor: dark ? '#3B2A15' : '#FFF7ED', borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.primary }}>
            <Text style={{ fontSize: 15, color: textColor }}>💬 <Text style={{ fontWeight: '700' }}>George says:</Text> "I'm sorry this happened. Let's get this sorted out for you quickly."</Text>
          </View>

          <View style={{ backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.xl, marginBottom: spacing.xl }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginBottom: spacing.md }}>Claim Details</Text>

            <Text style={{ fontSize: 13, color: mutedColor, marginBottom: 4 }}>Job ID (optional)</Text>
            <Input value={jobId} onChangeText={setJobId} placeholder="e.g. JOB-12345" accessibilityLabel="Job ID" />

            <Text style={{ fontSize: 13, color: mutedColor, marginBottom: 4, marginTop: spacing.md }}>Type of Damage</Text>
            <Input value={damageType} onChangeText={setDamageType} placeholder="e.g. Property damage, broken item" accessibilityLabel="Damage type" />

            <Text style={{ fontSize: 13, color: mutedColor, marginBottom: 4, marginTop: spacing.md }}>Estimated Cost ($)</Text>
            <Input value={estimatedCost} onChangeText={setEstimatedCost} placeholder="e.g. 250" keyboardType="decimal-pad" accessibilityLabel="Estimated repair cost" />

            <Text style={{ fontSize: 13, color: mutedColor, marginBottom: 4, marginTop: spacing.md }}>Description *</Text>
            <Input value={description} onChangeText={setDescription} placeholder="Describe what happened in detail..." multiline accessibilityLabel="Damage description" />
          </View>

          <Button variant="primary" size="lg" fullWidth loading={submitting} onPress={handleSubmit}>
            Submit Claim
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
