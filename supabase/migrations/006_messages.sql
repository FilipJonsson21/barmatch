-- BarMatch: messages table
CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_group_id UUID NOT NULL REFERENCES public.group_sessions(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (char_length(content) > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages from their matches
CREATE POLICY "Users can view match messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.group_members gm ON (gm.group_id = m.group_a_id OR gm.group_id = m.group_b_id)
      WHERE m.id = messages.match_id
        AND gm.user_id = auth.uid()
    )
  );

-- Users can send messages to their matches
CREATE POLICY "Users can send match messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_user_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      JOIN public.group_members gm ON (gm.group_id = m.group_a_id OR gm.group_id = m.group_b_id)
      WHERE m.id = messages.match_id
        AND gm.user_id = auth.uid()
    )
  );

-- Index for chat queries
CREATE INDEX idx_messages_match_id ON public.messages (match_id, created_at);
