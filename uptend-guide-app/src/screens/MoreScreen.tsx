import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const MENU_ITEMS = [
  { key: 'DIY', label: 'DIY Guides', icon: '🔨', desc: 'Learn home repairs with George' },
  { key: 'Shopping', label: 'Shopping', icon: '🛒', desc: 'Compare prices across retailers' },
  { key: 'Emergency', label: 'Emergency SOS', icon: '🚨', desc: 'Get immediate help' },
  { key: 'Profile', label: 'Profile & Settings', icon: '👤', desc: 'Account, home, vehicles' },
];

export default function MoreScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {MENU_ITEMS.map(item => (
          <TouchableOpacity
            key={item.key}
            style={styles.menuCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(item.key)}
          >
            <View style={styles.menuIcon}>
              <Text style={{ fontSize: 28 }}>{item.icon}</Text>
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    backgroundColor: '#f97316', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  scroll: { padding: 20, paddingBottom: 40 },
  menuCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  menuIcon: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: '#f9fafb',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  menuDesc: { fontSize: 13, color: '#64748b', marginTop: 2 },
  menuArrow: { fontSize: 24, color: '#9ca3af' },
});
