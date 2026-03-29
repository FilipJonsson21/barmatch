import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { User } from './types';

// ── Context shape ──────────────────────────────────────────────────────
interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    age: number,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Translate Supabase errors to Swedish ───────────────────────────────
function translateAuthError(msg: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials': 'Fel e-post eller lösenord.',
    'Email not confirmed': 'E-posten är inte bekräftad. Kolla din inbox.',
    'User already registered': 'Ett konto med denna e-post finns redan.',
    'Password should be at least 6 characters':
      'Lösenordet måste vara minst 6 tecken.',
    'Unable to validate email address: invalid format':
      'Ogiltig e-postadress.',
    'Email rate limit exceeded':
      'För många försök. Vänta en stund och försök igen.',
    'For security purposes, you can only request this once every 60 seconds':
      'Vänta 60 sekunder innan du försöker igen.',
    'Signup requires a valid password':
      'Du måste ange ett lösenord.',
    'A user with this email address has already been registered':
      'Ett konto med denna e-post finns redan.',
    'new row violates row-level security policy for table "users"':
      'Kunde inte skapa profil. Kontrollera att du är inloggad.',
  };

  // Check for partial matches
  for (const [key, value] of Object.entries(map)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Fallback: return original if no match
  return msg;
}

// ── Provider ───────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile from the users table
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setUser(data as User);
    }
  }, []);

  // Restore session on mount + listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ── Auth actions ───────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error ? translateAuthError(error.message) : null };
    },
    [],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      age: number,
    ) => {
      // 1. Create auth user
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: translateAuthError(error.message) };
      if (!data.user) return { error: 'Kunde inte skapa konto. Försök igen.' };

      // If email confirmation is required, user.identities will be empty
      if (data.user.identities && data.user.identities.length === 0) {
        return { error: 'Ett konto med denna e-post finns redan.' };
      }

      // 2. Insert profile row
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email,
        display_name: displayName,
        age,
      });
      if (profileError) return { error: translateAuthError(profileError.message) };

      return { error: null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{ session, user, isLoading, signIn, signUp, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
