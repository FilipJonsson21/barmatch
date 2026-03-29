import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMatches, MatchWithDetails } from '@/hooks/useMatches';
import { useGroupSession } from '@/lib/group-session-context';
import LoadingScreen from '@/components/LoadingScreen';
import { Colors, FontSizes, Spacing } from '@/lib/constants';

function MatchRow({ match }: { match: MatchWithDetails }) {
  const router = useRouter();
  const timeAgo = getTimeAgo(match.matched_at);

  return (
    <TouchableOpacity
      style={styles.matchRow}
      onPress={() => router.push(`/(tabs)/matches/${match.id}`)}
      activeOpacity={0.7}
    >
      {/* Photo */}
      {match.otherGroup.photo_url ? (
        <Image
          source={{ uri: match.otherGroup.photo_url }}
          style={styles.matchPhoto}
        />
      ) : (
        <View style={[styles.matchPhoto, styles.matchPhotoFallback]}>
          <Ionicons name="people" size={24} color={Colors.textMuted} />
        </View>
      )}

      {/* Info */}
      <View style={styles.matchInfo}>
        <Text style={styles.matchName} numberOfLines={1}>
          {match.otherGroup.name}
        </Text>
        <Text style={styles.matchMeta} numberOfLines={1}>
          {match.otherGroup.venue_name ?? 'Okänd bar'} •{' '}
          {match.otherGroup.member_count} pers
        </Text>
      </View>

      {/* Time + chevron */}
      <View style={styles.matchRight}>
        <Text style={styles.matchTime}>{timeAgo}</Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={Colors.textMuted}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function MatchesScreen() {
  const { session } = useGroupSession();
  const { matches, isLoading } = useMatches();

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>Matches</Text>

      {!session ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💜</Text>
          <Text style={styles.emptyTitle}>Inget aktivt gäng</Text>
          <Text style={styles.emptyText}>
            Skapa ett gäng och börja swipa för att se matchningar här.
          </Text>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>Inga matchningar ännu</Text>
          <Text style={styles.emptyText}>
            Fortsätt swipa! När båda gängen gillar varandra dyker matchningen
            upp här.
          </Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MatchRow match={item} />}
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Nu';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heading: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  matchPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  matchPhotoFallback: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
  },
  matchMeta: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  matchRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  matchTime: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
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
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
