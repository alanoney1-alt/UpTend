import React from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, EmptyState } from '../components/ui';
import { colors } from '../components/ui/tokens';

export default function PhotoTimelineScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? colors.backgroundDark : '#FFFBF5' }} edges={['top']}>
      <Header title="Photo Timeline" subtitle="Before & after" onBack={() => navigation?.goBack()} />
      <EmptyState
        icon="📸"
        title="No Photos Yet"
        description="After your first completed job, before & after photos will appear here. George loves a good transformation!"
        ctaLabel="Book a Service"
        onCta={() => navigation?.navigate('ServiceCatalog')}
      />
    </SafeAreaView>
  );
}
