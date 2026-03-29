import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useGroupSession } from '@/lib/group-session-context';
import type { Message } from '@/lib/types';

export interface ChatMessage extends Message {
  sender_name?: string;
  is_mine: boolean;
}

export function useMessages(matchId: string) {
  const { user } = useAuth();
  const { session: mySession } = useGroupSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing messages
  const fetchMessages = useCallback(async () => {
    if (!matchId) return;

    setIsLoading(true);

    const { data, error } = await supabase
      .from('messages')
      .select(
        `
        *,
        sender:users!messages_sender_user_id_fkey(display_name)
      `,
      )
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const mapped: ChatMessage[] = data.map((m: any) => ({
        ...m,
        sender_name: m.sender?.display_name ?? 'Okänd',
        is_mine: m.sender_user_id === user?.id,
      }));
      setMessages(mapped);
    }

    setIsLoading(false);
  }, [matchId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;

          setMessages((prev) => {
            // Deduplicate (optimistic inserts)
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            return [
              ...prev,
              {
                ...newMsg,
                sender_name: undefined, // Will be filled on next fetch
                is_mine: newMsg.sender_user_id === user?.id,
              },
            ];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, user]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!user || !mySession || !matchId || !content.trim()) return;

      const optimisticId = `temp-${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: optimisticId,
        match_id: matchId,
        sender_user_id: user.id,
        sender_group_id: mySession.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
        sender_name: user.display_name,
        is_mine: true,
      };

      // Optimistic insert
      setMessages((prev) => [...prev, optimisticMsg]);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_user_id: user.id,
          sender_group_id: mySession.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        console.warn('Send message error:', error.message);
      } else if (data) {
        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? {
                  ...data,
                  sender_name: user.display_name,
                  is_mine: true,
                }
              : m,
          ),
        );
      }
    },
    [user, mySession, matchId],
  );

  return { messages, isLoading, sendMessage };
}
