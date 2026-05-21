# Exact Fields Returned by Each Endpoint

## 1. GET /api/gcr/entities (Listings - Used by all category pages)

**Response structure:**
```javascript
{
  entities: [
    {
      // From entity table (all selected):
      id, slug, name, subtitle,
      entity_type, entity_subtype, secondary_types,
      icon, phone, rating, review_count,
      city, state, zip, address_line_1,
      hero_image_url, website_url, directions_url, call_url,
      is_active, description, price_range, price_from, price_to, price_unit,
      featured, booking_url, reservation_url, order_url,
      hh_days, hh_start, hh_end, hh_description,
      social_instagram, social_facebook, social_tiktok, email,
      
      // From batch-fetched tables:
      tags: [{tag, tag_category}, ...],
      hours: [{day_of_week, open_time, close_time, is_closed}, ...],
      photos: [{image_url, caption}, ...],
      
      // Backwards compat aliases (added):
      site_id,      // = id
      subdomain,    // = slug
      type,         // = entity_subtype
      category,     // = entity_subtype
      emoji,        // = icon
      cover_url,    // = hero_image_url
      logo_url,     // = hero_image_url
      tagline,      // = subtitle
      status,       // 'active' if is_active
      gcr_listed,   // = is_active
      address,      // = address_line_1
      priceRange,   // = price_range
      reviewCount,  // = review_count
      secondary_types,  // converted to string
      google_types      // (if exists, converted to string)
    }
  ],
  businesses: [...same as entities...],
  total: number
}
```

**Duplicates:** ✗ **HEAVY DUPLICATION**
- `id` + `site_id`
- `slug` + `subdomain`
- `entity_subtype` + `type` + `category`
- `icon` + `emoji`
- `hero_image_url` + `cover_url` + `logo_url`
- `subtitle` + `tagline`
- `is_active` + `status` + `gcr_listed`
- `address_line_1` + `address`
- `price_range` + `priceRange`
- `review_count` + `reviewCount`

---

## 2. GET /api/gcr/events (Events - Used by events.html)

**Response structure:**
```javascript
[
  {
    // From entity_events table:
    id,
    event_name,
    artist_name,
    event_date,
    start_time,
    description,
    event_type,
    venue_location,
    cover_charge,
    entity_id,
    
    // From entity join:
    entity_name,        // = entity.name
    entity_slug,        // = entity.slug (PRIMARY ID!)
    entity_hero_image_url,  // = entity.hero_image_url
    city,              // = entity.city
    entity_city,       // = entity.city (DUPLICATE!)
    businessName,      // = entity.name (DUPLICATE!)
    slug               // = entity.slug (DUPLICATE of entity_slug!)
  }
]
```

**Duplicates:** ✗ **MODERATE DUPLICATION**
- `entity_slug` + `slug` (same value, different field names)
- `entity_name` + `businessName` (same value)
- `entity_city` + `city` (same value)
- `entity_hero_image_url` (long field name vs just having it as `hero_image_url`)

---

## 3. GET /api/gcr/specials (Specials - Used by specials.html)

**Response structure:**
```javascript
[
  {
    // From entity_specials table (all fields spread):
    id,
    special_name,
    description,
    discount_text,
    special_type,
    is_active,
    days_of_week,
    created_at,
    updated_at,
    entity_id,
    // ... (all other entity_specials fields)
    
    // Aliases added:
    name,           // = special_name (DUPLICATE!)
    active,         // = is_active (DUPLICATE!)
    type,           // = special_type (DUPLICATE!)
    discount,       // = discount_text (DUPLICATE!)
    days,           // = days_of_week (DUPLICATE!)
    
    // From entity join:
    businessName,        // = entity.name
    businessEmoji,       // = entity.icon
    category,           // = entity.entity_subtype
    slug,               // = entity.slug (PRIMARY ID!)
    subdomain,          // = entity.slug (DUPLICATE!)
    hero_image_url,     // = entity.hero_image_url
    city,               // = entity.city
    phone,              // = entity.phone
    directions_url,     // = entity.directions_url
    address,            // = entity.address_line_1
    
    // Entity prefixed fields (same as above, different names):
    entity_name,        // = entity.name
    entity_city,        // = entity.city
    entity_slug,        // = entity.slug (DUPLICATE!)
    entity_hero_image_url,  // = entity.hero_image_url
    call_url,           // = entity.call_url
    booking_url,        // = entity.booking_url
    reservation_url     // = entity.reservation_url
  }
]
```

