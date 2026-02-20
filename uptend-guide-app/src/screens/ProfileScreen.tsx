import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';
import SignUpModal from '../components/SignUpModal';

export default function ProfileScreen() {
  const { user, guestMode, logout } = useAuth();
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  // Guest profile
  if (guestMode) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.guestScroll}>
          <View style={styles.guestContent}>
            <View style={styles.guestAvatar}>
              <Text style={styles.guestAvatarText}>👤</Text>
            </View>
            <Text style={styles.guestTitle}>Join UpTend</Text>
            <Text style={styles.guestSubtitle}>
              Create a free account to book services, save favorites, track jobs, and more.
            </Text>

            <TouchableOpacity style={styles.signUpBtn} onPress={() => setShowSignUp(true)} activeOpacity={0.8}>
              <Text style={styles.signUpBtnText}>Sign Up Free</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signInBtn} onPress={() => setShowSignUp(true)} activeOpacity={0.7}>
              <Text style={styles.signInBtnText}>I already have an account</Text>
            </TouchableOpacity>

            <View style={styles.guestPerks}>
              <Text style={styles.guestPerksTitle}>Why create an account?</Text>
              <Perk emoji="📅" text="Book and schedule services" />
              <Perk emoji="⭐" text="Save your favorite pros" />
              <Perk emoji="🔥" text="Earn streak rewards & discounts" />
              <Perk emoji="🏠" text="Track your home's health score" />
              <Perk emoji="💬" text="Get personalized recommendations" />
            </View>
          </View>

          <SignUpModal visible={showSignUp} onClose={() => setShowSignUp(false)} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Logged-in profile
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{user?.name || 'UpTend User'}</Text>
              <Text style={styles.email}>{user?.email || 'user@uptend.com'}</Text>
            </View>
          </View>
        </View>

        {/* Loyalty + Wallet */}
        <View style={styles.loyaltyWalletRow}>
          <View style={styles.loyaltyCard}>
            <Text style={styles.loyaltyIcon}>🥉</Text>
            <Text style={styles.loyaltyTier}>Bronze</Text>
            <Text style={styles.loyaltySub}>250 pts to Silver</Text>
          </View>
          <View style={styles.walletCard}>
            <Text style={styles.walletIcon}>💰</Text>
            <Text style={styles.walletBalance}>$42.50</Text>
            <Text style={styles.walletSub}>Wallet Balance</Text>
          </View>
        </View>

        {/* Home Details */}
        <Section title="Home Details">
          <Row icon="🏠" label="3BR / 2BA · 1,850 sqft" />
          <Row icon="📍" label="123 Oak Lane, Orlando, FL" />
          <Row icon="📅" label="Built 2004 · Owned since 2019" />
          <Row icon="🛡️" label="State Farm · Policy #SF-12345" />
        </Section>

        {/* Vehicles */}
        <Section title="Vehicles">
          <Row icon="🚗" label="2021 Toyota Camry · 34,200 mi" />
          <Row icon="🚙" label="2019 Honda CR-V · 58,700 mi" />
          <Row icon="➕" label="Add Vehicle" />
        </Section>

        <Section title="Account">
          <Row icon="✏️" label="Edit Profile" />
          <Row icon="💳" label="Payment Methods" />
          <Row icon="📍" label="Service Address" />
        </Section>

        <Section title="Preferences">
          <ToggleRow icon="🔔" label="Push Notifications" value={notificationsEnabled} onToggle={setNotificationsEnabled} />
          <ToggleRow icon="🗣" label="Voice Mr. George" value={voiceEnabled} onToggle={setVoiceEnabled} />
        </Section>

        {/* Referral */}
        <View style={styles.referralCard}>
          <Text style={styles.referralEmoji}>🎁</Text>
          <Text style={styles.referralTitle}>Refer & Earn $25</Text>
          <Text style={styles.referralDesc}>Refer your pro — when they complete 3 jobs, you get $25 credit!</Text>
          <TouchableOpacity style={styles.referralBtn} activeOpacity={0.8}>
            <Text style={styles.referralBtnText}>Share Referral Link</Text>
          </TouchableOpacity>
        </View>

        <Section title="Support">
          <Row icon="❓" label="Help & FAQ" />
          <Row icon="📧" label="Contact Support" />
          <Row icon="📄" label="Terms & Privacy" />
        </Section>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>UpTend v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Perk({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.perkRow}>
      <Text style={styles.perkEmoji}>{emoji}</Text>
      <Text style={styles.perkText}>{text}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({ icon, label }: { icon: string; label: string }) {
  return (
    <TouchableOpacity style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowArrow}>›</Text>
    </TouchableOpacity>
  );
}

function ToggleRow({ icon, label, value, onToggle }: { icon: string; label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: Colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  guestScroll: { padding: 20, paddingBottom: 40 },
  guestContent: { alignItems: 'center', paddingTop: 40 },
  guestAvatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  guestAvatarText: { fontSize: 36 },
  guestTitle: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  guestSubtitle: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20, marginBottom: 28 },
  signUpBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, width: '100%', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8,
  },
  signUpBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  signInBtn: { paddingVertical: 14 },
  signInBtnText: { fontSize: 15, color: Colors.textSecondary },
  guestPerks: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 20, width: '100%', marginTop: 24,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  guestPerksTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  perkEmoji: { fontSize: 20 },
  perkText: { fontSize: 15, color: Colors.text },

  // Logged-in styles
  headerBar: { backgroundColor: '#f97316', borderRadius: 20, padding: 20, marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerInfo: { marginLeft: 14 },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#fff' },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  loyaltyWalletRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  loyaltyCard: {
    flex: 1, backgroundColor: '#fff7ed', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#fdba74',
  },
  loyaltyIcon: { fontSize: 28 },
  loyaltyTier: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginTop: 4 },
  loyaltySub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  walletCard: {
    flex: 1, backgroundColor: '#f0fdf4', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#bbf7d0',
  },
  walletIcon: { fontSize: 28 },
  walletBalance: { fontSize: 18, fontWeight: '800', color: '#22c55e', marginTop: 4 },
  walletSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCard: { backgroundColor: Colors.white, borderRadius: 14, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  rowIcon: { fontSize: 18, marginRight: 12 },
  rowLabel: { fontSize: 16, color: Colors.text },
  rowArrow: { marginLeft: 'auto', fontSize: 20, color: Colors.textLight },
  logoutBtn: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  logoutText: { color: Colors.error, fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textLight, marginTop: 20 },
  referralCard: {
    backgroundColor: '#FFF7ED', borderRadius: 18, padding: 20, alignItems: 'center', marginBottom: 24,
    borderWidth: 2, borderColor: '#FDBA74',
  },
  referralEmoji: { fontSize: 36, marginBottom: 8 },
  referralTitle: { fontSize: 20, fontWeight: '800', color: '#EA580C', marginBottom: 4 },
  referralDesc: { fontSize: 14, color: '#9A3412', textAlign: 'center', lineHeight: 20, marginBottom: 14 },
  referralBtn: { backgroundColor: '#F97316', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  referralBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
