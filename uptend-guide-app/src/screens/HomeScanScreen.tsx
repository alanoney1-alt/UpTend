import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, useColorScheme, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Button, Card, Badge, EmptyState } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { showPhotoOptions } from '../components/PhotoCapture';
import { analyzeRoom } from '../services/api';

interface Room { id: string; name: string; icon: string; scanned: boolean; issues: number; analysis?: any; }

const BADGES_INIT = [
  { id: '1', name: 'First Scan', icon: '🏅', earned: false },
  { id: '2', name: 'Room Master', icon: '🏆', earned: false },
  { id: '3', name: 'Full House', icon: '🏠', earned: false },
  { id: '4', name: 'Eagle Eye', icon: '🦅', earned: false },
];

export default function HomeScanScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [activeTab, setActiveTab] = useState<'scan' | 'badges' | 'wallet'>('scan');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [scanning, setScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [badges, setBadges] = useState(BADGES_INIT);

  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;
  const scannedCount = rooms.filter(r => r.scanned).length;
  const progress = rooms.length > 0 ? scannedCount / Math.max(rooms.length, 1) : 0;

  const getRoomIcon = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('kitchen')) return '🍳';
    if (n.includes('living')) return '🛋️';
    if (n.includes('bed')) return '🛏️';
    if (n.includes('bath')) return '🚿';
    if (n.includes('garage')) return '🚗';
    if (n.includes('yard') || n.includes('outdoor')) return '🌳';
    if (n.includes('laundry')) return '🧺';
    return '🏠';
  };

  const handleScan = useCallback(() => {
    showPhotoOptions(async (uri: string) => {
      setScanning(true);
      setAnalysisResult(null);
      try {
        const formData = new FormData();
        formData.append('image', { uri, type: 'image/jpeg', name: 'room-scan.jpg' } as any);
        const result = await analyzeRoom(formData);
        setAnalysisResult(result);
        const roomName = result.roomType || result.room || result.label || `Room ${rooms.length + 1}`;
        const issueCount = result.issues?.length || result.problems?.length || 0;
        setRooms(prev => [...prev, { id: Date.now().toString(), name: roomName, icon: getRoomIcon(roomName), scanned: true, issues: issueCount, analysis: result }]);
        const newBadges = [...badges];
        if (newBadges[0]) newBadges[0].earned = true;
        if (rooms.length + 1 >= 3 && newBadges[1]) newBadges[1].earned = true;
        if (rooms.length + 1 >= 6 && newBadges[2]) newBadges[2].earned = true;
        setBadges(newBadges);
      } catch (e: any) {
        Alert.alert('Scan Error', e.message || 'Could not analyze the image.');
      } finally { setScanning(false); }
    });
  }, [rooms, badges]);

  const tabs = [
    { key: 'scan' as const, label: '📷 Scan' },
    { key: 'badges' as const, label: '🏅 Badges' },
    { key: 'wallet' as const, label: '💰 Credits' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="AI Home Scan" subtitle="Powered by AI Vision" onBack={() => navigation?.goBack()} />

      <View style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: 8 }}>
        {tabs.map(tab => (
          <TouchableOpacity key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab.key }}
            style={{ flex: 1, paddingVertical: 10, borderRadius: radii.sm, alignItems: 'center', backgroundColor: activeTab === tab.key ? (dark ? '#3B2A15' : '#FFF7ED') : cardBg, borderWidth: activeTab === tab.key ? 1.5 : 0, borderColor: colors.primary }}
            onPress={() => setActiveTab(tab.key)}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: activeTab === tab.key ? colors.primary : mutedColor }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}>
        {activeTab === 'scan' && (
          <>
            {rooms.length > 0 && (
              <View style={{ backgroundColor: cardBg, borderRadius: radii.lg, padding: 20, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Scan Progress</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>{scannedCount} rooms</Text>
                </View>
                <View style={{ height: 8, backgroundColor: dark ? colors.borderDark : '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ height: 8, backgroundColor: colors.success, borderRadius: 4, width: `${Math.min(progress * 100, 100)}%` }} />
                </View>
              </View>
            )}

            <Button variant="primary" size="lg" fullWidth loading={scanning} onPress={handleScan} style={{ marginBottom: spacing.xl }}>
              {scanning ? 'Analyzing...' : '📸 Start Scanning'}
            </Button>

            {analysisResult && (
              <View style={{ backgroundColor: dark ? '#0A2E1A' : '#F0FDF4', borderRadius: radii.lg, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: dark ? '#166534' : '#BBF7D0' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginBottom: 8 }}>🔍 Analysis Result</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary, marginBottom: 8 }}>{analysisResult.roomType || analysisResult.room || 'Room Detected'}</Text>
                {analysisResult.condition && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: mutedColor, marginRight: 8 }}>Condition:</Text>
                    <Badge status={analysisResult.condition === 'good' ? 'success' : analysisResult.condition === 'fair' ? 'warning' : 'error'}>{analysisResult.condition}</Badge>
                  </View>
                )}
                {analysisResult.description && <Text style={{ fontSize: 14, color: mutedColor, lineHeight: 20 }}>{analysisResult.description}</Text>}
                {(analysisResult.issues || analysisResult.problems || []).length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.error, marginBottom: 6 }}>⚠️ Issues Found</Text>
                    {(analysisResult.issues || analysisResult.problems || []).map((issue: any, i: number) => (
                      <Text key={i} style={{ fontSize: 13, color: mutedColor, marginBottom: 4, paddingLeft: 4 }}>• {typeof issue === 'string' ? issue : issue.description || issue.text || issue.name}</Text>
                    ))}
                  </View>
                )}
                {(analysisResult.recommendations || []).length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 6 }}>💡 Recommendations</Text>
                    {analysisResult.recommendations.map((rec: any, i: number) => (
                      <Text key={i} style={{ fontSize: 13, color: mutedColor, marginBottom: 4, paddingLeft: 4 }}>• {typeof rec === 'string' ? rec : rec.text || rec.recommendation}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {rooms.length > 0 && (
              <>
                <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 12 }}>Your Rooms</Text>
                {rooms.map(room => (
                  <TouchableOpacity key={room.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.lg, marginBottom: 10, borderWidth: 1, borderColor: dark ? colors.borderDark : '#F3F4F6' }}
                    onPress={() => room.analysis && setAnalysisResult(room.analysis)}>
                    <Text style={{ fontSize: 28, marginRight: 14 }}>{room.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>{room.name}</Text>
                      <Text style={{ fontSize: 13, color: mutedColor, marginTop: 2 }}>{room.issues > 0 ? `⚠️ ${room.issues} issue${room.issues > 1 ? 's' : ''}` : '✅ No issues'}</Text>
                    </View>
                    <Badge status="success" size="sm">Done</Badge>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {rooms.length === 0 && !scanning && !analysisResult && (
              <EmptyState icon="🏠" title="No rooms scanned yet" description="Take a photo of any room and our AI will analyze it for issues, inventory, and maintenance recommendations." />
            )}
          </>
        )}

        {activeTab === 'badges' && (
          <>
            <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: spacing.md }}>Badges</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {badges.map(badge => (
                <View key={badge.id} style={{ width: '47%', backgroundColor: badge.earned ? (dark ? '#3B2A15' : '#FFF7ED') : cardBg, borderRadius: radii.lg, padding: 20, alignItems: 'center', borderWidth: 1.5, borderColor: badge.earned ? colors.primary : (dark ? colors.borderDark : colors.border), opacity: badge.earned ? 1 : 0.6 }}>
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>{badge.icon}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: badge.earned ? textColor : mutedColor }}>{badge.name}</Text>
                  <Text style={{ fontSize: 12, color: mutedColor, marginTop: 4 }}>{badge.earned ? '✅ Earned' : '🔒 Locked'}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'wallet' && (
          <>
            <View style={{ backgroundColor: colors.primary, borderRadius: radii.lg, padding: 28, alignItems: 'center', marginBottom: spacing.xl }}>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>Scan Credits</Text>
              <Text style={{ fontSize: 42, fontWeight: '900', color: '#fff', marginVertical: 4 }}>${(scannedCount * 2.5).toFixed(2)}</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Earned from scanning your home</Text>
            </View>
            <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: spacing.md }}>How to Earn</Text>
            {[
              { icon: '📷', title: 'Scan a Room', desc: '+$2.50 per room scanned' },
              { icon: '🏅', title: 'Earn a Badge', desc: '+$5.00 per badge earned' },
              { icon: '🏠', title: 'Complete Full Scan', desc: '+$10.00 bonus' },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.lg, marginBottom: 10 }}>
                <Text style={{ fontSize: 28, marginRight: 14 }}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>{item.title}</Text>
                  <Text style={{ fontSize: 13, color: colors.success, fontWeight: '600', marginTop: 2 }}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
