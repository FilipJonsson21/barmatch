-- BarMatch: group_members table
CREATE TABLE public.group_members (
  group_id  UUID NOT NULL REFERENCES public.group_sessions(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Members can see who's in a group
CREATE POLICY "Group members are viewable"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (true);

-- Users can join groups (insert themselves)
CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can leave groups
CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
