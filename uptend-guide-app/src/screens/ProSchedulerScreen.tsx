import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 6); // 6am to 6pm

interface DaySchedule {
  day: string;
  enabled: boolean;
  start: number; // hour
  end: number;
}

export default function ProSchedulerScreen() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map((day, i) => ({
      day,
      enabled: i < 5, // Mon-Fri enabled
      start: 8,
      end: 17,
    }))
  );
  const [vacationMode, setVacationMode] = useState(false);
  const [calendarSync, setCalendarSync] = useState(true);

  const toggleDay = (index: number) => {
    setSchedule(prev => prev.map((d, i) => i === index ? { ...d, enabled: !d.enabled } : d));
  };

  const adjustTime = (index: number, field: 'start' | 'end', delta: number) => {
    setSchedule(prev => prev.map((d, i) => {
      if (i !== index) return d;
      const newVal = d[field] + delta;
      if (field === 'start' && newVal >= 6 && newVal < d.end) return { ...d, start: newVal };
      if (field === 'end' && newVal > d.start && newVal <= 20) return { ...d, end: newVal };
      return d;
    }));
  };

  const formatHour = (h: number) => {
    if (h === 0 || h === 12) return `${h === 0 ? 12 : h}:00 ${h < 12 ? 'AM' : 'PM'}`;
    return `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const totalHours = schedule.filter(d => d.enabled).reduce((s, d) => s + (d.end - d.start), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📅 Availability</Text>
        <Text style={styles.subtitle}>{totalHours} hours/week</Text>

        {/* Vacation mode */}
        <View style={[styles.vacationCard, vacationMode && styles.vacationActive]}>
          <View style={styles.vacationInfo}>
            <Text style={styles.vacationIcon}>🏖️</Text>
            <View>
              <Text style={[styles.vacationTitle, vacationMode && { color: '#fff' }]}>Vacation Mode</Text>
              <Text style={[styles.vacationSub, vacationMode && { color: 'rgba(255,255,255,0.7)' }]}>
                {vacationMode ? 'You\'re temporarily unavailable' : 'Pause all availability'}
              </Text>
            </View>
          </View>
          <Switch
            value={vacationMode}
            onValueChange={setVacationMode}
            trackColor={{ false: '#ddd', true: 'rgba(255,255,255,0.3)' }}
            thumbColor={vacationMode ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Weekly schedule */}
        <Text style={styles.sectionTitle}>Weekly Schedule</Text>
        {schedule.map((day, index) => (
          <View key={day.day} style={[styles.dayCard, !day.enabled && styles.dayDisabled]}>
            <TouchableOpacity style={styles.dayToggle} onPress={() => toggleDay(index)}>
              <View style={[styles.dayCheck, day.enabled && styles.dayCheckActive]}>
                {day.enabled && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.dayName, !day.enabled && styles.dayNameDisabled]}>{day.day}</Text>
            </TouchableOpacity>
            {day.enabled && (
              <View style={styles.timeRow}>
                <View style={styles.timeControl}>
                  <TouchableOpacity style={styles.timeBtn} onPress={() => adjustTime(index, 'start', -1)}>
                    <Text style={styles.timeBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeText}>{formatHour(day.start)}</Text>
                  <TouchableOpacity style={styles.timeBtn} onPress={() => adjustTime(index, 'start', 1)}>
                    <Text style={styles.timeBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.timeSep}>to</Text>
                <View style={styles.timeControl}>
                  <TouchableOpacity style={styles.timeBtn} onPress={() => adjustTime(index, 'end', -1)}>
                    <Text style={styles.timeBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeText}>{formatHour(day.end)}</Text>
                  <TouchableOpacity style={styles.timeBtn} onPress={() => adjustTime(index, 'end', 1)}>
                    <Text style={styles.timeBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Calendar sync */}
        <View style={styles.syncCard}>
          <View style={styles.syncInfo}>
            <Text style={styles.syncIcon}>📱</Text>
            <View>
              <Text style={styles.syncTitle}>Phone Calendar Sync</Text>
              <Text style={styles.syncSub}>Block times from your personal calendar</Text>
            </View>
          </View>
          <Switch
            value={calendarSync}
            onValueChange={setCalendarSync}
            trackColor={{ false: '#ddd', true: Colors.primaryLight }}
            thumbColor={calendarSync ? Colors.primary : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>💾 Save Schedule</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginTop: 4, marginBottom: 16 },
  vacationCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 16 },
  vacationActive: { backgroundColor: Colors.purple },
  vacationInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vacationIcon: { fontSize: 24 },
  vacationTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  vacationSub: { fontSize: 12, color: Colors.textSecondary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  dayCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 6 },
  dayDisabled: { opacity: 0.5 },
  dayToggle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayCheck: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  dayCheckActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '800' },
  dayName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  dayNameDisabled: { color: Colors.textLight },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8, paddingLeft: 34 },
  timeControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 8, overflow: 'hidden' },
  timeBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  timeBtnText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  timeText: { fontSize: 13, fontWeight: '600', color: Colors.text, paddingHorizontal: 6 },
  timeSep: { fontSize: 13, color: Colors.textSecondary },
  syncCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 16, marginBottom: 16 },
  syncInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  syncIcon: { fontSize: 20 },
  syncTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  syncSub: { fontSize: 12, color: Colors.textSecondary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
