import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';
import { Colors, FontSizes, Spacing } from '@/lib/constants';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.logo}>🍸</Text>
        <Text style={styles.title}>BarMatch</Text>
        <Text style={styles.tagline}>
          Hitta nya gäng.{'\n'}Matcha. Häng ikväll.
        </Text>
      </View>

      {/* CTA buttons */}
      <View style={styles.buttons}>
        <Button
          title="Logga in"
          onPress={() => router.push('/(auth)/login')}
          size="lg"
        />
        <Button
          title="Skapa konto"
          onPress={() => router.push('/(auth)/signup')}
          variant="outline"
          size="lg"
          style={{ marginTop: Spacing.md }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 100,
    paddingBottom: 60,
  },
  hero: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.hero,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 28,
  },
  buttons: {
    width: '100%',
  },
});
