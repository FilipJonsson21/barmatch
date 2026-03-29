import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { Colors, FontSizes, Spacing } from '@/lib/constants';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Ange din e-postadress.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Ogiltig e-postadress. Kontrollera formatet.');
      return;
    }
    if (!password) {
      setError('Ange ditt lösenord.');
      return;
    }
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Välkommen tillbaka</Text>
        <Text style={styles.subtitle}>Logga in för att fortsätta</Text>

        <View style={styles.form}>
          <Input
            label="E-post"
            placeholder="din@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <Input
            label="Lösenord"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
          />

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            title="Logga in"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={{ marginTop: Spacing.md }}
          />
        </View>

        <TouchableOpacity onPress={() => router.replace('/(auth)/signup')}>
          <Text style={styles.link}>
            Har du inget konto?{' '}
            <Text style={styles.linkAccent}>Skapa konto</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  form: {
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,71,87,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.3)',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSizes.sm,
    flex: 1,
  },
  link: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginTop: Spacing.lg,
  },
  linkAccent: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
