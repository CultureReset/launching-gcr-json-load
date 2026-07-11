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

-- ---------------------------------------------------------------------------
-- 004: Happy hour content misfiled in menu_sections/menu_items (found live,
-- 2026-07-11). 4 restaurants had real "Happy Hour" sections sitting in the
-- regular menu tables instead of happy_hour_sections/happy_hour_items, making
-- them invisible on both their own Happy Hour tab and the platform Happy
-- Hours listing page. Copied (not moved -- originals left in place per the
-- no-delete directive) into the correct tables.
-- ---------------------------------------------------------------------------
INSERT INTO happy_hour_sections (entity_slug, section_name, sort_order, days_of_week, start_time, end_time, available_days, is_active)
SELECT entity_slug, section_name, sort_order, days_of_week, start_time, end_time, available_days, true
FROM menu_sections
WHERE section_name ILIKE '%happy hour%'
  AND entity_slug IN ('fish-river-grill','hammered-crab','icehouse-taproom','yoho-rum-and-tacos');

INSERT INTO happy_hour_items (section_id, entity_slug, item_name, description, price, image_url, image_path, is_available, sort_order)
SELECT hhs.id, mi.entity_slug, mi.item_name, mi.description, mi.price, mi.image_url, mi.image_path, mi.is_available, mi.sort_order
FROM menu_items mi
JOIN menu_sections ms ON ms.id = mi.section_id
JOIN happy_hour_sections hhs ON hhs.entity_slug = ms.entity_slug AND hhs.section_name = ms.section_name
WHERE ms.section_name ILIKE '%happy hour%'
  AND ms.entity_slug IN ('fish-river-grill','hammered-crab','icehouse-taproom','yoho-rum-and-tacos');

-- 005: ice-house-taproom hero_image_url pointed at a stale pre-rename storage
-- path (icehouse-tap-room-gulf-shores/...) instead of its real uploaded photo
-- (ice-house-taproom/photo_01.jpg). Found live via a user screenshot, 2026-07-11.
UPDATE entity SET hero_image_url = 'https://mkepugvdlktfsossumox.supabase.co/storage/v1/object/public/entity-photos/ice-house-taproom/photo_01.jpg'
WHERE slug='ice-house-taproom'
  AND hero_image_url = 'https://mkepugvdlktfsossumox.supabase.co/storage/v1/object/public/entity-photos/icehouse-tap-room-gulf-shores/photo_01.jpg';

-- 006: Gulf Coast Luggo "How It Works" content, extracted from the business's
-- own uploaded page (gulfcoastluggowebsite_2.html), added as a real
-- entity_sections/entity_section_items block. Renders under this service's
-- "Offerings" tab (BusinessDetail.jsx isService tab order). Icon (🧳) was
-- already correctly set from an earlier load, matching the source page's logo mark.
INSERT INTO entity_sections (entity_slug, section_type, section_name, icon, subtitle, layout, sort_order, is_active)
VALUES ('gulf-coast-luggo', 'process', 'How It Works', '📋', 'Simple, fast, and built for tourists who want one more stress-free day on the Gulf Coast.', 'steps', 1, true);

INSERT INTO entity_section_items (section_id, entity_slug, item_name, description, icon, sort_order)
SELECT id, 'gulf-coast-luggo', '1. Schedule', 'Call, text, or book online with your pickup location, drop-off location, and timing.', '📅', 1
FROM entity_sections WHERE entity_slug='gulf-coast-luggo' AND section_name='How It Works';
INSERT INTO entity_section_items (section_id, entity_slug, item_name, description, icon, sort_order)
SELECT id, 'gulf-coast-luggo', '2. We Pick Up', 'We collect your bags from your condo, hotel, rental, or agreed pickup spot.', '🧳', 2
FROM entity_sections WHERE entity_slug='gulf-coast-luggo' AND section_name='How It Works';
INSERT INTO entity_section_items (section_id, entity_slug, item_name, description, icon, sort_order)
SELECT id, 'gulf-coast-luggo', '3. We Deliver', 'We deliver your luggage to the airport, your next stay, or another approved location.', '✈️', 3
FROM entity_sections WHERE entity_slug='gulf-coast-luggo' AND section_name='How It Works';

-- 007: Gulf Coast Luggo — real $50 starting price (from its own `offerings` row,
-- "Standard Pickup+Storage+Delivery") copied into entity.price_from so the
-- shared GCRCard price line (previously blank because price_from was null)
-- shows it. Also featured=true so it sorts first on the Services listing page
-- (see gcr-api-clean commit adding a featured-pinned-first tiebreak to the
-- default ranking; featured was true for 0 entities platform-wide before this,
-- so the new tiebreak doesn't reorder any other business's listing page).
UPDATE entity SET featured = true, price_from = 50 WHERE slug = 'gulf-coast-luggo';

