import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

type RoleOption = 'customer' | 'pro' | 'business';

const ROLE_OPTIONS: { key: RoleOption; label: string; emoji: string; desc: string }[] = [
  { key: 'customer', label: 'Customer', emoji: '🏠', desc: 'Get things done at home' },
  { key: 'pro', label: 'Pro', emoji: '🔧', desc: 'Find jobs & earn' },
  { key: 'business', label: 'Property Manager', emoji: '🏢', desc: 'Manage multiple properties' },
];

export default function LoginScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<RoleOption>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [propertyCount, setPropertyCount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (mode === 'signup' && !name.trim()) { Alert.alert('Error', 'Please enter your name.'); return; }
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields.'); return; }
    if (mode === 'signup' && role === 'business' && !companyName.trim()) {
      Alert.alert('Error', 'Please enter your company name.'); return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await login(email, password, role);
      } else {
        await signup({
          name, email, password, role,
          companyName: role === 'business' ? companyName : undefined,
          propertyCount: role === 'business' ? parseInt(propertyCount) || undefined : undefined,
        });
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'signin' ? 'Sign in to continue' : 'Choose your account type'}
          </Text>

          {/* Role selector */}
          <View style={styles.roleContainer}>
            {ROLE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.roleCard, role === opt.key && styles.roleCardActive]}
                onPress={() => setRole(opt.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.roleEmoji}>{opt.emoji}</Text>
                <Text style={[styles.roleLabel, role === opt.key && styles.roleLabelActive]}>{opt.label}</Text>
                <Text style={styles.roleDesc}>{opt.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Name (signup only) */}
          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          {/* Business fields (signup + business role) */}
          {mode === 'signup' && role === 'business' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Company name"
                placeholderTextColor={Colors.textLight}
                value={companyName}
                onChangeText={setCompanyName}
              />
              <TextInput
                style={styles.input}
                placeholder="Number of properties"
                placeholderTextColor={Colors.textLight}
                value={propertyCount}
                onChangeText={setPropertyCount}
                keyboardType="number-pad"
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textLight}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={Colors.white} /> : (
              <Text style={styles.submitText}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>

          {/* Social stubs */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
            <Text style={styles.socialIcon}>🍎</Text>
            <Text style={styles.socialText}>Continue with Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Toggle */}
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            <Text style={styles.toggleText}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.toggleLink}>{mode === 'signin' ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  roleContainer: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  roleCard: {
    flex: 1, backgroundColor: Colors.inputBackground, borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: '#FFF7F0' },
  roleEmoji: { fontSize: 24, marginBottom: 6 },
  roleLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  roleLabelActive: { color: Colors.primary },
  roleDesc: { fontSize: 11, color: Colors.textLight, textAlign: 'center', marginTop: 2 },
  input: {
    backgroundColor: Colors.inputBackground, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    marginBottom: 12, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
  },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  submitText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 16, fontSize: 13, color: Colors.textLight },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.inputBackground, borderRadius: 12, paddingVertical: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  socialIcon: { fontSize: 18 },
  socialText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  toggleBtn: { alignItems: 'center', marginTop: 16 },
  toggleText: { fontSize: 14, color: Colors.textSecondary },
  toggleLink: { color: Colors.primary, fontWeight: '600' },
});
