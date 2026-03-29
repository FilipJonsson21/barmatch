import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import SwipeCard from './SwipeCard';
import { Colors, FontSizes, Spacing } from '@/lib/constants';
import type { GroupSessionWithDistance } from '@/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeCardStackProps {
  cards: GroupSessionWithDistance[];
  onSwipe: (groupId: string, direction: 'left' | 'right') => void;
}

export default function SwipeCardStack({
  cards,
  onSwipe,
}: SwipeCardStackProps) {
  if (cards.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🔍</Text>
        <Text style={styles.emptyTitle}>Inga gäng i närheten</Text>
        <Text style={styles.emptySubtitle}>
          Prova att öka avståndet i filtret eller kom tillbaka senare!
        </Text>
      </View>
    );
  }

  // Show top 3 cards max (render in reverse so index 0 = top = rendered last)
  const visible = cards.slice(0, 3).reverse();

  return (
    <View style={styles.container}>
      {visible.map((group, i) => {
        const cardIndex = visible.length - 1 - i; // 0 = top card
        return (
          <SwipeCard
            key={group.id}
            group={group}
            isTop={cardIndex === 0}
            index={cardIndex}
            onSwipe={(direction) => onSwipe(group.id, direction)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