-- 008: Kayak/paddleboard rental businesses miscategorized under the generic
-- entity_subtype='service' (entity_type='service') bucket, which routes them
-- to the catch-all Services listing page instead of Things To Do — where
-- every other kayak-rental business (gulf-shores-kayak-rental,
-- coastal-kayak-rentals-southern-alabama, etc., entity_type='activity',
-- entity_subtype='kayak_rental') actually lives. Found live, 2026-07-11:
-- toggling the "Kayak Rental" filter chip on Things To Do silently excluded
-- these 9 real businesses because they were never on that page to begin with.
-- Reclassified to match the existing, correct kayak_rental pattern.
UPDATE entity SET entity_type='activity', entity_subtype='kayak_rental'
WHERE slug IN (
  'perdido-beach-service','dauphin-island-sup-and-kayak-rentals-DfjUyQ','gulf-shores-kayak-rentals',
  'island-life-kayak-and-paddle-board-rentals','littleheads-kayak-rentals','surfs-up-board-kayak-rentals',
  'gulfkayakrentals','paddled-by-you-kayak-stand-up-paddle-board-rentals','coyote-beach-sports'
);

-- 009: Tradewinds (a standalone beachfront condo complex, 24568 Perdido Beach
-- Blvd) had parent_entity_slug='zeke-s-landing-and-marina' -- a 54-child
-- fishing-charter/marina hub it has nothing to do with. Found live while
-- checking whether Zeke's Landing (Things To Do) was showing correct,
-- fully-broken-down data for each of its real children (49 charter boats +
-- 3 restaurants + 1 service). Un-linking restores Tradewinds as its own
-- independent Staying listing instead of being buried, undiscoverable,
-- inside an unrelated marina's directory.
UPDATE entity SET parent_entity_slug = NULL
WHERE slug='tradewinds' AND parent_entity_slug='zeke-s-landing-and-marina';

-- 010: Root-cause pass on the generic entity_type/entity_subtype='service'
-- bucket (114 active rows) -- the same "everything unclassifiable defaults
-- to generic service" import behavior that produced the kayak-rental bug
-- (008) also swallowed boat-rental, jet-ski, sailing/cruise, and bike-rental
-- businesses, and 2 standalone marinas. Reclassified with clear name/tag
-- evidence (left ambiguous names like "Beach Power Rentals" untouched
-- rather than guess). Real estate agents, photographers, and wedding
-- planners in the same bucket were left alone -- their current subtype
-- already routes them to the correct page (services), this was purely a
-- routing bug for the water/bike-rental and marina cases.
UPDATE entity SET entity_type='activity', entity_subtype='jet_ski'
  WHERE slug IN ('a2z-powersport','alabama-extreme-watersports','wave-jet-ski-rental');
UPDATE entity SET entity_type='activity', entity_subtype='watersports'
  WHERE slug IN ('captain-rons-watersports-llc-iWqF_g','ob-watersports','wahoo-watersports');
UPDATE entity SET entity_type='activity', entity_subtype='boat_rental'
  WHERE slug IN ('bay-side-boat-rental-llc','beachside-circle-boat-rentals-and-sales','cast-or-cruise-boat-rentals',
    'gulf-coast-boat-rentals','island-cruizer-boat-rentals','orange-beach-boat-rentals','orange-beach-pontoon-boats',
    'orange-beach-pontoons','pelican-boat-rentals','pontoon-boat-rentals-hudson-marina','salty-escapes-boat-rental');
UPDATE entity SET entity_type='activity', entity_subtype='sailing_charter' WHERE slug='key-sailing-iKHhJ0';
UPDATE entity SET entity_type='activity', entity_subtype='sunset_cruise' WHERE slug IN ('get-it-going-tiki-ride','zeke-s-tiki-queen');
UPDATE entity SET entity_type='activity', entity_subtype='bike_rental'
  WHERE slug IN ('beach-bike-rentals','e-bikes-boards','ebike-the-park','gulf-shores-bike-rentals','ike-s-bikes','ike-s-bikes-at-gulf-state-park','paradise-pedal-llc');
UPDATE entity SET entity_type='activity', entity_subtype='marina'
  WHERE slug IN ('dolphin-cove-marina-gulf-shores-al','flora-bama-marina-watersports');

