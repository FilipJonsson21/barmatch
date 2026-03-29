import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useGroupSession } from '@/lib/group-session-context';
import { useLocation } from '@/hooks/useLocation';
import { DEFAULT_RADIUS_KM } from '@/lib/constants';
import type { GroupSessionWithDistance, DiscoverFilters, VoteResult } from '@/lib/types';

export function useSwipe() {
  const { user } = useAuth();
  const { session: mySession } = useGroupSession();
  const { location } = useLocation();

  const [cards, setCards] = useState<GroupSessionWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<DiscoverFilters>({
    max_distance_km: DEFAULT_RADIUS_KM,
    age_min: 18,
    age_max: 99,
  });

  // Fetch nearby sessions
  const fetchCards = useCallback(async () => {
    if (!mySession || !user || !location) return;

    setIsLoading(true);

    const { data, error } = await supabase.rpc('get_nearby_sessions', {
      p_user_session_id: mySession.id,
      p_user_id: user.id,
      p_latitude: location.latitude,
      p_longitude: location.longitude,
      p_max_distance_km: filters.max_distance_km,
      p_age_min: filters.age_min,
      p_age_max: filters.age_max,
    });

    if (!error && data) {
      setCards(data as GroupSessionWithDistance[]);
    }
    setIsLoading(false);
  }, [mySession, user, location, filters]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Cast a vote (like or pass)
  const castVote = useCallback(
    async (toGroupId: string, vote: boolean): Promise<VoteResult> => {
      if (!mySession || !user) {
        return { voted: false, match: false };
      }

      const { data, error } = await supabase.rpc('cast_vote_and_check_match', {
        p_from_group_id: mySession.id,
        p_to_group_id: toGroupId,
        p_user_id: user.id,
        p_vote: vote,
      });

      if (error) {
        console.warn('Vote error:', error.message);
        return { voted: false, match: false };
      }

      return data as VoteResult;
    },
    [mySession, user],
  );

  // Remove top card from local deck
  const removeTopCard = useCallback(() => {
    setCards((prev) => prev.slice(1));
  }, []);

  return {
    cards,
    isLoading,
    filters,
    setFilters,
    castVote,
    removeTopCard,
    refreshCards: fetchCards,
    hasSession: !!mySession,
  };
}
