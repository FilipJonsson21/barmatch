import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCountdown } from '@/hooks/useCountdown';
import { Colors, FontSizes, Spacing } from '@/lib/constants';

interface CountdownTimerProps {
  expiresAt: string;
}

export default function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const { formatted, isExpired, totalSeconds } = useCountdown(expiresAt);

  // Color shifts toward red when < 30 minutes remain
  const isUrgent = totalSeconds < 1800;
  const color = isExpired
    ? Colors.danger
    : isUrgent
      ? Colors.accent
      : Colors.success;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color }]}>
        {isExpired ? 'Sessionen har gått ut' : 'Tid kvar'}
      </Text>
      <Text style={[styles.time, { color }]}>{formatted}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  label: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  time: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
