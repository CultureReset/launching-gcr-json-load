-- 002_menu_field_shift_repair.sql
-- ---------------------------------------------------------------------------
-- Root cause: an earlier menu scrape/import wrote menu rows with MISALIGNED
-- columns ("field shift"). In the corrupted rows:
--   menu_sections.section_name  held the REAL dish name
--   menu_items.item_name        held the REAL description
--   menu_items.description       held garbage (the NEXT dish's name / a header)
--   menu_items.price             was correct
-- This produced dozens of one-dish "sections" and hid the real prices.
--
-- This migration records the IN-PLACE repairs applied on 2026-07-11 to the two
-- restaurants whose corruption was cleanly reversible. Restaurants whose scrape
-- physically CONCATENATED adjacent items into one field are NOT fixable here and
-- must be re-imported from the clean staging/*/menu_items.json format
-- (see MENU_REPAIR_STATUS.md for that list).
--
-- Applied against Supabase project mkepugvdlktfsossumox. Idempotent-safe to
-- re-read as documentation; the DELETEs/UPDATEs are keyed to specific ids.
-- ---------------------------------------------------------------------------

-- =========================================================================
-- A) villaggio-grille : 46 sections -> 11 clean sections, prices recovered
-- =========================================================================
BEGIN;

-- A1. Un-shift the 29 dish-as-section rows and file each under its real category.
--     (dish name = section_name, description = old item_name, price kept)
UPDATE menu_items i
SET description = i.item_name,
    item_name   = s.section_name,
    section_id  = m.target
FROM menu_sections s
JOIN (VALUES
  ('ca68b0a1-4228-494d-87cc-79cdbaa78b40'::uuid,'628df56d-bbbd-4d81-aff2-ea3a1789c7a8'::uuid), -- Appetizers
  ('408943ec-7e17-4bb3-bac8-977d0814a532','628df56d-bbbd-4d81-aff2-ea3a1789c7a8'),
  ('1b779893-28dc-4c0c-933f-f5567ec82167','628df56d-bbbd-4d81-aff2-ea3a1789c7a8'),
  ('e40e8d5f-c0f4-4e2c-b7e7-9712d00827b9','628df56d-bbbd-4d81-aff2-ea3a1789c7a8'),
  ('26f4c6cd-0593-4dc5-ba86-48b3f7eb0747','628df56d-bbbd-4d81-aff2-ea3a1789c7a8'),
  ('8d2d01b1-5c62-41ad-93c5-73efdd9c7f06','5e405fce-80ee-461e-9ad4-c0edcd4d5b8f'), -- Salads
  ('c967e3db-94b0-4182-8375-9b9594820d8a','5e405fce-80ee-461e-9ad4-c0edcd4d5b8f'),
  ('99ec0c45-e3f4-4e37-be2b-7ee2c1b62fed','5e405fce-80ee-461e-9ad4-c0edcd4d5b8f'),
  ('1774dcd6-2744-4926-b967-9572807c4907','5e405fce-80ee-461e-9ad4-c0edcd4d5b8f'),
  ('c41abc68-8212-4a1f-bca1-19142db0888a','5e405fce-80ee-461e-9ad4-c0edcd4d5b8f'),
  ('5f3e1f76-fb12-4baa-a173-072ea2884b1e','94102563-ddd2-49a9-876e-a36726b91daf'), -- Pizza
  ('58aa0dfb-9d56-422e-8a46-d5b35bd39780','94102563-ddd2-49a9-876e-a36726b91daf'),
  ('0daf75e0-7ae7-49b0-adbc-e02646670d2f','94102563-ddd2-49a9-876e-a36726b91daf'),
  ('f8921a9c-e6a5-416f-a245-37b7dfd104e8','94102563-ddd2-49a9-876e-a36726b91daf'),
  ('6a4791c3-68af-4025-8234-1e2e252c5215','53d1a281-eab6-4709-96a4-22d567698e46'), -- Pasta
  ('4ec1b3e0-e166-4b61-a05a-dadea1468d7d','53d1a281-eab6-4709-96a4-22d567698e46'),
  ('17ec8585-1cc4-4743-8c9d-08e7ff60f448','53d1a281-eab6-4709-96a4-22d567698e46'),
  ('ce77ffd7-8987-4c94-94af-43e9a0892704','53d1a281-eab6-4709-96a4-22d567698e46'),
  ('21e7d997-ac82-4e0f-a21d-301243fefe8b','53d1a281-eab6-4709-96a4-22d567698e46'),
  ('5316896f-b9e6-4dd1-9e4b-2a92f42932d5','609383a0-a0b3-44f1-8ff8-d044757ac2a2'), -- Entrees
  ('d1ac1476-2a99-44c3-a04b-48def6752d93','609383a0-a0b3-44f1-8ff8-d044757ac2a2'),
  ('50b02463-4ecd-4389-b4c3-623542dea909','609383a0-a0b3-44f1-8ff8-d044757ac2a2'),
  ('6dc7e5e7-288f-4684-b52a-e1bccb5317ad','609383a0-a0b3-44f1-8ff8-d044757ac2a2'),
  ('910b0225-fd69-4e0e-91a6-d5d30c8de46c','609383a0-a0b3-44f1-8ff8-d044757ac2a2'),
  ('d70fac77-2b44-4866-af2a-2135cb424cca','9dc5af21-9394-4213-916a-2300f37b765c'), -- Sandwiches
  ('4cf64ac5-bbea-4e02-a005-b3f191224c36','9dc5af21-9394-4213-916a-2300f37b765c'),
  ('2bdc04da-eecf-4ce8-b9c0-64636cf44b9d','a842b7c0-d23f-4a09-9264-68236efa945f'), -- Desserts
  ('761a2331-a386-4902-918a-1deec61328cd','a842b7c0-d23f-4a09-9264-68236efa945f'),
  ('d2d05e4b-75d8-4a5a-9cef-b05aa17d773f','a842b7c0-d23f-4a09-9264-68236efa945f')
) AS m(src, target) ON m.src = s.id
WHERE i.section_id = s.id;

-- A2. Rescue 2 unique items from the mixed "Partial Dinner" fragment.
UPDATE menu_items SET section_id='628df56d-bbbd-4d81-aff2-ea3a1789c7a8'
  WHERE section_id='c1b52128-67b6-4175-b37b-8e48271fe3dc' AND lower(item_name) LIKE '%lobster bisque%';
UPDATE menu_items SET section_id='5e405fce-80ee-461e-9ad4-c0edcd4d5b8f'
  WHERE section_id='c1b52128-67b6-4175-b37b-8e48271fe3dc' AND lower(item_name) LIKE '%nicoise%';

-- A3. Drop pure-duplicate / fragment / junk sections' leftover items.
DELETE FROM menu_items WHERE section_id IN (
  '382759e6-e2ea-47a0-8bd8-52902889a45e', -- Most Popular (widget)
  'fdb5e580-1499-425b-8cd1-d744581def08', -- Starters (dup of Appetizers)
  'e177a7f9-ed7e-49b7-825c-12a12e328f47', -- Dessert Menu (dup of Desserts)
  '22626a9f-7696-4f9a-a4a8-3292e20be869', -- Takeout Family Meals (dup of Family Meals)
  'c1b52128-67b6-4175-b37b-8e48271fe3dc', -- Partial Dinner (uniques already moved)
  '6422e06d-1a9c-4611-9d85-8849ca8a79ec'  -- generic "Pizza" junk row
);

-- A4. Remove now-empty sections BEFORE renaming (avoids unique-name collision).
DELETE FROM menu_sections s
WHERE s.entity_slug='villaggio-grille'
  AND NOT EXISTS (SELECT 1 FROM menu_items i WHERE i.section_id = s.id);

-- A5. Rename Wood Oven Pizza -> Pizza.
UPDATE menu_sections SET section_name='Pizza' WHERE id='94102563-ddd2-49a9-876e-a36726b91daf';

-- A6. De-dupe within each section (keep the copy WITH a price + longest description).
DELETE FROM menu_items d
USING (
  SELECT id, row_number() OVER (
    PARTITION BY section_id, lower(btrim(item_name))
    ORDER BY (price IS NOT NULL) DESC, length(coalesce(description,'')) DESC, id
  ) AS rn
  FROM menu_items WHERE entity_slug='villaggio-grille'
) r
WHERE d.id = r.id AND r.rn > 1;

COMMIT;

-- =========================================================================
-- B) another-broken-egg-cafe : 29 sections -> 19 clean sections
--    The 19 category sections were already intact; only orphan debris removed.
-- =========================================================================
BEGIN;

-- B1. Move the one genuine retail product into Retail Items; clear its shifted description.
UPDATE menu_items
  SET section_id = (SELECT id FROM menu_sections
                    WHERE entity_slug='another-broken-egg-cafe' AND section_name='Retail Items'),
      description = NULL
  WHERE id='c31019fe-096d-4f6e-bb70-04f7b794fba4';

-- B2. Delete 8 corrupted duplicate orphans (real dish already fully present, with
--     price+description, in a healthy section) plus one junk scrape row.
DELETE FROM menu_items WHERE id IN (
  'a252ca3f-3149-4994-b983-48c66a315487', -- "| Monday | 7 AM-2 PM |" junk hours/review row
  'f3ca248b-90a6-4ee5-acca-0b7d6b1bafdd', -- 1/2 Order Of Biscuit Beignets  (dup -> Sides)
  '1c4af402-de0b-4078-8017-953b86eb90b6', -- Caramel Cold Brew              (dup -> Beverages)
  '3b92de27-b896-40c2-bf25-7b9c33cf5476', -- Hardwood Smoked Bacon          (dup -> Sides)
  'c25b6232-5420-4e8f-868d-d047565f0562', -- Kids' Chocolate Chip Pancakes  (dup -> Kid's Menu)
  'e637cf2f-7da9-4945-9fac-f2b163edfbf3', -- Loaded Bacon Gouda Grits       (dup -> Sides)
  'b1aec217-6ca7-482c-8288-1ab68548f1d3', -- Pineapple Berry Agua Fresca    (dup -> Mocktails)
  '586f0706-4a8b-47d8-8e2a-4c106b45852d', -- Skinny Omelette                (dup -> Sensible Creations)
  '937383a2-3e86-4a6f-8e5c-6c2746a6f335'  -- Smoked Salmon Benedict         (dup -> Brunch Specialties)
);

-- B3. Remove now-empty sections.
DELETE FROM menu_sections s
WHERE s.entity_slug='another-broken-egg-cafe'
  AND NOT EXISTS (SELECT 1 FROM menu_items i WHERE i.section_id = s.id);

COMMIT;