**Duplicates:** ✗ **EXTREME DUPLICATION**
- `special_name` + `name`
- `is_active` + `active`
- `special_type` + `type`
- `discount_text` + `discount`
- `days_of_week` + `days`
- `slug` + `subdomain` (from entity)
- `slug` + `entity_slug` (same value, different names)
- `entity_name` + `businessName` + `name` (where `name` = `special_name` NOT entity name!)
- `entity_city` + `city`
- `entity_hero_image_url` + `hero_image_url`
- And more...

---

## 4. GET /api/gcr/happy-hours (Happy Hour Businesses)

**Response structure:**
```javascript
[
  {
    // Mapped fields from entity:
    slug,
    name,
    emoji,           // = icon
    type,            // = entity_subtype
    entity_subtype,  // (DUPLICATE!)
    rating,
    address,         // = address_line_1
    address_line_1,  // (DUPLICATE!)
    city,
    phone,
    call_url,
    google_maps,     // = directions_url
    directions_url,  // (DUPLICATE!)
    booking_url,
    reservation_url,
    cover,           // = hero_image_url
    hero_image_url,  // (DUPLICATE!)
    
    // From batch queries:
    photos: [...],
    hours: [...],
    hh_sections: [...],
    
    // HH specific:
    hh_days,
    hh_start,
    hh_end,
    hh_description,
    happyHour        // formatted string like "Mon-Fri 4-6pm"
  }
]
```

**Duplicates:** ✓ **MODERATE DUPLICATION**
- `emoji` + `icon` (no icon in response, but emoji duplicates it)
- `type` + `entity_subtype`
- `address` + `address_line_1`
- `google_maps` + `directions_url`
- `cover` + `hero_image_url`

---

## 5. POST /api/gcr/search (Search Results)

**Response structure:**
```javascript
{
  query: string,
  results: [
    {
      // All entity fields (spread):
      id, slug, name, subtitle, entity_type, entity_subtype,
      icon, phone, rating, review_count, city, state, zip,
      address_line_1, hero_image_url, website_url, price_range,
      featured, booking_url, reservation_url, order_url,
      hh_days, hh_start, hh_end,
      
      // Aliases added:
      site_id,        // = id (DUPLICATE!)
      subdomain,      // = slug (DUPLICATE!)
      emoji,          // = icon (DUPLICATE!)
      type,           // = entity_subtype (DUPLICATE!)
      category,       // = entity_subtype (DUPLICATE!)
      cover_url,      // = hero_image_url (DUPLICATE!)
      tagline,        // = subtitle (DUPLICATE!)
      
      // Special fields:
      photos: [...],
      matched_menu_items: [...],
      matched_specials: [...],
      matched_events: [...],
      _relevance: number
    }
  ],
  structured: {
    businesses: [
      {id, slug, name, subtitle, entity_subtype, icon, city,
       hero_image_url, price_range, rating, hh_days, hh_start, hh_end,
       phone, address_line_1}
    ],
    menu_items: [...],
    drink_items: [...],
    happy_hour_items: [...],
    specials: [...],
    events: [...]
  },
  total: number,
  counts: {...}
}
```

**Duplicates:** ✗ **HEAVY DUPLICATION** (same as /entities)

---

## 6. GET /api/gcr/entity/:slug (Full Profile)

**Response structure:**
```javascript
{
  // All entity fields (complete):
  entity: {
    id, slug, name, subtitle, description,
    icon, phone, rating, review_count,
    city, state, zip, address_line_1,
    hero_image_url, website_url, directions_url,
    entity_type, entity_subtype,
    is_active, featured,
    hh_days, hh_start, hh_end, hh_description,
    // ... 50+ more fields
  },
  
  // Content:
  features: [...],
  perfect_for: [...],
  tags: [...],
  sections: [...],
  photos: [...],
  about_bullets: [...],
  hours: [...],
  
  // Menu (merged from multiple sources):
  menu: {
    sections: [...],
    items: [...]
  },
  menuSections: [...],  // DUPLICATE!
  menuItems: [...],     // DUPLICATE!
  
  // Drinks:
  drinks: {
    sections: [...],
    items: [...]
  },
  drinkSections: [...], // DUPLICATE!
  drinkItems: [...],    // DUPLICATE!
  
  // Happy Hour:
  happy_hour: {
    sections: [...],
    items: [...]
  },
  hhSections: [...],    // DUPLICATE!
  hhItems: [...],       // DUPLICATE!
  
  // Events & Specials:
  events: [...],
  specials: [...],
  
  // Booking/Rental:
  activities: [...],
  pricing: [...],
  booking_slots: [...],
  fleet: [...],
  addons: [...],
  
  // More:
  requirements: [...],
  policies: [...],
  meeting_points: [...],
  qna: [...],
  shopping: {
    sections: [...],
    items: [...]
  }
}
```

