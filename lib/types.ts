// ── Database row types (match Supabase schema) ────────────────────────

export interface User {
  id: string;
  email: string;
  display_name: string;
  age: number;
  avatar_url: string | null;
  created_at: string;
}

export interface GroupSession {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  venue_name: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  member_count: number;
  age_min: number;
  age_max: number;
  creator_id: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface Swipe {
  id: string;
  from_group_id: string;
  to_group_id: string;
  user_id: string;
  vote: boolean; // true = like, false = pass
  created_at: string;
}

export interface Match {
  id: string;
  group_a_id: string;
  group_b_id: string;
  matched_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_user_id: string;
  sender_group_id: string;
  content: string;
  created_at: string;
}

// ── Derived / UI types ─────────────────────────────────────────────────

export interface GroupSessionWithDistance extends GroupSession {
  distance_km?: number;
}

export interface MatchWithGroups extends Match {
  group_a: GroupSession;
  group_b: GroupSession;
}

export interface MessageWithSender extends Message {
  sender: User;
}

export interface DiscoverFilters {
  max_distance_km: number;
  age_min: number;
  age_max: number;
}

export interface VoteResult {
  voted: boolean;
  match: boolean;
  match_id?: string;
  votes?: number;
  needed?: number;
  group_approved?: boolean;
  already_matched?: boolean;
}
