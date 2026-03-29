import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export { SCREEN_WIDTH, SCREEN_HEIGHT };

// ── Colors (dark nightlife theme) ──────────────────────────────────────
export const Colors = {
  background: '#0D0B1A',
  surface: '#1A1730',
  surfaceLight: '#2A2545',
  primary: '#E91E8C',
  primaryLight: '#FF6BB5',
  accent: '#FF6B6B',
  text: '#FFFFFF',
  textSecondary: '#9B97B0',
  textMuted: '#5C5775',
  success: '#4ECDC4',
  danger: '#FF4757',
  border: '#2A2545',
  overlay: 'rgba(13,11,26,0.85)',
  gradient: {
    start: '#1A1730',
    end: '#0D0B1A',
  },
} as const;

// ── Spacing ────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ── Font sizes ─────────────────────────────────────────────────────────
export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  hero: 42,
} as const;

// ── App constants ──────────────────────────────────────────────────────
export const SESSION_DURATION_MS = 5 * 60 * 60 * 1000; // 5 hours
export const SESSION_DURATION_HOURS = 5;
export const DEFAULT_RADIUS_KM = 2;
export const MAX_RADIUS_KM = 10;
export const MIN_GROUP_SIZE = 2;
export const MAX_GROUP_SIZE = 9;
export const BIO_MAX_LENGTH = 120;
export const SWIPE_THRESHOLD = 120;
export const MAJORITY_RATIO = 0.5; // > 50% means majority
