import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

type Step = 0 | 1 | 2 | 3 | 4;
const STEPS = ['What Happened', 'When', 'Photos', 'Details', 'Review'];

const CLAIM_TYPES = [
  { id: 'property_damage', label: 'Property Damage', icon: '🏠' },
  { id: 'personal_injury', label: 'Personal Injury', icon: '🤕' },
  { id: 'vehicle_damage', label: 'Vehicle Damage', icon: '🚗' },
  { id: 'equipment_loss', label: 'Equipment Loss', icon: '🔧' },
  { id: 'other', label: 'Other', icon: '📋' },
];

export default function InsuranceClaimScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>(0);
  const [claimType, setClaimType] = useState('');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.submittedView}>
          <Text style={styles.submittedIcon}>✅</Text>
          <Text style={styles.submittedTitle}>Claim Submitted</Text>
          <Text style={styles.submittedSub}>Claim #CLM-2026-0847{'\n'}UpTend will review within 24-48 hours</Text>
          <View style={styles.claimSummary}>
            <Text style={styles.summaryItem}>Type: {claimType}</Text>
            <Text style={styles.summaryItem}>Photos: {photos.length} attached</Text>
            <Text style={styles.summaryItem}>Status: Under Review</Text>
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Progress */}
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View key={i} style={styles.stepItem}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}><Text style={styles.stepNum}>{i < step ? '✓' : i + 1}</Text></View>
            <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 && (
          <>
            <Text style={styles.stepTitle}>❓ What Happened?</Text>
            <Text style={styles.stepSub}>Select the type of incident</Text>
            {CLAIM_TYPES.map(ct => (
              <TouchableOpacity key={ct.id} style={[styles.typeBtn, claimType === ct.id && styles.typeBtnActive]} onPress={() => setClaimType(ct.id)}>
                <Text style={styles.typeIcon}>{ct.icon}</Text>
                <Text style={[styles.typeLabel, claimType === ct.id && styles.typeLabelActive]}>{ct.label}</Text>
              </TouchableOpacity>
            ))}
            <TextInput style={styles.textArea} placeholder="Briefly describe what happened..." value={description} onChangeText={setDescription} multiline placeholderTextColor={Colors.textLight} />
          </>
        )}
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>📅 When Did It Happen?</Text>
            <View style={styles.dateCard}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.dateText}>Today, Feb 12, 2026</Text>
            </View>
            <View style={styles.dateCard}>
              <Text style={styles.dateIcon}>🕐</Text>
              <Text style={styles.dateText}>2:30 PM (approx)</Text>
            </View>
            <Text style={styles.autoAttach}>Auto-attached: Job #JOB-4821, GPS location</Text>
          </>
        )}
        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>📸 Add Photos</Text>
            <Text style={styles.stepSub}>Take photos of the damage</Text>
            <View style={styles.photoGrid}>
              {photos.map((_, i) => (
                <View key={i} style={styles.photoThumb}><Text style={styles.photoIcon}>📷</Text></View>
              ))}
              <TouchableOpacity style={styles.addPhotoBtn} onPress={() => setPhotos([...photos, 'photo'])}>
                <Text style={styles.addPhotoIcon}>+</Text>
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.annotateHint}>📌 Tap photos to annotate damage areas</Text>
          </>
        )}
        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>📝 Additional Details</Text>
            <TextInput style={[styles.textArea, { height: 120 }]} placeholder="Provide any additional details that may help with the claim..." value={details} onChangeText={setDetails} multiline placeholderTextColor={Colors.textLight} />
          </>
        )}
        {step === 4 && (
          <>
            <Text style={styles.stepTitle}>✅ Review Your Claim</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewItem}>📋 Type: {claimType || 'Not selected'}</Text>
              <Text style={styles.reviewItem}>📝 Description: {description || 'None'}</Text>
              <Text style={styles.reviewItem}>📸 Photos: {photos.length} attached</Text>
              <Text style={styles.reviewItem}>📍 Job: #JOB-4821</Text>
              <Text style={styles.reviewItem}>📅 Date: Feb 12, 2026</Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep((step - 1) as Step)}><Text style={styles.backStepText}>Back</Text></TouchableOpacity>}
        <TouchableOpacity style={styles.nextBtn} onPress={() => step < 4 ? setStep((step + 1) as Step) : setSubmitted(true)}>
          <Text style={styles.nextBtnText}>{step === 4 ? '📤 Submit Claim' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progress: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, gap: 4 },
  stepItem: { flex: 1, alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: Colors.primary },
  stepNum: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepLabel: { fontSize: 9, color: Colors.textLight, marginTop: 4, textAlign: 'center' },
  stepLabelActive: { color: Colors.primary, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 100 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  stepSub: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 2, borderColor: 'transparent' },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: '#FFF3E8' },
  typeIcon: { fontSize: 24 },
  typeLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  typeLabelActive: { color: Colors.primary },
  textArea: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, color: Colors.text, height: 80, textAlignVertical: 'top', marginTop: 12 },
  dateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
  dateIcon: { fontSize: 20 },
  dateText: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  autoAttach: { fontSize: 12, color: Colors.success, marginTop: 12 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumb: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  photoIcon: { fontSize: 24 },
  addPhotoBtn: { width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addPhotoIcon: { fontSize: 24, color: Colors.primary },
  addPhotoText: { fontSize: 10, color: Colors.primary, fontWeight: '600' },
  annotateHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 16 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8 },
  reviewItem: { fontSize: 14, color: Colors.text },
  footer: { flexDirection: 'row', padding: 16, gap: 10, position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.background },
  backStepBtn: { flex: 1, borderWidth: 2, borderColor: Colors.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  backStepText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  nextBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  submittedView: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  submittedIcon: { fontSize: 60 },
  submittedTitle: { fontSize: 24, fontWeight: '800', color: Colors.success, marginTop: 16 },
  submittedSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
  claimSummary: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '100%', marginTop: 20, gap: 6 },
  summaryItem: { fontSize: 14, color: Colors.text },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 60, marginTop: 20 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
