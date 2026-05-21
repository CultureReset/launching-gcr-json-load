# GCR APIs & Tables Map

## What launching-GCR Loads (4 Endpoints)

```
GCR.load() calls:
├─ GET /api/gcr/entities?limit=500       ← Listings (all businesses)
├─ GET /api/gcr/events                   ← Events (all entity_events)
├─ GET /api/gcr/specials                 ← Specials (all entity_specials)
└─ GET /api/gcr/happy-hours              ← HH businesses (entity + happy_hour data)

On profile click:
└─ GET /api/gcr/entity/:slug             ← Full business profile

On search:
└─ POST /api/gcr/search                  ← Semantic search across all tables
```

---

## Each API Endpoint & Its Tables

### 1. GET /api/gcr/entities (Listing Cards)
**Tables queried:**
- `entity` (main)
- `entity_tags` (batch-fetched)
- `entity_features` (batch-fetched)
- `entity_photos` (batch-fetched)
- `entity_hours` (batch-fetched)
- `entity_sections` → `section_rich_text` (fallback descriptions)

**What it returns:**
```javascript
{
  entities: [
    {
      id, slug, name, subtitle, 
      icon, phone, rating, review_count, city, state, zip, 
      address_line_1, hero_image_url, website_url, 
      price_range, featured, 
      hh_days, hh_start, hh_end,
      social_instagram, social_facebook, social_tiktok, email,
      
      // From batch queries:
      tags: [{tag, tag_category}, ...],
      hours: [{day_of_week, open_time, close_time}, ...],
      photos: [{image_url, caption}, ...],
      
      // Backwards compat:
      site_id: id,
      subdomain: slug,
      cover_url: hero_image_url,
      ...
    }
  ]
}
```

**Used by:** restaurants.html, activities.html, coffee.html, home.html (card listings)

---

### 2. GET /api/gcr/entity/:slug (Profile Page)
**Tables queried:**
- `entity` (main, all fields)
- `entity_features`
- `entity_perfect_for`
- `entity_tags`
- `entity_sections`
- `entity_hours`
- `entity_photos`
- `entity_about_bullets`
- `menu_sections` + `menu_items`
- `drink_sections` + `drink_items`
- `happy_hour_sections` + `happy_hour_items`
- `entity_events`
- `entity_specials`
- `activities`
- `pricing_items`
- `booking_slots`
- `fleet_items`
- `addons`
- `whats_included`
- `requirements`
- `policies`
- `meeting_points`
- `entity_qna`
- `product_sections` + `product_items`

**What it returns:**
```javascript
{
  entity: {...all entity fields...},
  
  // Content sections:
  features: [...],
  perfect_for: [...],
  tags: [...],
  sections: [...],
  photos: [...],
  
  // Menu data (merged from both tables):
  menu: {
    sections: [...],
    items: [...]
  },
  drinks: {
    sections: [...],
    items: [...]
  },
  happy_hour: {
    sections: [...],
    items: [...]
  },
  
  // Events & specials:
  events: [...],
  specials: [...],
  
  // Other:
  hours: [...],
  activities: [...],
  pricing: [...],
  ...
}
```

**Used by:** profile.html?id=:slug (full business profile page)

---

### 3. GET /api/gcr/events
**Tables queried:**
- `entity_events` (main)
- `entity` (joined for entity details)

**Returns:**
```javascript
[
  {
    id, event_name, artist_name, event_date, start_time,
    description, event_type, venue_location, cover_charge,
    entity_id, entity_slug, entity_name, entity_hero_image_url,
    city, ...
  }
]
```

**Used by:** events.html, happy-hours.html (event listings)

---

### 4. GET /api/gcr/specials
**Tables queried:**
- `entity_specials` (main)
- `entity` (joined)

**Returns:**
```javascript
[
  {
    id, special_name, description, discount_text, is_active,
    special_type, days_of_week,
    
    // Entity details:
    entity_name, entity_slug, entity_hero_image_url,
    city, phone, address, ...
  }
]
```

**Used by:** specials.html (special offers listings)

---

### 5. GET /api/gcr/happy-hours
**Tables queried:**
- `entity` (main - gets IDs from multiple sources)
- `happy_hour_sections`
- `entity_specials` (WHERE special_type='happy_hour')
- `entity_happy_hours`
- `entity_photos`
- `entity_hours`
- `happy_hour_items`

**Returns:**
```javascript
[
  {
    slug, name, emoji, type, rating,
    address, city, phone,
    hh_days, hh_start, hh_end, hh_description,
    happyHour: "Mon-Fri 4-6pm",
    
    // Nested data:
    hh_sections: [{id, section_name, items: [...]}],
    photos: [...],
    hours: [...]
  }
]
```

**Used by:** happy-hours.html (HH specials page)

---

### 6. POST /api/gcr/search
**Tables queried (parallel):**
- `entity` (search name, subtitle, description, city, subtype)
- `section_items` (search menu/drink items)
- `entity_sections` (find section types)
- `entity_specials` (search specials)
- `entity_events` (search events)
- `activities` (search activities)

Then fetches full entity + photos for matches.

**Returns:**
```javascript
{
  query: "shrimp",
  results: [
    {
      id, slug, name, subtitle, entity_subtype,
      rating, review_count, city,
      hero_image_url, phone, address_line_1,
      
      // Matched items nested:
      matched_menu_items: [...],
      matched_drink_items: [...],
      matched_specials: [...],
      matched_events: [...],
      photos: [...]
    }
  ],
  structured: {
    businesses: [...],
    menu_items: [...],
    drink_items: [...],
    specials: [...],
    events: [...]
  }
}
```

**Used by:** search.html (search results)

---

## Problem: Slug Consistency

| Endpoint | Returns slug? | Field names vary? |
|----------|---------------|-------------------|
| `/entities` | ✓ slug | ✓ (has site_id, subdomain aliases) |
| `/entity/:slug` | ✓ slug | ✓ (full entity object) |
| `/events` | ✓ slug (via entity join) | ✗ (uses entity_slug) |
| `/specials` | ✓ slug (via entity join) | ✗ (uses entity_slug) |
| `/happy-hours` | ✓ slug | ✓ |
| `/search` | ✓ slug | ✓ (has site_id, subdomain aliases) |

---

## Solution: Normalize All to Use `slug` Consistently

Need to apply normalizeBusiness() to:
1. **`/entities`** response → ensure all business objects use `slug` only
2. **`/search`** results → same structure as `/entities`
3. **`/events`** response → ensure all have `slug` + business details
4. **`/specials`** response → ensure all have `slug` + business details
5. **`/happy-hours`** response → ensure all have `slug`
6. **`/entity/:slug`** → already has slug, but might need standardization

So that no matter which endpoint, every business object:
- **Always has `slug`** as the primary identifier
- **Never has duplicate identifiers** (no site_id, subdomain, id aliases in listing responses)
- **Always has the same field names** (name, rating, review_count, description, etc.)
