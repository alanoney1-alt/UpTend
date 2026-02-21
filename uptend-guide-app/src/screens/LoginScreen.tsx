import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView,
  Platform, Alert, useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Button, Input } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { useAuth } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

type RoleOption = 'customer' | 'pro' | 'business';

const ROLE_OPTIONS: { key: RoleOption; label: string; emoji: string; desc: string }[] = [
  { key: 'customer', label: 'Customer', emoji: '🏠', desc: 'Get things done at home' },
  { key: 'pro', label: 'Pro', emoji: '🔧', desc: 'Find jobs & earn' },
  { key: 'business', label: 'Property Manager', emoji: '🏢', desc: 'Manage multiple properties' },
];

export default function LoginScreen({ navigation }: { navigation?: any }) {
  const dark = useColorScheme() === 'dark';
  const { login, loginWithGoogle } = useAuth();
  const [role, setRole] = useState<RoleOption>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;
  const borderColor = dark ? colors.borderDark : colors.border;

  // Google auth
  const [_googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    // TODO: Replace with real client IDs
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
  });

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        handleGoogleLogin(idToken);
      }
    }
  }, [googleResponse]);

  const handleGoogleLogin = async (idToken: string) => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle(idToken);
    } catch (e: any) {
      setError(e.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password, role);
    } catch (e: any) {
      const msg = e.message || 'Something went wrong.';
      if (msg.toLowerCase().includes('401') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        setError('Network error. Please check your connection.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* George avatar */}
          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ fontSize: 36 }}>🏠</Text>
            </View>
            <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: '800', color: textColor, textAlign: 'center' }}>
              Welcome Back
            </Text>
            <Text style={{ fontSize: 15, color: mutedColor, textAlign: 'center', marginTop: spacing.xs }}>
              Mr. George is ready to help!
            </Text>
          </View>

          {/* Role selector */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: spacing.xl }} accessibilityRole="radiogroup" accessibilityLabel="Account type">
            {ROLE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                accessibilityRole="radio"
                accessibilityLabel={opt.label}
                accessibilityState={{ selected: role === opt.key }}
                style={{
                  flex: 1, backgroundColor: role === opt.key ? (dark ? '#3B2A15' : '#FFF7ED') : cardBg,
                  borderRadius: radii.lg, padding: 14, alignItems: 'center',
                  borderWidth: 2, borderColor: role === opt.key ? colors.primary : 'transparent',
                }}
                onPress={() => setRole(opt.key)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 24, marginBottom: 6 }}>{opt.emoji}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: role === opt.key ? colors.primary : textColor, textAlign: 'center' }}>{opt.label}</Text>
                <Text style={{ fontSize: 11, color: mutedColor, textAlign: 'center', marginTop: 2 }}>{opt.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Error message */}
          {error && (
            <View style={{ backgroundColor: '#FEF2F2', borderRadius: radii.md, padding: 12, marginBottom: spacing.md }}>
              <Text style={{ color: colors.error, fontSize: 14, textAlign: 'center' }}>{error}</Text>
            </View>
          )}

          <Input
            variant="email"
            placeholder="Email"
            value={email}
            onChangeText={(t: string) => { setEmail(t); setError(null); }}
            accessibilityLabel="Email address"
            containerStyle={{ marginBottom: spacing.sm }}
          />
          <Input
            variant="password"
            placeholder="Password"
            value={password}
            onChangeText={(t: string) => { setPassword(t); setError(null); }}
            accessibilityLabel="Password"
            containerStyle={{ marginBottom: spacing.sm }}
          />

          <Button variant="primary" size="lg" fullWidth loading={loading} onPress={handleSubmit} style={{ marginTop: spacing.sm }}>
            Sign In
          </Button>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl }}>
            <View style={{ flex: 1, height: 1, backgroundColor: borderColor }} />
            <Text style={{ marginHorizontal: spacing.lg, fontSize: 13, color: mutedColor }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: borderColor }} />
          </View>

          {/* Google button */}
          <TouchableOpacity
            accessibilityRole="button" accessibilityLabel="Continue with Google"
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: cardBg, borderRadius: radii.md, paddingVertical: 14, marginBottom: 10, borderWidth: 1, borderColor, gap: 10 }}
            activeOpacity={0.7}
            onPress={() => googlePromptAsync()}
            disabled={loading}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#4285F4' }}>G</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Apple button */}
          <TouchableOpacity
            accessibilityRole="button" accessibilityLabel="Continue with Apple"
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: cardBg, borderRadius: radii.md, paddingVertical: 14, marginBottom: 10, borderWidth: 1, borderColor, gap: 10 }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18 }}>🍎</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>Continue with Apple</Text>
          </TouchableOpacity>

          {/* Create Account link */}
          <TouchableOpacity
            accessibilityRole="button"
            style={{ alignItems: 'center', marginTop: spacing.lg }}
            onPress={() => navigation?.navigate?.('Register')}
          >
            <Text style={{ fontSize: 14, color: mutedColor }}>
              Don't have an account?{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
