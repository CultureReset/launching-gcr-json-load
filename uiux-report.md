# GCR UI/UX Audit Report

**Generated:** 4/17/2026, 1:50:38 PM
**Pages reviewed:** 20
**API:** https://cybercheck-api-database.vercel.app/api/gcr
**Model:** Haiku (all agents in parallel)
**Time:** 19.2s

---

## Artists `artists.html`

# GCR Artists Page (artists.html) — Audit Report

---

## 1. DATA LOADING — CRITICAL FAILURE ❌

**Issue**: Page has **zero integration** with `GCR.load()` or `gcr:loaded` event listener.

**Evidence**:
- Line 311–401: Hardcoded artist cards (`Tim Roberts`, `Wharf Amphitheater`, `Gulf Coast Blues Band`) 
- No `<script>` that calls `GCR.load()`
- No `document.addEventListener('gcr:loaded', ...)` 
- `<div id="artistGrid">` (line 297) exists but is never populated by JavaScript
- Scripts loaded at bottom (lines 408–411) are generic (`gcr-api.js`, `app.js`, `claim-modal.js`, `gcr-config.js`) — **no artist-specific renderer**

**Result**: Live API data will **never render**. Only hardcoded sample cards display.

---

## 2. LAYOUT — STRUCTURALLY SOUND ✅

**Present & Correct**:
- Header with nav tabs (lines 47–59) ✓
- Filter chips bar (lines 62–72) ✓
- Featured section (lines 75–114) ✓
- Artist grid container (line 297: `<div id="artistGrid">`) ✓
- Call-to-action section (lines 403–412) ✓
- Footer (lines 414–421) ✓

**Missing**: No loading spinner, error state, or empty-state message.

---

## 3. FILTER CHIPS — PRESENT BUT DISCONNECTED ❌

**Lines 65–72**: Filter chips defined:
```html
<button class="filter-chip active" data-filter="all">All</button>
<button class="filter-chip" data-filter="country">🤠 Country</button>
<button class="filter-chip" data-filter="rock">🎸 Rock</button>
<button class="filter-chip" data-filter="beach-music">🌊 Beach Music</button>
<!-- etc -->
```

**Problems**:
1. **No click handlers** — Chips have no `onclick` or event listeners attached
2. **Tag mismatch** — Filter values (`country`, `rock`, `beach-music`) don't match API sample tags from data:
   - API uses: `"tag": "speakeasy"`, `"tag": "cocktails"`, etc. (generic business tags)
   - **Artists schema is undefined** — no sample artist data provided; unclear what tag structure artists use
3. **No filtering logic** — No JavaScript filters `#artistGrid` cards based on chip clicks

**Status**: Non-functional decoration.

---

## 4. CARD RENDERING — WILL FAIL WITH LIVE DATA ❌

**Current**: Hardcoded HTML cards (lines 302–394)

**Issues when switching to live data**:

| Field | Needed | API Has? | Notes |
|-------|--------|----------|-------|
| `name` | ✓ | ✓ | `"name": "8 Reale"` — maps fine |
| `description` | ✓ | ✓ | Long text available |
| `image` | ✓ | ✓ | `"photos": [{...}]` array |
| `genre/tags` | ✓ | ⚠️ | Tags exist but mixed (business + category) — not artist-specific |
| `upcoming_shows` | ✓ | ✗ | **NOT IN API** — only business data, no event/show schedule |
| `tagline/subtitle` | ✓ | ✓ | `"subtitle"`, `"tagline"` |
| `artist_icon` (emoji) | ✓ | ✓ | `"icon"` (but often null) |

**Critical gaps**:
- **No artist event data** — API sample shows business listings, not artist shows/gigs
- **No booking info** — No `booking_url` specifically for artists
- **No genre classification** — Tags are business-type (bar, restaurant) not music genre

**Example: Tim Roberts card (lines 305–327)**
```html
<span class="artist-genre">Country / Beach</span>
<p class="artist-tagline">Gulf Coast originals, country & rock...</p>
<div class="artist-shows">
  <div class="show-row">
    <span class="show-date">Mar 8</span>
    <span class="show-venue">Luna's · 7pm</span>
    <span>Free</span>
  </div>
```
This data **does not exist** in the API response. Hardcoded.

---

## 5. MISSING FEATURES — SEVERAL ❌

| Feature | Status | Notes |
|---------|--------|-------|
| **Dynamic card rendering** | ❌ Missing | No JS loop over `GCR.businesses` or artist-specific endpoint |
| **Filter logic** | ❌ Missing | Chips present but no `filter-chip` click handlers |
| **Search** | ❌ Missing | No search input or filter-by-name |
| **Show schedule** | ❌ Missing | No event/gig data in API sample |
| **Claim/Submit flow** | ⚠️ Partial | `claim.html` link present (line 410) but no form validation shown |
| **Artist profiles** | ⚠️ Partial | Links to `profile.html?id=...` but page not audited |
| **Social links** | ⚠️ Partial | API has `social_instagram`, `social_facebook`, `social_tiktok` but cards don't display them |
| **Rating/reviews** | ❌ Missing | API has `rating` & `review_count` but cards ignore them |
| **Contact/booking** | ⚠️ Partial | API has `phone`, `email`, `website_url` but cards don't link to them |

---

## 6. RESPONSIVE ISSUES — MINOR ⚠️

**`.artist-grid`** (line 296):
```css
grid-template-columns: repeat(auto

## Circle Boats `circle-boats.html`

# GCR Circle Boats (circle-boats.html) — Audit Report

## 1. DATA LOADING

❌ **CRITICAL ISSUE**

- **Line 407+**: The page uses a **hardcoded inline script** that tries to fetch a single entity by slug (`'beachside-circle-boats'`)
- **Line 410**: `const slug = 'beachside-circle-boats';` — This is **not** the Circle Boats page; this is a **business profile page** masquerading as a listing page
- **Missing**: No `GCR.load()` call. No `gcr:loaded` event listener.
- **Problem**: The page never initializes the global `GCR` object. It only fetches a single entity and never populates a grid with live listings.

**What should happen**: This page should load all businesses, filter by category/tags (e.g., "boat-rentals"), and render a grid of cards — **not** a single business detail view.

---

## 2. LAYOUT STRUCTURE

❌ **SEVERE MISMATCH**

The HTML is structured as a **single-entity detail page** (like a business profile), not a **listing grid page** like `restaurants.html` would be.

- **Header** (lines 311–339): Present ✅, but styled for single business
- **Sticky nav tabs** (lines 341–347): Present ✅, but designed for business sections (About, Photos, Hours)
- **Cover slideshow** (lines 271–284): Present, designed for single business photos
- **Missing**: `<div id="listingsGrid" data-category="boat-rentals">` — **No listing grid container**
- **Missing**: Filter toolbar, search, sort chips
- **Missing**: `<div id="js-sections">` is empty (line 401) — meant for detail content, not listings

**Expected for a listing page**:
```html
<div class="results-title">
  <h2>Circle Boats & Boat Rentals</h2>
</div>
<div class="toolbar"><!-- filters --></div>
<div id="listingsGrid" data-category="things-to-do">
  <!-- cards render here -->
</div>
```

---

## 3. FILTER CHIPS

❌ **NOT PRESENT**

- No `.filter-row`, `.chips-row`, or filter UI anywhere
- No data-filter attributes
- The page doesn't use `gcr-listings.js` at all

**The API provides tags like:**
- `"boat-rentals"`, `"boat_rental"`, `"rentals"`
- `"parasailing"`, `"dolphin_cruises_tours"`, `"jet-ski-rentals-tours"`
- `"tours"`, `"activities"`, `"attraction"`

These should be rendered as clickable chips to filter the grid.

---

## 4. CARD RENDERING

❌ **WILL NOT RENDER**

The page doesn't load `gcr-listings.js` at all:

- **Line 2-4**: Only loads `styles.css`, no `gcr-listings.js`
- **Missing**: No `.gcr-card` class templates
- **Missing**: No card rendering logic
- **Line 407+**: Inline script only maps **one entity** to `BUSINESS_DATA` for a detail view

**What exists** (lines 407–420):
```javascript
const B = mapEntityToBusinessData(entityData);
window.BUSINESS_DATA = B;
```

This populates a single business object, but there's no loop to render multiple cards.

---

## 5. MISSING FEATURES

| Feature | Status | Notes |
|---------|--------|-------|
| GCR.load() | ❌ Missing | Never called |
| gcr:loaded listener | ❌ Missing | No event binding |
| gcr-listings.js | ❌ Not imported | Required for card rendering |
| Filter chips | ❌ Missing | No UI to filter |
| Search | ❌ Missing | No search input |
| Sort (distance, rating, name) | ❌ Missing | No sort controls |
| Listing grid | ❌ Missing | No `#listingsGrid` container |
| Card templates | ❌ Missing | No `.gcr-card` markup |
| Responsive grid | ❌ Missing | Grid layout hardcoded for detail view |
| Pagination | ❌ Missing | No page controls for long lists |
| Empty state | ❌ Missing | No "no results" message |
| Loading spinner | ❌ Missing | No UX for data fetch |

---

## 6. RESPONSIVE ISSUES

⚠️ **PARTIAL**

- **Header/logo**: Uses clamp() for responsive sizing ✅
- **Cover slideshow**: Responsive aspect-ratio ✅
- **Detail tabs & sections**: Mobile-friendly padding ✅

**But** — The entire page is designed for **single-business detail**, not a **listing grid**. When you add a grid, you need:
- Lines 40–50 in `gcr-listings.js` define responsive `.gcr-card` layouts (240–400px on desktop, 200px on tablet, 1fr on mobile)
- This page has no `.gcr-card` styles loaded, so if cards were added, they'd render incorrectly on mobile

---

## 7. BROKEN CODE

| Line(s) | Issue | Severity |
|---------|-------|----------|
| 2–4 | Missing `<script src="js/gcr-api.js"></script>` | 🔴 Critical |
| 2–4 | Missing `<script src="js/gcr-listings.js"></script>` | 🔴 Critical |
| 407–420 | `mapEntityToBusinessData()` function is **incomplete** — cut off mid-function | 🔴 Critical |
| 410 | Hardcoded slug `'beachside-circle-boats'` — should accept URL param or load from category | 🔴 Critical |
| 401 | `<div id="js-sections"></div>` is empty; will render nothing | 🟡 High |
| N/A | No global `GCR` object initialization; code

## Coffee Sweets `coffee-sweets.html`

# GCR Coffee & Sweets Page — Audit Report

## 1. DATA LOADING ❌ CRITICAL

**Status:** Page will **NOT load or render** listings.

- ✅ `<script src="js/gcr-api.js"></script>` present (line 291)
- ✅ `<script src="js/gcr-listings.js"></script>` present (line 293)
- ❌ **NO `GCR.load()` call anywhere** — data never fetches
- ❌ **NO event listener for `gcr:loaded`** — even if loaded, nothing triggers rendering

**Problem:**  
`gcr-api.js` exports `GCR` object but **never calls `GCR.load()`**. The page sits waiting for data that never arrives. `gcr-listings.js` presumably listens for `gcr:loaded` event but that event never fires.

**Fix Required:**
```javascript
// Add this in app.js or gcr-config.js BEFORE other scripts run
document.addEventListener('DOMContentLoaded', () => {
  GCR.load().then(() => {
    // Trigger gcr-listings.js rendering
    document.dispatchEvent(new CustomEvent('gcr:loaded', { detail: GCR }));
  });
});
```

---

## 2. LAYOUT & STRUCTURE ✅ MOSTLY OK

| Element | Status | Notes |
|---------|--------|-------|
| Header | ✅ Present | Lines 155–180, proper logo + nav |
| Category Tabs | ✅ Present | Lines 163–175, includes Coffee & Sweets link |
| Hero Section | ✅ Present | Lines 182–190, good imagery & text |
| Toolbar | ✅ Present | Lines 192–200, result count placeholder |
| Filter Tags | ⚠️ Partial | Only "All" hardcoded (line 199) |
| Listings Grid | ✅ Present | ID `#listingsGrid`, data-category="coffee-sweets" (line 206) |
| Sidebar | ✅ Present | Lines 208–242, map + CTA |
| Footer | ✅ Present | Lines 244–272 |

