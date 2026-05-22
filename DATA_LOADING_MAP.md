# Data Loading Methods & API Endpoints — Full Map

## Overview
There are **3 primary data loading patterns** + **multiple inline calls**. Several endpoints overlap across different modules.

---

## 1. GCR Core Data Layer (`gcr-api.js`)
**Called on:** Every page that includes `<script src="js/gcr-api.js">`  
**Trigger:** Automatic `GCR.load()` at script parse time  
**Pattern:** Stale-while-revalidate cache (5 min TTL)  
**Base URL:** `https://cybercheck-api-database.vercel.app/api/gcr`

### Endpoints:
| Endpoint | Purpose | Cache Key | Called By |
|----------|---------|-----------|-----------|
| `GET /entities?limit=500` | All businesses + categories | `entities` | All category pages, home, search |
| `GET /events` | All events across platform | `events` | Events page, calendar, home |
| `GET /specials` | All active specials/deals | `specials` | Specials page, listings |
| `GET /happy-hours` | Happy hour schedules | `happy-hours` | Restaurant pages, filters |
| `GET /search` | Full-text search (POST) | - | Search box (app.js) |
| `GET /entity/{slug}` | Single entity full profile | `profile:{slug}` | Profile pages, detail views |
| `GET /settings/ga4_id` | GA4 tracking ID | `gcr:tracking:v1` | Auto-injected, 1 hr TTL |
| `GET /settings/meta_pixel_id` | Meta Pixel ID | `gcr:tracking:v1` | Auto-injected, 1 hr TTL |

**Files:** `gcr-api.js` — 390 KB when cached  
**Events:** Fires `gcr:loaded`, `gcr:refreshed` custom events

---

## 2. Tourist Identity & Saves (`gcr-saves.js`)
**Called on:** Pages with `<script src="js/gcr-saves.js">`  
**Pattern:** User auth + personalized saves  
**Base URL:** `https://cybercheck-api-database.vercel.app/api/tourist` OR `/api/admin/tourist`

### Endpoints:
| Endpoint | Method | Purpose | Auth | Called By |
|----------|--------|---------|------|-----------|
| `POST /api/admin/tourist/send-verification-code` | POST | Send SMS code | ✗ | Login modal |
| `POST /api/tourist/verify` | POST | Verify code + get token | ✗ | Login modal |
| `POST /api/tourist/backfill-anonymous` | POST | Convert guest → user | ✓ | Saves (auto) |
| `GET /api/tourist/saves` | GET | Fetch user's saves | ✓ | GCRSaves.load() |
| `POST /api/tourist/saves` | POST | Add/update save | ✓ | Save button |
| `DELETE /api/tourist/saves/{slug}` | DELETE | Remove save | ✓ | Unsave button |

**Files:** `gcr-saves.js` — Tourist identity + save-button UI injection  
**Auth:** JWT token in `localStorage.cc_tourist_token`

---

## 3. Booking System (`square-booking-modal.js`)
**Called on:** Pages with `<script src="js/square-booking-modal.js">`  
**Pattern:** Multi-step booking, payment processing  
**Base URL:** `window.API_BASE` or `https://cybercheck-api-database.vercel.app`

### Endpoints:
| Endpoint | Method | Purpose | Notes |
|----------|--------|---------|-------|
| `GET /api/public/payment-config?subdomain=` | GET | Square/Stripe keys | Per-site payment processor |
| `GET /api/stripe/publishable-key` | GET | Stripe key (fallback) | Used if config fails |
| `GET /api/public/availability?subdomain=&date=` | GET | Available time slots | Called on date picker change |
| `POST /api/public/hold` | POST | Reserve time slot | Before payment |
| `POST /api/square/create-payment` | POST | Process Square payment | Payment processor |
| `POST /api/stripe/create-payment-intent` | POST | Create Stripe intent | Payment processor |
| `POST /api/whatsapp/send` | POST | Send SMS confirmation | Via `https://cybercheck-login.vercel.app` |
| `POST /api/bookings` | POST | Save booking record | Final confirmation |
| `GET /api/bookings/{id}?subdomain=` | GET | Fetch booking status | Confirm modal |

