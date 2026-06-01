# COMPLETE GCR DATA FLOW

## 1. RAW DATA (Your Source)
```
all-restaurants-raw.json, all-restaurants-raw.json, etc.
├── Messy format (Google Maps, Markdown, CSV)
├── Fields: name, rating, hours, address, phone, images
└── Structure: NOT normalized
```

## 2. TRANSFORMER LAYER (Must Build)
```
Raw Data → JavaScript/Node Script
├── Extract: name, address, hours, phone, rating, images
├── Normalize: field names, data types
├── Validate: required fields present
└── Output: Standardized JSON
```

## 3. STANDARDIZED JSON FORMAT (Required)
```json
{
  "id": "uuid",                          // REQUIRED for identifying entity
  "name": "Business Name",               // REQUIRED - card title
  "slug": "business-name",               // REQUIRED - URL-safe ID
  "entity_type": "restaurant",           // REQUIRED - determines page routing
  "entity_subtype": "seafood_restaurant",// OPTIONAL - for category icons
  "hero_image_url": "https://...",       // OPTIONAL - card image
  "description": "Short description",    // OPTIONAL - card text
  "address_line_1": "123 Main St",       // OPTIONAL - address on card
  "address_line_2": "Suite 100",
  "city": "Gulf Shores",                 // OPTIONAL - address
  "state": "AL",
  "zip": "36542",
  "rating": 4.5,                         // OPTIONAL - star rating
  "review_count": 192,                   // OPTIONAL - review count text
  "phone": "(251) 555-1234",             // OPTIONAL - call button
  "website_url": "https://...",          // OPTIONAL - link
  "hours": [                             // OPTIONAL - hours display
    {
      "day": "monday",
      "open": "09:00",
      "close": "22:00"
    },
    { "day": "tuesday", "open": "09:00", "close": "22:00" },
    { "day": "wednesday", "open": "09:00", "close": "22:00" },
    { "day": "thursday", "open": "09:00", "close": "22:00" },
    { "day": "friday", "open": "09:00", "close": "23:00" },
    { "day": "saturday", "open": "10:00", "close": "23:00" },
    { "day": "sunday", "open": "10:00", "close": "22:00" }
  ],
  "menu_url": "https://...",             // OPTIONAL - menu link
  "booking_url": "https://...",          // OPTIONAL - booking button
  "reservation_url": "https://...",      // OPTIONAL - reserve button
  "order_url": "https://...",            // OPTIONAL - order button
  "tags": [                              // OPTIONAL - chips on card
    "seafood",
    "waterfront",
    "live_music"
  ],
  "price_from": 15,                      // OPTIONAL - price badge
  "price_unit": "per person"
}
```

## 4. API SERVER (api-server.cjs)
```
Reads: standardized JSON
Serves: REST endpoints
├── GET /api/gcr/entities?limit=500
├── GET /api/gcr/entity/{id}
├── GET /api/gcr/events
├── GET /api/gcr/specials
└── GET /api/gcr/happy-hours
```

## 5. FRONTEND (gcr-listings.js)
```
Fetches from API
↓
Extracts fields:
├── Hero image (hero_image_url)
├── Name (name)
├── City/State (city, state)
├── Rating (rating, review_count)
├── Hours (hours[])
├── Entity type (entity_type → determines routing)
├── Tags (tags[] → chips on card)
└── Buttons (phone, menu_url, booking_url, etc.)
↓
Renders card with:
┌─────────────────────────┐
│  [Image]    [Badge]     │
│  [Status]   [Price]     │
├─────────────────────────┤
│ Name                    │
│ City, State             │
│ Description (3 lines)   │
│ ⭐ 4.5 (192 reviews)    │
│ [Tags/Chips]            │
├─────────────────────────┤
│ 🕐 Hours                │
│ 🍺 Happy Hour info      │
│ 🎸 Live Music           │
├─────────────────────────┤
│ 📍 Address              │
│ [View Profile] [Menu]   │
│ [Book] [Call] [Order]   │
└─────────────────────────┘
```

## 6. ROUTING (Where Entity Type Matters)

**entity_type** determines WHICH PAGE:

| entity_type | Page | Example |
|---|---|---|
| restaurant, seafood_restaurant, bar, cafe | `restaurants.html` | Joe's Seafood |
| coffee_shop, bakery, ice_cream | `coffee-sweets.html` | Joe's Coffee |
| boutique, gift_shop, retail | `shopping.html` | Coastal Boutique |
| parasailing, boat_rental, tour, amusement_park | `things-to-do.html` | Adventure Island |
| nightclub, lounge, sports_bar | `nightlife.html` | The Wharf |
| hotel, condo, vacation_rental | `staying.html` | Boardwalk Resort |

**SUBTYPES WITHIN EACH PAGE:**

```javascript
// restaurants.html shows:
- seafood_restaurant ← icon 🐟
- pizza_restaurant ← icon 🍕
- bar_grill ← icon 🍴
- pub ← icon 🍻

// things-to-do.html shows:
- parasailing ← icon 🪂
- boat_rental ← icon 🚤
- fishing_charter ← icon 🎣
- tour ← icon 🧭
```

## 7. FIELD MAPPING: Raw → Display

