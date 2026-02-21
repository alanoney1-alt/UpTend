import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  desc: string;
  iosIcon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
}

const ACCOUNT_MENU: MenuItem[] = [
  { key: 'Profile', label: 'Account & Profile', icon: '👤', iosIcon: 'person-outline', desc: 'Personal info, addresses, payment' },
  { key: 'CustomerDashboard', label: 'My Dashboard', icon: '📊', iosIcon: 'stats-chart-outline', desc: 'Bookings, spend, home health' },
  { key: 'HomeProfile', label: 'My Homes', icon: '🏠', iosIcon: 'home-outline', desc: 'Manage your home profiles' },
  { key: 'Calendar', label: 'Calendar', icon: '📅', iosIcon: 'calendar-outline', desc: 'Upcoming services & reminders' },
];

const FEATURES_MENU: MenuItem[] = [
  { key: 'DIY', label: 'DIY Guides', icon: '🔧', iosIcon: 'build-outline', desc: 'Step-by-step repair help' },
  { key: 'Auto', label: 'Auto Care', icon: '🚗', iosIcon: 'car-outline', desc: 'Vehicle maintenance & diagnostics' },
  { key: 'Emergency', label: 'Emergency', icon: '🚨', iosIcon: 'alert-circle-outline', desc: 'Get help right now' },
  { key: 'Shopping', label: 'Shopping', icon: '🛒', iosIcon: 'bag-outline', desc: 'Compare prices on parts' },
  { key: 'HomeStreaks', label: 'Home Streaks', icon: '🔥', iosIcon: 'flame-outline', desc: 'Maintenance streaks & rewards' },
  { key: 'Leaderboard', label: 'Leaderboard', icon: '🏆', iosIcon: 'trophy-outline', desc: 'Community rankings' },
];

const BUSINESS_MENU: MenuItem[] = [
  { key: 'B2BDashboard', label: 'Business Dashboard', icon: '🏢', iosIcon: 'business-outline', desc: 'B2B properties & jobs' },
  { key: 'Recruit', label: 'Become a Pro', icon: '⬆️', iosIcon: 'arrow-up-circle-outline', desc: 'Earn on your skills' },
  { key: 'WhiteLabel', label: 'White Label', icon: '🏷️', iosIcon: 'pricetag-outline', desc: 'Brand your own platform' },
];

const SUPPORT_MENU: MenuItem[] = [
  { key: 'GeorgeChat', label: 'Ask Mr. George', icon: '💬', iosIcon: 'chatbubble-outline', desc: 'AI home assistant' },
  { key: 'Help', label: 'Help & Support', icon: '❓', iosIcon: 'help-circle-outline', desc: 'FAQ, contact, feedback' },
  { key: 'Legal', label: 'Legal & Privacy', icon: '📄', iosIcon: 'document-text-outline', desc: 'Terms, privacy policy' },
];

export default function MoreScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const { user, logout } = useAuth();
  const bg = dark ? colors.backgroundDark : colors.background;
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;
  const borderColor = dark ? colors.borderDark : colors.border;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const renderSection = (title: string, items: MenuItem[]) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingHorizontal: 4 }}>
        {title}
      </Text>
      <View style={{ backgroundColor: cardBg, borderRadius: 16, overflow: 'hidden' }}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.key}
            style={{
              flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16,
              borderBottomWidth: i < items.length - 1 ? 0.5 : 0, borderBottomColor: borderColor,
            }}
            activeOpacity={0.6}
            onPress={() => navigation.navigate(item.key)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityHint={item.desc}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: dark ? '#1C1C1E' : '#F2F2F7', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
              <Text style={{ fontSize: 18 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>{item.label}</Text>
              <Text style={{ fontSize: 12, color: mutedColor, marginTop: 1 }}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={mutedColor} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="More" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* User card */}
        {user && (
          <TouchableOpacity
            style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg,
              borderRadius: 16, padding: 16, marginBottom: 24,
            }}
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="View profile"
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
              <Text style={{ fontSize: 20, color: '#fff', fontWeight: '700' }}>
                {(user.firstName || user.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>
                {user.firstName || user.name || 'User'}
              </Text>
              <Text style={{ fontSize: 13, color: mutedColor }}>{user.email || 'View profile'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={mutedColor} />
          </TouchableOpacity>
        )}

        {renderSection('Account', ACCOUNT_MENU)}
        {renderSection('Features', FEATURES_MENU)}
        {renderSection('Business', BUSINESS_MENU)}
        {renderSection('Support', SUPPORT_MENU)}

        {/* Sign Out */}
        <TouchableOpacity
          style={{
            backgroundColor: cardBg, borderRadius: 16, padding: 16,
            alignItems: 'center', marginBottom: 24,
          }}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FF3B30' }}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', fontSize: 12, color: mutedColor }}>
          UpTend v1.0.0 • Made with 🧡
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
