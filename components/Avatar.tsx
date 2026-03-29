import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Colors } from '@/lib/constants';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export default function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  const borderRadius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.surfaceLight,
  },
  fallback: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
