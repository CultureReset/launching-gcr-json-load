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

-- 016: Specials/discounts were structurally restaurant-only (buildFullEntity
-- only fetched entity_specials inside its isFood conditional), even though
-- the table is just entity_slug-keyed and a discount applies to any
-- business (a condo's last-minute rate, a discounted dolphin cruise seat).
-- Moved to the always-fetched core query set (gcr-api-clean/routes/gcr.js).
-- Also fixed the shared renderMenuItem (BusinessDetail.jsx) and
-- RestaurantMenu.jsx's separate specials tab (reads /api/public/menu,
-- routes/public.js) -- both only knew the menu-item shape (item_name/price)
-- and rendered entity_specials rows (special_name/discount_type/
-- discount_value/discount_text/days) blank. Also added the missing
-- is_active filter to /api/public/menu's specials query for consistency.
-- Plus two small confirmed bugs: BusinessDetail's fallback Reserve button
-- always read "Reserve a Table" instead of the already-computed
-- reserveLabel; the Fish Species tab was missing the ref/id every other
-- tab-nav section has, so clicking it did nothing.

-- 017: User-supplied "Wharf enriched business pages" data audit (2026-07-11).
-- Cross-checked all ~150 named businesses/pages against the existing
-- the-wharf hub children. Verdict: this data was already substantially
-- imported in an earlier pass -- e.g. Alabama Sweet Tea Company's upload
-- listed exactly 16 menu items, and the DB already has exactly 16; Ginny
-- Lane (110), Villaggio Grille (92), Tee Off (67) etc. already have menu
-- data at or above what's in this upload. Only checked, real gap: 13
-- Wharf children had no description. Of those, 12 only had generic
-- placeholder boilerplate in the upload ("X is listed by The Wharf under Y.
-- Create this as an individual platform page...") -- literally an
-- instruction to a downstream import process, not real business copy --
-- and were left alone rather than importing that as if it were marketing
-- text. Only one (the-wharf-store) had an actual real summary.
UPDATE entity SET description = 'Coastal inspired apparel and exclusive Wharf-branded merchandise.'
WHERE slug='the-wharf-store' AND description IS NULL;

-- 018: Condo/resort data audit (2026-07-11), per user request to focus on
-- condos, merge/backfill, never delete.
--   * Cross-checked all 17 records in the user's "Liquid Life" JSON upload
--     against the DB, verifying not just counts but exact tag text (e.g.
--     Beachcomber's single amenity tag is literally "Beach Access (Across
--     the Street)", Grand Pointe's 7 tags match verbatim). Every one of the
--     17 was already imported, verbatim, in an earlier pass. Nothing to add.
--   * The user's other upload (24 Phoenix-family + Caribe/Plantation/
--     Windemere/Lagoon/Colonnades/Seaside/Surfside/Turquoise/Dunes/San
--     Carlos condo JSON files) is low quality: 0 real FAQs across all 24
--     files, and several "about" fields are pure page-chrome/footer text
--     ("Job Opportunities / Office Locations / Contact / Owners Portal /
--     Facebook Link ... © Brett-Robinson. All Rights Reserved"). Not
--     imported as new content.
--   * BUT checking that same junk text against the live DB surfaced a real,
--     previously-undetected bug: 6 entities already had that exact same
--     nav/footer chrome sitting in their live `description` field from an
--     earlier scrape -- caribe-resort, phoenix-all-suites-hotel,
--     summerchase-orange-beach, seaside-beach-racquet,
--     windemere-orange-beach, plantation-dunes. Cleared to NULL (no real
--     replacement description available from either upload) rather than
--     leave scraper chrome live on a business's real page.
UPDATE entity SET description = NULL
WHERE slug IN ('caribe-resort','phoenix-all-suites-hotel','summerchase-orange-beach','seaside-beach-racquet','windemere-orange-beach','plantation-dunes');

--   * Fixed a UTF-8 mojibake encoding bug in san-carlos's description
--     ("thereï¿½s" -> "there's") -- isolated to this one row, checked
--     platform-wide for the same corruption pattern, no other matches.
UPDATE entity SET description = replace(description, 'ï¿½', E'’')
WHERE slug='san-carlos';

-- 019: Smart search improvements. Enabled pg_trgm and added a fuzzy fallback
-- function so a near-miss/typo search doesn't just return zero results (see
-- gcr-api-clean/routes/gcr.js POST /api/gcr/search — falls back to this when
-- the exact ILIKE pass finds nothing). Also blended distance into relevance
-- ranking (bounded, doesn't override a real name/feature match) and added an
-- optional radius filter, both wired up in gcr-unified/src/pages/Search.jsx.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION fuzzy_entity_search(search_term text, match_limit int DEFAULT 20)
RETURNS TABLE(slug text, similarity real) AS $$
  SELECT e.slug, similarity(e.name, search_term) AS similarity
  FROM entity e
  WHERE e.is_active = true
    AND similarity(e.name, search_term) > 0.2
  ORDER BY similarity DESC
  LIMIT match_limit;
$$ LANGUAGE sql STABLE;

-- 020: Condo photo-gap backfill from user's "restored 63-record" master condo
-- JSON (2026-07-11). Cross-checked all ~35 not-yet-verified names from this
-- file against entity_photos, diffing each resort's real image_urls against
-- what's already stored (not just a count check) to avoid inserting
-- duplicates. 12 resorts had a genuine, verified gap: the file listed
-- meaningfully more real photo URLs than the DB had. Inserted only the new
-- URLs (existing liquidlifevacationrentals.icnd-cdn.com CDN pass-through
-- URLs, same pattern already used by this platform's other entity_photos
-- rows -- not re-hosted), with sort_order starting at 100 to sit after each
-- resort's existing photos rather than colliding with them. 204 rows total:
-- gulf-shores-plantation (+43), island-royale (+12), island-shores (+14),
-- lost-key (+12), marlin-key (+3), ocean-house (+8), palacio (+17),
-- perdido-skye (+12), phoenix-gulf-towers-ii (+51), phoenix-on-the-bay-i (+7),
-- plantation-palms (+14), regency-isle (+11). Verified post-insert via a
-- per-slug COUNT that each number lands exactly.
--
-- Every other name checked from this file (Harbour Place, Palm Beach,
-- Pelican Pointe, Gulf Shores Surf and Racquet, etc.) already matched the DB
-- on both photo count and amenity text -- nothing else to add. INSERT
-- statement itself lives in this session's local scratch file
-- (/tmp/photo_insert.sql) since it's 204 literal rows; recorded here as the
-- audit-trail entry for what was applied directly via Supabase execute_sql.

-- 021: Coyote Beach Sports (coyote-beach-sports) gap-fill from the user's
-- own uploaded replica of the business's real site (coyotebeachsportsal.com),
-- 2026-07-11. The entity already had solid coverage (FAQs, 10 pricing_items,
-- 5 sections, 5 reviews all matched the source page verbatim) -- these were
-- the genuine, verified gaps:
--   * entity_tags only had "Kayaking" as a category tag despite Slingshots
--     being the business's own stated hero product across 6 rental
--     categories -- added Slingshot/E-Bike/Beach Bike/Paddleboard & Surfboard/
--     Beach Gear Rentals as category tags (entity_subtype stays kayak_rental;
--     CategoryPage.jsx's filter chip is single-subtype-only, so which one
--     category "wins" the chip is a product call, not something to force here).
--   * pricing_items was missing "Trikes & Tandem Bikes -- $25/hour", listed
--     in the source page's rate table alongside the other 6 rates already in the DB.
--   * entity.known_for / price_from / price_unit / deposit_amount /
--     deposit_type / waiver_required / waiver_text / cancellation_policy /
--     refund_policy were all null despite the source page stating them
--     explicitly ($300 Slingshot deposit + renter's insurance, no-cash-refund
--     policy, weather-cancellation refund/credit policy).
--   * entity_photos had only 3 (already re-hosted on Supabase storage);
--     added 17 more real photo URLs from the business's own site
--     (coyotebeachsportsal.com/site-photos/...), pass-through hosted like the
--     condo CDN photos in 020, sort_order 101-117.
--   * No section captured the founding story ("began in 2013... grew from
--     scooter and moped rentals...") or its quote -- added as a new
--     entity_sections row (section_type='highlights', "Our Story").
INSERT INTO entity_tags (entity_slug, tag_name, tag_category)
SELECT 'coyote-beach-sports', v, 'category' FROM (VALUES
  ('Slingshot Rentals'), ('E-Bike Rentals'), ('Beach Bike Rentals'), ('Paddleboard & Surfboard Rentals'), ('Beach Gear Rentals')
) AS v(v)
WHERE NOT EXISTS (SELECT 1 FROM entity_tags t WHERE t.entity_slug='coyote-beach-sports' AND t.tag_name=v.v);

INSERT INTO pricing_items (entity_slug, entity_id, item_name, tier_name, description, price, price_from, sort_order)
SELECT 'coyote-beach-sports', id, 'Trikes & Tandem Bikes', 'Trikes & Tandem Bikes', 'Trikes and tandem bikes for riding together.', 25.00, 25.00, 11
FROM entity WHERE slug='coyote-beach-sports'
AND NOT EXISTS (SELECT 1 FROM pricing_items WHERE entity_slug='coyote-beach-sports' AND item_name='Trikes & Tandem Bikes');

UPDATE entity SET
  known_for = ARRAY['Polaris Slingshot Rentals'],
  price_from = 15,
  price_unit = 'per rental',
  deposit_amount = 300,
  deposit_type = 'fixed',
  waiver_required = true,
  waiver_text = 'Slingshot rentals require a $300 deposit and renter''s insurance.',
  cancellation_policy = 'No cash refunds; cancellations receive a time credit.',
  refund_policy = 'Weather cancellations receive a full refund or time credit, minus a processing fee.'
WHERE slug='coyote-beach-sports';

INSERT INTO entity_photos (entity_slug, url, sort_order)
SELECT 'coyote-beach-sports', v, 100 + row_number() OVER () FROM (VALUES
  ('https://www.coyotebeachsportsal.com/site-photos/endshop.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/surfboard-sign.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/slingshots-lineup.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/ebikes-row.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/beach-bikes.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/kayak.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/surf.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/gear.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/hero-slingshot.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/slingshot-orange.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/slingshot-blue.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/slingshot-neon.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/coyote-art.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/slingshot-close.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/ebikes-fleet.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/slingshot-front.jpg'),
  ('https://www.coyotebeachsportsal.com/site-photos/fleet-overview.jpg')
) AS v(v)
WHERE NOT EXISTS (SELECT 1 FROM entity_photos p WHERE p.entity_slug='coyote-beach-sports' AND p.url=v.v);

INSERT INTO entity_sections (entity_slug, section_type, section_name, subtitle, sort_order, is_active)
SELECT 'coyote-beach-sports', 'highlights', 'Our Story',
  'Born on Dauphin Island. Built for the Gulf Coast. Coyote Beach Sports began in 2013 and grew from scooter and moped rentals into a Gulf Shores outfitter for Slingshots, e-bikes, beach bikes, paddleboards, surfboards, kayaks, and beach gear. "Chase the sun, cruise the coast, and make the beach day more memorable."',
  5, true
WHERE NOT EXISTS (SELECT 1 FROM entity_sections WHERE entity_slug='coyote-beach-sports' AND section_name='Our Story');

-- 022: User uploaded 5 new "Gulf Shores deep crawl" packs (batch1: 17 restaurant
-- profiles, batch3: 15 restaurant/charter profiles, batch4: repeat of the
-- already-imported Wharf batch, plus two shallow directory packs). Explicit
-- instruction: check for existing businesses first -- do NOT create duplicate
-- entity rows; only add data to businesses already in the system.
--
-- Cross-checked all 32 batch1+batch3 business names against `entity` by exact
-- phone-digit match first, then trigram name similarity as fallback. Result:
-- ALL 32 already exist in the DB (zero net-new businesses). This check itself
-- surfaced 2 pre-existing duplicate-row groups worth flagging for the still-
-- open duplicate-consolidation task (not touched here, no deletes):
--   * Agave Bar & Grill / Agave Mexican Restaurant -- same phone (251) 948-0550.
--   * The Hangout / The Hangout Gulf Shores / The Hangout Restaurant -- same
--     phone (251) 948-3030, three rows.
-- (Doc's Seafood Shack & Oyster Bar / Doc's Seafood Shack and Oyster Bar also
-- duplicate each other, same phone (251) 981-6999 -- unrelated business from
-- the one this batch matched, Doc's Seafood and Steaks.)
--
-- Of the 32 confirmed-existing businesses, most already had this exact data
-- imported in earlier passes (menu item counts matched the source file
-- count almost exactly, e.g. Fruitful/Doc's Seafood and Steaks). Real,
-- verified content gaps (target row had 0 rows in the relevant table before
-- this insert):
--   * Lucy Buffett's LuLu's -- 0 happy_hour rows despite a real, priced
--     9-item happy hour menu ($3-$6, drinks/apps) on the source page.
--   * Nami Sushi, Poke Bowl Sushi Burrito & Boba, New Orleans Original
--     Snoballs, Perdido Beach Pizza Company, Pub 6, The Hideaway -- 0
--     menu_items each despite each having real (if price-less, directory-
--     sourced) menu category data.
--   * The Hideaway also had a real "10% off with Spectrum Wristband"
--     discount not captured anywhere -- added to entity_specials.
--   * New Orleans Original Snoballs' cash/Venmo/Cash-App-only, no-cards
--     policy -- added as an entity_sections policies note.
--   * 4 Seasons Outfitters, Action Charter Service, Charter Boat Annie Girl --
--     0 pricing_items despite real, exact trip prices being available
--     ($140/person walk-on trip up to $9,270 for Annie Girl's 44-hour
--     charter). Added as pricing_items, matching the pattern already used
--     for Coyote Beach Sports.
--   * Addicted 2 Fishing Charters, Alabama Deep Sea Fishing -- 0 offerings
--     despite having real (price-less) service descriptions -- added as
--     offerings, matching A Pair A Dice Charter's existing row shape.
-- Skipped as not a good fit / too thin to be worth forcing in: Bar 45's 3
-- items (game room, weekly entertainment, happy-hour-starts-3pm -- already
-- has 8 amenities + 45 tags covering this) and Perdido Beach Pizza's
-- "temporarily closed" note (entity.business_status was already correctly
-- set to CLOSED_TEMPORARILY -- already known, not a gap).
--
-- The two shallow directory packs (gulfshores_restaurant_dining_data_pack,
-- 125 listings; gulfshores_water_activities_data_pack, 176 listings) were
-- not processed this pass -- directory-card data (name/area/one-line blurb/
-- category), best used to hunt for businesses genuinely missing from the
-- platform rather than to enrich existing ones. Left for a follow-up pass.

-- 023: Followed up on the 3 duplicate-row groups flagged in 022. Per request,
-- checked each for real, non-overlapping data before touching anything --
-- no rows deleted or merged/deactivated, only real content copied onto
-- whichever row in each group is the actual Google-verified / most-complete
-- one (has a google_place_id and/or the most real content), since that's the
-- row a filter/search page actually surfaces.
--   * Agave Bar & Grill / Agave Mexican Restaurant (same phone): the second
--     row's description was a literal placeholder ("Mexican restaurant
--     listing from main directory page 2") with 0 photos/menu/reviews --
--     nothing there worth keeping EXCEPT 8 real amenities (wheelchair
--     accessible, kids menu, outdoor pet-friendly dining, takeout, group
--     friendly, etc.) that the canonical row (agave-bar-grill, has a
--     google_place_id, 26 photos, 5 reviews) didn't have. Copied those 8
--     amenities over.
--   * Doc's Seafood Shack & Oyster Bar / Doc's Seafood Shack and Oyster Bar
--     (same phone): docs-seafood-shack-and-oyster-bar (no hyphen) is the
--     real one (google_place_id, 38 menu items, 62 tags, 5 reviews); the
--     hyphenated duplicate is thin on structured data but had two real facts
--     missing from the canonical row's copy -- the tagline "The Best Fried
--     Shrimp In The Entire Civilized World!" (added as subtitle) and the
--     Fox News "Top 10 Seafood Shacks in America" accolade (appended to
--     description).
--   * The Hangout / The Hangout Gulf Shores / The Hangout Restaurant (same
--     phone, 3 rows) -- the messiest of the three. "the-hangout" is the only
--     one with a google_place_id and real Google data (4.6 rating, 31,728
--     reviews), but it had a ONE-LINE description, no subtitle, 0 menu
--     items, and its hero_image_url was flat-out wrong -- pointed at a
--     different business's photo folder ("gone-coastal-gulf-shores"), a
--     real display bug independent of the duplicate-row issue. Meanwhile
--     "the-hangout-gulf-shores" (a batch1 deep-crawl import target, no
--     google_place_id) had the real, detailed official-site description,
--     subtitle ("Where 59 ends and the fun begins"), all 37 real menu items,
--     and a correctly-pathed hero photo; "the-hangout-restaurant" had yet a
--     third unique description (the antique matchbox car / PEZ dispenser /
--     rubber duckies / One Stop Fun Shop details -- real, not fabricated,
--     just never consolidated) but its 8 photos are Instagram CDN URLs,
--     which expire and were not copied over for that reason.
--     Fixed the canonical "the-hangout" row: adopted the-hangout-gulf-
--     shores's description/subtitle/hero photo, copied over its 37 menu
--     items (7 sections) and 2 stable photos, and added the-hangout-
--     restaurant's unique amenity content as a new "Beyond the Menu"
--     entity_sections entry rather than losing it.
-- The underlying duplicate ROWS still exist (no deletes) -- this only makes
-- sure the one row actually surfaced by search/category pages has all the
-- real data instead of a thin stub. Full consolidation (deciding whether to
-- deactivate the leftover duplicate rows) is still the separate, larger,
-- not-yet-approved task (#15 on the open punch list).
INSERT INTO entity_amenities (entity_slug, amenity, category)
SELECT 'agave-bar-grill', a.amenity, a.category
FROM entity_amenities a WHERE a.entity_slug='agave-mexican-restaurant'
AND NOT EXISTS (SELECT 1 FROM entity_amenities x WHERE x.entity_slug='agave-bar-grill' AND x.amenity=a.amenity);

UPDATE entity SET subtitle = 'The Best Fried Shrimp In The Entire Civilized World!'
WHERE slug='docs-seafood-shack-and-oyster-bar' AND subtitle IS NULL;

UPDATE entity SET description = description || ' Voted "Top 10" Seafood Shacks in America by Fox News.'
WHERE slug='docs-seafood-shack-and-oyster-bar' AND description NOT ILIKE '%Top 10%';

UPDATE entity SET
  description = 'The Hangout is the ultimate beachfront destination for family-friendly fun, live entertainment, and unforgettable beachside dining. Located in Gulf Shores, Alabama, we offer direct beach access, free live music, hourly foam parties, and a vibrant party atmosphere. Our menu features Gulf Coast-inspired cuisine including famous seafood boils, the Lifeguard Burger, crispy calamari, and handcrafted cocktails. We are proudly pet-friendly and designed for guests of all ages, from kids to grandparents, locals to visitors, and four-legged friends. With prime beachfront location, open-air dining spaces, ample seating, and convenient parking for team buses, The Hangout is perfect for large groups, sports teams, family gatherings, and private events.',
  subtitle = 'Where 59 ends and the fun begins',
  hero_image_url = 'https://mkepugvdlktfsossumox.supabase.co/storage/v1/object/public/entity-photos/the-hangout-gulf-shores/photo_01.jpg'
WHERE slug='the-hangout';

INSERT INTO entity_photos (entity_slug, url, sort_order)
SELECT 'the-hangout', p.url, 100 + row_number() OVER ()
FROM entity_photos p WHERE p.entity_slug='the-hangout-gulf-shores'
AND NOT EXISTS (SELECT 1 FROM entity_photos x WHERE x.entity_slug='the-hangout' AND x.url=p.url);

INSERT INTO menu_sections (entity_slug, section_name, sort_order, is_active)
SELECT 'the-hangout', v.section_name, v.sort_order, true FROM (VALUES
  ('appetizers',1),('Gulf Coast Favorites',2),('entrees',3),('Burgers/Sandwiches',4),('burgers',5),('Drinks',6)
) AS v(section_name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM menu_sections ms WHERE ms.entity_slug='the-hangout' AND ms.section_name=v.section_name);

INSERT INTO menu_items (entity_slug, section_id, item_name, description, sort_order)
SELECT 'the-hangout', ts.id, src.item_name, src.description, src.sort_order
FROM menu_items src
JOIN menu_sections ss ON ss.id = src.section_id AND ss.entity_slug='the-hangout-gulf-shores'
JOIN menu_sections ts ON ts.entity_slug='the-hangout' AND ts.section_name = ss.section_name
WHERE src.entity_slug='the-hangout-gulf-shores'
AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.entity_slug='the-hangout' AND mi.item_name=src.item_name);

INSERT INTO entity_sections (entity_slug, section_type, section_name, subtitle, sort_order, is_active)
SELECT 'the-hangout', 'highlights', 'Beyond the Menu',
  'Continuous family fun beyond dining: free foam parties every hour, yard games, hair braiding, temporary tattoos, gelato, ring toss, photo ops, and a fire pit. The venue also displays unique collections of antique matchbox cars, PEZ dispensers, vintage lunch boxes, and rubber duckies, plus a One Stop Fun Shop for souvenirs, beachwear, hats, and gifts.',
  10, true
WHERE NOT EXISTS (SELECT 1 FROM entity_sections WHERE entity_slug='the-hangout' AND section_name='Beyond the Menu');

-- 024: The 8 photos skipped in 023 for The Hangout Restaurant were Instagram
-- CDN URLs (scontent-*.cdninstagram.com) -- signed, expiring links, not safe
-- to store directly in entity_photos. Added a reusable endpoint,
-- POST /api/admin/gcr/rehost-photos (gcr-api-clean/routes/admin.js, next to
-- the existing /repair-photos Google-Places healer), that downloads a given
-- external URL server-side and re-uploads it into our own entity-photos
-- storage bucket, then writes the entity_photos row against the new
-- permanent Supabase URL. Could not run it against these specific 8 URLs
-- from this session -- the sandbox's outbound network policy blocks
-- cdninstagram.com outright (confirmed via the proxy's own status log: a
-- policy-level 403 on the CONNECT tunnel, not a transient failure). The live
-- API server has normal internet egress, so this needs to be triggered from
-- there (or a follow-up session with production access) -- and soon, since
-- Instagram's signed CDN links typically expire within hours to a few days,
-- so these 8 specific URLs may already be dead by the time this runs.

-- 025: Root-cause fix for the duplicate-entity-row problem (021-023 were
-- symptom fixes for 3 specific groups; this is the actual mechanism).
-- Investigated why: every write path that creates a new `entity` row
-- (deep-crawl extraction, CSV import, self-serve dashboard signup,
-- menu-editor signup) only checked for an existing business by exact
-- name/slug string match before inserting. Any naming variation across
-- sources ("The Hangout" vs "The Hangout Gulf Shores" vs "The Hangout
-- Restaurant"; "Doc's Seafood Shack & Oyster Bar" vs "... and Oyster Bar")
-- defeated that check and silently created a fresh duplicate row instead of
-- updating the real one -- exactly the mechanism behind the 3 groups fixed
-- in 023.
--
-- Added find_existing_entity(p_phone, p_google_place_id) -- matches only on
-- identifiers safe to auto-act on (exact Google Place ID or exact phone
-- number, normalized to digits). Deliberately does NOT auto-merge on fuzzy
-- name similarity alone -- different real businesses can have superficially
-- similar names ("Action Charter Service" vs "Dottie Jo Charter Service"),
-- and a wrong auto-merge would silently misattribute data to the wrong live
-- business page, which is worse than the duplicate it would "fix". A fuzzy
-- near-miss is only ever logged as an advisory warning for manual review.
--
-- Wired into gcr-api-clean:
--   * routes/gcr/deep-crawl.js -- phone match before minting a new slug.
--   * routes/admin.js CSV import (import-section-based) -- phone match as a
--     fallback when the existing name+address check finds nothing.
--   * routes/platform.js self-serve dashboard signup -- if an unclaimed
--     existing entity is found by phone, the new owner is attached to that
--     real profile instead of an empty duplicate being created (also fixes
--     a real product gap: a legitimate owner signing up used to get a blank
--     page instead of their already-scraped profile).
--   * routes/menu-editor.js signup -- this form collects no phone/place id,
--     so the safest available improvement is blocking an exact-name
--     collision with a clear 409 error instead of silently minting a "-2"
--     slug.
-- Deliberately NOT touched: the 4 one-off historical import scripts
-- (import-the-wharf.js, import-cobalt.js, import-3-new-venues.js,
-- import-activity-listings.js) -- each already ran once and isn't part of
-- any recurring pipeline, so they're not creating new duplicates going
-- forward; lower priority than the 4 live paths above.
--
-- Also hardened the frontend as a safety net: gcr-unified's
-- CategoryListings.jsx and Landing.jsx's homepage rails had NO name-based
-- entity dedup at all (CategoryPage.jsx and RentalListings.jsx/
-- ServiceListings.jsx already did) -- a duplicate business would render as
-- two separate cards. Applied the same dedup rule everywhere so all listing
-- surfaces agree on which of a duplicate pair to show.
CREATE OR REPLACE FUNCTION find_existing_entity(
  p_phone text DEFAULT NULL,
  p_google_place_id text DEFAULT NULL
) RETURNS TABLE(slug text, id uuid, match_type text) AS $$
DECLARE
  v_phone_digits text := regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g');
BEGIN
  IF p_google_place_id IS NOT NULL THEN
    RETURN QUERY SELECT e.slug, e.id, 'google_place_id'::text
    FROM entity e WHERE e.google_place_id = p_google_place_id LIMIT 1;
    IF FOUND THEN RETURN; END IF;
  END IF;

  IF length(v_phone_digits) >= 7 THEN
    RETURN QUERY SELECT e.slug, e.id, 'phone'::text
    FROM entity e
    WHERE e.phone IS NOT NULL
      AND regexp_replace(e.phone, '[^0-9]', '', 'g') LIKE '%' || right(v_phone_digits, 10)
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- 026: User asked to double-check for real data under the-hangout-gulf-shores
-- / the-hangout-restaurant before any deactivation, since 023's merge only
-- checked menu_items/photos/hours/tags/reviews/sections/amenities by name --
-- not a systematic sweep. Ran a full scan across all 116 tables in this DB
-- that have an entity_slug column. Found two real gaps 023 missed:
--   * entity_events: 20 real live-music events (band name, date, start
--     time) sitting on the-hangout-restaurant, completely absent from the
--     canonical the-hangout row. Copied over (deduped by event_name + date).
--   * entity_tags: 18 net-new curated tags (Beach Activities, Casual
--     Dining, Family Fun, Group Dining, Live Music, Outdoor Activities, Pet
--     Friendly, Waterfront Dining, Bars, Beach Restaurants, Entertainment,
--     Family Dining, Nightlife, etc.) across both duplicate rows that
--     the-hangout didn't have at all -- it only had raw Google-type tags,
--     no curated category tags. Copied over (excluding raw google_type/
--     google_primary_type rows already present, deduped by tag_name).
-- Re-scanned after the copy: everything else on the two duplicate rows is
-- either already covered on the-hangout (entity_hours: 7 rows already of
-- its own) or genuinely inert (entity_modules: generic feature-toggle
-- config, enabled=true with no custom settings, not user-facing content).
-- The only thing still not carried over is the-hangout-restaurant's 8
-- Instagram-hosted photos -- already a known, separately-tracked issue (024,
-- the rehost-photos endpoint) rather than something lost by this pass.
INSERT INTO entity_events (entity_slug, entity_name, event_name, description, event_date, start_time, end_time, day_of_week, recurring, artist_id, artist_name, cover_charge, is_active, image_url, image_path, event_type)
SELECT 'the-hangout', 'The Hangout', event_name, description, event_date, start_time, end_time, day_of_week, recurring, artist_id, artist_name, cover_charge, is_active, image_url, image_path, event_type
FROM entity_events src
WHERE src.entity_slug='the-hangout-restaurant'
AND NOT EXISTS (
  SELECT 1 FROM entity_events x
  WHERE x.entity_slug='the-hangout' AND x.event_name=src.event_name
    AND (x.event_date IS NOT DISTINCT FROM src.event_date)
);

INSERT INTO entity_tags (entity_slug, tag_name, tag_category)
SELECT 'the-hangout', a.tag_name, a.tag_category
FROM entity_tags a
WHERE a.entity_slug IN ('the-hangout-gulf-shores','the-hangout-restaurant')
  AND a.tag_category NOT IN ('google_type','google_primary_type')
  AND NOT EXISTS (SELECT 1 FROM entity_tags x WHERE x.entity_slug='the-hangout' AND x.tag_name=a.tag_name)
GROUP BY a.tag_name, a.tag_category;

-- 027: Before deactivating the Agave/Doc's Seafood duplicate rows (per 026's
-- pattern for the Hangout group), ran the same full 116-table scan against
-- agave-mexican-restaurant and doc-s-seafood-shack-and-oyster-bar. Found two
-- more real gaps 023 missed:
--   * agave-mexican-restaurant had a real entity_specials row ("Happy Hour"
--     -- "Full bar with happy hour specials and weekly deals") never copied
--     to the canonical agave-bar-grill. Copied over.
--   * doc-s-seafood-shack-and-oyster-bar had 2 photos already properly
--     re-hosted on our own storage (not a third-party link) that were never
--     copied to the canonical docs-seafood-shack-and-oyster-bar. Copied over.
-- Also found on agave-mexican-restaurant: 2 menu_sections ("Street Tacos",
-- "Tableside Guacamole") with zero menu_items under them -- empty shells
-- from a partial import, nothing to lose by leaving them behind.
-- entity_modules on both is the same inert feature-toggle config as 026.
INSERT INTO entity_specials (entity_slug, special_name, description, discount_type, discount_value, discount_text, days, day_of_week, start_time, end_time, is_active)
SELECT 'agave-bar-grill', special_name, description, discount_type, discount_value, discount_text, days, day_of_week, start_time, end_time, is_active
FROM entity_specials src WHERE src.entity_slug='agave-mexican-restaurant'
AND NOT EXISTS (SELECT 1 FROM entity_specials x WHERE x.entity_slug='agave-bar-grill' AND x.special_name=src.special_name);

INSERT INTO entity_photos (entity_slug, url, sort_order)
SELECT 'docs-seafood-shack-and-oyster-bar', p.url, 100 + row_number() OVER ()
FROM entity_photos p WHERE p.entity_slug='doc-s-seafood-shack-and-oyster-bar'
AND NOT EXISTS (SELECT 1 FROM entity_photos x WHERE x.entity_slug='docs-seafood-shack-and-oyster-bar' AND x.url=p.url);

-- 028: With all real data confirmed migrated (023, 026, 027), deactivated
-- the 4 duplicate rows per user approval -- is_active=false, NOT deleted,
-- fully reversible. Verified this actually hides them everywhere, not just
-- in the database: gcr-api-clean's GET /api/gcr/entities (every listing
-- page), getEntityBySlug()/buildFullEntity() (individual business pages --
-- so even a direct link to the old URL now 404s instead of showing a stale
-- duplicate), and POST /api/gcr/search all filter .eq('is_active', true).
UPDATE entity SET is_active = false
WHERE slug IN ('the-hangout-gulf-shores', 'the-hangout-restaurant', 'agave-mexican-restaurant', 'doc-s-seafood-shack-and-oyster-bar');

-- 029: Full platform visual/UX/data-completeness audit (2026-07-11), per user
-- request to screenshot and review every page. This sandbox has no network
-- egress to the live site or Supabase's own HTTP endpoint (confirmed via the
-- proxy's own status log -- policy-level 403s), so real pages were rendered
-- locally by the actual gcr-unified frontend code against a local Playwright
-- harness that serves real DB rows (pulled via SQL, shaped to match each
-- endpoint's real response contract) in place of the blocked network calls.
-- 19 page templates x 2 viewports = 38 screenshots; 9 logged-in-only pages
-- (Setup/Home/MyList/Building/Itinerary/Profile/Saves/Groups/Swipe) got a
-- code-level review instead, since no test login was available.
--
-- Two confirmed, verified bugs were fixed live in gcr-unified (see that
-- repo's own commit history for the diffs):
--   * CategoryPage.jsx's .listings-stack (powers 8 nav categories --
--     restaurants, things-to-do, nightlife, shopping, happy-hours,
--     public-spots, wellness, marinas) was a flex-column single-file stack
--     with no grid at all, unlike the matching RentalListings/
--     ServiceListings pattern -- a 27-result page rendered as a ~31,000px
--     single-column scroll on desktop. Fixed to the same 3/2/1-column
--     responsive grid used elsewhere. Verified before/after via screenshot:
--     6,436px after the fix.
--   * RestaurantMenu.jsx rendered a literal "$0.00" badge on every menu item
--     whose price was never captured (common for deep-crawled menus --
--     confirmed real for The Hangout's full 37-item menu) -- the backend
--     already defaults a missing price to 0, but the frontend displayed
--     that 0 as a real price instead of omitting the badge. Fixed to only
--     show a price when it's > 0.
--
-- Real, verified findings NOT yet fixed (full detail + screenshots in the
-- audit report artifact shared with the user this session):
--   * Site-wide: business pages showing a real Google rating/review count
--     in the header (e.g. Fort Morgan "4.7, 5624 reviews") while the
--     Reviews section directly below renders all-zero stars and "no
--     reviews yet" -- entity.rating/review_count are cached Google
--     aggregates, but actual review text only exists in entity_reviews for
--     a small slice of businesses platform-wide. Highest-impact open item.
--   * Artist listings (/artists): several hundred real records, zero
--     pagination or filter chips -- a single 400+-card unbroken scroll.
--   * Events page: 115 real events for a single day with no render cap --
--     100,000+px page height.
--   * Hub/marina template (HubTemplate.jsx, e.g. Zeke's Landing's 53 real
--     children): correctly renders once fed, but wastes most of the
--     desktop viewport (narrow centered column, huge empty gutters) and has
--     no filter/sort control for large child directories -- matches the
--     already-open #15/#16 punch-list items.
--   * MyList.jsx and Saves.jsx are two separate, fully-built, independent
--     implementations of the same "saved places" feature, reachable via
--     different nav paths (bottom-nav -> /saves, Profile/Swipe -> /list) --
--     needs a canonical-page decision.
--   * Landing.jsx's weather widget prints literal "..." placeholder text
--     when the API has nothing, instead of hiding the segment.
--   * Rental cards (/staying) show bed count but no nightly price or
--     bathroom count -- thin for a booking-intent page.
--   * Tag-chip de-duplication gap (e.g. "American"/"American Food"/
--     "American Restaurant" as 3 separate chips) and raw Google category
--     slugs (point_of_interest, wheelchairAccessibleParking) still leaking
--     into card "MORE" rows on mobile, where they also hard-clip instead of
--     wrapping.
--   * The Hangout's own menu has a real data-quality duplicate: "burgers"
--     and "Burgers/Sandwiches" are two separate sections, with "Lifeguard
--     Burger" in one and "The Lifeguard" in the other.
--   * Deals page (/deals) empty state was checked and is fine as-is --
--     gcr_deals has zero active rows platform-wide (real, not a bug), and
--     the empty state itself reads as intentional, not broken.