| Raw Field | Maps To | Displays As | Required? |
|---|---|---|---|
| name | entity.name | Card title | ✅ YES |
| rating | entity.rating | ⭐ Stars | ⚠️ Recommended |
| reviews | entity.review_count | "(192 reviews)" | ⚠️ Recommended |
| hours | entity.hours[] | "🕐 Mon-Fri 9AM-10PM" | ❌ NO (nice to have) |
| address | entity.address_line_1, city, state, zip | "📍 123 Main St" | ❌ NO |
| phone | entity.phone | "📞 Call" button | ❌ NO |
| image_url | entity.hero_image_url | Card background | ⚠️ Fallback if missing |
| website | entity.website_url | Link in profile | ❌ NO |
| category | entity.entity_type | Determines page | ✅ YES |
| type/subtype | entity.entity_subtype | Badge icon | ⚠️ Recommended |
| description | entity.description | Card text (3 lines) | ❌ NO |
| tags/features | entity.tags[] | Chips below rating | ❌ NO |

## 8. HOURS FORMAT (Critical)

**If you have hours, MUST be this format:**

```json
"hours": [
  { "day": "monday", "open": "09:00", "close": "22:00" },
  { "day": "tuesday", "open": "09:00", "close": "22:00" },
  ...
]
```

**Rendering logic:**
```
- If entity.hours exists AND today is in it
  → Show "🕐 Mon-Fri 9AM–10PM"
- If not provided
  → No hours display (OK)
```

## 9. IMAGES (Critical)

**If no image provided:**
```
1. Uses hero_image_url from database
2. Falls back to category image:
   - restaurants → seafood photo
   - coffee → coffee shop photo
   - tours → water activity photo
   - etc.
3. Fallback → generic beach photo
```

**Image MUST be URL (not local file):**
```javascript
✅ "https://supabase.co/storage/v1/object/public/images/123.jpg"
❌ "Attachments/image.jpg"
❌ "local/path/image.jpg"
```

## 10. CARDS WITHOUT REQUIRED FIELDS

**What breaks:**

| Missing Field | What Happens |
|---|---|
| `name` | Card title blank → Card breaks |
| `entity_type` | Can't route to page → Card hidden or misplaced |
| `slug` or `id` | Can't click card → onClick breaks |

**What's OK to miss:**

| Missing Field | What Happens |
|---|---|
| `hours` | No hours display, everything else works |
| `rating` | No stars, everything else works |
| `hero_image_url` | Uses fallback image |
| `phone` | No call button |
| `tags` | No chips below rating |

## 11. EXAMPLE TRANSFORMATIONS

### Restaurant (has hours, menu, reservations)
```json
{
  "id": "rest-001",
  "name": "Joe's Seafood",
  "slug": "joes-seafood",
  "entity_type": "restaurant",
  "entity_subtype": "seafood_restaurant",
  "hero_image_url": "https://images.com/joes.jpg",
  "description": "Fresh Gulf seafood, outdoor seating",
  "address_line_1": "123 Beach Blvd",
  "city": "Gulf Shores",
  "state": "AL",
  "zip": "36542",
  "rating": 4.7,
  "review_count": 284,
  "phone": "(251) 555-0123",
  "hours": [
    { "day": "monday", "open": "11:00", "close": "22:00" },
    { "day": "tuesday", "open": "11:00", "close": "22:00" }
  ],
  "tags": ["seafood", "waterfront", "outdoor_seating"],
  "menu_url": "https://joes.com/menu",
  "reservation_url": "https://joes.com/reserve"
}
```

### Activity (boat rental, no hours needed)
```json
{
  "id": "act-001",
  "name": "Gulf Coast Boat Rentals",
  "slug": "gulf-coast-boat-rentals",
  "entity_type": "boat_rental",
  "entity_subtype": "boat_rental",
  "hero_image_url": "https://images.com/boats.jpg",
  "description": "Rent speedboats or fishing boats",
  "address_line_1": "Marina Dock, 456 Harbor Dr",
  "city": "Orange Beach",
  "state": "AL",
  "rating": 4.4,
  "review_count": 156,
  "phone": "(251) 555-9999",
  "price_from": 95,
  "price_unit": "per hour",
  "tags": ["water_sports", "rental"],
  "booking_url": "https://boats.com/book"
}
```

### Hotel (hours not relevant)
```json
{
  "id": "hotel-001",
  "name": "Boardwalk by Young's",
  "slug": "boardwalk-youngs",
  "entity_type": "condo",
  "hero_image_url": "https://images.com/boardwalk.jpg",
  "description": "Gulf-front condos with pool",
  "address_line_1": "409 E Beach Blvd",
  "city": "Gulf Shores",
  "state": "AL",
  "zip": "36542",
  "rating": 4.3,
  "review_count": 192,
  "phone": "(251) 968-7158",
  "website_url": "https://youngssuncoast.com",
  "price_from": 150,
  "price_unit": "per night",
  "booking_url": "https://booking.com/boardwalk"
}
```

## SUMMARY: Data Quality Checklist

Before sending data to API, check:

- [ ] Every entity has `id`, `name`, `entity_type`
- [ ] `entity_type` is one of: restaurant, coffee_shop, shopping, things_to_do, nightlife, services, staying
- [ ] `slug` is URL-safe (lowercase, hyphens only)
- [ ] `hero_image_url` is full HTTPS URL (if provided)
- [ ] `hours[]` is correct format with all 7 days (if provided)
- [ ] `phone` is formatted "(251) 555-1234"
- [ ] `rating` is number 0-5 (if provided)
- [ ] `review_count` is number (if provided)
- [ ] All URLs start with `https://`
- [ ] All addresses have city, state, zip
- [ ] `tags` array has lowercase strings with underscores
