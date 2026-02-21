import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Input, Button, Card, LoadingScreen, EmptyState } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { fetchCurrentUser, updateUserProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function HomeProfileScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState({ address: '', bedrooms: '', bathrooms: '', sqft: '', yearBuilt: '', appliances: '' });

  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  const loadProfile = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchCurrentUser();
      setProfile({
        address: data?.address || user?.address || '',
        bedrooms: String(data?.homeSpecs?.bedrooms || user?.homeSpecs?.bedrooms || ''),
        bathrooms: String(data?.homeSpecs?.bathrooms || user?.homeSpecs?.bathrooms || ''),
        sqft: String(data?.homeSpecs?.sqft || user?.homeSpecs?.sqft || ''),
        yearBuilt: String(data?.homeSpecs?.yearBuilt || user?.homeSpecs?.yearBuilt || ''),
        appliances: (data?.homeSpecs?.appliances || []).join(', '),
      });
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile({
        address: profile.address,
        homeSpecs: {
          bedrooms: parseInt(profile.bedrooms) || undefined,
          bathrooms: parseInt(profile.bathrooms) || undefined,
          sqft: parseInt(profile.sqft) || undefined,
          yearBuilt: parseInt(profile.yearBuilt) || undefined,
          appliances: profile.appliances.split(',').map(a => a.trim()).filter(Boolean),
        },
      });
      setEditing(false);
      Alert.alert('Saved!', 'Your home profile has been updated.');
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setSaving(false); }
  };

  if (loading) return <LoadingScreen message="Loading your home profile..." />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="My Home" subtitle="Home details & specs" onBack={() => navigation?.goBack()}
        rightAction={
          <Button variant="tertiary" size="sm" onPress={() => editing ? handleSave() : setEditing(true)} loading={saving}>
            {editing ? '💾' : '✏️'}
          </Button>
        } />

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}>
        {error && (
          <EmptyState icon="⚠️" title="Couldn't load profile" description={error} ctaLabel="Retry" onCta={loadProfile} />
        )}

        {!error && (
          <>
            <View style={{ backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.xl, marginBottom: spacing.xl }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginBottom: spacing.md }}>📍 Address</Text>
              <Input value={profile.address} onChangeText={v => setProfile({ ...profile, address: v })} editable={editing} placeholder="Enter your address" accessibilityLabel="Home address" />
            </View>

            <View style={{ backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.xl, marginBottom: spacing.xl }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginBottom: spacing.md }}>🏠 Home Specs</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: mutedColor, marginBottom: 4 }}>Bedrooms</Text>
                  <Input value={profile.bedrooms} onChangeText={v => setProfile({ ...profile, bedrooms: v })} editable={editing} keyboardType="number-pad" placeholder="0" accessibilityLabel="Bedrooms" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: mutedColor, marginBottom: 4 }}>Bathrooms</Text>
                  <Input value={profile.bathrooms} onChangeText={v => setProfile({ ...profile, bathrooms: v })} editable={editing} keyboardType="number-pad" placeholder="0" accessibilityLabel="Bathrooms" />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: mutedColor, marginBottom: 4 }}>Sq Ft</Text>
                  <Input value={profile.sqft} onChangeText={v => setProfile({ ...profile, sqft: v })} editable={editing} keyboardType="number-pad" placeholder="0" accessibilityLabel="Square footage" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: mutedColor, marginBottom: 4 }}>Year Built</Text>
                  <Input value={profile.yearBuilt} onChangeText={v => setProfile({ ...profile, yearBuilt: v })} editable={editing} keyboardType="number-pad" placeholder="0" accessibilityLabel="Year built" />
                </View>
              </View>
            </View>

            <View style={{ backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.xl }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginBottom: spacing.md }}>🔌 Appliances</Text>
              <Input value={profile.appliances} onChangeText={v => setProfile({ ...profile, appliances: v })} editable={editing} placeholder="Washer, Dryer, Dishwasher..." accessibilityLabel="Appliances, comma separated" multiline />
            </View>

            {editing && (
              <Button variant="primary" size="lg" fullWidth loading={saving} onPress={handleSave} style={{ marginTop: spacing.xl }}>
                Save Changes
              </Button>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
