import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { reviewResponseAI, Review, ResponseTone } from '../services/ReviewResponseAI';

const TONES: { tone: ResponseTone; label: string; icon: string }[] = [
  { tone: 'grateful', label: 'Grateful', icon: '🙏' },
  { tone: 'professional', label: 'Professional', icon: '👔' },
  { tone: 'friendly', label: 'Friendly', icon: '😊' },
  { tone: 'apologetic', label: 'Apologetic', icon: '💐' },
];

export default function ReviewManagerScreen() {
  const [reviews] = useState(reviewResponseAI.getReviews());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const generateResponse = async (review: Review, tone: ResponseTone) => {
    setGenerating(review.id);
    const response = await reviewResponseAI.generateResponse(review, tone);
    setDrafts(prev => ({ ...prev, [review.id]: response }));
    setGenerating(null);
  };

  const stars = (n: number) => '⭐'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>⭐ Review Manager</Text>
        <Text style={styles.subtitle}>{reviews.filter(r => !r.responded).length} need response</Text>
      </View>
      <FlatList
        data={reviews}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.reviewHeader}>
              <View>
                <Text style={styles.reviewer}>{item.customerName}</Text>
                <Text style={styles.reviewStars}>{stars(item.rating)}</Text>
              </View>
              <View>
                <Text style={styles.reviewDate}>{item.date.toLocaleDateString?.() || 'Recent'}</Text>
                <Text style={styles.reviewService}>{item.serviceType}</Text>
              </View>
            </View>
            <Text style={styles.reviewText}>"{item.text}"</Text>

            {item.responded ? (
              <View style={styles.respondedBox}>
                <Text style={styles.respondedLabel}>✓ Your Response:</Text>
                <Text style={styles.respondedText}>{item.response}</Text>
              </View>
            ) : (
              <>
                {/* Tone buttons */}
                <View style={styles.toneRow}>
                  {TONES.map(t => (
                    <TouchableOpacity key={t.tone} style={styles.toneBtn} onPress={() => generateResponse(item, t.tone)}>
                      <Text style={styles.toneIcon}>{t.icon}</Text>
                      <Text style={styles.toneLabel}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {generating === item.id && <Text style={styles.generating}>✨ Generating response...</Text>}

                {drafts[item.id] && (
                  <View style={styles.draftBox}>
                    <Text style={styles.draftLabel}>Draft Response:</Text>
                    {editingId === item.id ? (
                      <TextInput
                        style={styles.draftInput}
                        value={drafts[item.id]}
                        onChangeText={text => setDrafts(prev => ({ ...prev, [item.id]: text }))}
                        multiline
                      />
                    ) : (
                      <Text style={styles.draftText}>{drafts[item.id]}</Text>
                    )}
                    <View style={styles.draftActions}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => setEditingId(editingId === item.id ? null : item.id)}>
                        <Text style={styles.editBtnText}>{editingId === item.id ? '✓ Done' : '✏️ Edit'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.sendBtn}>
                        <Text style={styles.sendBtnText}>📤 Send Response</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.primary, marginTop: 4, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewer: { fontSize: 16, fontWeight: '700', color: Colors.text },
  reviewStars: { fontSize: 12, marginTop: 2 },
  reviewDate: { fontSize: 12, color: Colors.textSecondary, textAlign: 'right' },
  reviewService: { fontSize: 12, color: Colors.purple, fontWeight: '600', textAlign: 'right' },
  reviewText: { fontSize: 14, color: Colors.text, fontStyle: 'italic', lineHeight: 20, marginBottom: 12 },
  toneRow: { flexDirection: 'row', gap: 6 },
  toneBtn: { flex: 1, backgroundColor: Colors.background, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  toneIcon: { fontSize: 16 },
  toneLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
  generating: { textAlign: 'center', color: Colors.primary, fontSize: 13, marginTop: 10 },
  draftBox: { backgroundColor: '#F0F9FF', borderRadius: 10, padding: 12, marginTop: 12 },
  draftLabel: { fontSize: 12, fontWeight: '700', color: Colors.info, marginBottom: 4 },
  draftText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  draftInput: { fontSize: 14, color: Colors.text, lineHeight: 20, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 8, minHeight: 60 },
  draftActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  editBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  editBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  sendBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  sendBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  respondedBox: { backgroundColor: '#E8F5E8', borderRadius: 10, padding: 12, marginTop: 8 },
  respondedLabel: { fontSize: 12, fontWeight: '700', color: Colors.success, marginBottom: 4 },
  respondedText: { fontSize: 13, color: Colors.text, lineHeight: 18 },
});
