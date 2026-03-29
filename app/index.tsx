import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import LoadingScreen from '@/components/LoadingScreen';

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (session) return <Redirect href="/(tabs)/discover" />;
  return <Redirect href="/(auth)/welcome" />;
}