**Issue:** `#listingsGrid` is empty — no cards will render until data loads + gcr-listings.js fires.

---

## 3. FILTER CHIPS ⚠️ INCOMPLETE

**Current State (lines 197–200):**
```html
<div class="tag-row">
  <button class="tag-btn active" data-filter="all">All</button>
</div>
```

**Problems:**
1. Only "All" chip exists — no subcategories like Coffee, Bakery, Ice Cream visible
2. `data-filter="all"` values don't match API tag structure (`tag.tag` from JSON)
3. No JavaScript to:
   - Hydrate chips from real entity tags
   - Filter cards on click
   - Toggle active state

**Expected from API:**
```json
{
  "tag": "coffee",
  "tag_category": null
},
{
  "tag": "bakery",
  "tag_category": null
}
```

**Fix Required:**  
`gcr-listings.js` should scan `GCR.businesses` for coffee-sweets category, extract unique tags, and inject filter buttons with proper click handlers.

---

## 4. CARD RENDERING ❌ WILL FAIL

**API Data Available:**
```json
{
  "id": "7dd87a0f-1b01-4b6a-aba2-21b81f0a7fa9",
  "name": "8 Reale",
  "subtitle": "Orange Beach's BEST kept secret",
  "address_line_1": "4851 Wharf Parkway W, Suite D-112",
  "photos": [
    { "image_url": "//images.squarespace-cdn.com/..." }
  ],
  "phone": "251-484-0712",
  "website_url": "http://www.8realeobal.com",
  "entity_type": "business"
}
```

**Expected Card HTML (from styles.css, lines 65–100):**
```html
<a href="#" class="gcr-card">
  <div class="gcr-card-img" style="background-image: url(...)">
    <div class="gcr-status open">Open Now</div>
    <div class="gcr-card-badge">Coffee</div>
  </div>
  <div>
    <div class="gcr-card-name">8 Reale</div>
    <div class="gcr-card-meta">...</div>
  </div>
</a>
```

**Problems:**
1. **`gcr-listings.js` isn't shown in full** — can't confirm card template matches API fields
2. **No `.cafe-card` class in CSS** but referenced in media query (line 274)
3. **Status badge logic missing** — code needs:
   - Parse `hours` array
   - Calculate open/closed state
   - Format close time if closing soon
4. **Hardcoded card data risk** — if template uses wrong field names, cards will be blank

**Critical Assumptions to Verify:**
- Does `gcr-listings.js` map `name` → `.gcr-card-name`? ✓
- Does it use first image from `photos[]`? ✓
- Does it render address from `address_line_1`? ⚠️ Need to see actual template

---

## 5. MISSING / INCOMPLETE FEATURES

| Feature | Status | Issue |
|---------|--------|-------|
| **Data Loading** | ❌ Missing | No `GCR.load()` call |
| **Filter Tags Hydration** | ❌ Missing | Only "All" hardcoded; no dynamic tag generation |
| **Filter Logic** | ❌ Missing | No click handlers to filter cards |
| **Card Rendering** | ⚠️ Unknown | Depends on `gcr-listings.js` full code |
| **

## Concierge `concierge.html`

# GCR Concierge (concierge.html) — Audit Report

---

## 1. DATA LOADING ⚠️ **CRITICAL**

**Status:** ❌ **NOT LOADING**

### Issues:

- **Missing `gcr-api.js` import** — Line ~160 (before closing `</body>`) has inline `<script>` but **no `<script src="js/gcr-api.js"></script>`**
- **No listener for `gcr:loaded` event** — The inline chat script never waits for GCR data to hydrate
- **API called directly in chat handler** — Line 265-274 calls `${API}/chat` but GCR.businesses is never populated
- **No data hydration for responses** — When user asks "Best seafood restaurants?", the `/chat` endpoint receives no context about loaded GCR businesses

### Code Reference:
```javascript
// Line 265-274 — calls API directly, but GCR.businesses is undefined
const res = await fetch(`${API}/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: text, history: chatHistory.slice(-10) })
});
```

**Fix:** Add before closing `</body>`:
```html
<script src="js/gcr-api.js"></script>
<script>
  // Wait for GCR to load, then hydrate chat context
  document.addEventListener('gcr:loaded', () => {
    window.GCR_LOADED = true;
    console.log('✅ GCR loaded:', GCR.businesses.length, 'businesses');
  });
  GCR.load();
</script>
```

---

## 2. LAYOUT ⚠️ **PARTIAL**

**Status:** ⚠️ **HEADER PRESENT, BUT NO FOOTER / MISSING ELEMENTS**

### Present:
- ✅ `.chat-header` (Lines 245-251) — avatar, name, status indicator
- ✅ `.chat-messages` (Line 253) — scrollable message container
- ✅ `.quick-replies` (Lines 255-261) — 6 quick action buttons
- ✅ `.chat-input-bar` (Lines 263-266) — textarea + mic + send button

### Missing/Issues:
- ❌ **No footer** — No copyright, links, or branding (unlike other pages with `gcr-header`)
- ❌ **GCR Header missing** — Other pages have `.gcr-header` with logo + nav tabs. This page has **only** chat header.
  - Missing: Navigation tabs (Restaurants, Coffee, etc.) at top
  - Missing: "Join Loyalty" / "Master Calendar" action strip
  - Missing: Logo/branding above chat
- ⚠️ **Empty `<div id="messages"></div>`** (Line 253) — Correct ID, but no initial welcome message

### Code Reference:
**Missing header setup** — Compare to other pages which include at top:
```html
<div class="gcr-header">
  <div class="gcr-header-top">
    <a href="index3.html" class="gcr-logo-row">
      <img src="gcr-logo.png" alt="Gulf Coast Radar">
      <div class="gcr-logo-text">GULF<span>COAST</span>RADAR</div>
    </a>
  </div>
  <div class="gcr-cat-tabs" id="gcrCatTabs">
    <!-- nav links -->
  </div>
</div>
```

**Fix:** Add GCR header immediately after opening `<body>` tag (before `.chat-header`), and add welcome message on load.

---

## 3. FILTER CHIPS — **NOT APPLICABLE**

**Status:** ✅ **N/A** (Chat interface, not card grid)

This is a conversational chat page, not a filterable listing. No filter chips needed.

However, **quick-reply buttons** (Lines 255-261) should dynamically populate from GCR data:
```html
<button class="quick-btn" onclick="send('Best seafood restaurants?')">🦞 Seafood</button>
```
These are currently hardcoded. Should reflect live categories.

---

## 4. CARD RENDERING — **NOT APPLICABLE**

**Status:** ✅ **N/A** (Chat bubbles, not cards)

This page renders **message bubbles** (`.msg`), not business cards. The chat API response should include references to businesses, but there's no **follow-up rendering of card details**.

### Gap:
When user asks "Best seafood restaurants?" → AI replies with text only. No cards, images, or clickable business links are rendered.

**Example Response (missing):**
```
AI: "Check out these seafood spots:
   🦞 [Card: The Dock]
   🦞 [Card: Gulf Shrimp Co]"
```

**Currently Only Returns:**
```
AI: "Here are some great seafood options near Orange Beach..."
   (plain text, no links)
```

---

## 5. MISSING FEATURES ⚠️ **SEVERAL**

| Feature | Status | Issue |
|---------|--------|-------|
| **GCR Data Context** | ❌ | API never receives loaded businesses, events, specials |
| **Smart Chat Responses** | ❌ | Chat endpoint can't reference real listings (no context injection) |
| **Clickable Results** | ❌ | No business cards/links in chat responses |
| **Session Persistence** | ⚠️ | Line 228: `let sessionId = params.get('s')` grabbed but never used |
| **Voice Mode** | ⚠️ | Lines 340+ implement Whisper + TTS, but `speakWithOpenAIAndListen()` is incomplete (cuts off mid-function at line ~450) |
| **Typing Indicator** | ✅ | Present (Lines 341-347) |
| **Auto-scroll** | ✅ | Present (messagesEl.scrollTop in

## Deals `deals.html`

# GCR Deals Page Audit

## 1. Data Loading ❌ CRITICAL

**Issue:** No explicit `GCR.load()` call on page.

- **Line:** Missing in `<script>` section
- **Problem:** The page includes `gcr-api.js` and `app.js`, but **neither file contains a call to `GCR.load()`** at page startup
- **Current State:** `GCR.businesses` will be `[]` empty array; `gcr:loaded` event fires but with no data
- **Result:** `#listingsGrid` will render empty

**Fix Required:**
```js
// Add to bottom of gcr-api.js or in deals.html before close </body>
document.addEventListener('DOMContentLoaded', () => {
  GCR.load();
});
```

---

## 2. Layout Structure ✅ PRESENT

**Header:** ✅ Present (lines 92–109)  
**Nav tabs:** ✅ Present (lines 99–108, `gcr-cat-tabs`)  
**Filter toolbar:** ✅ Present (lines 123–139)  
**Listing grid:** ✅ Present (line 149, `id="listingsGrid"`)  
**Sidebar panels:** ✅ Present (lines 151–162)  
**Footer:** ✅ Present (lines 164+)  

**Status:** Structure is sound. All containers exist with correct IDs.

---

## 3. Filter Chips ⚠️ MISMATCH

**Chips Present:** Lines 127–138 (14 filter buttons)

```html
<button class="tag-btn" data-filter="bar">🍺 Bars</button>
<button class="tag-btn" data-filter="beach-bar">🏖️ Beach Bars</button>
<button class="tag-btn" data-filter="sports-bar">📺 Sports Bars</button>
<!-- etc -->
```

**Problem:** These `data-filter` values do **NOT match API tag format**:

| Filter Chip | Expected API Tag | API Reality |
|---|---|---|
| `bar` | `"bar"` | ✅ exists in sample (type: "bar") |
| `beach-bar` | `"beach-bar"` | ❌ NOT in API data |
| `sports-bar` | `"sports-bar"` | ❌ NOT in API data |
| `live-music` | `"live-music"` | ❌ NOT in API data |
| `ayce` | `"ayce"` | ❌ NOT in API data |

**Sample Data Tags:** From 8 Reale: `speakeasy`, `cocktails`, `prohibition-era`, `craft cocktails`, `hidden bar`, `upscale bar`, `nightlife`, `Bars`, `Cocktail Lounges`, `Speakeasies`

**Root Cause:** Filter logic in `gcr-listings.js` not shown, but chips are **hardcoded for "happy hours" concept**, not generic "deals."

**Fix Required:**
- Align chips to actual API tags OR
- Implement tag-based filtering that reads `business.tags[]` array

---

## 4. Card Rendering ❌ CRITICAL ISSUES

**Current Card Template (inferred):** Not visible in `gcr-listings.js` excerpt, but HTML suggests:
```html
<div class="deal-card">
  <div class="deal-image"><!-- background image --></div>
  <div class="deal-body">
    <div class="deal-name">Name</div>
    <div class="deal-subline">Meta</div>
    <div class="deal-summary">Summary</div>
    <div class="deal-actions">Buttons</div>
  </div>
</div>
```

**Field Mapping Issues:**

| Card Field | API Field | Status |
|---|---|---|
| `name` | `business.name` | ✅ Available |
| `subtitle` | `business.subtitle` | ✅ Available |
| `image` | `business.hero_image_url` | ⚠️ **NULL in sample** (fallback: `photos[0]`) |
| `description` | `business.description` | ✅ Available (long) |
| `address` | `business.address_line_1` | ✅ Available |
| `phone` | `business.phone` | ✅ Available |
| `rating` | `business.rating` | ❌ **NULL** (no ratings in API) |
| `hours` | `business.hours[]` | ✅ Available (but needs formatting) |
| `happy hour info` | `business.hh_*` fields | ⚠️ **NULL in sample** |

**Blockers:**
1. **No image fallback logic** — `hero_image_url` is null; should use `photos[0].image_url` or placeholder
2. **Happy hour fields empty** — `hh_days`, `hh_start`, `hh_end`, `hh_description` all null in sample 8 Reale
3. **Spam entry in API** — "888SLOT" (lines 2, second object) is **promotional gambling content**, not a legitimate deal. It has:
   - No location (city, address null)
   - No phone
   - No hours
   - Suspicious description (keyword-stuffed SEO spam)
   - **Should be filtered out** before render

