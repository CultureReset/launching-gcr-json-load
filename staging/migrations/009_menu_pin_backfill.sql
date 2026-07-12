-- ============================================================================
-- 009_menu_pin_backfill.sql
-- Backfill entity.menu_pin for real, ownable business rows that were missing one.
-- ============================================================================
-- APPLIED to project mkepugvdlktfsossumox on 2026-07-12 via Supabase migration
-- `menu_pin_backfill_ownable_entities`.
--
-- CONTEXT: the standalone menu/content editor (restaurant-menu-editor-MAIN-)
-- authenticates a business purely via entity.menu_pin (routes/menu-editor.js:
-- lookup is `.eq('slug', slug)` then compares entity.menu_pin -- PIN only
-- needs to be unique in combination with the slug, NOT globally unique, so no
-- collision-avoidance logic was needed here). Of 3,428 entity rows, only 8 had
-- a menu_pin set (7 restaurants + 1 shopping row) before this migration --
-- meaning virtually no real business could reach the editor even though the
-- mechanism itself works end-to-end.
--
-- INVESTIGATION (queried live against mkepugvdlktfsossumox before acting):
-- entity_type distribution (3,428 total rows):
--   service           853   activity          792   restaurant        529
--   shopping          502   condo             235   vacation-rental   156
--   park              145   hotel             136   coffee             78
--   dessert             1   bakery              1
--
-- JUDGMENT CALL -- which rows are "ownable businesses" vs scraped/reference
-- listings (verified via entity_subtype breakdown + spot-checked sample rows,
-- not assumed):
--   * restaurant, coffee, dessert, bakery, shopping, hotel, vacation-rental,
--     condo -- treated as ownable wholesale. These entity_types are inherently
--     commercial/hospitality/rental-property categories.
--   * park -- excluded wholesale. Its entity_subtypes are essentially all
--     public/reference points of interest (park, museum, state_park, beach,
--     historical_landmark, tourist_information_center, dog_park, visitor_center,
--     playground, cultural_landmark, wildlife_park) with no private "owner" who
--     would use a menu/content-editor PIN.
--   * activity and service -- these two are large, heterogeneous buckets mixing
--     real ownable businesses (fishing charters, tour agencies, boat rentals,
--     salons, real estate agencies, photographers, etc. -- confirmed by
--     sampling name/subtype rows) with public infrastructure / government /
--     generic-POI rows. Excluded only the subtypes that are unambiguously NOT
--     an ownable business:
--       activity excludes: tourist_attraction, attraction, nature_preserve,
--         hiking_area, wildlife_refuge, scenic_spot, parking, parking_lot,
--         heliport, park, observation_deck, amphitheatre  (66 rows)
--       service excludes: parking_lot, bus_stop, bridge, post_office,
--         local_government_office, government_office, government, airport,
--         point_of_interest, premise, park, beach_access, boat_launch,
--         community_center, university, stadium  (51 rows)
--     NULL/generic subtypes (e.g. service.entity_subtype = 'service' or NULL)
--     were spot-checked by sampling random rows and found to be overwhelmingly
--     real small businesses (charter services, photography studios, real
--     estate agents, rental companies) -- these were INCLUDED as ownable.
--
-- RESULT: 3,166 of 3,428 entity rows classified ownable; 262 excluded
-- (145 park + 66 activity POI-subtypes + 51 service infra/government subtypes).
-- Of the 3,166 ownable rows, 8 already had a menu_pin (untouched -- this
-- migration only fills menu_pin IS NULL, never overwrites). 3,158 rows backfilled
-- with a random 4-digit PIN generated the same way admin.html already does
-- (Math.floor(1000+Math.random()*9000) equivalent: floor(1000 + random()*9000)).
--
-- Fully additive: WHERE menu_pin IS NULL guarantees no existing PIN is touched.
-- No rows deleted, no columns dropped.
--
-- VERIFIED POST-MIGRATION (fresh query against live project):
--   ownable=true : 3,166 total, 3,166 with menu_pin, 0 missing
--   ownable=false: 262 total, 0 with menu_pin (correctly left alone)
--   entity table overall: 3,428 total rows, 3,166 now have menu_pin (was 8)
--
-- entity_owners / business_staff bridge (separate ask): checked live data --
-- business_staff, business_claims, and business_invites all have 0 rows in
-- this project, so there is no real phone-number or claim data to backfill
-- entity_owners from. entity_owners remains 0 rows. Not fabricated. The only
-- existing real owner link is the pre-existing `users` table row
-- (owner@gulfcoastluggo.com -> entity_slug gulf-coast-luggo), which was already
-- there before this migration and was left untouched.
-- ============================================================================

UPDATE entity
SET menu_pin = floor(1000 + random() * 9000)::int::text
WHERE menu_pin IS NULL
AND (
  entity_type IN ('restaurant','coffee','dessert','bakery','shopping','hotel','vacation-rental','condo')
  OR (entity_type = 'activity' AND (entity_subtype IS NULL OR entity_subtype NOT IN (
    'tourist_attraction','attraction','nature_preserve','hiking_area','wildlife_refuge','scenic_spot',
    'parking','parking_lot','heliport','park','observation_deck','amphitheatre'
  )))
  OR (entity_type = 'service' AND (entity_subtype IS NULL OR entity_subtype NOT IN (
    'parking_lot','bus_stop','bridge','post_office','local_government_office','government_office',
    'government','airport','point_of_interest','premise','park','beach_access','boat_launch',
    'community_center','university','stadium'
  )))
);
