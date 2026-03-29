import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import MatchAnimation from '@/components/MatchAnimation';
import Button from '@/components/Button';
import { Colors, FontSizes, Spacing } from '@/lib/constants';

export default function MatchModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    matchId: string;
    groupAName: string;
    groupBName: string;
    groupAPhoto: string;
    groupBPhoto: string;
  }>();

  const titleScale = useSharedValue(0);
  const photoAX = useSharedValue(-200);
  const photoBX = useSharedValue(200);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    titleScale.value = withDelay(300, withSpring(1, { damping: 8 }));
    photoAX.value = withDelay(500, withSpring(0, { damping: 12 }));
    photoBX.value = withDelay(500, withSpring(0, { damping: 12 }));
    buttonsOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));
  const photoAStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: photoAX.value }],
  }));
  const photoBStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: photoBX.value }],
  }));
  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <MatchAnimation />

      <View style={styles.content}>
        {/* Title */}
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>IT'S A MATCH! 🎉</Text>
          <Text style={styles.subtitle}>
            {params.groupAName ?? 'Ditt gäng'} &{' '}
            {params.groupBName ?? 'Deras gäng'} gillar varandra!
          </Text>
        </Animated.View>

        {/* Photos side by side */}
        <View style={styles.photosRow}>
          <Animated.View style={[styles.photoWrap, photoAStyle]}>
            {params.groupAPhoto ? (
              <Image
                source={{ uri: params.groupAPhoto }}
                style={styles.photo}
              />
            ) : (
              <View style={[styles.photo, styles.photoFallback]}>
                <Text style={styles.photoEmoji}>👥</Text>
              </View>
            )}
            <Text style={styles.photoLabel} numberOfLines={1}>
              {params.groupAName ?? 'Ditt gäng'}
            </Text>
          </Animated.View>

          <Text style={styles.heart}>💜</Text>

          <Animated.View style={[styles.photoWrap, photoBStyle]}>
            {params.groupBPhoto ? (
              <Image
                source={{ uri: params.groupBPhoto }}
                style={styles.photo}
              />
            ) : (
              <View style={[styles.photo, styles.photoFallback]}>
                <Text style={styles.photoEmoji}>👥</Text>
              </View>
            )}
            <Text style={styles.photoLabel} numberOfLines={1}>
              {params.groupBName ?? 'Deras gäng'}
            </Text>
          </Animated.View>
        </View>

        {/* Buttons */}
        <Animated.View style={[styles.buttons, buttonsStyle]}>
          <Button
            title="Skicka meddelande"
            onPress={() => {
              router.dismiss();
              if (params.matchId) {
                router.push(`/(tabs)/matches/${params.matchId}`);
              }
            }}
            size="lg"
          />
          <Button
            title="Fortsätt swipa"
            variant="outline"
            onPress={() => router.dismiss()}
            style={{ marginTop: Spacing.md }}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.hero,
    fontWeight: '900',
    color: Colors.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(233,30,140,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  photoWrap: {
    alignItems: 'center',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  photoFallback: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: {
    fontSize: 40,
  },
  photoLabel: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    marginTop: Spacing.sm,
    maxWidth: 120,
    textAlign: 'center',
  },
  heart: {
    fontSize: 32,
  },
  buttons: {
    width: '100%',
  },
});