**Duplicates:** ✓ **NESTED DUPLICATION**
- `menu.sections` + `menuSections`
- `menu.items` + `menuItems`
- `drinks.sections` + `drinkSections`
- `drinks.items` + `drinkItems`
- `happy_hour.sections` + `hhSections`
- `happy_hour.items` + `hhItems`

---

## Summary: Field Duplication by Endpoint

| Endpoint | Slug Consistency | Field Name Consistency | Duplicate Count |
|----------|------------------|------------------------|-----------------|
| `/entities` | ✓ (has `slug`) | ✗ Heavy (id/site_id/subdomain aliases) | **10+ aliases** |
| `/entity/:slug` | ✓ (has `slug`) | ✓ Good (mostly clean) | **6 nested duplicates** |
| `/events` | ✗ Mixed (slug + entity_slug) | ✗ Mixed (entity_X + regular names) | **6+ duplicates** |
| `/specials` | ✓ (has `slug`) | ✗ Extreme (all spread + aliases + entity_X) | **15+ duplicates** |
| `/happy-hours` | ✓ (has `slug`) | ✗ Moderate (type/entity_subtype, address/address_line_1) | **5+ duplicates** |
| `/search` | ✓ (has `slug`) | ✗ Heavy (same as `/entities`) | **10+ aliases** |

---

## The Fix: What Should Change

### **Keep:**
- All actual data fields
- All nested arrays (tags, photos, hours, menu items, etc.)
- All special fields (matched_menu_items, events, specials, etc.)
- Profile endpoint's nested structure (menu.sections, menu.items, etc.)

### **Remove:**
1. **All backwards compat aliases** from `/entities` and `/search`
   - Remove: site_id, subdomain, cover_url, logo_url, tagline, status, gcr_listed, priceRange, reviewCount
   - Keep actual: id, slug, hero_image_url, subtitle, is_active, price_range, review_count

2. **All duplicate entity fields** from `/specials` and `/events`
   - Keep only: `slug` as the business identifier
   - Remove: `entity_slug`, `subdomain`, `site_id`, `entity_name`, `businessName`, `entity_city`, `city`, etc.
   - Decision: **Use the non-prefixed field names** (slug, name, city, hero_image_url, etc.)

3. **All field name aliases** from `/happy-hours`
   - Remove: `emoji` (use `icon`), `type` (use `entity_subtype`), `address` (use `address_line_1`), `cover` (use `hero_image_url`)

4. **Nested duplicates** from `/entity/:slug`
   - Keep the nested structure: `menu.sections`, `menu.items`, `drinks.sections`, etc.
   - Remove the flat aliases: `menuSections`, `menuItems`, `drinkSections`, `drinkItems`, `hhSections`, `hhItems`

---

## Result: What All Endpoints Will Have

Every business object will have:
```javascript
{
  // Identity (required):
  id,
  slug,  // ← PRIMARY IDENTIFIER
  name,
  
  // Basics (consistent across all):
  city,
  address_line_1,
  phone,
  
  // Media:
  hero_image_url,
  icon,  // or emoji
  photos: [...],
  
  // Rating & Reviews:
  rating,
  review_count,
  
  // Category/Type:
  entity_subtype,
  
  // Business flags:
  featured,
  is_active,
  
  // Happy Hour:
  hh_days,
  hh_start,
  hh_end,
  
  // Nested data (from batch queries or entity content):
  tags: [...],
  hours: [...],
  
  // Search/Special-specific:
  matched_menu_items: [...],  // only in search
  matched_specials: [...],    // only in search
  matched_events: [...],      // only in search
}
```

**No duplicates. No confusing aliases. Just `slug` as the identifier.**
