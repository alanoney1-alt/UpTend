import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, LayoutAnimation, UIManager, Platform, RefreshControl } from 'react-native';
import { Colors } from '../theme/colors';
import { LoadingScreen, EmptyState } from '../components/ui';
import { fetchProTips } from '../services/api';

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);

interface ProTip {
  id: string;
  title: string;
  summary: string;
  fullText: string;
  category: string;
  categoryEmoji: string;
  categoryLabel: string;
  readMinutes: number;
  proName?: string;
  proRating?: number;
  bookableService?: string;
  bookmarked?: boolean;
}

const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  seasonal: { emoji: '🌤️', label: 'Seasonal' },
  diy: { emoji: '🔧', label: 'DIY' },
  when_to_call: { emoji: '📞', label: 'When to Call' },
  money: { emoji: '💰', label: 'Money' },
  maintenance: { emoji: '🏠', label: 'Maintenance' },
  energy: { emoji: '⚡', label: 'Energy' },
  safety: { emoji: '🛡️', label: 'Safety' },
  efficiency: { emoji: '⏱️', label: 'Efficiency' },
  customer_service: { emoji: '🤝', label: 'Customer Service' },
};

type FilterKey = 'all' | string;
const FILTERS: FilterKey[] = ['all', ...Object.keys(CATEGORY_META)];

function TipCard({ tip, featured }: { tip: ProTip; featured?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(tip.bookmarked || false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity style={[styles.tipCard, featured && styles.featuredCard]} onPress={toggle} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={tip.title}>
      {featured && <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>💡 Tip of the Day</Text></View>}
      <View style={styles.tipHeader}>
        <View style={[styles.categoryTag, { backgroundColor: Colors.primary + '15' }]}>
          <Text style={styles.categoryText}>{tip.categoryEmoji} {tip.categoryLabel}</Text>
        </View>
        <Text style={styles.readTime}>{tip.readMinutes} min read</Text>
      </View>
      <Text style={[styles.tipTitle, featured && styles.featuredTitle]}>{tip.title}</Text>
      <Text style={styles.tipSummary}>{tip.summary}</Text>
      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.fullText}>{tip.fullText}</Text>
          {tip.proName && (
            <View style={styles.proAttrib}>
              <Text style={styles.proAttribText}>💡 Tip from {tip.proName} ⭐ {tip.proRating}</Text>
            </View>
          )}
          <View style={styles.tipActions}>
            {tip.bookableService && (
              <TouchableOpacity style={styles.bookBtn}>
                <Text style={styles.bookBtnText}>Book {tip.bookableService}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setBookmarked(!bookmarked)} style={styles.actionIcon}>
              <Text style={styles.actionText}>{bookmarked ? '🔖' : '📑'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon}>
              <Text style={styles.actionText}>↗️</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ProTipsScreen() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [tips, setTips] = useState<ProTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const cat = filter === 'all' ? undefined : filter;
      const res = await fetchProTips(cat);
      const list: ProTip[] = (res?.tips || res || []).map((t: any, i: number) => ({
        id: t.id || `${i}`,
        title: t.title || 'Tip',
        summary: t.summary || t.description || '',
        fullText: t.fullText || t.content || t.summary || '',
        category: t.category || 'general',
        categoryEmoji: CATEGORY_META[t.category]?.emoji || '💡',
        categoryLabel: CATEGORY_META[t.category]?.label || t.category || 'General',
        readMinutes: t.readMinutes || 2,
        proName: t.proName,
        proRating: t.proRating,
        bookableService: t.bookableService,
        bookmarked: t.bookmarked || false,
      }));
      setTips(list);
    } catch { setTips([]); }
  }, [filter]);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading && tips.length === 0) return <LoadingScreen message="Loading tips from Mr. George..." />;

  const tipOfDay = tips[0];
  const restTips = tips.slice(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : (CATEGORY_META[f]?.emoji || '') + ' ' + (CATEGORY_META[f]?.label || f)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {tips.length === 0 ? (
        <EmptyState icon="💡" title="No Tips Yet" description="Mr. George is cooking up some great pro tips — check back soon!" />
      ) : (
        <>
          {tipOfDay && <TipCard tip={tipOfDay} featured />}
          {restTips.map(tip => <TipCard key={tip.id} tip={tip} />)}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 20 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff' },
  filterBtnActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  tipCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  featuredCard: { borderWidth: 2, borderColor: Colors.primary + '40', backgroundColor: Colors.primary + '05' },
  featuredBadge: { marginBottom: 10 },
  featuredBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  readTime: { fontSize: 11, color: Colors.textSecondary },
  tipTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, lineHeight: 22 },
  featuredTitle: { fontSize: 18 },
  tipSummary: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginTop: 6 },
  expandedContent: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 14 },
  fullText: { fontSize: 14, color: Colors.text, lineHeight: 22 },
  proAttrib: { backgroundColor: Colors.purple + '10', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginTop: 12 },
  proAttribText: { fontSize: 13, fontWeight: '600', color: Colors.purple },
  tipActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  bookBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, flex: 1 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, textAlign: 'center' },
  actionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontSize: 18 },
});
