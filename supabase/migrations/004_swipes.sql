-- BarMatch: swipes table
CREATE TABLE public.swipes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_group_id UUID NOT NULL REFERENCES public.group_sessions(id) ON DELETE CASCADE,
  to_group_id   UUID NOT NULL REFERENCES public.group_sessions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote          BOOLEAN NOT NULL,  -- true = like, false = pass
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_group_id, to_group_id, user_id)
);

ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

-- Users can see swipes from their own group
CREATE POLICY "Users can view own group swipes"
  ON public.swipes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = swipes.from_group_id
        AND gm.user_id = auth.uid()
    )
  );

-- Users can insert their own swipes
CREATE POLICY "Users can cast swipes"
  ON public.swipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index for vote counting
CREATE INDEX idx_swipes_vote_count
  ON public.swipes (from_group_id, to_group_id, vote)
  WHERE vote = true;
