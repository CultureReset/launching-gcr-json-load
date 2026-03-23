# Ducks Diner — Staging Checklist

## Before uploading to Supabase, verify each file:

### business.json
- [ ] Name, slug, tagline, description filled in
- [ ] Address, phone, website confirmed
- [ ] Hours correct for every day
- [ ] Tags accurate (drives search results)
- [ ] live_music, happy_hour flags set correctly
- [ ] happy_hour_days, start, end set if happy_hour=true

### specials.json
- [ ] Each special has correct days array
- [ ] start_time / end_time in HH:MM 24h format
- [ ] discount_text is short & punchy (shows on cards)
- [ ] drink_specials array filled (can be empty [])
- [ ] Remove placeholder object if no specials

### menu_items.json
- [ ] Rename TODO_menu_type keys to real types (brunch, lunch, dinner, happy_hour, etc.)
- [ ] Set available_days, available_start, available_end per menu type
- [ ] All sections named and numbered with section_order
- [ ] All items entered per section
- [ ] Prices as strings ("12.99" not 12.99) — use "MP" for market price
- [ ] price_variants filled if item has sizes/options, otherwise []
- [ ] Tags added for search filtering (popular, seafood, vegetarian, etc.)
- [ ] Remove unused menu_type blocks before uploading

### events.json
- [ ] Dates in YYYY-MM-DD format
- [ ] Times in HH:MM 24h format
- [ ] Recurring events flagged correctly
- [ ] Remove placeholder object if no events

## Upload Order (Supabase)
1. `businesses` table ← business.json
2. `specials` table   ← specials.json
3. `menu_items` table ← menu_items.json
4. `events` table     ← events.json (if any)

## Status
- [ ] Data reviewed
- [ ] All TODOs resolved
- [ ] Uploaded to Supabase
- [ ] Tested on live search
