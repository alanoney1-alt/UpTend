import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  condition: string;
  message: string;
  suggestion?: string;
}

const WEATHER_ICONS: Record<string, string> = {
  rain: '🌧️', storm: '⛈️', wind: '💨', sunny: '☀️', cloudy: '☁️',
};

export default function WeatherAlert({ condition, message, suggestion }: Props) {
  const icon = WEATHER_ICONS[condition] || '🌤️';
  const isWarning = condition === 'rain' || condition === 'storm';

  return (
    <View style={[styles.alert, isWarning ? styles.warningBg : styles.infoBg]}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.content}>
        <Text style={[styles.message, isWarning && styles.warningText]}>{message}</Text>
        {suggestion && <Text style={styles.suggestion}>{suggestion}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: { flexDirection: 'row', borderRadius: 10, padding: 10, gap: 8, alignItems: 'center' },
  warningBg: { backgroundColor: '#FFF3E8' },
  infoBg: { backgroundColor: '#E8F0FF' },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  message: { fontSize: 13, fontWeight: '600', color: Colors.text },
  warningText: { color: Colors.warning },
  suggestion: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
