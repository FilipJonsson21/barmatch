import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, SWIPE_THRESHOLD } from '@/lib/constants';
import type { GroupSessionWithDistance } from '@/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_OUT_X = SCREEN_WIDTH * 1.5;

interface SwipeCardProps {
  group: GroupSessionWithDistance;
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
  index: number; // 0 = top, 1 = next, etc.
}

export default function SwipeCard({
  group,
  onSwipe,
  isTop,
  index,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.4; // dampen vertical
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const dir = e.translationX > 0 ? 'right' : 'left';
        translateX.value = withTiming(
          dir === 'right' ? CARD_OUT_X : -CARD_OUT_X,
          { duration: 300 },
          () => runOnJS(onSwipe)(dir),
        );
        translateY.value = withTiming(e.translationY * 0.8, { duration: 300 });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-12, 0, 12],
    );

    if (isTop) {
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotate: `${rotation}deg` },
        ],
      };
    }

    // Stack effect for non-top cards
    const scale = interpolate(index, [0, 1, 2], [1, 0.95, 0.9]);
    const yOffset = interpolate(index, [0, 1, 2], [0, 10, 20]);
    return {
      transform: [{ scale }, { translateY: yOffset }],
    };
  });

  // LIKE / NOPE stamp opacity
  const likeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]),
  }));
  const nopeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0, 1]),
  }));

  const distanceLabel =
    group.distance_km != null
      ? group.distance_km < 1
        ? `${Math.round(group.distance_km * 1000)} m`
        : `${group.distance_km.toFixed(1)} km`
      : null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Photo */}
        {group.photo_url ? (
          <Image source={{ uri: group.photo_url }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <Ionicons name="people" size={64} color={Colors.textMuted} />
          </View>
        )}

        {/* Gradient overlay at bottom */}
        <View style={styles.gradient} />

        {/* LIKE stamp */}
        <Animated.View style={[styles.stamp, styles.likeStamp, likeStampStyle]}>
          <Text style={[styles.stampText, { color: Colors.success }]}>LIKE</Text>
        </Animated.View>

        {/* NOPE stamp */}
        <Animated.View style={[styles.stamp, styles.nopeStamp, nopeStampStyle]}>
          <Text style={[styles.stampText, { color: Colors.danger }]}>NOPE</Text>
        </Animated.View>

        {/* Info overlay */}
        <View style={styles.infoOverlay}>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.bio ? (
            <Text style={styles.bio} numberOfLines={2}>
              {group.bio}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="people" size={14} color={Colors.primaryLight} />
              <Text style={styles.metaText}>{group.member_count}</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="calendar" size={14} color={Colors.primaryLight} />
              <Text style={styles.metaText}>
                {group.age_min}–{group.age_max} år
              </Text>
            </View>
            {group.venue_name ? (
              <View style={styles.metaChip}>
                <Ionicons name="location" size={14} color={Colors.primaryLight} />
                <Text style={styles.metaText}>
                  {group.venue_name}
                  {distanceLabel ? ` • ${distanceLabel}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - Spacing.lg * 2,
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(13,11,26,0.6)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: 'rgba(13,11,26,0.75)',
  },
  groupName: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  bio: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },
  metaText: {
    color: Colors.text,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  stamp: {
    position: 'absolute',
    top: 40,
    zIndex: 10,
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  likeStamp: {
    left: 20,
    borderColor: Colors.success,
    transform: [{ rotate: '-15deg' }],
  },
  nopeStamp: {
    right: 20,
    borderColor: Colors.danger,
    transform: [{ rotate: '15deg' }],
  },
  stampText: {
    fontSize: FontSizes.xxl,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
