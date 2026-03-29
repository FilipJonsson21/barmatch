-- BarMatch: group_sessions table
CREATE TABLE public.group_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  bio          TEXT CHECK (char_length(bio) <= 120),
  photo_url    TEXT,
  venue_name   TEXT,
  venue_lat    DOUBLE PRECISION,
  venue_lng    DOUBLE PRECISION,
  member_count INTEGER NOT NULL DEFAULT 2 CHECK (member_count >= 2 AND member_count <= 9),
  age_min      INTEGER NOT NULL DEFAULT 18,
  age_max      INTEGER NOT NULL DEFAULT 99,
  creator_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at   TIMESTAMPTZ NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.group_sessions ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can view active sessions (for discover feed)
CREATE POLICY "Active sessions are viewable"
  ON public.group_sessions FOR SELECT
  TO authenticated
  USING (true);

-- Only the creator can insert
CREATE POLICY "Creator can create session"
  ON public.group_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Only the creator can update (e.g. end session)
CREATE POLICY "Creator can update own session"
  ON public.group_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Index for discover queries
CREATE INDEX idx_group_sessions_active
  ON public.group_sessions (is_active, expires_at)
  WHERE is_active = true;
