import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import Button from '@/components/Button';
import { Colors, FontSizes, Spacing, MAX_RADIUS_KM } from '@/lib/constants';
import type { DiscoverFilters } from '@/lib/types';

interface FilterSheetProps {
  visible: boolean;
  filters: DiscoverFilters;
  onApply: (filters: DiscoverFilters) => void;
  onClose: () => void;
}

export default function FilterSheet({
  visible,
  filters,
  onApply,
  onClose,
}: FilterSheetProps) {
  const [local, setLocal] = useState(filters);

  // Sync when opened
  React.useEffect(() => {
    if (visible) setLocal(filters);
  }, [visible, filters]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>

      <Animated.View
        entering={SlideInDown.springify().damping(20)}
        exiting={SlideOutDown.duration(200)}
        style={styles.sheet}
      >
        <View style={styles.handle} />
        <Text style={styles.title}>Filter</Text>

        {/* Distance slider */}
        <Text style={styles.label}>
          Max avstånd: {local.max_distance_km.toFixed(1)} km
        </Text>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>0.5</Text>
          <View style={styles.sliderWrap}>
            <Slider
              minimumValue={0.5}
              maximumValue={MAX_RADIUS_KM}
              step={0.5}
              value={local.max_distance_km}
              onValueChange={(v: number) =>
                setLocal((p) => ({ ...p, max_distance_km: v }))
              }
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.surfaceLight}
              thumbTintColor={Colors.primary}
            />
          </View>
          <Text style={styles.sliderLabel}>{MAX_RADIUS_KM}</Text>
        </View>

        {/* Age range */}
        <Text style={styles.label}>
          Ålder: {local.age_min} – {local.age_max} år
        </Text>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>18</Text>
          <View style={styles.sliderWrap}>
            <Slider
              minimumValue={18}
              maximumValue={99}
              step={1}
              value={local.age_min}
              onValueChange={(v: number) =>
                setLocal((p) => ({
                  ...p,
                  age_min: Math.min(v, p.age_max - 1),
                }))
              }
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.surfaceLight}
              thumbTintColor={Colors.primary}
            />
          </View>
          <Text style={styles.sliderLabel}>{local.age_min}</Text>
        </View>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>{local.age_max}</Text>
          <View style={styles.sliderWrap}>
            <Slider
              minimumValue={18}
              maximumValue={99}
              step={1}
              value={local.age_max}
              onValueChange={(v: number) =>
                setLocal((p) => ({
                  ...p,
                  age_max: Math.max(v, p.age_min + 1),
                }))
              }
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.surfaceLight}
              thumbTintColor={Colors.primary}
            />
          </View>
          <Text style={styles.sliderLabel}>99</Text>
        </View>

        <Button
          title="Tillämpa filter"
          onPress={() => {
            onApply(local);
            onClose();
          }}
          size="lg"
          style={{ marginTop: Spacing.lg }}
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: 50,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sliderWrap: {
    flex: 1,
  },
  sliderLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    minWidth: 28,
    textAlign: 'center',
  },
});
