import { Stack } from 'expo-router';
import { Colors } from '@/lib/constants';

export default function MatchesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
