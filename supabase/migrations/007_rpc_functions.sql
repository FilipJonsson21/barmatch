-- ═══════════════════════════════════════════════════════════════════════
-- BarMatch: RPC functions for voting / matching / discovery
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Cast a vote and atomically check for a match ────────────────────
CREATE OR REPLACE FUNCTION cast_vote_and_check_match(
  p_from_group_id UUID,
  p_to_group_id   UUID,
  p_user_id       UUID,
  p_vote          BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from_member_count  INTEGER;
  v_yes_votes          INTEGER;
  v_majority_needed    INTEGER;
  v_reverse_yes_votes  INTEGER;
  v_to_member_count    INTEGER;
  v_reverse_majority   INTEGER;
  v_already_matched    BOOLEAN;
  v_match_id           UUID;
BEGIN
  -- Insert (or update) the swipe
  INSERT INTO public.swipes (from_group_id, to_group_id, user_id, vote)
  VALUES (p_from_group_id, p_to_group_id, p_user_id, p_vote)
  ON CONFLICT (from_group_id, to_group_id, user_id)
  DO UPDATE SET vote = p_vote;

  -- If it's a pass, no match logic needed
  IF NOT p_vote THEN
    RETURN jsonb_build_object('voted', true, 'match', false);
  END IF;

  -- Count YES votes from our group toward the target
  SELECT member_count INTO v_from_member_count
    FROM public.group_sessions WHERE id = p_from_group_id;

  SELECT COUNT(*) INTO v_yes_votes
    FROM public.swipes
   WHERE from_group_id = p_from_group_id
     AND to_group_id   = p_to_group_id
     AND vote = true;

  -- Majority = ceil(n/2): 2→2, 3→2, 4→3, 5→3, etc.
  v_majority_needed := CEIL(v_from_member_count::NUMERIC / 2);

  -- Not enough votes yet from our group
  IF v_yes_votes < v_majority_needed THEN
    RETURN jsonb_build_object(
      'voted', true, 'match', false,
      'votes', v_yes_votes, 'needed', v_majority_needed
    );
  END IF;

  -- Our group has majority! Now check the reverse direction.
  SELECT member_count INTO v_to_member_count
    FROM public.group_sessions WHERE id = p_to_group_id;

  SELECT COUNT(*) INTO v_reverse_yes_votes
    FROM public.swipes
   WHERE from_group_id = p_to_group_id
     AND to_group_id   = p_from_group_id
     AND vote = true;

  v_reverse_majority := CEIL(v_to_member_count::NUMERIC / 2);

  -- Other group hasn't reached majority yet
  IF v_reverse_yes_votes < v_reverse_majority THEN
    RETURN jsonb_build_object(
      'voted', true, 'match', false, 'group_approved', true
    );
  END IF;

  -- Both groups have mutual majority! Check for existing match.
  SELECT EXISTS (
    SELECT 1 FROM public.matches
     WHERE (group_a_id = LEAST(p_from_group_id, p_to_group_id)
        AND group_b_id = GREATEST(p_from_group_id, p_to_group_id))
  ) INTO v_already_matched;

  IF v_already_matched THEN
    RETURN jsonb_build_object('voted', true, 'match', false, 'already_matched', true);
  END IF;

  -- ✨ Create the match!
  INSERT INTO public.matches (group_a_id, group_b_id)
  VALUES (LEAST(p_from_group_id, p_to_group_id), GREATEST(p_from_group_id, p_to_group_id))
  RETURNING id INTO v_match_id;

  RETURN jsonb_build_object('voted', true, 'match', true, 'match_id', v_match_id);
END;
$$;


-- ── 2. Get nearby active sessions (Haversine distance filter) ──────────
CREATE OR REPLACE FUNCTION get_nearby_sessions(
  p_user_session_id  UUID,
  p_user_id          UUID,
  p_latitude         DOUBLE PRECISION,
  p_longitude        DOUBLE PRECISION,
  p_max_distance_km  DOUBLE PRECISION DEFAULT 10,
  p_age_min          INTEGER DEFAULT 18,
  p_age_max          INTEGER DEFAULT 99
)
RETURNS TABLE (
  id           UUID,
  name         TEXT,
  bio          TEXT,
  photo_url    TEXT,
  venue_name   TEXT,
  venue_lat    DOUBLE PRECISION,
  venue_lng    DOUBLE PRECISION,
  member_count INTEGER,
  age_min      INTEGER,
  age_max      INTEGER,
  creator_id   UUID,
  expires_at   TIMESTAMPTZ,
  is_active    BOOLEAN,
  created_at   TIMESTAMPTZ,
  distance_km  DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gs.id, gs.name, gs.bio, gs.photo_url,
    gs.venue_name, gs.venue_lat, gs.venue_lng,
    gs.member_count, gs.age_min, gs.age_max,
    gs.creator_id, gs.expires_at, gs.is_active, gs.created_at,
    -- Haversine formula (returns km)
    (
      6371 * acos(
        LEAST(1.0,
          cos(radians(p_latitude)) * cos(radians(gs.venue_lat))
          * cos(radians(gs.venue_lng) - radians(p_longitude))
          + sin(radians(p_latitude)) * sin(radians(gs.venue_lat))
        )
      )
    ) AS distance_km
  FROM public.group_sessions gs
  WHERE gs.id != p_user_session_id
    AND gs.is_active = true
    AND gs.expires_at > now()
    AND gs.venue_lat IS NOT NULL
    AND gs.venue_lng IS NOT NULL
    -- Age overlap filter
    AND gs.age_max >= p_age_min
    AND gs.age_min <= p_age_max
    -- Exclude groups the current user already swiped on
    AND NOT EXISTS (
      SELECT 1 FROM public.swipes s
       WHERE s.from_group_id = p_user_session_id
         AND s.to_group_id   = gs.id
         AND s.user_id        = p_user_id
    )
    -- Haversine distance filter
    AND (
      6371 * acos(
        LEAST(1.0,
          cos(radians(p_latitude)) * cos(radians(gs.venue_lat))
          * cos(radians(gs.venue_lng) - radians(p_longitude))
          + sin(radians(p_latitude)) * sin(radians(gs.venue_lat))
        )
      )
    ) <= p_max_distance_km
  ORDER BY distance_km ASC;
END;
$$;


-- ── 3. Expire stale sessions (can be called from a cron / Edge Function)
CREATE OR REPLACE FUNCTION expire_stale_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.group_sessions
     SET is_active = false
   WHERE is_active = true
     AND expires_at < now();
END;
$$;