**Example Render Issue — 8 Reale Card:**
```
Name: "8 Reale" ✅
Subtitle: "Orange Beach's BEST kept secret" ✅
Image: (NULL) → fallback to photos[0] ✅
Description: (1000+ chars) → truncate to 150 chars ❌ (code likely not shown)
Hours: [{ day: "Friday", open: "17:00", close: null }] → format as "Fri 5PM–Late" ❌ (null close)
Happy Hour: All fields NULL → Don't show section ✅ (correct)
Phone/Web: ✅ Available
```

---

##

## Events `events.html`

# GCR Events Page — UI/UX Audit

## 1. DATA LOADING ❌ **CRITICAL**

**Issue:** The page **does NOT call `GCR.load()`** and **does NOT listen for `gcr:loaded`**.

- **Line 493–530** (bottom of HTML): Inline `<script>` begins but is **truncated/incomplete**. The full setup is missing.
- **No `document.addEventListener('gcr:loaded', ...)` listener** visible anywhere.
- **`GCR.events` array is never populated or rendered.**

**Expected flow:**
```js
document.addEventListener('gcr:loaded', function(e) {
  const events = e.detail.events;
  renderEventCards(events);
});
GCR.load(); // Call at startup
```

**Current state:** The page will render **empty containers** (`#todayGrid`, `#weeklyGrid`) because there's no code to fetch or render data.

---

## 2. LAYOUT — STRUCTURE ✅ **OK**

**Present & intact:**
- GCR header with logo + nav tabs (line 168–187)
- Hero section (line 195–207)
- Toolbar with filters + view toggle (line 209–292)
- Main layout grid (line 294–340)
  - `#todayView` (line 295–299)
  - `#weeklyView` (line 300–302)
  - Sidebar with featured/recurring panels (line 304–325)
- Footer (line 327–360)

**All key container IDs present:**
- `#todayGrid`, `#weeklyGrid`, `#featuredTonightList`, `#recurringList` ✓

---

## 3. FILTER CHIPS ✅ **PRESENT, BUT NON-FUNCTIONAL**

**Location:** Lines 286–291 (type filters in toolbar)

```html
<button class="tag-btn" data-etype="live_music_or_event">🎸 Live Music</button>
<button class="tag-btn" data-etype="open_mic_jam">🎙️ Open Mic</button>
<button class="tag-btn" data-etype="karaoke">🎤 Karaoke</button>
<button class="tag-btn" data-etype="trivia">🧠 Trivia</button>
<button class="tag-btn" data-etype="bingo">🎰 Bingo</button>
<button class="tag-btn" data-etype="show_performance">🎭 Shows</button>
<button class="tag-btn" data-etype="market">🛍️ Markets</button>
```

**Problems:**
1. **No onclick handlers** — buttons don't filter on click
2. **data-etype values** are **not in the API schema** (the sample JSON shows `tags[]` with properties like `tag_category`; there's no `event_type` field)
3. **No JS to handle filtering logic** — code to check `data-etype` against incoming events is missing
4. The "All" button (line 285) has `.active` class but no tab-switching logic

---

## 4. CARD RENDERING ❌ **BROKEN**

**Missing:**
1. **No event card template** — There's CSS for `.event-card` (lines 119–122) but **no JavaScript to generate HTML**
2. **No field mapping** — Code doesn't map API fields to card elements:
   - Event name → `.name`
   - Image → `.event-image`
   - Time → `.timepill`
   - Description → `.event-copy`
   - Venue/business → `.venue`
   - Tags → `.chips`

**Card CSS exists** (lines 119–137) but will never be populated.

**Expected logic (missing):**
```js
function renderEventCard(event) {
  const card = document.createElement('div');
  card.className = 'event-card';
  card.innerHTML = `
    <div class="event-image" style="background-image: url('${event.hero_image_url || event.photos?.[0]?.image_url}')">
      <div class="image-badge">${event.type || 'Event'}</div>
    </div>
    <div class="event-body">
      <div class="name">${event.name}</div>
      <div class="subline">${event.city}, ${event.state}</div>
      <div class="event-copy">${event.description?.substring(0, 120)}…</div>
      <div class="chips">
        ${event.tags?.map(t => `<span class="chip">${t.tag}</span>`).join('')}
      </div>
    </div>
  `;
  return card;
}
```

This function **does not exist**.

---

## 5. MISSING FEATURES / INCOMPLETE CODE ❌

### A. **No JavaScript for core functionality**
- Lines 493–530: Inline script is **cut off mid-function**
- Missing:
  - `switchTab(tab)` — called on line 269 (tab buttons)
  - `setView(view)` — called on line 281 (list/card toggle)
  - `toggleDatePicker()` — called on line 271
  - `applyDateFilter()`, `clearDateFilter()` — called on lines 278–279
  - `setQuickDate()`, `setQuickRange()` — called on lines 274–277
  - **All rendering functions**

### B. **No list view logic**
- Lines 103–117: `.list-row` CSS and `.list-expand` exist
- But **no code to generate list rows from event data**
- Expand/collapse behavior (`onclick="..."` on `.list-row`) undefined

### C. **View toggle non-functional**
- Lines 281–282: Two buttons with IDs `#viewCards`, `#viewList`
- But `#cardView` / `#listView` containers **don't exist**
- Expected: Toggle between `#todayView` (list) and a cards variant

### D. **Date picker partially wired**
-

## Feed `feed.html`

# GCR Feed Page (feed.html) — UX/Engineering Audit

---

## 1. DATA LOADING ❌ CRITICAL

**Issue:** The page does **NOT** call `GCR.load()` and does **NOT** listen for the `gcr:loaded` event.

**Evidence:**
- `<script src="js/gcr-api.js"></script>` is loaded (line 95)
- `<script src="js/app.js"></script>` is loaded (line 96)
- **BUT** no initialization code calls `GCR.load()`
- The feed displays static placeholder HTML instead of dynamic data

**What's missing:**
```javascript
// Should exist in app.js or inline before closing </body>
document.addEventListener('DOMContentLoaded', () => {
  GCR.load().then(() => {
    renderFeed(GCR.businesses);
  });
});
```

**Impact:** Zero live data will render. The "Live Feed Coming Soon" message is hardcoded.

---

## 2. LAYOUT — Structurally Sound, But Content Missing

### Header & Nav ✅
- Lines 13–48: GCR header with logo, nav tabs, action strip present
- Responsive grid in CSS (feed-layout): `grid-template-columns:1fr 320px`
- Sidebar hides on mobile (`@media(max-width:768px)`)

### Main Content Area ❌
- Lines 58–67: Feed list contains **only static placeholder** ("Live Feed Coming Soon")
- No dynamic listing grid with class like `#listingsGrid` or `.feed-grid`
- No card rendering template

### Filter Chips ⚠️
- Lines 51–56: Filter bar present with buttons:
  - `all`, `photos`, `reviews`, `deals`, `events`, `new`
- **NO event listeners** attached to these buttons
- **NO JS logic** filters the feed based on these selections

### Sidebar ✅
- Lines 69–89: Trending & Events sections structured correctly
- "Trending Now" has 3 hardcoded items (Crab, Boats, Tim Roberts)
- `<div id="eventsList">` exists (line 77) but **no JS populates it**

---

## 3. FILTER CHIPS — Present But Non-Functional

**HTML (lines 51–56):**
```html
<button class="filter-chip active" data-filter="all">All</button>
<button class="filter-chip" data-filter="photos">📸 Photos</button>
<!-- ... -->
```

**Problems:**
- Filter values (`all`, `photos`, `reviews`, `deals`, `events`, `new`) do **NOT match API tag structure**
  - API uses: `tag_category` (null, "category", "industry", "type") + `tag` field
  - Example from 8 Reale: `"tag": "speakeasy"`, `tag_category: null`
- **Zero JS event handlers** for `.filter-chip` buttons
- No `.active` state toggle logic

**What should happen:**
- Click "photos" → filter to items where `photos.length > 0`
- Click "deals" → filter to items with promo/special data
- Click "events" → show `GCR.events` instead of `GCR.businesses`

---

## 4. CARD RENDERING — No Template, Will Not Render

**Current state:**
- No `.gcr-card` elements generated
- No card template in HTML
- `gcr-listings.js` is **NOT** loaded (`<script src="js/gcr-listings.js"></script>` missing)

**From API sample (8 Reale object):**
```json
{
  "name": "8 Reale",
  "subtitle": "Orange Beach's BEST kept secret",
  "description": "...",
  "address_line_1": "4851 Wharf Parkway W, Suite D-112",
  "city": "Orange Beach",
  "phone": "251-484-0712",
  "rating": null,
  "review_count": 0,
  "photos": [
    { "image_url": "//images.squarespace-cdn.com/...", "caption": null }
  ],
  "hours": [{ "day_of_week": "Friday", "open_time": "17:00", ... }],
  "tags": [{ "tag": "speakeasy" }, ...]
}
```

**What's missing:**
- No card template that maps these fields
- No image lazy-loading (critical for performance)
- No status badge logic (OPEN/CLOSING/CLOSED based on `hours` array)
- No truncated description rendering

---

## 5. MISSING / INCOMPLETE FEATURES

| Feature | Status | Notes |
|---------|--------|-------|
| Dynamic feed rendering | ❌ None | No JS calls `GCR.load()` |
| Filter by type | ❌ None | Buttons present, no logic |
| Filter by tags | ❌ None | API returns rich tags, unused |
| Search within feed | ❌ None | No search box or logic |
| "Trending Now" population | ❌ Hardcoded | Should pull from API |
| "Events This Week" population | ❌ Empty | `#eventsList` never filled |
| Card hover animations | ⚠️ Partial | CSS exists in `gcr-listings.js`, but cards never render |
| Social links (Instagram/FB) | ❌ None | API has `social_instagram`, `social_facebook` — unused |
| Hours display | ❌ None | API provides full hours array, never shown |
| Rating/reviews | ❌ None | All items have `rating: null, review_count: 0` |
| "New Openings" filter | ❌ None | No `created_at` field in API sample, can't determine new vs. old |
| Photos carousel | ❌ None | API has `photos[]` array, no carousel UI |

---

## 6. RESPONSIVE ISSUES ⚠️

### Mobile (< 480px)
- Lines 99–103: Feed layout correctly switches to single column
-

## Happy Hours `happy-hours.html`

# GCR Happy Hours Page — Audit Report

---

## 1. Data Loading ⚠️ **CRITICAL**

### Status: **Will NOT load correctly**

**Issue:** The page has no explicit data loading initialization.

- **Line 297 (HTML):** `<script src="js/gcr-api.js"></script>` — loads API module
- **Line 298 (HTML):** `<script src="js/app.js"></script>` — loads app logic
- **Line 299 (HTML):** `<script src="js/gcr-listings.js"></script>` — loads card renderer
- **Line 300 (HTML):** `<script src="js/claim-modal.js"></script>` — unrelated modal
- **Line 301 (HTML):** `<script src="js/gcr-config.js" data-category="happy-hours"></script>` — config

**Missing:** No call to `GCR.load()` in the HTML or in a page-specific init script.

**What should happen:**
```javascript
document.addEventListener('DOMContentLoaded', () => {
  GCR.load(); // Fetches data from API
});
document.addEventListener('gcr:loaded', (e) => {
  renderHappyHours(e.detail.happyHours);
});
```

**Current behavior:** `GCR.happyHours` will be `[]` forever. No cards render.

---

## 2. Layout ✅ **Mostly Present**

### Structure: **Good**

- **Line 140–143:** Hero section present ✓
- **Line 145–150:** Toolbar with filter chips present ✓
- **Line 152–177:** Layout grid (main + sidebar) present ✓
- **Line 153:** `<div class="list" id="listingsGrid" data-category="happy-hours"></div>` — **correct ID**
- **Line 154–169:** Sidebar panels present ✓
- **Line 179+:** Footer present ✓

### Issue:

- **Line 154:** `data-category="happy-hours"` must match GCR category ID
  - GCR categories: `restaurants`, `things-to-do`, `nightlife`, `coffee-sweets`, `shopping`, `hotels`, `services`, `other`, `specials`, `events`
  - **"happy-hours" is NOT in the GCR category list** — this is a data type, not a category.
  
  **This will cause the filter logic to fail.** Should likely be mapped to `nightlife` or handled separately.

---

## 3. Filter Chips ⚠️ **Incomplete**

### Status: **Insufficient**

**Line 151:**
```html
<div class="tag-row">
  <button class="tag-btn active" data-filter="all">All</button>
</div>
```

**Problems:**

1. **Only one chip ("All")** — no ability to filter by day, time, or venue type.
2. **No time-based filters** — Happy hours are fundamentally time-dependent. Should have chips like:
   - "Today"
   - "This Week"
   - "Monday–Friday"
   - "17:00–19:00"
3. **`data-filter="all"`** — the CSS shows tag filtering logic exists (`.tag-btn.active` styling), but:
   - No filter handler in the scripts
   - No data to match against (API data has `hh_days`, `hh_start`, `hh_end`, `hh_description` but these are mostly `null` in sample)

**What's needed:**
```html
<button class="tag-btn active" data-filter="all">All</button>
<button class="tag-btn" data-filter="today">Today</button>
<button class="tag-btn" data-filter="weekdays">Mon–Fri</button>
<button class="tag-btn" data-filter="evenings">5–7 PM</button>
```

---

## 4. Card Rendering 🔴 **Will Fail**

### Status: **No rendering logic for happy hours**

**Problem:**

- **gcr-listings.js** (per context) handles `restaurants`, `coffee-sweets`, `shopping`
- **Happy Hours are NOT mentioned** in gcr-listings.js
- **No happy-hours-specific renderer exists**

**What will happen:**
1. `GCR.happyHours` loads from API ✓
2. `#listingsGrid` exists ✓
3. **gcr-listings.js** looks for category "happy-hours" → **not in its handler list** → **nothing renders**

**Sample API data fields that need to render:**

```json
{
  "name": "8 Reale",                    // Business name
  "subtitle": "Orange Beach's BEST kept secret",
  "address_line_1": "4851 Wharf Parkway W, Suite D-112",
  "phone": "251-484-0712",
  "website_url": "http://www.8realeobal.com",
  "hh_description": null,               // No HH-specific text
  "hh_days": null,                      // No days defined
  "hh_start": null,                     // No start time
  "hh_end": null,                       // No end time
  "hours": [ { day_of_week, open_time, close_time } ],
  "photos": [ { image_url } ]
}
```

**Current sample data has `hh_*` fields that are mostly `null`** — this is a data quality issue, but the page must still handle rendering the business + hours.

---

## 5. Missing Features 🔴 **Critical Gaps**

### A. No Happy Hour–Specific Renderer

**Missing file or function:** `renderHappyHours(data)` or similar

Should render:
```html
<a href="/business/[slug]" class="hh-card">
  <div class="hh-card-img" style="background-image:url(...)"></div>
  <div class="hh-card-content">
    <h3>8 Reale

## Index3 `index3.html`

# GCR Index3 (index3.html) — UI/UX Audit

---

## 1. DATA LOADING ❌ CRITICAL

### Issue: No GCR.load() call anywhere on the page

**Location:** `<head>` and `<body>` — **MISSING**

```html
<!-- ❌ NO SCRIPT TAGS FOR gcr-api.js or gcr-listings.js -->
<!-- ❌ NO listener for 'gcr:loaded' event -->
```

**What's broken:**
- `GCR.load()` is **never invoked**
- No `<script src="js/gcr-api.js"></script>`
- No `<script src="js/gcr-listings.js"></script>`
- No `addEventListener('gcr:loaded', ...)` to trigger render
- **Result:** Data will never load; page displays hardcoded/empty content only

**Fix:**
```html
<script src="js/gcr-api.js"></script>
<script src="js/gcr-listings.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    GCR.load();
  });
  
  document.addEventListener('gcr:loaded', (e) => {
    console.log('Data loaded:', e.detail);
    // Trigger any page-specific renderings
  });
