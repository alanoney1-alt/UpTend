import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

export default function ARCameraScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.icon}>📸</Text>
        <Text style={styles.title}>AR Camera</Text>
        <Text style={styles.subtitle}>
          Point your camera at any room to get instant AI analysis, item identification, and condition assessment.
        </Text>
        <Text style={styles.note}>Available in the mobile app</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#aaa', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  note: { fontSize: 14, color: '#F97316', fontWeight: '600' },
});