**Files:** `square-booking-modal.js` — 2400+ lines, self-contained  
**Config:** `window.API_BASE`, `window.SUBDOMAIN`, `window.DARK_MODE`

---

## 4. Page-Specific Data Loading (Inline Scripts)

### `menu.html`
```javascript
// Loads on every page open
GCR_API = 'https://cybercheck-api-database.vercel.app/api/gcr'
GET /api/gcr/entity/{slug}    // Full profile with menu_items, drink_items
```
**Refresh:** Auto-refresh every 30 sec (configurable)

### `profile.html` & `*-profile.html`
```javascript
// Two parallel calls on page load
Promise.all([
  GET /api/gcr/entity/{slug},          // Business data
  GET /api/gcr/community-photos/{slug} // User photos
])
```
**Overlap:** Both use GCR_API, same endpoint for entity data

### `home.html`
```javascript
// Multiple inline calls
GET /api/gcr/category-page-config/{categoryId}  // Hero + page metadata
GET /api/gcr/site-config                        // Global config (new, not in summary)
GET /api/gcr/category-cards                     // Category card overrides (new, not in summary)
// Then uses GCR.businesses, GCR.events for rendering
```

### `search.html`
Uses `GCR.search(query)` from gcr-api.js → POST `/api/gcr/search`

---

## 5. Secondary / Admin Endpoints

| Endpoint | Method | Purpose | File | Notes |
|----------|--------|---------|------|-------|
| `GET /api/admin/auth-config` | GET | Auth mode (email/sms) | `gcr-auth.js` | Not used in public pages |
| `POST /api/gcr/claim` | POST | Business claim | `claim-modal.js` | Hardcoded URL |
| `POST /api/gcr/track` | POST | Page view tracking | `app.js` | Via GCR API |
| `POST /api/gcr/tourist/register` | POST | Create tourist account | `app.js` | Alternative signup |
| `GET /api/public/funnel?subdomain=` | GET | Funnel analytics | `booking-modal.js` | Via `_TRACK_API` |
| `POST /api/public/business-lead` | POST | Contact form submission | (not found) | Likely in forms |
| `GET /api/qr/locations` | GET | QR code data | (not found) | Likely in QR pages |
| `GET /api/qr/scans` | GET | QR scan analytics | (not found) | Likely in analytics |
| `GET /api/dashboard/events` | GET | Event data feed | (not found) | Likely in dashboard pages |
| `GET /api/tourist/recommendations?limit=6` | GET | Personalized recommendations | (not found) | Likely in recommendation feature |

---

## 6. External API Calls (Non-Backend)

| Service | Endpoint | Purpose |
|---------|----------|---------|
| **Google Maps** | `maps.google.com` | Directions links |
| **Stripe** | `https://js.stripe.com` | Payment JS SDK |
| **Square** | `https://sandbox.web.squarecdn.com` OR `https://web.squarecdn.com` | Payment SDK |
| **Google Analytics** | `https://www.googletagmanager.com/gtag/js` | GA4 tracking |
| **Meta Pixel** | `https://connect.facebook.net/en_US/fbevents.js` | FB tracking |
| **Google Fonts** | `https://fonts.googleapis.com/css2` | Inter font |
| **Supabase** | `https://xbptmkpbiqzvxptjkfoi.supabase.co` | File storage (images) |
| **Open Weather** | `https://api.open-meteo.com` | Weather data (some pages) |

---

## Overlap Analysis

### 🔴 CRITICAL OVERLAP: Entity Data

**Same endpoint called from multiple places:**

1. **GCR Core Load** → `GET /api/gcr/entities?limit=500`
   - Retrieves all businesses at once
   - Used by: home, restaurants, activities, nightlife, etc.
   - Cached: 5 min

