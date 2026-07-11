-- 003_structural_audit_fixes.sql
-- ---------------------------------------------------------------------------
-- Platform-wide structural audit of all business data (2026-07-11).
-- Directive: restructure only — NO row deletions.
--
-- Audit findings (Supabase project mkepugvdlktfsossumox):
--   * Linkage is ~clean: of all entity_slug-keyed content tables, only
--     artist_profiles (separate vertical, displays via /artist routes — NOT a bug),
--     entity_modules (237 config rows for removed entities), entity_amenities (13),
--     and bookable_resources (2) had unresolved slugs.
--   * Parent/child links: 331 children, 0 broken.
--   * Field-shift corruption was isolated to the menu scrape (see 002); offerings
--     and the drink tables are correctly structured.
--   * reviews/photos/hours are normalized into entity_reviews / entity_photos /
--     entity_hours for ~97% of entities (see review backfill below).
--
-- This migration records the safe fixes applied.
-- ---------------------------------------------------------------------------
BEGIN;

-- A) Backfill Google reviews that never landed in entity_reviews (28 entities, 37 rows).
--    Source: entity.google_places_data->'reviews' (Places API v1 shape). approved=true
--    so the API (which filters approved=true) returns them.
INSERT INTO entity_reviews (entity_slug, reviewer_name, rating, body, verified_purchase, helpful_count, approved, created_at)
SELECT e.slug,
  rev->'authorAttribution'->>'displayName',
  NULLIF(rev->>'rating','')::int,
  rev->'text'->>'text',
  false, 0, true,
  NULLIF(rev->>'publishTime','')::timestamptz
FROM entity e,
  LATERAL jsonb_array_elements(e.google_places_data->'reviews') AS rev
WHERE jsonb_typeof(e.google_places_data->'reviews')='array'
  AND (rev ? 'authorAttribution')
  AND (SELECT count(*) FROM entity_reviews r WHERE r.entity_slug=e.slug)=0;

-- B) Entities missing entity_type (couldn't categorize / list). Inferred from name.
UPDATE entity SET entity_type='restaurant'
  WHERE slug IN ('good-time-charlies-foley','italian-bistro','sushi-palace')
    AND (entity_type IS NULL OR entity_type='');
UPDATE entity SET entity_type='service'
  WHERE slug='american-legion-post-199-fairhope' AND (entity_type IS NULL OR entity_type='');

-- C) Re-point orphaned child data at the correct existing entity (slug variants).
UPDATE entity_amenities   SET entity_slug='poke-bowl-sushi-burrito-boba'
  WHERE entity_slug='poke-bowl-sushi-burrito-and-boba';
UPDATE bookable_resources SET entity_slug='phoenix-i'
  WHERE entity_slug='phoenix-i-orange-beach-condominiums';
UPDATE bookable_resources SET entity_slug='phoenix-v'
  WHERE entity_slug='phoenix-v-vacation-rental-condominiums';

-- D) Move drink prices trapped in description ("$55.00", price col null) into price (100 rows).
UPDATE drink_items
  SET price = NULLIF(regexp_replace(description,'[^0-9.]','','g'),'')::numeric,
      description = NULL
  WHERE price IS NULL
    AND description ~ '^\s*\$?\s*[0-9]{1,4}(\.[0-9]{2})?\s*$';

COMMIT;

-- ---------------------------------------------------------------------------
-- Deliberately NOT changed (need input or server-side work):
--   * entity_amenities entity_slug='bayview' (7 rows) — ambiguous among
--     bayview-estates / bayview-fort-morgan / bayview-dog-beach. Needs owner's call.
--   * entity_modules: 237 config rows for entities that no longer exist. Harmless
--     (config, not displayed); left in place per no-delete directive.
--   * entity_photos gap: 79 entities have Google photo *name-references* in the blob
--     that need the Google Places Photo API (key + network) to resolve to URLs —
--     must run on the API server.
--   * 5 menu restaurants flagged in 002 for re-import (concatenated scrape).
-- ---------------------------------------------------------------------------