</script>
```

---

## 2. LAYOUT STRUCTURE ⚠️ PARTIAL

### Present Elements:
- ✅ `.gcr-header` — sticky header with logo, tabs, action strip (lines ~120–200)
- ✅ `.gcr-hero` — search hero section (lines ~200–280)
- ✅ `.stats-bar` — stats display (lines ~280–310)
- ✅ `.weather-card` — hardcoded weather (lines ~310–360)
- ✅ Multiple `.home-section` blocks for categories, featured, calendar, districts
- ✅ Footer stub (incomplete but present)

### Missing/Empty IDs:
- **⚠️ No `<div id="listingsGrid">` anywhere** — This is needed by `gcr-listings.js` to render cards
- No dedicated filter chip container for dynamic category filtering
- No event container for event listings
- No happy hour container

**Impact:** If someone navigates to a "listings" view, there's no target container to render into.

---

## 3. FILTER CHIPS ⚠️ INCOMPLETE

### Location: Lines ~140–165 (`.gcr-cat-tabs`)

```html
<div class="gcr-cat-tabs">
  <a href="..." class="gcr-cat-tab active">🍽️ Restaurants</a>
  <a href="..." class="gcr-cat-tab">🎯 Things To Do</a>
  ... etc
</div>
```

### Problems:
1. **No `data-filter` or `data-category` attributes** — Filter logic can't identify which category was clicked
2. **Hardcoded hrefs** — Should be `data-category="restaurants"` for dynamic JS handling
3. **No active state toggle JS** — Clicking a tab doesn't update `.active` class
4. **No connection to API tags** — API returns tags with `tag_category` (e.g., `"category": "bar"`), but chips don't use this

**Example from API:**
```json
{
  "tag": "Bars",
  "tag_category": "category"
}
```

**Current HTML:**
```html
<a class="gcr-cat-tab active">🍽️ Restaurants</a>
<!-- No way for JS to know this is filter="restaurants" -->
```

**Fix:**
```html
<a class="gcr-cat-tab active" data-category="restaurants">🍽️ Restaurants</a>
<script>
  document.querySelectorAll('.gcr-cat-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = e.target.dataset.category;
      const items = GCR.getByCategory(cat);
      renderListings(items);
      
      // Update active state
      document.querySelectorAll('.gcr-cat-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
    });
  });
</script>
```

---

## 4. CARD RENDERING ❌ NOT IMPLEMENTED

### Current State:
- **Page has zero card renders** — everything is hardcoded HTML mockups
- No JavaScript that converts API objects into `.gcr-card` elements

### Expected API Fields (from live sample):

```json
{
  "name": "8 Reale",
  "subtitle": "Orange Beach's BEST kept secret",
  "description": "If you find yourself...",
  "address_line_1": "4851 Wharf Parkway W, Suite D-112",
  "city": "Orange Beach",
  "phone": "251-484-0712",
  "website_url": "http://www.8realeobal.com",
  "photos": [ { "image_url": "..." } ],
  "hours": [ { "day_of_week": "Monday", "open_time": "17:00" } ],
  "rating": null,
  "review_count": 0
}
```

### Missing in HTML:
- **No template or rendering function** to convert objects to cards
- No logic to display:
  - Multi-photo carousel or first photo only
  - Hours (open/closing status badges)
  - Ratings/reviews (from API `rating`, `review_count`)
  - Contact info (phone, email)
  - Social links (Instagram, Facebook, TikTok)

### Example Card Template (missing):
```html
<a class="gcr-card" href="/entity/{slug}">
  <div class="gcr-card-img" style="background-image: url('{photo}')">
    <div class="gcr-status open">Open Now</div>
  </div>
  <div class="gcr-card-body

## Loyalty `loyalty.html`

# Gulf Coast Radar — Loyalty Page Audit

## 1. Data Loading ❌ CRITICAL

**Line references:** HTML inline `<script>` block (bottom of page)

### Issues:
- ✅ **Correctly calls** `GCR.load()` at top of gcr-api.js
- ✅ **Listens for** `gcr:loaded` event via `DOMContentLoaded`
- ❌ **FATAL:** References `GCR.loyalty` object that **does not exist** in gcr-api.js

**Line:** Script block references:
```javascript
const lp = GCR.loyalty;  // ← This object is never defined
lp.participating
lp.howItWorks
lp.tiers
lp.rewardsCatalog
```

**gcr-api.js only exports:**
- `GCR.businesses[]`
- `GCR.events[]`
- `GCR.specials[]`
- `GCR.happyHours[]`

**Result:** Page will throw `TypeError: Cannot read property 'participating' of undefined` and render nothing.

---

## 2. Layout ✅ MOSTLY OK

**Sections present:**
- ✅ Header with nav tabs (lines 134–146)
- ✅ Hero section with signup form (lines 152–165)
- ✅ Co-op explainer banner (lines 170–180)
- ✅ "How It Works" grid (lines 185–192)
- ✅ Membership tiers (lines 197–204)
- ✅ Rewards catalog (lines 209–216)
- ✅ Participating businesses grid (lines 221–228)
- ✅ "For Businesses" CTA (lines 233–245)
- ✅ Footer (lines 250–267)

**Issues:**
- ID containers all present & properly formatted
- No grid/layout structural problems
- Responsive breakpoints defined in CSS (handled via media queries)

---

## 3. Filter Chips ❌ NOT PRESENT

**Status:** No filter chips on this page (unlike restaurants.html, things-to-do.html)

**Question:** Should there be filters? Current page shows:
- No category filters
- No tag/search filters
- Static "Participating Businesses" section

**Recommendation:** If user should be able to filter participating businesses by type/tag, add a chip row above `#bizCoopGrid`. Currently just a hardcoded list.

---

## 4. Card Rendering — Participating Businesses ❌ BROKEN

**Lines 323–330** (inline script):
```javascript
const bizList = GCR.getLoyaltyBiz();  // ← Method doesn't exist
document.getElementById('bizCoopGrid').innerHTML = bizList.map(b => `
  <a href="profile.html?id=${b.slug||b.id}" class="biz-coop-card">
    <div class="biz-coop-emoji">${b.emoji}</div>  // ← API doesn't provide emoji
    <div>
      <div class="biz-coop-name">${b.name}</div>
      <div class="biz-coop-perk">🎁 ${b.loyaltyPerk}</div>  // ← loyaltyPerk undefined
```

### Problems:

| Field | API Provides? | Status |
|-------|---------------|--------|
| `name` | ✅ Yes | OK |
| `slug` / `id` | ✅ Yes | OK |
| `emoji` | ❌ No | Will be `undefined` |
| `loyaltyPerk` | ❌ No | Will be `undefined` |

**Result:** Cards will render but emoji column & perk text missing. Will show:
```
[undefined] Business Name
🎁 undefined
```

---

## 5. Missing/Incomplete Features ❌ MAJOR

### A. No Data Source for Static Content
**Lines 323–330** assumes:
- `GCR.getLoyaltyBiz()` method (doesn't exist)
- `b.emoji` field (not in API)
- `b.loyaltyPerk` custom field (not in API)

**Where should this come from?**
- [ ] Hard-code a loyalty participation list in gcr-api.js?
- [ ] Add new API endpoint `/api/gcr/loyalty-businesses`?
- [ ] Add `loyaltyPerk` field to business model?

### B. Signup Form Has No Submission Logic
**Lines 159–163:**
```html
<div class="signup-row">
  <input type="tel" id="signupPhone" placeholder="(251) 555-0000" maxlength="14">
  <button onclick="submitSignup()">Join Now →</button>
