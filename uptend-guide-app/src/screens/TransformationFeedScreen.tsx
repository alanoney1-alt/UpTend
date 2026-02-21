import React from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, EmptyState } from '../components/ui';
import { colors } from '../components/ui/tokens';

export default function TransformationFeedScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? colors.backgroundDark : '#FFFBF5' }} edges={['top']}>
      <Header title="Transformations" subtitle="Before & after gallery" onBack={() => navigation?.goBack()} />
      <EmptyState
        icon="✨"
        title="No Transformations Yet"
        description="Once jobs are completed, amazing before & after transformations will show up here. George can't wait to show them off!"
        ctaLabel="Book a Service"
        onCta={() => navigation?.navigate('ServiceCatalog')}
      />
    </SafeAreaView>
  );
}
