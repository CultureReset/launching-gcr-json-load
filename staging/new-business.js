#!/usr/bin/env node
/**
 * GCR Business Staging Scaffolder
 * Usage:  node new-business.js "Business Name" [type] [area]
 *
 * type  = restaurants | nightlife | things-to-do | coffee-sweets | shopping | hotels | services | other
 * area  = "Orange Beach" | "Gulf Shores" | "Foley" | "Perdido Key"
 *
 * Examples:
 *   node new-business.js "Lulu's Restaurant" restaurants "Gulf Shores"
 *   node new-business.js "Flora-Bama" nightlife "Orange Beach"
 *   node new-business.js "Orange Beach Watersports" things-to-do "Orange Beach"
 */

const fs   = require('fs');
const path = require('path');

/* ── parse args ── */
const [,, rawName, type = 'restaurants', area = 'Orange Beach'] = process.argv;

if (!rawName) {
  console.error('Usage: node new-business.js "Business Name" [type] [area]');
  process.exit(1);
}

/* ── derive slug ── */
const slug = rawName
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-');

const dir = path.join(__dirname, slug);

if (fs.existsSync(dir)) {
  console.error(`Folder already exists: ${dir}`);
  process.exit(1);
}

fs.mkdirSync(dir, { recursive: true });

/* ════════════════════════════════════════
   business.json — core record
   ════════════════════════════════════════ */
const business = {
  name:        rawName,
  slug,
  subdomain:   slug,
  type,
  category:    type,
  tagline:     `TODO: short tagline for ${rawName}`,
  description: `TODO: 1–2 sentence description of ${rawName}.`,
  area,
  address:     `TODO: street address, ${area}, AL`,
  phone:       "TODO: (251) xxx-xxxx",
  website:     "TODO: https://",
  hours: {
    monday:    "TODO: 9am–9pm or closed",
    tuesday:   "TODO: 9am–9pm or closed",
    wednesday: "TODO: 9am–9pm or closed",
    thursday:  "TODO: 9am–9pm or closed",
    friday:    "TODO: 9am–9pm or closed",
    saturday:  "TODO: 9am–9pm or closed",
    sunday:    "TODO: 9am–9pm or closed"
  },
  tags:              ["TODO: tag1", "TODO: tag2"],
  featured:          false,
  live_music:        false,
  happy_hour:        false,
  happy_hour_days:   [],
  happy_hour_start:  null,
  happy_hour_end:    null,
  images:            [],
  social: {
    facebook:  "",
    instagram: "",
    tiktok:    ""
  },
  "_notes": "Fill in all TODO fields. Delete this _notes key before uploading."
};

/* ════════════════════════════════════════
   specials.json — happy hours / drink deals
   ════════════════════════════════════════ */
const specials = [
  {
    slug,
    name:         "TODO: Special Name (e.g. Happy Hour)",
    type:         "TODO: happy_hour | daily_special | weekend_special | after_8pm",
    description:  "TODO: describe the deal",
    days:         ["TODO: monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
    start_time:   "TODO: 15:00",
    end_time:     "TODO: 18:00",
    active:       true,
    discount_text: "TODO: e.g. $1 oysters | BOGO | Half-price drafts",
    drink_specials: [
      {
        name:  "TODO: Item name",
        note:  "TODO: detail about the deal",
        price: "TODO: $X | X% off | BOGO | half price"
      }
    ],
    "_notes": "Add one object per distinct special/deal. Delete _notes before uploading."
  }
];

/* ════════════════════════════════════════
   menu_items.json — full menu (grouped structure)
   Sections are grouped by menu_type → section → items
   Upload script flattens this into individual DB rows
   ════════════════════════════════════════ */
const menuItems = {
  slug,
  "_notes": [
    "Add one key per menu type your restaurant serves.",
    "Menu types: main | breakfast | brunch | lunch | dinner | happy_hour | after_8pm | bar | kids | seasonal",
    "Each menu type has: available_days, available_start, available_end, sections[]",
    "Each section has: section (name), section_order (integer), items[]",
    "Each item has: name, description, price, price_variants?, tags[], active",
    "price_variants example: [{label:'Small',price:'8.99'},{label:'Large',price:'12.99'}]",
    "tags: popular | new | seafood | vegetarian | vegan | gluten-free | spicy | southern | kids-friendly",
    "Delete this _notes key before uploading."
  ],
  "menus": {
    "TODO_menu_type_1 (e.g. brunch)": {
      "available_days": ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
      "available_start": "TODO: 07:00",
      "available_end":   "TODO: 15:00",
      "sections": [
        {
          "section": "TODO: Section Name (e.g. Benedicts, Appetizers, Entrees)",
          "section_order": 1,
          "items": [
            {
              "name":        "TODO: Item Name",
              "description": "TODO: what's in it (can be empty string)",
              "price":       "TODO: 12.99",
              "price_variants": [],
              "tags":        ["TODO: popular | seafood | vegetarian | spicy | etc"],
              "active":      true
            }
          ]
        },
        {
          "section": "TODO: Section 2 Name",
          "section_order": 2,
          "items": [
            {
              "name":        "TODO: Item Name",
              "description": "TODO: description",
              "price":       "TODO: 14.99",
              "price_variants": [],
              "tags":        [],
              "active":      true
            }
          ]
        }
      ]
    },
    "TODO_menu_type_2 (e.g. happy_hour)": {
      "available_days": ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
      "available_start": "TODO: 14:00",
      "available_end":   "TODO: 17:00",
      "sections": [
        {
          "section": "TODO: Happy Hour Deals",
          "section_order": 1,
          "items": [
            {
              "name":        "TODO: Item Name",
              "description": "TODO: the deal",
              "price":       "TODO: 1.00",
              "price_variants": [],
              "tags":        ["popular"],
              "active":      true
            }
          ]
        }
      ]
    }
  }
};

/* ════════════════════════════════════════
   events.json — live music / events
   ════════════════════════════════════════ */
const events = [
  {
    slug,
    title:        "TODO: Event / Band Name",
    description:  "TODO: short description",
    event_date:   "TODO: 2026-04-05",
    start_time:   "TODO: 20:00",
    end_time:     "TODO: 23:00",
    event_type:   "TODO: live_music | festival | trivia | karaoke | special_event",
    cover_charge: "TODO: 0 or dollar amount",
    recurring:    false,
    recurrence:   "TODO: none | weekly | biweekly (if recurring=true)",
    active:       true,
    "_notes":     "Add one object per event. Delete _notes before uploading. Leave array empty [] if no events."
  }
];

/* ════════════════════════════════════════
   CHECKLIST.md — review before uploading
   ════════════════════════════════════════ */
const checklist = `# ${rawName} — Staging Checklist

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
1. \`businesses\` table ← business.json
2. \`specials\` table   ← specials.json
3. \`menu_items\` table ← menu_items.json
4. \`events\` table     ← events.json (if any)

## Status
- [ ] Data reviewed
- [ ] All TODOs resolved
- [ ] Uploaded to Supabase
- [ ] Tested on live search
`;

/* ── write all files ── */
const write = (filename, data) => {
  const filepath = path.join(dir, filename);
  const content  = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  fs.writeFileSync(filepath, content);
  console.log(`  ✓ ${filename}`);
};

console.log(`\nCreating staging folder: ${slug}/`);
write('business.json',  business);
write('specials.json',  specials);
write('menu_items.json', menuItems);
write('events.json',    events);
write('CHECKLIST.md',   checklist);

console.log(`\nDone! Edit files in:\n  gcr/staging/${slug}/\n`);
console.log('When ready → run upload script (coming soon).\n');
