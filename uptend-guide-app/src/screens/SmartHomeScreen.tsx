import React from 'react';
import { ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, EmptyState } from '../components/ui';
import { colors, spacing } from '../components/ui/tokens';

export default function SmartHomeScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const bg = dark ? colors.backgroundDark : '#FFFBF5';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="Smart Home" subtitle="Device integrations" onBack={() => navigation?.goBack()} />
      <EmptyState
        icon="🏠"
        title="Coming Soon!"
        description="I'm still learning this trick! Check back soon. George will help you connect and manage all your smart home devices."
        ctaLabel="Chat with George"
        onCta={() => navigation?.navigate('GeorgeChat', { initialMessage: 'Tell me about smart home tips' })}
      />
    </SafeAreaView>
  );
}
