# Search Breakage Analysis — Two Conflicting Implementations

## The Problem: TWO Different Search Systems

You have **two completely different search implementations** that don't know about each other:

### **System 1: search.html (Old/Broken)**

```javascript
// search.html line 782
const res = await fetch(`${API}/api/gcr/search`, {
  method: 'POST',
  body: JSON.stringify({ query: lastQuery }),
});
const data = await res.json();
allResults = data.results || [];

// Then it expects structure like:
// {
//   results: [
//     {
//       slug: "cosmos-restaurant-bar-zJgenE",
//       matched_menu_items: [{_type: 'menu', ...}],
//       matched_specials: [{...}],
//       ...
//     }
//   ]
// }
```

**Files involved:**
- `search.html` (standalone page)
- `API = 'https://cybercheck-api-database.vercel.app'`
- Uses `/api/gcr/search` endpoint
- Expects rich result structure (menu items, specials per result)
- Has complex filtering by tabs (all, menu, drinks, specials)

---

### **System 2: app.js + gcr-api.js (New/Working)**

```javascript
// app.js line 1518
const results = GCR.search(q);  // Async helper from GCR object

// gcr-api.js implementation:
async search(q) {
  try {
    const res = await fetch(GCR_API + '/search', {
      method: 'POST',
      body: JSON.stringify({ query: term }),
    });
    const data = await res.json();
    return data.results || [];
  } catch(e) {
    // FALLBACK: If API fails, do client-side search
    return this.businesses.filter(b => {
      return b.name.includes(term) || 
             b.subtitle.includes(term) ||
             b.tags.some(t => t.tag.includes(term));
    });
  }
}
```

**Files involved:**
- `app.js` (embedded in home.html, category pages)
- `gcr-api.js`
- Uses `/api/gcr/search` endpoint (same as System 1!)
- BUT expects simple structure: array of businesses only
- Has fallback to client-side search on GCR.businesses[]
- Used in quick search box (top right)

---

## Why Search is Broken

### **Conflict 1: Two Different API Endpoints**

```
System 1 (search.html): POST /api/gcr/search
System 2 (gcr-api.js):  POST /api/gcr/search
                        ↓
                   SAME ENDPOINT
                   BUT DIFFERENT RESPONSE EXPECTED
```

The API likely returns **System 2 format** (simple business array), but **search.html expects System 1 format** (rich results with menu_items, specials).

### **Conflict 2: API Base Confusion**

```
search.html:    const API = 'https://cybercheck-api-database.vercel.app'
gcr-api.js:     const GCR_API = 'https://cybercheck-api-database.vercel.app/api/gcr'
                                                                          ^^^^^^^^^^^^^^ Different!
```

search.html is hitting `${API}/api/gcr/search`  
gcr-api.js is hitting `${GCR_API}/search`

These resolve to the **same URL** but you can see the confusion.

### **Conflict 3: Old Code in search.html**

search.html has a ton of old code trying to do:
- Rich result cards with matched menu items
- Filtering by content type (menu vs drinks vs specials)
- Fuzzy/similar business matching
- Complex rendering with tabs

But the API **doesn't return** menu items per business anymore. That's old architecture.

---

## The Current Data Flow (What's Actually Happening)

### **Scenario 1: User searches from home.html search box**

```
1. User types "cosmos"
2. app.js search handler fires
3. Calls GCR.search("cosmos")
4. gcr-api.js makes POST /search
5. API returns: [{ slug: "cosmos-restaurant-bar-zJgenE", name: "Cosmos", ... }]
6. Home page renders quick search results (6 items)
✓ WORKS
```

### **Scenario 2: User goes to search.html directly**

```
1. User types "cosmos"
2. search.html search handler fires
3. Makes POST ${API}/api/gcr/search
4. API returns: [{ slug: "cosmos-restaurant-bar-zJgenE", name: "Cosmos", ... }]
5. search.html tries to access: allResults[0].matched_menu_items
6. undefined — no such property
7. Result card doesn't render menu items tab
❌ BROKEN (partially renders, missing data)
```