</div>
```

**Issue:** `submitSignup()` function is **never defined** anywhere in codebase.
- app.js has `openSignupModal()` but not `submitSignup()`
- Success message div exists but will never show

### C. Co-op Stats are Hardcoded
**Line 320:**
```javascript
const bizCount = lp.participating.length;
document.getElementById('coopStats').innerHTML = `...${bizCount}+...`;
```

Since `lp` is undefined, these stats won't render.

### D. Loyalty Object Structure Missing
**Expected structure** (referenced but never defined):
```javascript
GCR.loyalty = {
  participating: [...],           // ← businesses in program
  howItWorks: [{ emoji, step, title, text }, ...],
  tiers: [{ emoji, name, minPoints, color, perks: [] }, ...],
  rewardsCatalog: [{ emoji, points, title, desc }, ...],
};
```

---

## 6. Responsive Issues ⚠️ MINOR

**Good:**
- ✅ Media queries properly cascade (480px, 640px, 768px breakpoints)
- ✅ Grid layouts use `repeat(auto-fill, minmax(...))`
- ✅ Typography scales with `clamp()`

**Potential issues

## Nightlife `nightlife.html`

# GCR Nightlife Page Audit

## 1. DATA LOADING

**Status:** ⚠️ **CRITICAL ISSUE**

- ✅ `gcr-api.js` is loaded (line: `<script src="js/gcr-api.js"></script>`)
- ✅ `gcr-listings.js` is loaded (line: `<script src="js/gcr-listings.js"></script>`)
- ✅ `app.js` is loaded (line: `<script src="js/app.js"></script>`)
- ❌ **`GCR.load()` is NEVER CALLED** — No code in `app.js` excerpt or `gcr-config.js` shows an initial call to `GCR.load()`
- ❌ **No explicit `gcr:loaded` listener visible** in the page or scripts

**Impact:** Data will never fetch from API. Listings grid will stay empty forever.

**Fix Required:**
```js
// Add to app.js or gcr-config.js:
document.addEventListener('DOMContentLoaded', () => {
  GCR.load();
});
```

---

## 2. LAYOUT & STRUCTURE

**Status:** ✅ **MOSTLY GOOD**

### Present:
- ✅ Header with logo & navigation (`.gcr-header`)
- ✅ Hero section with title & description (line: `<section class="hero">`)
- ✅ Toolbar with title & result count (line: `<section class="toolbar">`)
- ✅ Filter chip row (line: `<div class="tag-row">`)
- ✅ Main listing grid (line: `<div class="list" id="listingsGrid" data-category="nightlife">`)
- ✅ Sidebar with map & CTA (line: `<aside class="sidebar">`)
- ✅ Footer (`.site-footer`)

### Issues:
- ⚠️ **Tag row only shows "All" button** (line 1 in `<div class="tag-row">`):
  ```html
  <div class="tag-row">
    <button class="tag-btn active" data-filter="all">All</button>
  </div>
  ```
  Missing filter chips for: Bars, Clubs, Live Music, Rooftop, Sports Bars (from `categories` in `gcr-api.js` line ~20)

---

## 3. FILTER CHIPS

**Status:** ❌ **NOT IMPLEMENTED**

**Found:**
- Only **one static "All" button** (line: `<button class="tag-btn active" data-filter="all">All</button>`)
- No dynamic chip generation from API subcategories

**Expected (from `gcr-api.js`):**
```js
{ id: "nightlife", label: "Nightlife", emoji: "🎶", sub: ["All","Bars","Live Music","Clubs","Rooftop","Sports Bars"] }
```

**Impact:** Users cannot filter by venue type. Entire filter bar is hardcoded & static.

**Fix Required:**
- Generate chips from `GCR.categories.find(c => c.id === 'nightlife').sub`
- Add click handlers to filter visible cards by tag matching

---

## 4. CARD RENDERING

**Status:** ⚠️ **PARTIALLY READY, BUT DATA FLOW BROKEN**

### Structure in `gcr-listings.js`:
- ✅ `.gcr-card` grid layout defined (lines ~45–75)
- ✅ Card template with image, badge, status, content
- ✅ Responsive grid (desktop: 2-col, mobile: 1-col)

### Data Field Mapping:
From live API sample (8 Reale):
```json
"name": "8 Reale",
"subtitle": "Orange Beach's BEST kept secret",
"description": "If you find yourself...",
"address_line_1": "4851 Wharf Parkway W, Suite D-112",
"phone": "251-484-0712",
"rating": null,
"hours": [...]
"photos": [...]
```

### Problems:
- ❌ **No visible card rendering code in provided excerpts** — `gcr-listings.js` first 3000 chars ends mid-style, doesn't show card generation logic
- ❌ **Sample data has duplicates/spam:** "888SLOT" entry (lines ~150–220 of API sample) is a malicious Indonesian gambling site masquerading as a nightlife venue:
  - No address, no phone, no valid contact
  - Keyword-stuffed description in Indonesian
  - Belongs in a **content moderation filter**, not results
  
**Assume card rendering exists but:**
- Missing check for `is_active: true` & `gcr_listed: true`
- No spam/quality filtering
- Address field handling unclear (use `address_line_1` or `address`?)

---

## 5. MISSING FEATURES

**Critical Gaps:**

| Feature | Status | Issue |
|---------|--------|-------|
| **Data Load Initialization** | ❌ Missing | No `GCR.load()` call |
| **Filter Chip Generation** | ❌ Missing | Only hardcoded "All" button |
| **Content Moderation** | ❌ Missing | "888SLOT" spam passes through |
| **Hours Display** | ⚠️ Unclear | API has hours, unclear if rendered |
| **Rating/Review Count** | ⚠️ Incomplete | Fields exist but mostly null in sample |
| **Social Links** | ⚠️ Missing | API has `social_instagram`, `social_facebook`, `social_tiktok` — no rendering visible |
| **Call/Web CTAs** | ⚠️ Missing | API has `phone`, `website_url`, `call_url` — not shown in card |
| **Happy Hour Info** | ⚠️ Missing | API has `hh_days`, `hh_start`, `hh_end` — not displayed |
| **Tag-based Filtering** | ⚠️

## Profile `profile.html`

# Gulf Coast Radar Profile Page Audit

## 1. DATA LOADING ❌ CRITICAL

**Status:** Page loads data correctly but has **fragile error handling**.

- **Line 8-10 (profile.html `<script>`):** Fetches `/api/gcr/entity/${slug}` ✅
- **Line 14-16:** Has fallback if `entityData` is null, shows error message ✅
- **Missing:** No call to `GCR.load()` from `gcr-api.js`. This page is **independent** and does NOT use the shared GCR singleton. ⚠️
  - This is **acceptable** for a detail page, but if the global nav/header needs GCR data, it won't be loaded.
  - Recommend: Add a `document.addEventListener('gcr:loaded', ...)` to the sticky nav just in case.

**Result:** Data will load IF the API is reachable and the slug exists.

---

## 2. LAYOUT ✅ MOSTLY GOOD

**Header Section (Lines 1-48 HTML):**
- ✅ GCR header present (logo, back button, nav tabs, loyalty/calendar CTAs)
- ✅ Cover slideshow container `#js-cover`
- ✅ Gallery & reviews popups defined
- ✅ Main header card with title, meta, badges, CTAs

**Sticky Nav (Lines 45-48 HTML):**
- ✅ `.sticky-wrap` with scroll margin (120px total)
- ✅ Tabs container `#js-tabs` (populated by JS)

**Main Content:**
- ✅ `#js-sections` placeholder for dynamic sections
- ⚠️ **No footer** — page just ends at `</div>` on Line 333

**Issue:** Missing footer (contact info, links, copyright).

---

## 3. FILTER CHIPS ❌ NOT APPLICABLE

This is a **detail page**, not a listing page. Filter chips belong on `restaurants.html`, `nightlife.html`, etc.

- No chips present. ✅ Correct for this context.

---

## 4. CARD RENDERING ✅ GOOD PREP, EXECUTION IN JS

**HTML Structure Ready:**
```html
<div class="header">
  <div class="title">
    <span id="js-emoji"></span>
    <h1 id="js-name"></h1>
  </div>
  <div class="meta" id="js-meta"></div>
  <div class="badge-row" id="js-badges"></div>
  <div class="cta-row" id="js-cta"></div>
  <div class="social-row" id="js-social"></div>
</div>
```

**Data Fields Used (from API sample):**
- `name` → `#js-name` ✅
- `subtitle`, `city`, `phone` → `#js-meta` (implied) ⚠️
- `photos[].image_url` → cover slideshow ✅
- `social_instagram`, `social_facebook`, `social_tiktok` → social buttons ✅
- `phone`, `website_url`, `directions_url` → CTA buttons ✅

**JavaScript Rendering (Lines 8-400+ in `<script>`):**
- Currently **INCOMPLETE/CUT OFF** in provided HTML — only shows the fetch and error handling.
- **Line 10-12 (approx):** Shows structure for rendering:
  ```javascript
  if (!entityData || !entityData.entity) { ... return; }
  ```
- **Missing:** No actual DOM population visible in provided code.

**Critical Issue:** The main rendering logic is **cut off in the audit materials**. Cannot verify if:
- Cover slideshow is properly initialized
- Meta fields are extracted correctly
- Social buttons are rendered
- Hours, tags, description sections populate
- Event listeners (prev/next slideshow) are attached

---

## 5. MISSING FEATURES ❌ SIGNIFICANT GAPS

### A. **Incomplete Script Section (Line 8+)**
The `<script>` block ends abruptly. Missing:
- Cover slideshow navigation (`#js-prev`, `#js-next` buttons exist but no JS)
- Tab rendering (`#js-tabs` exists but empty)
- Section rendering (`#js-sections` exists but empty)
- Gallery popup pagination (`galleryPage()`, `closePopup()` called but not defined)
- Reviews rendering logic
- All the actual DOM population logic

### B. **No Tab System**
- `.sticky-nav` markup exists with `.tabs` container (Line 45)
- But no JavaScript to:
  - Populate tabs (About, Hours, Photos, Reviews, etc.)
  - Handle scroll-to-section on tab click
  - Highlight active tab

### C. **No Section Content**
- `#js-sections` is a placeholder (Line 48)
- Should contain:
  - About/Description section
  - Hours section
  - Tags/Categories section
  - Photos gallery
  - Reviews section
  - Special offers section (if applicable)
  - Map/location section (missing entirely)

### D. **Hours Display**
- API includes `hours[]` array (7 day objects with open/close times)
- No HTML template to display hours
- Should show:
  - Current day highlighted
  - "Open now / Closes at X / Opens at Y" status
  - Full week view

### C. **Missing Map**
- No embedded map section
- Address exists in API (`address_line_1`, `city`, `state`, `zip`)
- Should show: Google Maps embed or link to directions

### D. **Photos/Gallery**
- API has `photos[]` with `image_url`
- Popup container exists (`#gallery-popup`, `#gallery-grid`)
- **But**: No JS logic to populate gallery or handle pagination

---

## 6. RESPONSIVE ISSUES ⚠️ MINOR

**Mobile Layout (CSS Lines 1-100):**
- Cover slideshow: `aspect-ratio:16/9` ✅ scales well
- Button layout: `.cta-row` uses `flex-wrap` ✅
- Gallery: `.gallery-grid` uses `@media` breakpoints 

## Public Spots `public-spots.html`

# GCR Public Spots Audit — Gulf Coast Radar

## 1. DATA LOADING ❌ CRITICAL

**Status:** Page will **NOT** load or render data.

### Issues:

- **Missing `GCR.load()` call** — No script initializes the API
  - `gcr-api.js` is included (line 403) ✓
  - `app.js` is included (line 404) ✓
  - **BUT:** Neither file calls `GCR.load()` on page init
  - No `document.addEventListener('DOMContentLoaded', ...)` to trigger load

- **No listener for `gcr:loaded` event**
  - The page has hardcoded HTML but NO JavaScript to:
    - Wait for `gcr:loaded`
    - Fetch data from `GCR.businesses`
    - Render cards into `#spotsContainer`

- **Result:** `#spotsContainer` (line 363) will remain empty; no cards render.

### Fix Required:
```javascript
// Add to bottom of HTML before closing </body>, or in a new <script> tag
document.addEventListener('DOMContentLoaded', () => {
  GCR.load();
});

document.addEventListener('gcr:loaded', (e) => {
  // Call renderPublicSpots() here (see section 4)
});
```

---

## 2. LAYOUT ✓ MOSTLY GOOD

**Status:** HTML structure is solid.

### Present ✓
- Header w/ logo, nav tabs (lines 342–358)
- Hero section w/ live stats box (lines 367–375)
- Toolbar w/ filter controls (lines 377–392)
- Filter chip row w/ 8 category buttons (lines 393–401)
- Main `#spotsContainer` (line 363) — **empty, needs JS to fill**
- Sidebar w/ map, quick links, beach notes (lines 366–393)
- Footer (lines 398–426)

