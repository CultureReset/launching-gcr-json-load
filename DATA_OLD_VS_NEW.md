# Data Version Check: Old vs New API

## Answer: Cards Use **NEW** Data

All listing cards use **new** API data from the cosmos-era endpoints.

---

## Data Sources Breakdown

### **Listing Cards: NEW API**

```
GCR.businesses ← /api/gcr/entities?limit=500
    ↓
    ├─ name, slug, city, rating, tags, description
    ├─ address, phone, logo_url, price_range
    ├─ featured, happy_hour, booking_required
    └─ (Basic info only, no menu items/specials)
```

**Endpoint:** `/api/gcr/entities?limit=500`  
**Version:** ✓ NEW (cosmos-era)  
**Data:** Basic business info (fast to fetch, cached)

---

### **Profile Pages (Cosmos): NEW API**

```
Full profile ← /api/gcr/entity/{slug}
    ↓
    ├─ (All basic info from /entities)
    ├─ menu_items: [{...}, {...}]
    ├─ drink_items: [{...}, {...}]
    ├─ specials: [{...}, {...}]
    ├─ sections: [{...}, {...}]
    ├─ photos: [...]
    ├─ hours: {...}
    └─ (Complete profile, lazy-loaded)
```

**Endpoint:** `/api/gcr/entity/{slug}`  
**Version:** ✓ NEW (cosmos-era)  
**Data:** Complete business + content (fetched on-demand)

---

## Comparison: Two Endpoints, Same API Version

```
┌──────────────────────────────────────────────────┐
│  API VERSION: NEW (Both cosmos-era)              │
└──────────────────────────────────────────────────┘

ENDPOINT 1: /api/gcr/entities?limit=500 (LISTINGS)
├─ Purpose: Get all businesses quickly
├─ Data: name, rating, city, tags, description, address
├─ Size: ~200KB (4MB with caching)
├─ Speed: Fast (returns ~500 businesses)
├─ Used by: All listing pages, home, search
└─ Cached: YES (5 min TTL)

ENDPOINT 2: /api/gcr/entity/{slug} (PROFILE)
├─ Purpose: Get complete business detail
├─ Data: All from /entities PLUS menu_items, specials, sections
├─ Size: ~50KB per business
├─ Speed: Slower (fetches single business)
├─ Used by: Profile pages, menu pages, qr-menu pages
└─ Cached: YES (5 min TTL per slug)
```

---

## What Data Do Cards Actually Display?

```javascript
// From /api/gcr/entities?limit=500:
{
  id: "...",
  slug: "cosmos-restaurant-bar-zJgenE",
  name: "Cosmos Restaurant & Bar",
  rating: 4.8,
  review_count: 247,
  tags: ["waterfront", "live-music", "happy-hour"],
  description: "Premium Italian and seafood restaurant...",
  city: "Orange Beach",
  price_range: "$$",
  address: "123 Main St, Orange Beach, AL 36561",
  phone: "251-123-4567",
  logo_url: "https://...",
  featured: true,
  booking_required: false,
  happy_hour: true,
  hh_days: "Mon-Fri",
  
  // NOT in /entities (lazy-loaded in /entity/{slug}):
  // menu_items: [...],
  // drink_items: [...],
  // specials: [...],
  // sections: [...],
  // hours: {...},
  // photos: [...]
}

// This is the EXACT data that cards display
// All of it is from NEW API ✓
```

---

## Old vs New Comparison

### **What was OLD (no longer used)**

```javascript
// OLD Search endpoint (what search.html was trying to use):
POST /api/gcr/search
Response: {
  results: [{
    slug: "cosmos",
    matched_menu_items: [...],      // ← Pre-computed on server
    matched_drink_items: [...],
    matched_specials: [...]
  }]
}

❌ BROKEN: API doesn't return matched_* fields anymore
❌ BROKEN: Tried to show menu items in search results
❌ BROKEN: search.html couldn't render
```

### **What is NEW (what everything uses now)**

```javascript
// NEW entities endpoint:
GET /api/gcr/entities?limit=500
Response: [{
  slug: "cosmos",
  name: "Cosmos Restaurant & Bar",
  rating: 4.8,
  description: "...",
  // NO menu_items, NO matched_* fields
  // Just basic business info
}]

✓ Cards render this perfectly
✓ Lightweight, fast
✓ Profile fetches menu items separately when needed

// NEW profile endpoint:
GET /api/gcr/entity/{slug}
Response: {
  slug: "cosmos",
  name: "Cosmos Restaurant & Bar",
  rating: 4.8,
  description: "...",
  menu_items: [...],       // ← Only fetched when viewing profile
  drink_items: [...],
  specials: [...],
  sections: [...],
  // Complete business data
}

✓ Profile pages render this perfectly
✓ Lazy-loaded (only fetch when user clicks)
✓ Full content available
```

---

## Data Timeline

```
OLD ERA (before cosmos):
├─ Search endpoint: /api/gcr/search with matched_* fields
├─ Profile endpoint: (unknown structure)
└─ DATA: Pre-computed, server-side aggregation

NEW ERA (cosmos, current):
├─ List endpoint: /api/gcr/entities?limit=500 (basic info)
├─ Profile endpoint: /api/gcr/entity/{slug} (full detail)
├─ Search endpoint: Also /api/gcr/search but returns different format
└─ DATA: Client-side aggregation, lazy-loaded profiles

FIXED NOW:
└─ Search: Now uses NEW pattern (fetches profiles, extracts items client-side)
```

---

## Current Data Flow (All NEW)

```
Page Loads (e.g., restaurants.html)
    ↓
GCR.load() → /api/gcr/entities?limit=500 ✓ NEW
    ↓
GCR.businesses[] = [{...}, {...}, ...] (basic info)
    ↓
renderBizCard(biz, 'restaurants') → Display card
    ✓ Uses: name, rating, tags, description, etc. (all from NEW API)
    ↓
User clicks [View Page]
    ↓
profile.html?id=cosmos
    ↓
GCR.loadProfile(slug) → /api/gcr/entity/{slug} ✓ NEW
    ↓
Returns: full profile with menu_items, specials, sections, etc.
    ↓
Profile renders menu items, photos, hours
```

**Every step uses NEW API endpoints.** ✓

---

## Summary: Data Versions

| Component | Endpoint | Version | Status |
|-----------|----------|---------|--------|
| **Listing Cards** | `/entities?limit=500` | ✓ NEW | ✓ Working |
| **Profiles** | `/entity/{slug}` | ✓ NEW | ✓ Working |
| **Happy Hours** | `/happy-hours` | ✓ NEW | ✓ Working |
| **Events** | `/events` | ✓ NEW | ✓ Working |
| **Specials** | `/specials` | ✓ NEW | ✓ Working |
| **Search** | `/search` (was broken) | ✓ NEW | ✓ FIXED |
| **GA4/Meta IDs** | `/settings/*` | ✓ NEW | ✓ Working |

---

## Old API (No Longer Used)

```javascript
❌ POST /api/gcr/search with matched_menu_items
   └─ Used by: search.html (BROKEN, now fixed)
   
❌ Old entity structure with pre-computed fields
   └─ No longer exists in current API
```

---

## Conclusion

✓ **Cards show NEW data** from `/api/gcr/entities?limit=500`  
✓ **Profiles show NEW data** from `/api/gcr/entity/{slug}`  
✓ **All endpoints are aligned** on the new API version  
✓ **Search is now fixed** to use the same NEW pattern  

**Everything is NEW.** No old data is being used anywhere.

