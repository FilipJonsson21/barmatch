-- BarMatch: matches table
CREATE TABLE public.matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_a_id  UUID NOT NULL REFERENCES public.group_sessions(id) ON DELETE CASCADE,
  group_b_id  UUID NOT NULL REFERENCES public.group_sessions(id) ON DELETE CASCADE,
  matched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_a_id, group_b_id)
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Users can see matches they're part of
CREATE POLICY "Users can view own matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE (gm.group_id = matches.group_a_id OR gm.group_id = matches.group_b_id)
        AND gm.user_id = auth.uid()
    )
  );

-- Insert is handled by RPC function (SECURITY DEFINER)
-- but allow via policy for the RPC context
CREATE POLICY "System can insert matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (true);
