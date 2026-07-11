# Menu Data Repair — Status (2026-07-11)

## Root cause (systemic)
An earlier menu scrape/import wrote rows with **misaligned columns** ("field shift"):

| Column | Held (in corrupted rows) |
|---|---|
| `menu_sections.section_name` | the **real dish name** |
| `menu_items.item_name` | the **real description** |
| `menu_items.description` | garbage (next dish's name / a stray header) |
| `menu_items.price` | correct |

Result: dozens of one-dish "sections" and hidden prices. The **new `staging/*/menu_items.json`
format is correctly structured**, so imports through it do not reproduce this bug.

## Repaired in place (see `002_menu_field_shift_repair.sql`)
| Entity | Before | After |
|---|---|---|
| `villaggio-grille` | 46 sections (29 shifted dish-rows + 6 junk fragments) | **11 clean sections, 92 items, prices recovered** |
| `another-broken-egg-cafe` | 29 sections (10 orphan debris rows) | **19 clean sections** (category sections were already intact; 8 orphans were stale duplicates of dishes already present with correct price+desc) |

## 🚩 Must be RE-IMPORTED (not SQL-fixable)
The scraper **concatenated adjacent menu items into a single field**
(e.g. `"3 small pancakes, syrup, butterLarge Stack Of Pancakes"`). The boundary
between two items is gone, so no field-swap recovers them. Re-import via the clean
staging JSON format:

- `gulf-shores-diner`  (whole menu misaligned — even multi-item section names are stray descriptions)
- `original-oyster-house-boardwalk`
- `pelican-grill-orange-beach`
- `the-ugly-diner`
- `ruby-slipper-orange-beach`

## ✅ Fine as-is (~18)
`china-dragon`, `angry-crab-shack`, `coastal-orange-beach`, `efes-greek-kitchen`,
`mrs-fields-gulf-shores`, `smoothie-king`, `lillians-pizza`, `lost-key-golf-club`,
`docs-seafood-shack-and-oyster-bar`, `the-catch-gulf-shores`, `parlor-doughnuts`,
`the-southern-grind-coffee-house-at-the-wharf`, `the-tap-and-still-gulf-shores`,
`southern-shores-coffee`, `fish-river-grill`, `the-point-restaurant`, `crave-cookies`,
`gts-on-the-bay`. Single-item sections here are correctly structured (granular/summary rows).
`the-gulf-orange-beach` only has two duplicate section pairs (cosmetic merge).

## Known leftover
`another-broken-egg-cafe` still has one section literally named
`"Three house-recipe buttermilk cakes."` (a description, 2 items) — real section name
unknown, left untouched rather than guessed.
