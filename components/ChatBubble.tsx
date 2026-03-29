import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing } from '@/lib/constants';

interface ChatBubbleProps {
  content: string;
  senderName?: string;
  isMine: boolean;
  timestamp: string;
}

export default function ChatBubble({
  content,
  senderName,
  isMine,
  timestamp,
}: ChatBubbleProps) {
  const time = new Date(timestamp).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View
      style={[
        styles.container,
        isMine ? styles.containerMine : styles.containerTheirs,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        {!isMine && senderName ? (
          <Text style={styles.sender}>{senderName}</Text>
        ) : null}
        <Text style={[styles.content, isMine && styles.contentMine]}>
          {content}
        </Text>
        <Text style={[styles.time, isMine && styles.timeMine]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 3,
    paddingHorizontal: Spacing.md,
    maxWidth: '80%',
  },
  containerMine: {
    alignSelf: 'flex-end',
  },
  containerTheirs: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: Colors.surfaceLight,
    borderBottomLeftRadius: 4,
  },
  sender: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginBottom: 2,
  },
  content: {
    fontSize: FontSizes.md,
    color: Colors.text,
    lineHeight: 22,
  },
  contentMine: {
    color: '#fff',
  },
  time: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMine: {
    color: 'rgba(255,255,255,0.6)',
  },
});