### Missing/Problematic:
- **No JavaScript container or render logic** — The entire card-rendering system is missing
- **Live stats are hardcoded** (lines 372–374):
  ```html
  <span id="spotCount">28 public spots listed</span>
  ```
  Should be dynamic:
  ```javascript
  document.getElementById('spotCount').textContent = `${GCR.businesses.length} public spots listed`;
  ```

---

## 3. FILTER CHIPS ⚠️ PARTIAL

**Status:** HTML present, but no filtering logic.

### Chips Present (lines 393–401):
```html
<button class="tag-btn active" data-filter="all">All</button>
<button class="tag-btn" data-filter="beach-access">🏖️ Beach Access</button>
<button class="tag-btn" data-filter="boat-launch">🚤 Boat Launches</button>
<button class="tag-btn" data-filter="parks">🌳 Parks</button>
<button class="tag-btn" data-filter="pier-fishing">🎣 Piers & Fishing</button>
<button class="tag-btn" data-filter="restrooms">🚽 Restrooms</button>
<button class="tag-btn" data-filter="parking">🅿️ Parking</button>
<button class="tag-btn" data-filter="ada">♿ ADA Accessible</button>
```

### Problems:

1. **No event listeners** — Chips don't respond to clicks
2. **Tag mismatch with API** — Sample data has tags like `"speakeasy"`, `"cocktails"`, `"hidden bar"` BUT page expects tags like `"beach-access"`, `"boat-launch"`, `"parks"`, etc.
   - Need tag category mapping or data-driven chip generation
   - Live API may not have consistent "public spot" categorization

3. **No "active" state toggle** — Clicking a chip should:
   - Add `.active` class
   - Filter `#spotsContainer` cards
   - Hide non-matching cards (add `.gcr-card-hidden` class)

### Missing Logic:
```javascript
document.querySelectorAll('.tag-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const filter = e.target.dataset.filter;
    // Toggle active state
    document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    // Filter cards
    filterCards(filter);
  });
});
```

---

## 4. CARD RENDERING ❌ NOT IMPLEMENTED

**Status:** Zero card rendering logic.

### Current State:
- `#spotsContainer` is empty (line 363)
- HTML has `.utility-card` CSS (lines 70–73) but no cards are generated
- Sample API data shows rich fields: `name`, `description`, `address_line_1`, `city`, `state`, `phone`, `website_url`, `photos[]`, `hours[]`

### Required Function (MISSING):
```javascript
function renderPublicSpots(spots = GCR.businesses) {
  const container = document.getElementById('spotsContainer');
  container.innerHTML = '';

  spots.forEach(spot => {
    const card = document.createElement('div');
    card.className = 'utility-card';
    card.innerHTML = `
      <div class="utility-image" style="background-image:url('${spot.photos?.[0]?.image_url || 'placeholder.jpg'}')">
        <div class="utility-image-badge">${spot.entity_subtype || spot.type}</div>
      </div>
      <div class="title-row">
        <div>
          <div class="name">${spot.name}</div>
          <div class="subline">${spot.subtitle || spot.tagline || ''}</div>
        </div>
        <div class="type-pill">${spot.entity_subtype || 'Public'}</div>
      </div>
      <p class="copy">${spot.description?.substring(0, 120) || ''}...</p>

## Restaurants `restaurants.html`

# GCR Restaurants Page Audit

## 1. Data Loading ⚠️ **CRITICAL**

**Status:** Data will NOT load or render.

- ✅ `gcr-api.js` is included (line 409)
- ✅ `gcr-listings.js` is included (line 410)
- ✅ `app.js` is included (line 410)
- ❌ **Missing: No explicit call to `GCR.load()`** — The page expects `gcr:loaded` event but never triggers it
- ❌ **No listener for `gcr:loaded`** in the page or `gcr-listings.js`

**Problem:** 
```javascript
// gcr-api.js line ~60 fires this:
document.dispatchEvent(new CustomEvent('gcr:loaded', { detail: this }));

// But restaurants.html never listens for it
// gcr-listings.js must be called AFTER load completes
```

**Fix needed:**
- Add to `<body>` before closing tag or top of `app.js`:
```javascript
document.addEventListener('gcr:loaded', () => {
  renderRestaurants();
});
GCR.load();
```

---

## 2. Layout Structure ✅ Good

- ✅ Header with nav tabs (line 204–217)
- ✅ Hero section (line 228–234)
- ✅ Toolbar with filter chips (line 236–245)
- ✅ Main grid with listings + sidebar (line 247–300)
- ✅ Footer present (line 302+)
- ✅ Proper `id="listingsGrid" data-category="restaurants"` (line 253)

**Note:** Filter chips are hardcoded (line 241: `data-filter="all"`). Need dynamic generation from tags.

---

## 3. Filter Chips ⚠️ **Major Issue**

**Status:** Hardcoded, not dynamic.

**Line 239–245:**
```html
<div class="tag-row">
  <button class="tag-btn active" data-filter="all">All</button>
</div>
```

**Problems:**
1. Only "All" button exists — no cuisine tags (Seafood, Bar & Grill, Fine Dining, etc.)
2. `gcr-listings.js` must populate these dynamically from API response
3. No filter logic exists to show/hide `.gcr-card` by `data-filter` attribute

**API sample has 15+ tags** (line ~80 of sample: speakeasy, cocktails, prohibition-era, craft cocktails, Bars, Nightlife, etc.)

**Fix:** `gcr-listings.js` needs to:
1. Extract unique tags from `GCR.businesses`
2. Generate buttons like:
```html
<button class="tag-btn" data-filter="seafood">🐟 Seafood (12)</button>
<button class="tag-btn" data-filter="bar-grill">🍖 Bar & Grill (8)</button>
```
3. Add filter click handler to toggle `.gcr-card-hidden` class

---

## 4. Card Rendering 🔴 **Critical**

**Status:** Template exists but won't render without trigger.

**In `gcr-listings.js` (full code not shown)**, but CSS classes confirm the structure:
- `.gcr-card` grid layout exists (CSS line ~40 of gcr-listings.js)
- `.gcr-card-img`, `.gcr-card-badge`, `.gcr-status` defined
- ✅ Mobile responsive (480px, 768px breakpoints)

**Expected card structure (from CSS):**
```html
<a href="#" class="gcr-card">
  <div class="gcr-card-img" style="background-image:url(...)">
    <div class="gcr-status open">Open Now</div>
    <div class="gcr-card-badge">⭐ 4.8</div>
  </div>
  <div style="padding:...">
    <h3>Restaurant Name</h3>
    <p>Description</p>
    <div class="gcr-card-footer">Address, phone, etc.</div>
  </div>
</a>
```

**API Data Mapping Issues:**
1. ✅ `name` → Card title (exists in sample)
2. ✅ `description` → Body text (exists, 300+ chars)
3. ⚠️ `hero_image_url` → Hero/feature image (sample has `null` for 8 Reale)
4. ⚠️ `photos[0].image_url` → Card background (exists but may be null)
5. ✅ `rating` → Badge (sample has `null` — fallback needed)
6. ✅ `address_line_1` → Address display (exists)
7. ✅ `phone` → Call button (exists as `call_url` or derive from phone)
8. ✅ `hours` → "Open Now" status (array of day_of_week + open_time/close_time)

**Critical missing logic in gcr-listings.js:**
- No function to determine current day's hours
- No logic to show "Open Now" vs "Closed" vs "Opening Soon"
- No image fallback (placeholder SVG or default image)
- No rating formatting (sample has `null` — need stars or "No ratings yet")

---

## 5. Missing/Incomplete Features 🔴

| Feature | Status | Issue |
|---------|--------|-------|
| **"Popular Nearby" sidebar** | Placeholder only (line 268) | No mini-cards rendered; hardcoded HTML in CSS suggests intent but no logic |
| **Filter chip generation** | Hardcoded | Only "All" button exists |
| **Search bar** | Completely missing | No search input or search logic |
| **Sort/ordering** | Missing | No way to sort by rating, distance, price |
| **Reservation/booking** | Missing | `booking_url`, `reservation_url`, `order_url` in API but no buttons |
|

## Search `search.html`

# GCR Search Page Audit

## 1. **Data Loading** ❌ CRITICAL

**Issue:** The page has **no `<script>` tags** to load `gcr-api.js` or `app.js`.

- **Line missing after `</head>`:** Need `<script src="js/gcr-api.js"></script>` + `<script src="js/app.js"></script>`
- The HTML ends mid-tag at line ~300: `<scri` (incomplete)
- **Result:** `GCR` object is undefined → data will never load → page shows only default browse tiles forever

**Fix:**
```html
<!-- Before closing </body> -->
<script src="js/gcr-api.js"></script>
<script src="js/app.js"></script>
<script src="js/search.js"></script> <!-- needs to exist -->
```

---

## 2. **Missing Search Logic** ❌ CRITICAL

**Issue:** No `search.js` file exists (not provided). The page has:
- Search input (line 243)
- Search button (line 244)
- **But NO event listeners or search function**

The `app.js` snippet shows `window.openSignupModal()` but **no search handler**.

**What's missing:**
- Search input `#searchInput` has no `onchange/onkeyup` listener
- Search button `#searchBtn` has no `onclick` handler
- No autocomplete logic (the `.autocomplete-box` div exists but is empty)
- No result rendering function for search queries
- No filter tabs logic (`data-tab="all|businesses|menu|drinks|specials"`)

---

## 3. **Layout & Structure** ⚠️ MOSTLY OK

**Present:**
- Header with logo (line 220) ✓
- Category tabs (line 230) ✓
- Action strip (line 239) ✓
- Search bar (lines 242–246) ✓
- Filter tabs (lines 249–256) ✓
- Results section (line 268–278) — exists but `display:none`
- No results fallback (line 280–288) ✓
- Default browse tiles (line 290–302) ✓
- Footer (line 304) — **incomplete, cut off**

**Issue:** Footer HTML is malformed (line 304–309 cuts off mid-`</scri`)

---

## 4. **Filter Chips & Mode Toggles** ⚠️ INCOMPLETE

**Present:** Lines 249–256 have toggle buttons:
```html
<button class="search-mode-toggle active" data-tab="all">🔍 All</button>
<button class="search-mode-toggle" data-tab="businesses">🏢 Businesses</button>
<button class="search-mode-toggle" data-tab="menu">🍽️ Food</button>
<button class="search-mode-toggle" data-tab="drinks">🍺 Drinks</button>
<button class="search-mode-toggle" data-tab="specials">🏷️ Specials</button>
```

**Missing:** 
- No click handlers for these tabs
- No filter logic in JS
- `data-tab` values don't match GCR API structure (`entity_type`, `entity_subtype`, `tags`)

**Fix needed:** Add click listener in `search.js`:
```javascript
document.querySelectorAll('.search-mode-toggle').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.search-mode-toggle').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    const tab = e.target.dataset.tab;
    filterResults(tab);
  });
});
```

---

## 5. **Card Rendering Template** ⚠️ STYLING OK, LOGIC MISSING

**Card HTML exists** (lines 64–111 in `<style>`):
- `.gcr-search-card` — main container
- `.gcr-search-card-inner` — grid 200px image + content
- `.gcr-search-card-body` — name, subtitle, desc, rating, chips
- `.gcr-search-card-footer` — buttons

**But NO JavaScript rendering logic:**
- No `renderCard(business)` function
- No template filling for:
  - `name` → `.gcr-search-card-name`
  - `description` → `.gcr-search-card-desc`
  - `photos[0].image_url` → `.gcr-search-card-img` (background-image)
  - `address_line_1` → (not in template!)
  - `rating` → `.gcr-search-rating` (template has it, but data.rating is `null`)
  - `tags` → `.gcr-search-chips`
  - Call/website buttons

**From sample API:**
- `rating: null` — no ratings in data
- `review_count: 0` — review chips won't show
- `photos[].image_url` — **needs to be set as CSS `background-image`**
- `description` — exists, 2-line clamp in CSS, needs rendering
- Missing: `call_url`, `website_url`, `directions_url` buttons

---

## 6. **Autocomplete (Not Implemented)** ❌

**HTML exists:** Line 247
```html
<div class="autocomplete-box" id="autocompleteBox" style="display:none;"></div>
```

