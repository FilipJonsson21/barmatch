import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';
import { Colors, FontSizes, Spacing } from '@/lib/constants';

export default function NotFound() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🍻</Text>
      <Text style={styles.title}>Wrong bar!</Text>
      <Text style={styles.subtitle}>This page doesn't exist.</Text>
      <Button
        title="Go Home"
        onPress={() => router.replace('/')}
        style={{ marginTop: Spacing.lg }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  emoji: { fontSize: 64, marginBottom: Spacing.md },
  title: {
    color: Colors.text,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    marginTop: Spacing.sm,
  },
});
