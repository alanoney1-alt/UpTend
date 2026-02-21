import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, Alert, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, Input, Header, LoadingScreen, Badge } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { useAuth } from '../context/AuthContext';
import SignUpModal from '../components/SignUpModal';
import { fetchCurrentUser, updateUserProfile, fetchLoyaltyStatus } from '../services/api';

export default function ProfileScreen() {
  const dark = useColorScheme() === 'dark';
  const { user, role, guestMode, logout, refreshUser } = useAuth();
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [loyalty, setLoyalty] = useState<any>(null);

  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sqft, setSqft] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');

  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  useEffect(() => {
    if (!guestMode) loadProfile();
  }, [guestMode]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [userData, loyaltyData] = await Promise.allSettled([
        fetchCurrentUser(),
        fetchLoyaltyStatus(),
      ]);
      if (userData.status === 'fulfilled' && userData.value) {
        setProfileData(userData.value);
        const hs = userData.value.homeSpecs || {};
        setBedrooms(hs.bedrooms?.toString() || '');
        setBathrooms(hs.bathrooms?.toString() || '');
        setSqft(hs.sqft?.toString() || '');
        setYearBuilt(hs.yearBuilt?.toString() || '');
      }
      if (loyaltyData.status === 'fulfilled' && loyaltyData.value) {
        setLoyalty(loyaltyData.value);
      }
    } catch {}
    setLoading(false);
  };

  const saveProfile = async () => {
    try {
      await updateUserProfile({
        homeSpecs: {
          bedrooms: parseInt(bedrooms) || undefined,
          bathrooms: parseInt(bathrooms) || undefined,
          sqft: parseInt(sqft) || undefined,
          yearBuilt: parseInt(yearBuilt) || undefined,
        },
      });
      setEditing(false);
      Alert.alert('Saved', 'Your profile has been updated.');
      if (refreshUser) refreshUser();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save profile.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  // Guest profile
  if (guestMode) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: dark ? colors.backgroundDark : colors.background }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
          <View style={{ alignItems: 'center', paddingTop: 40, gap: spacing.lg }}>
            <Avatar name="Guest" size="xl" />
            <Text style={{ fontSize: 28, fontWeight: '800', color: textColor }}>Join UpTend</Text>
            <Text style={{ fontSize: 16, color: mutedColor, textAlign: 'center', lineHeight: 24 }}>
              Create a free account to book services, save favorites, track jobs, and more.
            </Text>
            <Button variant="primary" size="lg" fullWidth onPress={() => setShowSignUp(true)} accessibilityLabel="Sign up free">
              Sign Up Free
            </Button>
            <Button variant="tertiary" onPress={() => setShowSignUp(true)} accessibilityLabel="Sign in">
              I already have an account
            </Button>

            <Card style={{ width: '100%', gap: spacing.md }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Why create an account?</Text>
              {['📅 Book and schedule services', '⭐ Save your favorite pros', '🔥 Earn streak rewards & discounts', '🏠 Track your home\'s health score', '💬 Get personalized recommendations'].map(perk => (
                <Text key={perk} style={{ fontSize: 15, color: textColor }}>{perk}</Text>
              ))}
            </Card>
          </View>
          <SignUpModal visible={showSignUp} onClose={() => setShowSignUp(false)} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loading && !profileData) {
    return <LoadingScreen message="Loading profile..." />;
  }

  const displayName = profileData?.firstName
    ? `${profileData.firstName} ${profileData.lastName || ''}`.trim()
    : user?.name || 'UpTend User';
  const displayEmail = profileData?.email || user?.email || '';
  const loyaltyTier = loyalty?.tier || 'Bronze';
  const loyaltyPoints = loyalty?.points || 0;
  const walletBalance = loyalty?.walletBalance || profileData?.walletBalance || 0;
  const isPro = role === 'pro';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? colors.backgroundDark : colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        {/* Header card */}
        <Card style={{
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          marginBottom: spacing.lg,
        }}>
          <Avatar name={displayName} size="lg" borderColor="#FFFFFF" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>{displayName}</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{displayEmail}</Text>
            {isPro && (
              <Badge label="🔧 Pro Account" variant="custom" color="rgba(255,255,255,0.2)" textColor="#FFFFFF" size="sm" />
            )}
          </View>
        </Card>

        {/* George intro for home data */}
        <Card style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
          <Text style={{ fontSize: 28 }}>🏠</Text>
          <Text style={{ flex: 1, fontSize: 14, color: mutedColor }}>
            Here's your home data. Keeping this updated helps me give better recommendations!
          </Text>
        </Card>

        {/* Loyalty + Wallet */}
        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 28 }}>{loyaltyTier === 'Gold' ? '🥇' : loyaltyTier === 'Silver' ? '🥈' : '🥉'}</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: textColor }}>{loyaltyTier}</Text>
            <Text style={{ fontSize: 11, color: mutedColor }}>{loyaltyPoints} pts</Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 28 }}>💰</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.success }}>
              ${typeof walletBalance === 'number' ? walletBalance.toFixed(2) : walletBalance}
            </Text>
            <Text style={{ fontSize: 11, color: mutedColor }}>Wallet Balance</Text>
          </Card>
        </View>

        {/* Home Details */}
        {!isPro && (
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
              Home Details
            </Text>
            <Card>
              {editing ? (
                <View style={{ gap: spacing.md }}>
                  <Input label="Bedrooms" variant="number" value={bedrooms} onChangeText={setBedrooms} placeholder="3" />
                  <Input label="Bathrooms" variant="number" value={bathrooms} onChangeText={setBathrooms} placeholder="2" />
                  <Input label="Sqft" variant="number" value={sqft} onChangeText={setSqft} placeholder="1850" />
                  <Input label="Year Built" variant="number" value={yearBuilt} onChangeText={setYearBuilt} placeholder="2004" />
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <Button variant="secondary" size="sm" onPress={() => setEditing(false)} style={{ flex: 1 }} accessibilityLabel="Cancel editing">
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onPress={saveProfile} style={{ flex: 1 }} accessibilityLabel="Save profile">
                      Save
                    </Button>
                  </View>
                </View>
              ) : (
                <View style={{ gap: spacing.sm }}>
                  <Text style={{ fontSize: 16, color: textColor }}>🏠 {bedrooms || '?'}BR / {bathrooms || '?'}BA · {sqft || '?'} sqft</Text>
                  <Text style={{ fontSize: 16, color: textColor }}>📅 {yearBuilt ? `Built ${yearBuilt}` : 'Year built not set'}</Text>
                  <Button variant="tertiary" size="sm" onPress={() => setEditing(true)} accessibilityLabel="Edit home specs">
                    ✏️ Edit Home Specs
                  </Button>
                </View>
              )}
            </Card>
          </View>
        )}

        {/* Pro dashboard section */}
        {isPro && (
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
              Pro Dashboard
            </Text>
            <Card style={{ gap: spacing.sm }}>
              {['📊 View Earnings', '📋 Available Jobs', '🏅 Certifications', '⭐ Reviews & Ratings'].map(item => (
                <Text key={item} style={{ fontSize: 16, color: textColor, paddingVertical: 6 }}>{item}</Text>
              ))}
            </Card>
          </View>
        )}

        {/* Account */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
            Account
          </Text>
          <Card style={{ gap: spacing.sm }}>
            {['💳 Payment Methods', '📍 Service Address', '📋 Order History'].map(item => (
              <Text key={item} style={{ fontSize: 16, color: textColor, paddingVertical: 6 }}>{item}</Text>
            ))}
          </Card>
        </View>

        {/* Preferences */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
            Preferences
          </Text>
          <Card style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, color: textColor }}>🔔 Push Notifications</Text>
              <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ true: colors.primary }} accessibilityLabel="Toggle push notifications" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, color: textColor }}>🗣 Voice Mr. George</Text>
              <Switch value={voiceEnabled} onValueChange={setVoiceEnabled} trackColor={{ true: colors.primary }} accessibilityLabel="Toggle voice mode" />
            </View>
          </Card>
        </View>

        {/* Referral */}
        <Card style={{ alignItems: 'center', gap: spacing.sm, backgroundColor: dark ? '#431407' : '#FFF7ED', borderColor: dark ? '#EA580C' : '#FDBA74', marginBottom: spacing.xl }}>
          <Text style={{ fontSize: 36 }}>🎁</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primary }}>Refer & Earn $25</Text>
          <Text style={{ fontSize: 14, color: mutedColor, textAlign: 'center' }}>
            Refer your pro — when they complete 3 jobs, you get $25 credit!
          </Text>
          <Button variant="primary" size="md" accessibilityLabel="Share referral link">
            Share Referral Link
          </Button>
        </Card>

        {/* Support */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
            Support
          </Text>
          <Card style={{ gap: spacing.sm }}>
            {['❓ Help & FAQ', '📧 Contact Support', '📄 Terms & Privacy'].map(item => (
              <Text key={item} style={{ fontSize: 16, color: textColor, paddingVertical: 6 }}>{item}</Text>
            ))}
          </Card>
        </View>

        <Button variant="destructive" size="md" fullWidth onPress={handleLogout} accessibilityLabel="Sign out">
          Sign Out
        </Button>

        <Text style={{ textAlign: 'center', fontSize: 12, color: mutedColor, marginTop: spacing.lg }}>
          UpTend v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
