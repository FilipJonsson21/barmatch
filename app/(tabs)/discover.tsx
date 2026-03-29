import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSwipe } from '@/hooks/useSwipe';
import { useGroupSession } from '@/lib/group-session-context';
import SwipeCardStack from '@/components/SwipeCardStack';
import FilterSheet from '@/components/FilterSheet';
import Button from '@/components/Button';
import LoadingScreen from '@/components/LoadingScreen';
import { Colors, FontSizes, Spacing } from '@/lib/constants';

export default function DiscoverScreen() {
  const router = useRouter();
  const { session: mySession, isLoading: sessionLoading } = useGroupSession();
  const {
    cards,
    isLoading,
    filters,
    setFilters,
    castVote,
    removeTopCard,
    hasSession,
  } = useSwipe();
  const [filterVisible, setFilterVisible] = useState(false);

  const handleSwipe = useCallback(
    async (groupId: string, direction: 'left' | 'right') => {
      const vote = direction === 'right';
      const result = await castVote(groupId, vote);

      // Remove the card from the stack
      removeTopCard();

      // Check for match
      if (result.match && result.match_id && mySession) {
        const matchedGroup = cards.find((c) => c.id === groupId);
        router.push({
          pathname: '/match-modal',
          params: {
            matchId: result.match_id,
            groupAName: mySession.name,
            groupBName: matchedGroup?.name ?? '',
            groupAPhoto: mySession.photo_url ?? '',
            groupBPhoto: matchedGroup?.photo_url ?? '',
          },
        });
      }
    },
    [castVote, removeTopCard, router, mySession, cards],
  );

  const handleButtonSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (cards.length > 0) {
        handleSwipe(cards[0].id, direction);
      }
    },
    [cards, handleSwipe],
  );

  if (sessionLoading) return <LoadingScreen />;

  // No active group session — prompt user
  if (!mySession) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.noSession}>
          <Text style={styles.noSessionEmoji}>🍻</Text>
          <Text style={styles.noSessionTitle}>Inget gäng ännu!</Text>
          <Text style={styles.noSessionText}>
            Skapa ditt gäng för kvällen för att matcha!
          </Text>
          <Button
            title="Skapa gäng"
            onPress={() => router.push('/(tabs)/group')}
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity
          onPress={() => setFilterVisible(true)}
          style={styles.filterBtn}
        >
          <Ionicons name="options" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Card Stack */}
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <SwipeCardStack cards={cards} onSwipe={handleSwipe} />
      )}

      {/* Action Buttons */}
      {cards.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.nope]}
            onPress={() => handleButtonSwipe('left')}
          >
            <Ionicons name="close" size={32} color={Colors.danger} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.like]}
            onPress={() => handleButtonSwipe('right')}
          >
            <Ionicons name="heart" size={32} color={Colors.success} />
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Sheet */}
      <FilterSheet
        visible={filterVisible}
        filters={filters}
        onApply={setFilters}
        onClose={() => setFilterVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  nope: {
    borderColor: Colors.danger,
    backgroundColor: 'rgba(255,71,87,0.1)',
  },
  like: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(78,205,196,0.1)',
  },
  noSession: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  noSessionEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  noSessionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  noSessionText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
