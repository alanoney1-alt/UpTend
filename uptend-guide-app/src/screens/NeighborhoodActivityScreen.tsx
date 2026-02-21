import React from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, EmptyState } from '../components/ui';
import { colors } from '../components/ui/tokens';

export default function NeighborhoodActivityScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? colors.backgroundDark : '#FFFBF5' }} edges={['top']}>
      <Header title="Nearby Jobs" subtitle="Activity around you" onBack={() => navigation?.goBack()} />
      <EmptyState
        icon="📍"
        title="Coming Soon!"
        description="I'm still learning this trick! Check back soon. George will show you nearby jobs and activity in your area."
      />
    </SafeAreaView>
  );
}