### **Scenario 3: User searches from app.js embedded search**

```
1. Same as Scenario 1
✓ WORKS
```

---

## How Profile Pages Work (Correct Model)

### **Cosmos in GCR (launching-GCR/profile.html)**

```
URL: launch-gcr.vercel.app/profile.html?slug=cosmos-restaurant-bar-zJgenE

Load sequence:
1. GCR.load() → entities cache
   └─ GCR.businesses = [{slug: "cosmos-restaurant-bar-zJgenE", ...}, ...]

2. GCR.loadProfile("cosmos-restaurant-bar-zJgenE")
   └─ POST /api/gcr/entity/cosmos-restaurant-bar-zJgenE
   └─ Returns: {
        slug: "...",
        name: "Cosmos Restaurant & Bar",
        menu_items: [{...}, {...}],
        drink_items: [{...}, {...}],
        sections: [{...}],
        photos: [...],
        ...
      }

3. Render full profile with menu, hours, photos
✓ WORKS CORRECTLY
```

### **Same Cosmos in cybercheck-links (QR Menu)**

```
URL: cybercheck-links.vercel.app/qr-menu.html?slug=cosmos-restaurant-bar-zJgenE

Load sequence:
1. Page loads, slug extracted from URL
2. Fetch /api/gcr/entity/cosmos-restaurant-bar-zJgenE
   └─ Returns full profile (same as above)
3. Render menu from response.menu_items
✓ WORKS CORRECTLY
```

### **What Search SHOULD Do**

```
URL: launching-gcr.vercel.app/search.html?q=cosmos

Load sequence:
1. GCR.load() → entities cache
2. User searches "cosmos"
3. POST /api/gcr/search?q=cosmos
   └─ Returns: [{slug: "cosmos-restaurant-bar-zJgenE", name: "Cosmos", ...}, ...]
4. For each result, OPTIONAL: fetch full profile
   └─ POST /api/gcr/entity/{slug} (like profile pages do)
   └─ This gives you menu_items, specials, photos
5. Render search results with rich cards
✓ SHOULD WORK
```

---

## Why Cosmos Works But Search Doesn't

**Cosmos Profile (Working):**
- Has explicit slug from URL
- One entity to load
- Fetches full profile (`/entity/{slug}`)
- Renders all menu items directly

**Search Results (Broken):**
- Multiple entities to search
- Gets basic results from `/search` endpoint
- search.html ASSUMES it gets rich data (menu items, specials) in same response
- API only returns basic entity data
- search.html code expects old architecture

---

## How To Fix Search

### **Option A: Simple Fix (5 min) — Use System 2**

Delete search.html complex code, use app.js approach:

```javascript
// search.html simplified

const q = new URLSearchParams(window.location.search).get('q');

// Wait for GCR
await new Promise(resolve => {
  if (GCR.loaded) resolve();
  else document.addEventListener('gcr:loaded', resolve, { once: true });
});

// Use GCR.search() — same as app.js
const results = await GCR.search(q);

// Render simple cards
results.forEach(business => {
  const card = `
    <div class="result-card">
      <h3>${business.name}</h3>
      <p>${business.subtitle}</p>
      <a href="profile.html?slug=${encodeURIComponent(business.slug)}">View Profile</a>
    </div>
  `;
  document.getElementById('results').innerHTML += card;
});
```

**Time:** 5 min  
**Trade-off:** Search results don't show menu items, specials inline (but profiles do)

---

### **Option B: Rich Fix (30 min) — Fetch full profiles per result**

Keep search.html complex UI, but fetch full profile for each result:

```javascript
// search.html enhanced

const q = new URLSearchParams(window.location.search).get('q');

// 1. Get basic search results
const basicResults = await GCR.search(q);  // Use GCR.search()

// 2. Fetch full profiles for each (parallel)
const fullProfiles = await Promise.all(
  basicResults.map(b => GCR.loadProfile(b.slug))
);

// 3. Now you have menu_items, specials, photos per business
fullProfiles.forEach(profile => {
  const menuItems = profile.menu_items || [];
  const specials = profile.specials || [];
  
  const card = `
    <div class="result-card">
      <h3>${profile.name}</h3>
      <div class="tabs">
        <button data-tab="menu">Menu (${menuItems.length})</button>
        <button data-tab="specials">Specials (${specials.length})</button>
      </div>
      <!-- Render menu items per tab -->
    </div>
  `;
  document.getElementById('results').innerHTML += card;
});
```

