import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal,
  Animated, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SignUpModalProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
}

export default function SignUpModal({ visible, onClose, message }: SignUpModalProps) {
  const { login, signup, pendingAction, setPendingAction } = useAuth();
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 150 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const handleSubmit = async () => {
    setError('');
    if (mode === 'signup' && !name.trim()) { setError('Please enter your name'); return; }
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); return; }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signup({ name, email, password, role: 'customer' });
      } else {
        await login(email, password, 'customer');
      }
      // Clear pending action reference — the action should continue now
      setPendingAction(null);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPendingAction(null);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity activeOpacity={1}>
              {/* Handle bar */}
              <View style={styles.handleBar} />

              {/* Header */}
              <Text style={styles.title}>
                {mode === 'signup' ? 'Create your free account' : 'Welcome back'}
              </Text>
              <Text style={styles.subtitle}>
                {message || 'Create an account to book this service'}
              </Text>

              {/* Error */}
              {error ? <Text style={styles.error}>{error}</Text> : null}

              {/* Name field (signup only) */}
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

              {/* Email */}
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.textLight}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              {/* Password */}
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {/* Submit */}
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.submitText}>
                    {mode === 'signup' ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Social logins */}
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

              {/* Toggle mode */}
              <TouchableOpacity
                style={styles.toggleBtn}
                onPress={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}
              >
                <Text style={styles.toggleText}>
                  {mode === 'signup'
                    ? 'Already have an account? '
                    : "Don't have an account? "}
                  <Text style={styles.toggleLink}>
                    {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  error: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 12,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: Colors.textLight,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  socialIcon: { fontSize: 18 },
  socialText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  toggleBtn: { alignItems: 'center', marginTop: 16 },
  toggleText: { fontSize: 14, color: Colors.textSecondary },
  toggleLink: { color: Colors.primary, fontWeight: '600' },
});
