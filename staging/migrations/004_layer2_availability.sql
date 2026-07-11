-- ============================================================================
-- 004_layer2_availability.sql
-- LAYER 2 — AVAILABILITY AGGREGATION (per-unit)
-- ============================================================================
-- APPLIED to project mkepugvdlktfsossumox on 2026-07-11 via two Supabase
-- migrations: `layer2_availability` then `layer2_reconcile_with_existing_pipeline`.
-- This file is the consolidated record of the FINAL applied state.
--
-- STANDING CONSTRAINT (unchanged): additive to real data. No existing rows
-- dropped or overwritten. All ADD COLUMN / CREATE are if-not-exists.
--
-- WHY THIS SHAPE — important context:
-- gcr-api-clean ALREADY has a working iCal ingest+export pipeline:
--   * routes/email-parser.js  syncExternalCalendar() polls entity_external_calendars
--     feeds hourly (Vercel cron /api/email-parser/ical-import/run), parses VEVENTs
--     via utils/ical-parse.js, and blocks dates into business_availability.
--   * routes/public.js  GET /api/public/ical/:slug/:token.ics exports GCR's blocked
--     dates back out, authed by entity.ical_token.
-- That pipeline was ENTITY-LEVEL only (business_availability keyed by entity_slug),
-- so a multi-unit building (e.g. 155-unit condo complex = one entity) could not
-- block a single unit. Layer 2 therefore EXTENDS the existing pipeline with a
-- per-unit dimension rather than building a parallel one. (An initial iteration
-- created a separate calendar_blocks table; it was dropped once the existing
-- pipeline was found — see 004.0.)
--
-- GROUND TRUTH verified 2026-07-11:
--   bookable_resources ......... 1,008 rows (155 condos) — CANONICAL, populated unit layer
--   room_types ................. 0 rows — legacy/empty, superseded by bookable_resources
--   business_availability ...... blocks table used by the live ingest+export (per-day rows)
--   entity_external_calendars .. feed registry consumed by the live cron
--   entity.ical_token .......... per-entity outbound export token (already exists)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 004.0  Reconciliation — remove the short-lived parallel table.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS resource_is_available(uuid, date, date);
DROP FUNCTION IF EXISTS resource_blocked_dates(uuid, date, date);
DROP TABLE IF EXISTS calendar_blocks;   -- was created then superseded; empty, no data lost

-- ----------------------------------------------------------------------------
-- 004.1  Per-unit dimension on the EXISTING blocks table.
-- NULL resource_id = entity-wide block (every current row + reader unchanged).
-- A set resource_id = that unit only.
-- ----------------------------------------------------------------------------
ALTER TABLE business_availability
  ADD COLUMN IF NOT EXISTS resource_id uuid REFERENCES bookable_resources(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_business_availability_resource_date
  ON business_availability (resource_id, availability_date);

-- ----------------------------------------------------------------------------
-- 004.2  Let a feed target a specific unit; let a booking name its unit; give
-- each unit its own outbound iCal export token (per-unit feeds for buildings).
-- ----------------------------------------------------------------------------
ALTER TABLE entity_external_calendars
  ADD COLUMN IF NOT EXISTS resource_id uuid REFERENCES bookable_resources(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS sync_error text,
  ADD COLUMN IF NOT EXISTS consecutive_failures integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sync_frequency_minutes integer DEFAULT 180;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS resource_id uuid REFERENCES bookable_resources(id);

ALTER TABLE bookable_resources
  ADD COLUMN IF NOT EXISTS ical_export_token text;
UPDATE bookable_resources
   SET ical_export_token = encode(gen_random_bytes(16), 'hex')
 WHERE ical_export_token IS NULL;   -- backfill only where absent

-- ----------------------------------------------------------------------------
-- 004.3  Resolver — single source of availability truth, per unit.
-- Reads the REAL blocks table (business_availability): a unit is unavailable
-- for a night if a blocked/full row targets that unit (resource_id match) OR
-- the whole entity (resource_id IS NULL), or an active native booking overlaps.
-- Verified 2026-07-11 against phoenix-i (2 units): per-unit block isolates to
-- one unit; entity-wide block cascades to both. (Tested in a rolled-back tx.)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION resource_is_available(
  p_resource_id uuid, p_checkin date, p_checkout date
) RETURNS boolean LANGUAGE sql STABLE AS $$
  WITH r AS (SELECT entity_slug FROM bookable_resources WHERE id = p_resource_id)
  SELECT p_checkout > p_checkin
    AND NOT EXISTS (
      SELECT 1 FROM business_availability ba, r
      WHERE ba.availability_date >= p_checkin AND ba.availability_date < p_checkout
        AND ba.status IN ('blocked','full')
        AND (ba.resource_id = p_resource_id
             OR (ba.resource_id IS NULL AND ba.entity_slug = r.entity_slug))
    )
    AND NOT EXISTS (
      SELECT 1 FROM bookings bk
      WHERE bk.resource_id = p_resource_id
        AND bk.status IN ('pending','confirmed')
        AND bk.date < p_checkout AND COALESCE(bk.end_date, bk.date + 1) > p_checkin
    );
$$;

CREATE OR REPLACE FUNCTION resource_blocked_dates(
  p_resource_id uuid, p_from date, p_to date
) RETURNS TABLE(d date) LANGUAGE sql STABLE AS $$
  WITH r AS (SELECT entity_slug FROM bookable_resources WHERE id = p_resource_id)
  SELECT ba.availability_date
  FROM business_availability ba, r
  WHERE ba.availability_date BETWEEN p_from AND p_to
    AND ba.status IN ('blocked','full')
    AND (ba.resource_id = p_resource_id
         OR (ba.resource_id IS NULL AND ba.entity_slug = r.entity_slug))
  UNION
  SELECT gs::date
  FROM bookings bk
  CROSS JOIN LATERAL generate_series(
    GREATEST(bk.date, p_from),
    LEAST(COALESCE(bk.end_date, bk.date + 1) - 1, p_to),
    interval '1 day'
  ) gs
  WHERE bk.resource_id = p_resource_id
    AND bk.status IN ('pending','confirmed')
    AND bk.date <= p_to AND COALESCE(bk.end_date, bk.date + 1) > p_from;
$$;

-- ============================================================================
-- CODE CHANGES SHIPPED WITH THIS MIGRATION (gcr-api-clean):
--   routes/email-parser.js  blockDateOnCalendar() + syncExternalCalendar() now
--     carry resource_id from the feed row -> per-unit ingest (entity-wide when null).
--   routes/availability.js  new read endpoints for the date-picker:
--     GET /api/availability/resource/:id?from=&to=      -> blocked nights + rules
--     GET /api/availability/resource/:id/quote?checkin=&checkout=&guests= -> priced quote
--
-- STILL PENDING (Layer 2 remainder):
--   [ ] per-unit outbound export feed (GET /api/public/ical/unit/:token.ics)
--   [ ] admin.html per-unit "Calendars & Availability" panel (register feed, sync-now, copy export URL)
--   [ ] gcr-unified date-picker on condo listing pages (task #18) consuming the endpoints above
--   [ ] cancellation-aware resync (existing ingest only ADDS blocks; stale blocks persist when a feed reservation is removed)
--   [ ] additive gap-fill: bookable_resources.bedrooms/bathrooms/booking_url NULL on the 155 condos
-- ============================================================================
