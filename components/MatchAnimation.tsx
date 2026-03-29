import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/lib/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  Colors.primary,
  Colors.primaryLight,
  Colors.accent,
  Colors.success,
  '#FFD700',
  '#FF69B4',
  '#00CED1',
];

function ConfettiPiece({ index }: { index: number }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(
    Math.random() * SCREEN_WIDTH - SCREEN_WIDTH / 2,
  );
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  const size = 8 + Math.random() * 10;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const delay = Math.random() * 600;
  const startX = Math.random() * SCREEN_WIDTH;

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1));
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT * 0.7 + Math.random() * 200, {
        duration: 2000 + Math.random() * 1000,
        easing: Easing.out(Easing.quad),
      }),
    );
    translateX.value = withDelay(
      delay,
      withTiming((Math.random() - 0.5) * SCREEN_WIDTH * 0.8, {
        duration: 2000,
      }),
    );
    rotate.value = withDelay(
      delay,
      withTiming(360 * (2 + Math.random() * 3), { duration: 2500 }),
    );
    opacity.value = withDelay(
      1500 + delay,
      withTiming(0, { duration: 800 }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: -20,
          width: size,
          height: size * (0.5 + Math.random() * 0.5),
          backgroundColor: color,
          borderRadius: Math.random() > 0.5 ? size / 2 : 2,
        },
        style,
      ]}
    />
  );
}

export default function MatchAnimation() {
  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: 30 }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