2. **Profile Page Load** → `GET /api/gcr/entity/{slug}`
   - Retrieves single full profile
   - Used by: profile.html, restaurant-profile.html, activity-profile.html
   - Cached: 5 min (per slug)

3. **Menu Page Load** → `GET /api/gcr/entity/{slug}`
   - Same endpoint, same data
   - Refreshes every 30 sec (wastes bandwidth)
   - **INEFFICIENT:** Could use GCR.loadProfile() instead

---

### 🟡 MEDIUM OVERLAP: Event/Special Data

1. **GCR Events** → `GET /api/gcr/events`
   - Full event list (cached)
   - Used by: home, events page, calendar

2. **GCR Specials** → `GET /api/gcr/specials`
   - Full special list (cached)
   - Used by: home, specials page, business detail

Both fetched via GCR.load() — **no duplication**, good.

---

### 🟢 MINOR OVERLAP: Auth Endpoints

1. **Auth Config** → `GET /api/admin/auth-config`
   - Loaded by: gcr-auth.js (not used on public pages)

2. **Tourist Register** → `POST /api/gcr/tourist/register`
   - Alternative signup flow
   - Called from: app.js (secondary path)

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  Page Load Sequence                         │
└─────────────────────────────────────────────────────────────┘

1. HTML parsed
   ↓
2. <script src="gcr-api.js"> → GCR.load()
   ├─ Check localStorage cache (instant)
   ├─ If found & fresh: render from cache + background refresh
   └─ If missing: fetch parallel [entities, events, specials, happy-hours]
   ↓
3. <script src="gcr-saves.js"> → GCRSaves.init()
   ├─ Check localStorage for user token
   ├─ If exists: fetch user's saves
   └─ Fire gcr:saves:ready event
   ↓
4. Page-specific script (e.g., app.js)
   ├─ Wait for gcr:loaded event
   ├─ Render listings from GCR.businesses/events/specials
   └─ Attach save-buttons, search handlers
   ↓
5. If booking modal needed:
   ├─ <script src="square-booking-modal.js"> → insertBookingModal()
   ├─ openBooking(slug) → fetch /api/public/payment-config
   └─ Fetch availability, process payment, send SMS
```

---

## Configuration Injection Points

| Variable | Default | Used By | Overridable |
|----------|---------|---------|-------------|
| `window.CC_API_BASE` | Not set (falls back to Vercel) | login/admin | ✓ In console |
| `window.API_BASE` | `https://cybercheck-api-database.vercel.app` | square-booking-modal | ✓ Via window |
| `window.SUBDOMAIN` | `''` | Booking modal | ✓ Via window |
| `window.DARK_MODE` | `false` | Booking modal | ✓ Via window |
| `window.WHATSAPP_API_BASE` | `https://cybercheck-login.vercel.app` | SMS send | ✓ Via window |
| `GCR_API` | `https://cybercheck-api-database.vercel.app/api/gcr` | gcr-api.js | ✗ Hardcoded |
| `GCR_CACHE_VERSION` | `'v9'` | Cache invalidation | ✗ Hardcoded |
| `GCR_CACHE_TTL_MS` | `5 * 60 * 1000` | Cache freshness | ✗ Hardcoded |

---

## Inefficiencies & Recommendations

### 1. **Menu Page Refresh Overkill**
- Refreshes every 30 sec with `GET /api/gcr/entity/{slug}`
- **Fix:** Use cached GCR.loadProfile() with `forceRefresh=false`, or increase refresh interval

### 2. **Duplicate Entity Fetches**
- Profile pages call `GET /api/gcr/entity/{slug}`
- GCR core already caches this per-slug
- **Fix:** Use `GCR.loadProfile(slug)` instead of direct fetch

### 3. **No Deduping for Happy Hour + Specials**
- Both merged into listings, some entities have overlapping data
- **Fix:** Dedup by entity_id + name in rendering layer

