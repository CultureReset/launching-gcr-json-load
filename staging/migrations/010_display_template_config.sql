-- ============================================================================
-- 010_display_template_config.sql
-- Add entity.display_template + entity.display_config, backfilled by
-- entity_type. Powers the generic non-restaurant display work: the public
-- /api/public/menu response (serveMenuFromGcr in gcr-api-clean/routes/public.js)
-- now also returns entity_sections content, and gcr-unified's RestaurantMenu
-- page uses display_template to decide which section-renderer registry to
-- apply for entity_types that were previously showing an empty/broken page.
-- ============================================================================
-- APPLIED to project mkepugvdlktfsossumox on 2026-07-12 via Supabase migration
-- `add_display_template_and_config_to_entity`.
--
-- CONTEXT: entity_sections/entity_section_items already hold real rich content
-- (rooms, pricing, offerings, amenities, highlights, policies, tour_types,
-- process, best_for, whats_included) for 3,166 ownable entities (see
-- 009_menu_pin_backfill.sql for the ownable-entity classification), but
-- serveMenuFromGcr never queried entity_sections, so this data was invisible
-- on the public page for every non-restaurant business. Verified live
-- section_type distribution across entity_sections before writing this:
--   rooms 155, pricing 117, offerings 5, highlights 3, policies 2, process 1,
--   best_for 1, whats_included 1, amenities 1, tour_types 1 (287 rows total).
--
-- display_template is a plain backfill from entity_type, not a judgment call:
--   restaurant, coffee, bakery, dessert  -> 'menu'      (existing tab behavior)
--   condo, vacation-rental, hotel        -> 'stay'
--   activity, service                    -> 'booking'
--   everything else (shopping, park)     -> 'generic'
-- display_config is left NULL for every row -- it's an optional per-entity
-- override (`{section_order:[...], hide:[...]}`) for later manual curation,
-- not populated by this migration.
--
-- Fully additive: two new nullable columns, no existing column touched, no
-- rows deleted.
--
-- VERIFIED POST-MIGRATION (fresh query against live project, entity_type x
-- display_template cross-tab):
--   booking / service 853, booking / activity 792,
--   generic / shopping 502, generic / park 145,
--   menu / restaurant 529, menu / coffee 78, menu / bakery 1, menu / dessert 1,
--   stay / condo 235, stay / vacation-rental 156, stay / hotel 136
--   -- matches the entity_type distribution exactly, every row backfilled.
-- ============================================================================

ALTER TABLE entity ADD COLUMN IF NOT EXISTS display_template text;
ALTER TABLE entity ADD COLUMN IF NOT EXISTS display_config jsonb;

UPDATE entity SET display_template = CASE
  WHEN entity_type IN ('restaurant','coffee','bakery','dessert') THEN 'menu'
  WHEN entity_type IN ('condo','vacation-rental','hotel') THEN 'stay'
  WHEN entity_type IN ('activity','service') THEN 'booking'
  ELSE 'generic'
END
WHERE display_template IS NULL;
