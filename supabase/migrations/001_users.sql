-- BarMatch: users table
CREATE TABLE public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  display_name TEXT NOT NULL,
  age        INTEGER NOT NULL CHECK (age >= 18 AND age <= 99),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Everyone can read users (needed for chat sender names, etc.)
CREATE POLICY "Users are viewable by authenticated users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own row
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own row (during signup)
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
