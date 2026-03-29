import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { SESSION_DURATION_HOURS } from '@/lib/constants';
import type { GroupSession, GroupMember } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────
interface CreateSessionInput {
  name: string;
  bio: string;
  photo_url: string | null;
  venue_name: string;
  venue_lat: number | null;
  venue_lng: number | null;
  member_count: number;
  age_min: number;
  age_max: number;
}

interface GroupSessionContextValue {
  session: GroupSession | null;
  members: GroupMember[];
  isLoading: boolean;
  createSession: (input: CreateSessionInput) => Promise<{ error: string | null; session?: GroupSession }>;
  endSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const GroupSessionContext = createContext<GroupSessionContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────
export function GroupSessionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [session, setSession] = useState<GroupSession | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the user's current active session
  const fetchSession = useCallback(async () => {
    if (!user) {
      setSession(null);
      setMembers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Find an active session where user is a member
    const { data: memberRows } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (!memberRows || memberRows.length === 0) {
      setSession(null);
      setMembers([]);
      setIsLoading(false);
      return;
    }

    const groupIds = memberRows.map((m) => m.group_id);

    const { data: sessions } = await supabase
      .from('group_sessions')
      .select('*')
      .in('id', groupIds)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessions && sessions.length > 0) {
      const activeSession = sessions[0] as GroupSession;
      setSession(activeSession);

      // Fetch members
      const { data: mems } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', activeSession.id);
      setMembers((mems as GroupMember[]) || []);
    } else {
      setSession(null);
      setMembers([]);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Create a new group session
  const createSession = useCallback(
    async (input: CreateSessionInput) => {
      if (!user) return { error: 'Ej inloggad' };

      const expiresAt = new Date(
        Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000,
      ).toISOString();

      const { data, error } = await supabase
        .from('group_sessions')
        .insert({
          ...input,
          creator_id: user.id,
          expires_at: expiresAt,
          is_active: true,
        })
        .select()
        .single();

      if (error) return { error: error.message };

      // Add creator as first member
      await supabase.from('group_members').insert({
        group_id: data.id,
        user_id: user.id,
      });

      const newSession = data as GroupSession;
      setSession(newSession);
      setMembers([{ group_id: data.id, user_id: user.id, joined_at: new Date().toISOString() }]);
      return { error: null, session: newSession };
    },
    [user],
  );

  // End the current session
  const endSession = useCallback(async () => {
    if (!session) return;

    await supabase
      .from('group_sessions')
      .update({ is_active: false })
      .eq('id', session.id);

    setSession(null);
    setMembers([]);
  }, [session]);

  return (
    <GroupSessionContext.Provider
      value={{
        session,
        members,
        isLoading,
        createSession,
        endSession,
        refreshSession: fetchSession,
      }}
    >
      {children}
    </GroupSessionContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────
export function useGroupSession() {
  const ctx = useContext(GroupSessionContext);
  if (!ctx) {
    throw new Error('useGroupSession must be used within <GroupSessionProvider>');
  }
  return ctx;
}
