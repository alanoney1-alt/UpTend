import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarDay {
  day: number;
  hasService: boolean;
  serviceName?: string;
  serviceTime?: string;
  isToday: boolean;
  isBusy: boolean;
}

const today = new Date();
const MOCK_DAYS: CalendarDay[] = Array.from({ length: 28 }, (_, i) => {
  const day = i + 1;
  const services: Record<number, { name: string; time: string }> = {
    5: { name: 'Lawn Care', time: '10:00 AM' },
    12: { name: 'Pressure Washing', time: '2:00 PM' },
    18: { name: 'Pool Cleaning', time: '9:00 AM' },
    25: { name: 'Gutter Cleaning', time: '11:00 AM' },
  };
  const s = services[day];
  return { day, hasService: !!s, serviceName: s?.name, serviceTime: s?.time, isToday: day === today.getDate(), isBusy: [3, 7, 14, 21].includes(day) };
});

const SUGGESTED_TIMES = [
  { date: 'Feb 14', time: '10:00 AM – 12:00 PM', reason: 'Free window, good weather ☀️' },
  { date: 'Feb 16', time: '2:00 PM – 4:00 PM', reason: 'You\'re home all afternoon' },
  { date: 'Feb 18', time: '9:00 AM – 11:00 AM', reason: 'Weekend – most popular time' },
];

export default function CalendarScreen() {
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📅 Service Calendar</Text>
        <Text style={styles.subtitle}>February 2026</Text>

        {/* Calendar grid */}
        <View style={styles.calendarCard}>
          <View style={styles.weekRow}>
            {DAYS_OF_WEEK.map(d => <Text key={d} style={styles.weekDay}>{d}</Text>)}
          </View>
          <View style={styles.daysGrid}>
            {/* Offset for month start */}
            {Array.from({ length: 0 }).map((_, i) => <View key={`empty-${i}`} style={styles.dayCell} />)}
            {MOCK_DAYS.map(day => (
              <TouchableOpacity
                key={day.day}
                style={[styles.dayCell, day.isToday && styles.todayCell, selectedDay?.day === day.day && styles.selectedCell]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayNum, day.isToday && styles.todayNum, day.isBusy && styles.busyNum]}>{day.day}</Text>
                {day.hasService && <View style={styles.serviceDot} />}
                {day.isBusy && !day.hasService && <View style={styles.busyDot} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected day detail */}
        {selectedDay && (
          <View style={styles.dayDetail}>
            <Text style={styles.dayDetailTitle}>February {selectedDay.day}</Text>
            {selectedDay.hasService ? (
              <View style={styles.serviceDetail}>
                <View style={styles.serviceTime}><Text style={styles.serviceTimeText}>{selectedDay.serviceTime}</Text></View>
                <View>
                  <Text style={styles.serviceNameText}>{selectedDay.serviceName}</Text>
                  <Text style={styles.serviceProText}>Pro assigned • Confirmed</Text>
                </View>
              </View>
            ) : selectedDay.isBusy ? (
              <Text style={styles.busyText}>📋 You have calendar events this day</Text>
            ) : (
              <Text style={styles.freeText}>✅ You're free — great day for a service!</Text>
            )}
          </View>
        )}

        {/* AI Suggestions */}
        <Text style={styles.sectionTitle}>🤖 Bud Suggested Times</Text>
        <Text style={styles.sectionSubtitle}>Based on your calendar & weather</Text>
        {SUGGESTED_TIMES.map((st, i) => (
          <View key={i} style={styles.suggestionCard}>
            <View style={styles.suggestionInfo}>
              <Text style={styles.suggestionDate}>{st.date}</Text>
              <Text style={styles.suggestionTime}>{st.time}</Text>
              <Text style={styles.suggestionReason}>{st.reason}</Text>
            </View>
            <TouchableOpacity style={styles.bookSlotBtn}>
              <Text style={styles.bookSlotText}>Book</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Upcoming */}
        <Text style={styles.sectionTitle}>Upcoming Services</Text>
        {MOCK_DAYS.filter(d => d.hasService).map(d => (
          <View key={d.day} style={styles.upcomingRow}>
            <View style={styles.upcomingDate}><Text style={styles.upcomingDateText}>Feb {d.day}</Text></View>
            <View><Text style={styles.upcomingService}>{d.serviceName}</Text><Text style={styles.upcomingTime}>{d.serviceTime}</Text></View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  calendarCard: { backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  todayCell: { backgroundColor: '#FFF3E8', borderRadius: 20 },
  selectedCell: { backgroundColor: Colors.primary, borderRadius: 20 },
  dayNum: { fontSize: 14, fontWeight: '600', color: Colors.text },
  todayNum: { color: Colors.primary, fontWeight: '800' },
  busyNum: { color: Colors.textSecondary },
  serviceDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.primary, position: 'absolute', bottom: 4 },
  busyDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.textLight, position: 'absolute', bottom: 4 },
  dayDetail: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16 },
  dayDetailTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  serviceDetail: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceTime: { backgroundColor: '#FFF3E8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  serviceTimeText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  serviceNameText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  serviceProText: { fontSize: 12, color: Colors.success },
  busyText: { fontSize: 14, color: Colors.textSecondary },
  freeText: { fontSize: 14, color: Colors.success },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 8, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  suggestionCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, alignItems: 'center' },
  suggestionInfo: { flex: 1 },
  suggestionDate: { fontSize: 14, fontWeight: '700', color: Colors.text },
  suggestionTime: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  suggestionReason: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  bookSlotBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  bookSlotText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  upcomingDate: { backgroundColor: Colors.purple, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  upcomingDateText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  upcomingService: { fontSize: 14, fontWeight: '600', color: Colors.text },
  upcomingTime: { fontSize: 12, color: Colors.textSecondary },
});
