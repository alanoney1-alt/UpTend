import React, { useState, useCallback } from 'react';
import { View, FlatList, Text, TouchableOpacity, RefreshControl, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import TransformationCard from '../components/TransformationCard';
import { MOCK_TRANSFORMATIONS, Transformation } from '../data/mockTransformations';

const FILTERS = ['All', 'Trending', 'Near Me', 'By Service'] as const;

export default function TransformationFeedScreen() {
  const navigation = useNavigation<any>();
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(MOCK_TRANSFORMATIONS);

  const filtered = activeFilter === 'Trending'
    ? data.filter(t => t.trending)
    : activeFilter === 'Near Me'
    ? data.slice(0, 8)
    : data;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setData([...MOCK_TRANSFORMATIONS].sort(() => Math.random() - 0.5));
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleGetThisDone = (serviceType: string) => {
    navigation.navigate('Bud', { prefill: `I'd like to book ${serviceType}` });
  };

  const renderItem = ({ item }: { item: Transformation }) => (
    <TransformationCard item={item} onGetThisDone={handleGetThisDone} />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Filter tabs */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.background },
  filterTabActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  list: { paddingTop: 16, paddingBottom: 40 },
});
