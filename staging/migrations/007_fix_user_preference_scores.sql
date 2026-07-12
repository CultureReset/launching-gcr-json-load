-- ============================================================================
-- 007_fix_user_preference_scores.sql
-- Fix broken swipe-preference-learning pipeline: missing table + broken function.
-- ============================================================================
-- APPLIED to project mkepugvdlktfsossumox on 2026-07-12.
--
-- FOUND: live runtime error logs on gcr-api-clean (Vercel) showed
-- "[preference] upsert_preference_score failed: relation \"user_preference_scores\"
-- does not exist" firing 117 times in 5 hours across 8 real users -- every single
-- swipe was silently failing to record its preference-learning signal, and every
-- personalized-ranking read in routes/gcr.js, routes/admin.js, routes/admin-tourists.js
-- was silently getting back empty results instead of a real error.
--
-- ROOT CAUSE (two independent bugs stacked on the same feature):
-- 1. The table `user_preference_scores` was never created -- only the
--    `upsert_preference_score(p_tourist_id, p_tag, p_delta)` RPC function existed,
--    referencing a table that was never migrated. A half-shipped migration.
-- 2. Once the table was added, the function STILL failed: it was defined with
--    `SET search_path TO ''` (a Supabase security-advisor recommendation to
--    prevent search_path hijacking) but its body referenced the bare table name
--    `user_preference_scores` instead of `public.user_preference_scores` --
--    with an empty search_path, that can never resolve. Whoever applied the
--    security hardening never re-tested the function afterward.
--
-- Both fixed here. Fully additive -- no existing data or callers changed shape.
-- Verified end-to-end with a real RPC call + cleanup after applying.
-- ============================================================================

-- 007.1  The missing table.
CREATE TABLE IF NOT EXISTS public.user_preference_scores (
  user_id uuid NOT NULL,
  tag text NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_user_preference_scores_user_id
  ON public.user_preference_scores(user_id);

-- 007.2  Re-define the function with fully-qualified table references so it
-- actually works under SET search_path TO ''. Clamp range (-50..200) and
-- upsert semantics unchanged from whatever was already live.
CREATE OR REPLACE FUNCTION public.upsert_preference_score(p_tourist_id uuid, p_tag text, p_delta numeric)
 RETURNS void
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  INSERT INTO public.user_preference_scores (user_id, tag, score, updated_at)
  VALUES (p_tourist_id, p_tag, GREATEST(-50, LEAST(200, p_delta)), NOW())
  ON CONFLICT (user_id, tag)
  DO UPDATE SET
    score = GREATEST(-50, LEAST(200, public.user_preference_scores.score + p_delta)),
    updated_at = NOW();
$function$;
