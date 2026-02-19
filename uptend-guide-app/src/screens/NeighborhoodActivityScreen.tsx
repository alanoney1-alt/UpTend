import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import ActivityCard from '../components/ActivityCard';

export default function NeighborhoodActivityScreen() {
  return (
    <View style={styles.container}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>24</Text>
          <Text style={styles.statLabel}>Active Pros</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>87</Text>
          <Text style={styles.statLabel}>Jobs This Week</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>73</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
      </View>

      <FlatList
        data={[]}
        renderItem={({ item }: { item: ActivityItem }) => <ActivityCard item={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  statsBar: { flexDirection: 'row', backgroundColor: Colors.purple, paddingVertical: 16, paddingHorizontal: 20, justifyContent: 'space-around', alignItems: 'center' },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.white },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '500' },
  divider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  list: { paddingTop: 16, paddingBottom: 40 },
});
