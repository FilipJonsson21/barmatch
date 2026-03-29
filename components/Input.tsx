import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors, FontSizes, Spacing } from '@/lib/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  containerStyle,
  style,
  onFocus: externalOnFocus,
  onBlur: externalOnBlur,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error ? styles.inputError : undefined,
          style,
        ]}
        placeholderTextColor={Colors.textMuted}
        onFocus={(e) => {
          setIsFocused(true);
          externalOnFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          externalOnBlur?.(e);
        }}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: Spacing.md,
    color: Colors.text,
    fontSize: FontSizes.md,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  error: {
    color: Colors.danger,
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
