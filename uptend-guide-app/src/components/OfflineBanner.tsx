import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  syncing?: boolean;
  syncedUp?: boolean;
}

export default function OfflineBanner({ syncing, syncedUp }: Props) {
  if (syncedUp) {
    return (
      <View style={[styles.banner, styles.syncedBanner]}>
        <Text style={styles.syncedText}>✓ All caught up</Text>
      </View>
    );
  }

  return (
    <View style={[styles.banner, syncing ? styles.syncingBanner : styles.offlineBanner]}>
      <Text style={styles.bannerText}>
        {syncing ? '🔄 Syncing...' : '📡 Offline — changes will sync'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { paddingVertical: 6, alignItems: 'center' },
  offlineBanner: { backgroundColor: Colors.warning },
  syncingBanner: { backgroundColor: Colors.info },
  syncedBanner: { backgroundColor: Colors.success },
  bannerText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  syncedText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