**CSS exists:** Lines 142–158 (autocomplete styles)

**Logic missing:** No input event listener, no fuzzy search, no business/menu/special matching.

---

## 7. **Load More Button** ⚠️ 

**HTML exists:** Lines 276–278
```html
<div id="loadMoreWrap" style="text-align:center;margin-top:24px;display:none;">
  <button id="loadMoreBtn" class="gcr-search-btn primary">Load More Results</button>
</div>
```

**Logic missing:** No pagination handler, no offset/limit tracking.

---

## 8. **Responsive Issues**

## Services `services.html`

# GCR Services Page — UX/UI Audit Report

---

## 1. DATA LOADING

**Status:** ❌ **CRITICAL ISSUE**

### Problems:

- **No `GCR.load()` call on page.** The page never triggers data initialization.
  - Missing: `<script>GCR.load();</script>` before or after `gcr-api.js`
  - gcr-listings.js waits for `gcr:loaded` event, but it's never dispatched if load() isn't called.

- **No event listener on `#listingsGrid`.** The HTML has:
  ```html
  <div class="list" id="listingsGrid" data-category="services"></div>
  ```
  But there's no JavaScript that:
  1. Listens for `gcr:loaded`
  2. Filters `GCR.businesses` by category = "services"
  3. Renders cards into that div

- **Result:** Page loads with empty grid. User sees "Loading..." in resultCount forever.

---

## 2. LAYOUT & STRUCTURE

**Status:** ⚠️ **MOSTLY OK, BUT GAPS**

| Component | Present? | Issue |
|-----------|----------|-------|
| Header | ✅ Yes | Looks good, nav tabs visible |
| Hero section | ✅ Yes | Proper background image + title |
| Toolbar with filters | ✅ Yes | Has `#resultCount` placeholder |
| Tag filters | ⚠️ Partial | Only shows `<button data-filter="all">All</button>` — hardcoded, not dynamic |
| Listings grid | ✅ Yes | `#listingsGrid` present, correct ID |
| Sidebar | ✅ Yes | "Popular Nearby" + "List Your Service" CTA |
| Footer | ✅ Yes | Simple, adequate |

### Layout Issues:

- **Line 113:** `<aside class="sidebar" style="display:flex;...">` — sidebar only has 2 placeholder panels (Popular Nearby, List Your Service). Neither populated with data.
- **Line 61:** Filter tag row only has hardcoded `All` button. Should dynamically render sub-categories from `GCR.categories` for "services".

---

## 3. FILTER CHIPS

**Status:** ❌ **MISSING DYNAMIC LOGIC**

### Current state:
```html
<div class="tag-row">
  <button class="tag-btn active" data-filter="all">All</button>
</div>
```

**What should happen:**
1. On `gcr:loaded`, populate tag buttons for `GCR.categories.find(c => c.id === 'services').sub`
2. Expected subs from gcr-api.js:
   ```js
   { id: "services", label: "Services", emoji: "🎯", 
     sub: ["All","Photography","Weddings","Transportation","Wellness","Hair & Beauty"] }
   ```
3. Clicking a chip should filter cards in `#listingsGrid` by matching tag in card data.

**Current issue:** No JavaScript to build or handle filter buttons. App.js doesn't contain filter logic for this page.

---

## 4. CARD RENDERING

**Status:** ❌ **NO RENDERING LOGIC**

### Missing code structure:

**In gcr-listings.js**, there should be a function like:
```js
function renderListings(category, container) {
  const items = GCR.businesses.filter(/* by category */);
  container.innerHTML = items.map(b => `
    <a href="listing.html?id=${b.id}" class="gcr-card">
      <div class="gcr-card-img" style="background-image:url('${b.photos?.[0]?.image_url || b.hero_image_url}');">
        <span class="gcr-card-badge">${b.type || b.category}</span>
        ${renderStatusBadge(b)}
      </div>
      <div class="gcr-card-content">
        <h3>${b.name}</h3>
        <p>${b.subtitle || b.description?.substring(0, 80)}</p>
        ...
      </div>
    </a>
  `).join('');
}
```

**But this page has NO such call.** The grid will remain empty.

### API data fields to map:

| Field | Current State | Status |
|-------|---------------|--------|
| `b.name` | "8 Reale" | ✅ Present |
| `b.subtitle` | "Orange Beach's BEST kept secret" | ✅ Present |
| `b.description` | Full text | ✅ Present |
| `b.photos[].image_url` | Squarespace CDN URLs | ✅ Present |
| `b.address_line_1` | Full address | ✅ Present |
| `b.phone` | "251-484-0712" | ✅ Present (can be null) |
| `b.website_url` | Full URL | ✅ Present (can be null) |
| `b.social_*` | Instagram, Facebook, TikTok | ✅ Present (can be null) |
| `b.hours[]` | Day + open/close times | ✅ Present (can be null) |
| `b.rating` | null in sample | ⚠️ Can be null |
| `b.review_count` | 0 in sample | ⚠️ Can be 0 |

**The 888SLOT spam entry shows a critical problem:** the API includes a fake "entertainment" business with no address, no phone, no hours, and a malicious description. **This needs filtering.**

---

## 5. MISSING FEATURES

**Status:** ❌ **MULTIPLE GAPS**

### Not implemented:

1. **`GCR.load()` call** — See #1
2. **Event listener on gcr:loaded** — No code listens for it
3. **Filter chip rendering** — Hardcoded "All" only
4. **Card render function** — No function to populate #list

## Shopping `shopping.html`

# GCR Shopping Page — Audit Report

## 1. DATA LOADING ⚠️ **CRITICAL ISSUE**

**Status:** ❌ **BROKEN** — Data will NOT load and render.

**Problem:**
- Line 1 (`<script src="js/gcr-api.js"></script>`) loads GCR.load() but **never calls it**.
- Line 2 (`<script src="js/app.js"></script>`) runs before GCR data is fetched.
- Line 3 (`<script src="js/gcr-listings.js"></script>`) tries to render into `#listingsGrid` but GCR.businesses is still empty.

**Why it fails:**
```javascript
// gcr-listings.js needs GCR.businesses to be populated
// But GCR.load() is defined but NOT INVOKED
// No event listener for 'gcr:loaded' in gcr-listings.js
```

**Required fix:**
Add to bottom of `app.js` or inline in `<script>` tag:
```javascript
document.addEventListener('DOMContentLoaded', () => {
  GCR.load();
});
```

OR add to `gcr-listings.js`:
```javascript
document.addEventListener('gcr:loaded', (e) => {
  renderListings(e.detail.businesses);
});
```

---

## 2. LAYOUT & STRUCTURE ✅ **MOSTLY GOOD**

| Component | Status | Notes |
|-----------|--------|-------|
| Header | ✅ Present | `.gcr-header` with nav, logo, strip buttons |
| Hero Section | ✅ Present | Lines 170–172: Title, subtitle, gradient bg |
| Toolbar | ✅ Present | Lines 173–175: Result count, filter chips |
| Listings Grid | ✅ Present | Line 177: `<div class="list" id="listingsGrid" data-category="shopping">` |
| Sidebar | ✅ Present | Popular nearby, map iframe, claim CTA |
| Footer | ✅ Present | Logo, links, copyright |

**Issue:** `#listingsGrid` has class `list` (column flex) but should render cards. Spacing is correct.

---

## 3. FILTER CHIPS ⚠️ **INCOMPLETE**

**Line 176:**
```html
<div class="tag-row">
  <button class="tag-btn active" data-filter="all">All</button>
</div>
```

**Problems:**
- Only "All" button exists. No other subcategories rendered.
- `data-filter="all"` value doesn't match API tag structure.
- GCR.categories shows shopping should have: `["All","Souvenirs","Clothing","Boutique","Art & Gifts","Beach Gear"]`
- **No JavaScript to handle filter click events.**

**Sample data:** `888SLOT` (spam) and `8 Reale` (bar, not shopping) suggest **data filtering is missing entirely.**

**Required:**
```html
<button class="tag-btn" data-filter="all">All</button>
<button class="tag-btn" data-filter="souvenirs">Souvenirs</button>
<button class="tag-btn" data-filter="clothing">Clothing</button>
<button class="tag-btn" data-filter="boutique">Boutique</button>
<button class="tag-btn" data-filter="art_gifts">Art & Gifts</button>
<button class="tag-btn" data-filter="beach_gear">Beach Gear</button>
```

Plus filter logic in `gcr-listings.js`:
```javascript
document.querySelectorAll('.tag-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const filter = e.target.dataset.filter;
    filterListings(filter);
  });
});
```

---

## 4. CARD RENDERING ❌ **WILL FAIL**

**Line 177:** `<div class="list" id="listingsGrid" data-category="shopping"></div>`

**Current state:** Empty. No cards will render.

**Why:**
- `gcr-listings.js` injects styles but **does not contain the render logic** (excerpt cuts off at ~3000 chars).
- Need to verify full `gcr-listings.js` contains:
  ```javascript
  function renderCard(business) {
    return `
      <a href="/listing/${business.slug}" class="gcr-card">
        <div class="gcr-card-img" style="background-image:url('${business.photos?.[0]?.image_url || business.hero_image_url}')">
          ${business.rating ? `<span class="gcr-card-badge">⭐ ${business.rating}</span>` : ''}
          ${renderOpenStatus(business)}
        </div>
        <div class="gcr-card-content">
          <h4>${business.name}</h4>
          <p class="subtitle">${business.subtitle || ''}</p>
          <p class="description">${business.description?.slice(0, 120)}...</p>
          <div class="meta">
            <span>${business.address_line_1}</span>
            ${business.phone ? `<span>${business.phone}</span>` : ''}
          </div>
        </div>
      </a>
    `;
  }
  ```

**Test data issues:**
- `888SLOT`: No address, no phone, spam content → **should be filtered out**
- `8 Reale`: `entity_subtype: "bar"` → wrong category, **should not render on shopping page**

---

## 5. MISSING FEATURES 🚨

| Feature | Status | Impact |
|---------|--------|--------|
| GCR.load() invocation | ❌ Missing | **Data never fetches** |
| Filter event handlers | ❌ Missing | Chips don't work |
| Category-based filtering | ❌ Missing | All categories mixed in feed |
| Spam/invalid data filtering | ❌ Missing | 888SLOT renders as "shopping" |
| Open/close status

## Specials `specials.html`

# GCR Specials Page Audit Report

---

## 1. DATA LOADING ❌ **CRITICAL ISSUE**

**Status:** Data loads but **does not render**.

### Issue Details:
- ✅ `gcr-api.js` is loaded (line in `<script>` tags at bottom)
- ✅ `GCR.load()` is implicitly called by `gcr-api.js`
- ✅ `gcr:loaded` event fires
- ❌ **No listener** for the `gcr:loaded` event on this page
- ❌ `gcr-listings.js` is loaded but has **no specials-specific rendering logic**

### Problem:
Looking at the HTML (lines 1-2), the page loads:
```html
<script src="js/gcr-api.js"></script>
<script src="js/app.js"></script>
<script src="js/gcr-listings.js"></script>
<script src="js/gcr-config.js" data-category="specials"></script>
```

But `gcr-listings.js` (from context) is designed for **restaurants, coffee-sweets, shopping** only. The comment explicitly states:
```js
/* Card rendering for: restaurants, coffee-sweets, shopping
   (things-to-do, nightlife, events, happy-hours handled separately)
```

**Specials are NOT listed as handled.** There is no specials-specific JS file.

### Expected Data Flow (Missing):
```js
document.addEventListener('gcr:loaded', () => {
  const specials = GCR.specials;
  renderSpecials(specials);
});
```

This code **does not exist** on this page.

---

## 2. LAYOUT ✅ **MOSTLY PRESENT**

**Status:** Structure is correct, but containers may not populate.

### Verified:
- ✅ GCR header w/ nav tabs (lines 83–88)
- ✅ Hero section (lines 89–90)
- ✅ Toolbar w/ filter chips (lines 91–92)
- ✅ Main grid layout: 2-col (main + sidebar) on desktop, 1-col on mobile (lines 93–103)
- ✅ Footer (lines 104–116)
- ✅ `id="listingsGrid"` present (line 95) with `data-category="specials"`

