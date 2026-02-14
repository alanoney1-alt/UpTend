import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

// On web, show a placeholder. On native, this would use react-native-maps.
// For the investor demo (web), we show the map placeholder.
export default function LiveMapScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.title}>Live Pro Map</Text>
        <Text style={styles.subtitle}>
          {Platform.OS === 'web'
            ? 'Live map tracking is available in the mobile app. Download from the App Store or Google Play.'
            : 'Loading map...'}
        </Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>10</Text>
            <Text style={styles.statLabel}>Pros Online</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>~15min</Text>
            <Text style={styles.statLabel}>Avg Response</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background || '#111' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#aaa', textAlign: 'center', lineHeight: 22 },
  stats: { flexDirection: 'row', marginTop: 32, gap: 24 },
  stat: { alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#F97316' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
});