### 4. **Tracking IDs Fetched Separately**
- GA4 & Meta Pixel IDs fetched on every page load
- **Fix:** Reduce to 1 combined endpoint: `GET /api/gcr/settings` (single request for all config)

### 5. **No Offline Support**
- Falls back to cache on network error, but cache is all-or-nothing
- **Fix:** Consider partial hydration from cache + show "offline" banner

---

## Summary Table: All Endpoints

| Base | Endpoint | Method | Module | Cache | TTL |
|------|----------|--------|--------|-------|-----|
| `/api/gcr` | `/entities?limit=500` | GET | gcr-api | Yes | 5m |
| `/api/gcr` | `/events` | GET | gcr-api | Yes | 5m |
| `/api/gcr` | `/specials` | GET | gcr-api | Yes | 5m |
| `/api/gcr` | `/happy-hours` | GET | gcr-api | Yes | 5m |
| `/api/gcr` | `/entity/{slug}` | GET | gcr-api + pages | Yes | 5m |
| `/api/gcr` | `/community-photos/{slug}` | GET | profile.html | No | — |
| `/api/gcr` | `/search` | POST | search.html | No | — |
| `/api/gcr` | `/settings/ga4_id` | GET | gcr-api | Yes | 1h |
| `/api/gcr` | `/settings/meta_pixel_id` | GET | gcr-api | Yes | 1h |
| `/api/gcr` | `/category-page-config/{id}` | GET | gcr-config.js | No | — |
| `/api/gcr` | `/claim` | POST | claim-modal | No | — |
| `/api/gcr` | `/track` | POST | app.js | No | — |
| `/api/gcr` | `/tourist/register` | POST | app.js | No | — |
| `/api/tourist` | `/send-verification-code` | POST | gcr-saves | No | — |
| `/api/tourist` | `/verify` | POST | gcr-saves | No | — |
| `/api/tourist` | `/backfill-anonymous` | POST | gcr-saves | No | — |
| `/api/tourist` | `/saves` | GET/POST | gcr-saves | No | — |
| `/api/public` | `/payment-config` | GET | booking-modal | No | — |
| `/api/public` | `/availability` | GET | booking-modal | No | — |
| `/api/public` | `/hold` | POST | booking-modal | No | — |
| `/api/public` | `/funnel` | GET | booking-modal | No | — |
| `/api/public` | `/business-lead` | POST | (unknown) | No | — |
| `/api/square` | `/create-payment` | POST | booking-modal | No | — |
| `/api/stripe` | `/create-payment-intent` | POST | booking-modal | No | — |
| `/api/stripe` | `/publishable-key` | GET | booking-modal | No | — |
| `/api/admin` | `/auth-config` | GET | gcr-auth | No | — |
| `/api/whatsapp` | `/send` | POST | booking-modal | No | — |
| `/api/bookings` | `(multiple)` | GET/POST | booking-modal | No | — |

---

## Load on Different Pages

### **home.html**
1. `gcr-api.js` → GCR.load() [entities, events, specials, happy-hours]
2. `gcr-config.js` → `/category-page-config/home`
3. Inline: `/site-config`, `/category-cards`
4. `app.js` → `/api/gcr/track`

### **restaurants.html** (category page)
1. `gcr-api.js` → GCR.load() [entities filtered by category]
2. `gcr-config.js` → `/category-page-config/restaurants`
3. `app.js` → Standard listeners

### **profile.html** (single entity)
1. `gcr-api.js` → GCR.load() (background)
2. Inline: Parallel fetch `/entity/{slug}` + `/community-photos/{slug}`
3. `gcr-saves.js` → Check user saves
4. Render profile from fetched data

### **menu.html** (restaurant menu)
1. Auto-load: `/entity/{slug}` on page open
2. Auto-refresh: Every 30 sec
3. Manual refresh: On button click

### **search.html**
1. `gcr-api.js` → GCR.load()
2. On query: `GCR.search(q)` → POST `/search`
3. Fallback: Client-side search from cached GCR.businesses