### Problem:
The `<div class="list" id="listingsGrid">` is empty and **no JS populates it**.

---

## 3. FILTER CHIPS ❌ **NOT FUNCTIONAL**

**Status:** HTML exists but JS not wired.

### Details:
- ✅ Filter chips HTML present (line 92):
```html
<div class="tag-row">
  <button class="tag-btn active" data-filter="all">All</button>
</div>
```

- ❌ **Only 1 filter chip** (`all`) — specials page should show category filters like:
  - Food & Drink
  - Bar / Happy Hour
  - Entertainment
  - etc.

- ❌ **No JS click handlers** on `.tag-btn` buttons
- ❌ No filter logic to match `data-filter` to `GCR.specials` tags

### Expected:
```js
document.querySelectorAll('.tag-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    filterSpecials(filter);
  });
});
```

This code **does not exist**.

---

## 4. CARD RENDERING ❌ **WILL NOT WORK**

**Status:** No template; no render function.

### API Data Available:
From your sample, specials have:
- `name` ✅
- `subtitle` ✅
- `description` ✅
- `photos[].image_url` ✅
- `phone` ✅
- `email` ✅
- `website_url` ✅
- `address_line_1`, `city`, `state`, `zip` ✅
- `hours[]` ✅
- `tags[]` ✅

### Problem:
- ❌ No card HTML template defined anywhere
- ❌ `gcr-listings.js` has `.gcr-card` styles but no specials renderer
- ❌ Sample data shows **"888SLOT"** (spam/gambling site) — **NO DATA VALIDATION**

### Expected Card Template:
```html
<a href="/specials/{slug}" class="gcr-card">
  <div class="gcr-card-img" style="background-image:url('{photo}')">
    <span class="gcr-card-badge">{subtitle}</span>
  </div>
  <div class="gcr-card-content">
    <h3>{name}</h3>
    <p>{description}</p>
    <div class="gcr-card-meta">
      <span>📍 {address}</span>
      <span>📞 {phone}</span>
    </div>
  </div>
</a>
```

**This template does not exist in HTML or JS.**

---

## 5. MISSING FEATURES ❌ **MULTIPLE**

### 1. **No Specials-Specific Renderer**
   - Need `renderSpecials(data)` or similar function
   - Must handle missing fields gracefully (888SLOT has no address, phone, hours, tags)

### 2. **No Category Filtering**
   - Sidebar is hardcoded ("Popular Nearby", "Map", "Claim Your Listing")
   - Should show category pills from specials tags
   - Example from API: `"category": "bar"` or tags like `["speakeasy", "cocktails", "nightlife"]`

### 3. **No Search / Sort**
   - Page title says "Daily food deals" but no way to browse by type
   - No sorting by rating, distance, time

### 4. **Result Count**
   - Line 92: `<div class="toolbar-meta" id="resultCount">Loading...</div>`
   - Says "Loading

## The Wharf `the-wharf.html`

# GCR Audit: The Wharf Page (the-wharf.html)

---

## 1. DATA LOADING ❌ CRITICAL

**Status:** Page does NOT call `GCR.load()` — data will NOT load.

**Issue:**
- Line 240: `<script src="js/gcr-api.js"></script>` is included ✓
- Line 241: `<script src="js/app.js"></script>` is included ✓
- **BUT:** No `GCR.load()` call anywhere on page
- The inline script (lines 231-263) runs on `DOMContentLoaded` but GCR data hasn't loaded yet
- The page listens for data that never arrives

**Fix:**
```javascript
// Line 244, add before the inline script:
<script>
  document.addEventListener('DOMContentLoaded', () => {
    GCR.load(); // MUST call this first
  });
</script>
```

Or add to `app.js` as a global init.

**Impact:** All grids (`#diningGrid`, `#shopGrid`, `#wharfEvents`) will render empty or error.

---

## 2. LAYOUT & STRUCTURE ✓ GOOD

**Header:** Present (lines 41–73)
- Logo ✓
- Category tabs ✓  
- Action strip with modals ✓

**Sections:**
- Hero banner (lines 75–104) ✓
- Filter chips (lines 106–114) ✓
- Dining section w/ grid (lines 117–125) ✓
- Entertainment section w/ feature cards (lines 127–163) ✓
- Upcoming concerts (lines 166–179) ✓
- Shopping (lines 181–189) ✓
- Map placeholder (lines 191–194) ✓
- Info cards (lines 196–217) ✓
- Footer (lines 221–227) ✓

All major sections present with proper IDs.

---

## 3. FILTER CHIPS ⚠️ PRESENT BUT NON-FUNCTIONAL

**Location:** Lines 106–114

```html
<button class="filter-chip active" data-filter="all">All</button>
<button class="filter-chip" data-filter="dining">🍽️ Dining</button>
<button class="filter-chip" data-filter="entertainment">🎭 Entertainment</button>
<button class="filter-chip" data-filter="shopping">🛍️ Shopping</button>
<button class="filter-chip" data-filter="events">🎤 Concerts</button>
<button class="filter-chip" data-filter="marina">⛵ Marina</button>
```

**Issue:**
- Filter chips are rendered but **no JS handler exists** to filter the grids
- No click event listener in the inline script (lines 231–263)
- No filtering logic in `app.js`

**Fix:** Add to inline script:
```javascript
document.querySelectorAll('.filter-chip').forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Remove active class from all
    document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    const filter = e.target.dataset.filter;
    // Hide/show cards based on filter
    document.querySelectorAll('[data-wharf-category]').forEach(card => {
      if (filter === 'all' || card.dataset.wharfCategory === filter) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
});
```

---

## 4. CARD RENDERING ❌ BROKEN LOGIC

**Issues in inline script (lines 231–263):**

### Line 245: `renderBizCard` is undefined
```javascript
dg.innerHTML = items.length ? items.map(renderBizCard).join('') : ...
```
- **Problem:** `renderBizCard()` function doesn't exist in this file
- It should be imported from `gcr-listings.js` or defined locally
- Will throw: `ReferenceError: renderBizCard is not defined`

**Fix:** Add `<script src="js/gcr-listings.js"></script>` before the inline script (it includes `renderBizCard`).

### Line 253: `.getByLocation()` may not exist
```javascript
const items = GCR.getByLocation('the-wharf');
```
- **Check:** `gcr-api.js` defines `getByCategory()`, `getByTag()` but **no `getByLocation()` method**
- Will return `undefined` → items are `undefined`

**Fix:** Use filter instead:
```javascript
const items = GCR.businesses.filter(b => 
  b.address && b.address.toLowerCase().includes('wharf')
);
```

Or from live data sample, add a `location` or `venue` field to API and filter by that.

### Line 254: `.getByTag()` with location string
```javascript
const items = GCR.getByTag('the-wharf').filter(b => b.category === 'shopping');
```
- `getByTag()` exists, but it filters by tag slug, not location
- This will try to find tag `"the-wharf"` in the business tags — may work by accident if tagged, but unreliable

**Better approach:**
```javascript
const items = GCR.businesses.filter(b => 
  (b.tags?.some(t => t.tag.includes('wharf')) || b.address?.includes('Wharf')) && 
  b.type === 'shopping'
);
```

### Line 258: `.getByTag('the-wharf')` for concerts
```javascript
const shows = GCR.events.filter(e => e.venue && e.venue.toLowerCase().includes('wharf'));
```
- This one looks **OK** — filters events by venue name
- BUT depends on `GCR.events` being populated (which requires `GCR.load()`)

---

## 5.

## Things To Do `things-to-do.html`

# GCR "Things To Do" Page Audit

## 1. Data Loading — ⚠️ CRITICAL ISSUE

**Status:** ❌ **WILL NOT LOAD**

- **Line 1 (HTML):** `<script src="js/gcr-api.js"></script>` — Present ✓
- **Line 1 (HTML):** `<script src="js/app.js"></script>` — Present ✓
- **Line 1 (HTML):** `<script src="js/gcr-listings.js"></script>` — Present ✓

**Problem:** No initialization code. The scripts load but:
1. `GCR.load()` is **never called**
2. No listener for `gcr:loaded` event in page-specific code
3. `#listingsGrid` has `data-category="things-to-do"` but no rendering trigger

**Fix Required:**
```html
<!-- Before closing </body>, add: -->
<script>
  document.addEventListener('DOMContentLoaded', () => {
    GCR.load().then(() => {
      const grid = document.getElementById('listingsGrid');
      if (grid) renderListings(grid, 'things-to-do');
    });
  });
</script>
```

---

## 2. Layout Structure — ✓ GOOD

**Present & Correct:**
- ✓ Header with logo, nav tabs, action strip (line 12–15)
- ✓ Hero section with title + description (line 18–20)
- ✓ Toolbar with results count placeholder (line 21–24)
- ✓ Main layout: 2-column grid (line 25–40)
- ✓ Sidebar with Popular Nearby, Map, Claim Your Listing (line 35–46)
- ✓ Footer (line 47–57)
- ✓ `#listingsGrid` container exists (line 31)

**Minor Issue:**
- Line 26: `results-title` duplicates text ("Things To Do" appears twice)

---

## 3. Filter Chips — ⚠️ INCOMPLETE

**Line 23-24:**
```html
<div class="tag-row">
  <button class="tag-btn active" data-filter="all">All</button>
</div>
```

**Problems:**
1. Only **one chip** ("All") — should have: Water Sports, Fishing, Boat Rentals, Family, Outdoor, Tours, Golf, Attractions (from GCR.categories line 4 in gcr-api.js)
2. No chip click handlers to filter cards
3. `data-filter="all"` won't match API tags (API uses "tag" field with `tag_category`)

**Expected from API sample:**
- "888slot" has `tags: []` (empty — bad data)
- "8 Reale" has tags like "water sports", "fishing", "boat rentals" (none present in sample)

**Fix Required:**
```html
<div class="tag-row">
  <button class="tag-btn active" data-filter="all">All</button>
  <button class="tag-btn" data-filter="water-sports">Water Sports</button>
  <button class="tag-btn" data-filter="fishing">Fishing</button>
  <button class="tag-btn" data-filter="boat-rentals">Boat Rentals</button>
  <button class="tag-btn" data-filter="family">Family</button>
  <button class="tag-btn" data-filter="outdoor">Outdoor</button>
  <button class="tag-btn" data-filter="tours">Tours</button>
  <button class="tag-btn" data-filter="golf">Golf</button>
  <button class="tag-btn" data-filter="attractions">Attractions</button>
</div>
```

Add click handler in JS to filter `#listingsGrid` cards.

---

## 4. Card Rendering — ⚠️ WILL NOT RENDER (Missing Function)

**Line 31:**
```html
<div class="list" id="listingsGrid" data-category="things-to-do"></div>
```

**Problems:**

1. **Missing render function:** `gcr-listings.js` defines `.gcr-card` styles but **never exports a `renderListings()` function**
2. **Field mismatches:** API sample shows fields like:
   - `name` ✓
   - `description` ✓ 
   - `photos[].image_url` ✓
   - `address_line_1`, `city`, `state`, `zip` ✓
   - `phone` ✓
   - `website_url` ✓
   - `hours[]` array ✓
   - `rating` (null in sample) / `review_count` (0 in sample)

3. **Bad data in sample:**
   - "888slot" entry: `city: null`, `phone: null`, `address_line_1: null` — should be **filtered out or flagged**
   - No hero image — `hero_image_url: null` for both samples

4. **Card HTML structure unclear:** gcr-listings.js shows:
```css
.gcr-card {
  display: grid;
  grid-template-columns: clamp(240px, 35%, 400px) minmax(0, 1fr);
  /* image | content */
}
```
But no actual `<div class="gcr-card">` template defined.

**Fix Required:**

Add to `gcr-listings.js`:
```javascript
function renderListings(container, category) {
  const items = GCR.getByCategory(category);
  
  container.innerHTML = items
    .filter(item => item.is_active && item.gcr_listed) // Exclude 888slot
    .map(item => `
      <a href="${item.slug}.html" class="gcr-card">
        <div class="gcr-card-img" 
             style="background-image: url('${item.hero_image_url || item.photos?.[0]?.image_url || 'fallback.jpg'}')">

