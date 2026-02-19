import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

const MENU = [
  { key: 'DIY', label: 'DIY Guides', icon: 'build-outline' as const, desc: 'Step-by-step repair help' },
  { key: 'Shopping', label: 'Shopping', icon: 'bag-outline' as const, desc: 'Compare prices on parts' },
  { key: 'Emergency', label: 'Emergency', icon: 'alert-circle-outline' as const, desc: 'Get help right now' },
  { key: 'Profile', label: 'Profile', icon: 'person-outline' as const, desc: 'Account & settings' },
  { key: 'Recruit', label: 'Become a Pro', icon: 'arrow-up-circle-outline' as const, desc: 'Earn on your skills' },
];

export default function MoreScreen({ navigation }: any) {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>More</Text>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        {MENU.map(item => (
          <TouchableOpacity
            key={item.key}
            style={s.row}
            activeOpacity={0.6}
            onPress={() => navigation.navigate(item.key)}
          >
            <View style={s.iconWrap}>
              <Ionicons name={item.icon} size={20} color={Colors.gray900} />
            </View>
            <View style={s.info}>
              <Text style={s.label}>{item.label}</Text>
              <Text style={s.desc}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.gray300} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.gray900, letterSpacing: -0.5 },
  scroll: { paddingHorizontal: 20 },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 0.5, borderBottomColor: Colors.gray150,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.gray100,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  info: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600', color: Colors.gray900, letterSpacing: -0.2 },
  desc: { fontSize: 13, color: Colors.gray500, marginTop: 2 },
});
