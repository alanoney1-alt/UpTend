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
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'UpTend User'}</Text>
          <Text style={styles.email}>{user?.email || 'user@uptend.com'}</Text>
        </View>

        <Section title="Account">
          <Row icon="🏠" label="Property Info" />
          <Row icon="💳" label="Payment Methods" />
          <Row icon="📍" label="Service Address" />
        </Section>

        <Section title="Preferences">
          <ToggleRow icon="🔔" label="Push Notifications" value={notificationsEnabled} onToggle={setNotificationsEnabled} />
          <ToggleRow icon="🗣" label="Voice Guide" value={voiceEnabled} onToggle={setVoiceEnabled} />
        </Section>

        <Section title="Support">
          <Row icon="❓" label="Help & FAQ" />
          <Row icon="📧" label="Contact Support" />
          <Row icon="📄" label="Terms & Privacy" />
        </Section>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>UpTend Guide v1.0.0</Text>
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
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { color: Colors.white, fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: Colors.text },
  email: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
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
});
