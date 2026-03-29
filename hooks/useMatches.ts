import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useGroupSession } from '@/lib/group-session-context';
import type { Match, GroupSession } from '@/lib/types';

export interface MatchWithDetails {
  id: string;
  matched_at: string;
  otherGroup: GroupSession;
  myGroup: GroupSession;
}

export function useMatches() {
  const { user } = useAuth();
  const { session: mySession } = useGroupSession();
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    if (!mySession || !user) {
      setMatches([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Fetch matches where our session is either group_a or group_b
    const { data, error } = await supabase
      .from('matches')
      .select(
        `
        id,
        matched_at,
        group_a_id,
        group_b_id,
        group_a:group_sessions!matches_group_a_id_fkey(*),
        group_b:group_sessions!matches_group_b_id_fkey(*)
      `,
      )
      .or(
        `group_a_id.eq.${mySession.id},group_b_id.eq.${mySession.id}`,
      )
      .order('matched_at', { ascending: false });

    if (!error && data) {
      const mapped: MatchWithDetails[] = data.map((m: any) => {
        const isGroupA = m.group_a_id === mySession.id;
        return {
          id: m.id,
          matched_at: m.matched_at,
          otherGroup: isGroupA ? m.group_b : m.group_a,
          myGroup: isGroupA ? m.group_a : m.group_b,
        };
      });
      setMatches(mapped);
    }

    setIsLoading(false);
  }, [mySession, user]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Realtime subscription for new matches
  useEffect(() => {
    if (!mySession) return;

    const channel = supabase
      .channel(`matches-${mySession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          const newMatch = payload.new as Match;
          // Only add if it involves our session
          if (
            newMatch.group_a_id === mySession.id ||
            newMatch.group_b_id === mySession.id
          ) {
            // Refetch to get full join data
            fetchMatches();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mySession, fetchMatches]);

  return { matches, isLoading, refreshMatches: fetchMatches };
}