**Time:** 30 min  
**Trade-off:** Takes 2-3 seconds to load full profiles (but search page is not time-sensitive)  
**Benefit:** Search results show menu items, specials, just like old implementation

---

## Current Status: What Works vs What's Broken

| Feature | Status | Why | Location |
|---------|--------|-----|----------|
| Home search box (top right) | ✓ Works | Uses GCR.search() | app.js |
| Home results modal | ✓ Works | Simple cards from GCR.search() | app.js |
| search.html page | ❌ Broken | Expects old data format | search.html |
| Profile pages (cosmos, etc) | ✓ Works | Fetches full profile | profile.html |
| QR menu pages | ✓ Works | Fetches full profile | qr-menu.html |
| Category pages | ✓ Works | Uses GCR.businesses cache | restaurants.html, etc |

---

## The Root Cause

You have **three different ways to load data**:

1. **GCR core** (gcr-api.js) → entities, events, specials, happy-hours
2. **Profile fetch** (any page) → full entity detail at `/entity/{slug}`
3. **Search** (search.html) → expected old rich format but API returns new simple format

search.html was built for architecture #3 (old), but architecture #2 (new profile fetch) replaced it.

---

## Overlapping Old vs New Code

### **Old Code Still in search.html**

```javascript
// Expects this structure (OLD):
{
  results: [{
    slug: "cosmos",
    matched_menu_items: [{_type: 'menu', item_name: 'Pasta', ...}],
    matched_specials: [{special_name: '10% off', ...}],
    matched_drink_items: [{...}],
  }]
}

// But API returns (NEW):
{
  results: [{
    slug: "cosmos",
    name: "Cosmos Restaurant",
    subtitle: "Italian",
    category: "restaurants",
    // NO matched_menu_items, matched_specials here!
  }]
}
```

### **Tab Filtering Code (Old)**

```javascript
// search.html line 633-639
if (currentTab === 'menu') {
  filteredResults = allResults.filter(e => 
    (e.matched_menu_items||[]).some(i => i._type === 'menu')
  );
}
// This assumes matched_menu_items exists, but it doesn't!
```

### **Complex Rendering (Old)**

```javascript
// search.html line 460+
// Tries to render menu items, specials, drinnks per result
// But data structure doesn't have them at top level anymore
```

---

## Cosmos is Correct Model

Both cosmos URLs work:
- `launching-gcr.vercel.app/profile.html?slug=cosmos-restaurant-bar-zJgenE`
- `cybercheck-links.vercel.app/qr-menu.html?slug=cosmos-restaurant-bar-zJgenE`

Because they both:
1. Get slug from URL
2. Fetch `/entity/{slug}` endpoint
3. Get full profile with menu_items, specials
4. Render

Search.html SHOULD do the same:
1. Get search query from URL
2. Fetch `/search?q=cosmos`
3. Get array of businesses (basic info)
4. For each: **fetch `/entity/{slug}` for full profile** (like profile pages do!)
5. Render with menu items, specials

But currently search.html tries to do it in ONE call (old architecture).

---

## Action Plan to Fix Search

**Week 1 (Easy):**
- [ ] Option A: Simplify search.html to use GCR.search() + simple cards (5 min)
- [ ] Test cosmos search returns correct results
- [ ] Remove old `matched_menu_items` code

**Week 2 (Medium):**
- [ ] Option B: Add full profile fetches to search.html (30 min)
- [ ] Fetch menu_items, specials for each result in parallel
- [ ] Re-enable menu/specials tabs
- [ ] Test performance (should be ~2-3 sec)

**Recommended: Start with Option A**, then upgrade to B if needed.

