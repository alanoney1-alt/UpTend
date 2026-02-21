import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView,
  Platform, useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { useAuth } from '../context/AuthContext';

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password needs an uppercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password needs a number' };
  return { valid: true, message: '' };
}

export default function RegisterScreen({ navigation }: { navigation?: any }) {
  const dark = useColorScheme() === 'dark';
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  const passwordCheck = password ? validatePassword(password) : null;

  const handleRegister = async () => {
    setError(null);
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!validateEmail(email.trim())) { setError('Please enter a valid email address.'); return; }
    if (passwordCheck && !passwordCheck.valid) { setError(passwordCheck.message); return; }
    if (!password) { setError('Please enter a password.'); return; }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, phone.trim() || undefined);
    } catch (e: any) {
      setError(e.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ fontSize: 36 }}>🏠</Text>
            </View>
            <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '800', color: textColor, textAlign: 'center' }}>
              Create Account
            </Text>
            <Text style={{ fontSize: 15, color: mutedColor, textAlign: 'center', marginTop: spacing.xs }}>
              Join UpTend and meet Mr. George
            </Text>
          </View>

          {/* Error */}
          {error && (
            <View style={{ backgroundColor: '#FEF2F2', borderRadius: radii.md, padding: 12, marginBottom: spacing.md }}>
              <Text style={{ color: colors.error, fontSize: 14, textAlign: 'center' }}>{error}</Text>
            </View>
          )}

          <Input
            label="Full Name"
            placeholder="John Smith"
            value={name}
            onChangeText={(t: string) => { setName(t); setError(null); }}
            autoCapitalize="words"
            accessibilityLabel="Full name"
            containerStyle={{ marginBottom: spacing.sm }}
          />

          <Input
            label="Email"
            variant="email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(t: string) => { setEmail(t); setError(null); }}
            accessibilityLabel="Email address"
            error={email && !validateEmail(email) ? 'Invalid email format' : undefined}
            containerStyle={{ marginBottom: spacing.sm }}
          />

          <Input
            label="Phone (optional)"
            variant="phone"
            placeholder="(555) 123-4567"
            value={phone}
            onChangeText={setPhone}
            accessibilityLabel="Phone number"
            containerStyle={{ marginBottom: spacing.sm }}
          />

          <Input
            label="Password"
            variant="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            value={password}
            onChangeText={(t: string) => { setPassword(t); setError(null); }}
            accessibilityLabel="Password"
            error={passwordCheck && !passwordCheck.valid ? passwordCheck.message : undefined}
            containerStyle={{ marginBottom: spacing.md }}
          />

          <Button variant="primary" size="lg" fullWidth loading={loading} onPress={handleRegister}>
            Create Account
          </Button>

          {/* Link to login */}
          <TouchableOpacity
            accessibilityRole="button"
            style={{ alignItems: 'center', marginTop: spacing.xl }}
            onPress={() => navigation?.navigate?.('Login')}
          >
            <Text style={{ fontSize: 14, color: mutedColor }}>
              Already have an account?{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