-- 011: Re-linked businesses to the marina they actually operate at, evidenced
-- by their own tags/name (e.g. a2z-powersport's tags literally say "zekes
-- landing"). Same root cause as 009 -- real affiliations that were simply
-- never captured as parent_entity_slug during import.
UPDATE entity SET parent_entity_slug='zeke-s-landing-and-marina' WHERE slug='a2z-powersport';
UPDATE entity SET parent_entity_slug='bear-point-harbor' WHERE slug='alabama-extreme-watersports';
UPDATE entity SET parent_entity_slug='happy-harbor-marina-dry-storage' WHERE slug='southern-rose-dolphin-cruises';
UPDATE entity SET parent_entity_slug='hudson-marina' WHERE slug='pontoon-boat-rentals-hudson-marina';
-- The Wharf Marina is the real boat-slip facility inside The Wharf complex
-- (its own 4.6-star/285-review rating -- not a duplicate row) but was
-- floating as an unrelated top-level "marina" hub with 0 children instead
-- of nested inside `the-wharf`, which already correctly holds all 162
-- other Wharf businesses (shops, restaurants, the amphitheater, etc.).
UPDATE entity SET parent_entity_slug='the-wharf' WHERE slug='the-wharf-marina';

-- 012: Same generic-subtype root cause found one level deeper -- dolphin
-- cruise businesses were scattered across entity_subtype IN
-- (dolphin_cruise, tour_agency, tourist_attraction, null), which would have
-- silently broken a "who has dolphin cruises" search/filter. Normalized to
-- dolphin_cruise using each business's own name as evidence.
UPDATE entity SET entity_subtype='dolphin_cruise' WHERE slug IN (
  '29-dolphin-cruise','alabama-dolphin-cruises-southern-rose','bama-breeze-dolphin-cruise',
  'best-dolphin-cruise-on-perdido-key','cetacean-dolphin-cruises-and-sailing-tours',
  'cruise-orange-beach-dolphin-cruises','dolphin-sailing-tours-by-cetacean-cruises',
  'dolphin-cruises-cold-mil-fleet','dolphin-cruises-aboard-cruise-orange-beach',
  'dolphin-cruises-aboard-dolphin-tales','dolphin-cruises-aboard-the-cold-mil-fleet',
  'dolphin-cruises-and-island-tours-at-hudson-marina-orange-beach','dolphins-down-under',
  'orange-beach-private-family-dolphin-tours-boating-safaris',
  'snorkeling-and-dolphin-tours-orange-beach-island-tours',
  'sunny-lady-dolphin-cruises-at-the-wharf','surf-s-up-dolphin-cruises',
  'the-fun-boats-dolphin-cruise','the-fun-boats-dolphin-cruises',
  'the-fun-boats-dolphin-cruises-and-sea-life-experience','dolphin-and-sunset-cruises'
) AND is_active=true;
UPDATE entity SET parent_entity_slug='hudson-marina'
  WHERE slug='dolphin-cruises-and-island-tours-at-hudson-marina-orange-beach' AND parent_entity_slug IS NULL;
UPDATE entity SET entity_type='activity', entity_subtype='sailing_charter'
  WHERE slug='wild-hearts-sailing-adventures';

-- 013: Added a real search_businesses tool to the AI concierge chat
-- (gcr-api-clean/routes/tourist.js) -- see that repo's commit. The chat's
-- only data source was a static top-200-by-rating/distance context dump, so
-- it could not reliably answer "who has X" questions or find a business
-- outside that slice. The new tool queries `entity`/`entity_tags` live and
-- returns each match's parent hub (marina, complex, tour operator, etc.).

-- 014: Availability tracking foundation. business_availability already existed
-- (0 rows -- unused scaffolding, along with entity_availability/availability/
-- availability_blocks, which are equally empty and left untouched) and
-- already had exactly the columns this needed (source_platform,
-- last_minute_deal/last_minute_price/original_price, last_updated) -- reused
-- it rather than adding a 5th availability table.
ALTER TABLE business_availability ADD COLUMN IF NOT EXISTS visible_on_profile boolean NOT NULL DEFAULT true;
-- Admin GET/PUT endpoints added in gcr-api-clean/routes/admin.js; public
-- read wired into gcr.js's /entities listing + buildFullEntity; setting low
-- spots or a last-minute price auto-syncs a row into the already-live
-- gcr_deals table (deal_type='last_minute', source='availability_sync') so
-- it shows on /deals with no extra work -- gcr_deals and its /deals page
-- +/api/deals/* endpoints were themselves already fully built but sitting on
-- 0 rows, same pattern as everything else found empty-but-scaffolded this
-- session (rag-index, the other 3 availability tables).

-- 015: Two verified bugs found during a full-codebase re-read, fixed in
-- gcr-api-clean/routes/tourist.js:
--   a) The AI chat's static top-200 context select was missing `id`, so its
--      entity_id -> slug map was always empty and pricing_items/
--      whats_included could never attach to any business in the prompt
--      (everything keyed directly by entity_slug was unaffected).
--   b) GET /api/tourist/recommendations queried tourist_profiles on a
--      tourist_id column that doesn't exist (real column is user_id),
--      so seen_slugs/interests always came back null.
-- Also fixed in gcr-unified/src/components/GCRCard.jsx: the save button
-- passed only the bare entity to onSave, so AppContext's business.category
-- (written into tourist_saves/tourist_swipe_events) was always null --
-- entity has no category column, and the page-level category prop that
-- GCRCard receives was never merged in before the save.
