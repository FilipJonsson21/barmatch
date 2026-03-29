import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '@/lib/constants';

interface ChatInputProps {
  onSend: (text: string) => void;
}

export default function ChatInput({ onSend }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Skriv ett meddelande…"
        placeholderTextColor={Colors.textMuted}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
        onPress={handleSend}
        disabled={!text.trim()}
      >
        <Ionicons
          name="send"
          size={20}
          color={text.trim() ? '#fff' : Colors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.text,
    fontSize: FontSizes.md,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
});
