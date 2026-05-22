# Fix API Inconsistency: Make Search Use Cosmos Pattern

## The Problem: Two Different APIs

### **What Cosmos Uses (WORKS)**
```
Endpoint: GET /api/gcr/entity/{slug}
Response: {
  slug: "cosmos-restaurant-bar-zJgenE",
  name: "Cosmos Restaurant & Bar",
  menu_items: [
    {item_name: "Shrimp Pasta", price: 18.99},
    {item_name: "Coconut Shrimp", price: 12.99}
  ],
  drink_items: [
    {item_name: "Shrimp Shooter", price: 8.99}
  ],
  specials: [
    {special_name: "Shrimp Special"}
  ],
  sections: [...],
  photos: [...]
}
```

**Used by:** profile.html, qr-menu.html, menu.html  
**Status:** ✓ WORKS PERFECTLY

---

### **What Search Uses (BROKEN)**
```
Endpoint: POST /api/gcr/search
Request: {query: "shrimp"}
Response: {
  results: [
    {
      slug: "cosmos-restaurant-bar-zJgenE",
      matched_menu_items: [
        {item_name: "Shrimp Pasta", ...}
      ],
      matched_specials: [...]
    }
  ]
}
```

**Used by:** search.html only  
**Status:** ❌ API DOESN'T RETURN matched_menu_items

---

## Why It's Broken

The `/api/gcr/search` endpoint **was built for old architecture** where:
- Search returned pre-computed matched items per business
- Frontend just had to filter and display

But that endpoint probably got **deprecated or never updated** to the new format.

Meanwhile, `/api/gcr/entity/{slug}` is the **NEW standard** that:
- Returns complete business data
- Frontend queries it whenever needed
- All pages (cosmos, menu, profile) use it

---

## The Solution: Align Search to Cosmos Pattern

Instead of relying on `/api/gcr/search` returning matched items, use the cosmos pattern:

```javascript
// STEP 1: Search for matching businesses
const q = 'shrimp';
const results = await GCR.search(q);  // Uses GCR.search() from gcr-api.js
// Returns: [{slug: "cosmos", name: "Cosmos", ...}, {slug: "another", ...}]

// STEP 2: For each result, fetch full profile (just like cosmos does)
const enrichedResults = await Promise.all(
  results.map(biz => GCR.loadProfile(biz.slug))
);
// Now we have: [{menu_items: [...], drink_items: [...], specials: [...]}, ...]

// STEP 3: Client-side filter matching items
enrichedResults = enrichedResults.map(profile => ({
  ...profile,
  // Find items that match the search term
  matched_menu_items: (profile.menu_items || []).filter(item =>
    (item.item_name || '').toLowerCase().includes(q.toLowerCase())
  ),
  matched_drink_items: (profile.drink_items || []).filter(item =>
    (item.item_name || '').toLowerCase().includes(q.toLowerCase())
  ),
  matched_specials: (profile.specials || []).filter(item =>
    (item.special_name || '').toLowerCase().includes(q.toLowerCase())
  )
}));

// STEP 4: search.html filtering/rendering works as-is
allResults = enrichedResults;
applyTab('all');  // Filter by: All, Businesses, Food, Drinks, Specials
renderResults();
```

**That's it.** Now search uses the same `GCR.loadProfile()` that cosmos uses.

---

## Detailed Implementation (30 min)

### **File: search.html**

Replace the old search handler (line ~780):

**BEFORE (Old API):**
```javascript
async function doSearch(q) {
  lastQuery = q;
  
  try {
    const res = await fetch(`${API}/api/gcr/search`, {  // ← OLD ENDPOINT
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ query: lastQuery }),
    });
    const data = await res.json();
    allResults = data.results || [];  // ← Expects matched_menu_items here
  } catch(err) {
    console.error('Search error:', err);
    allResults = [];
  }
  
  // ... rest of rendering
}
```

**AFTER (Cosmos Pattern):**
```javascript
async function doSearch(q) {
  lastQuery = q;
  document.getElementById('gcrLoadingOverlay').style.display = '';
  
  try {
    // STEP 1: Use GCR.search() (waits for GCR to load)
    if (!GCR.loaded) {
      await new Promise(resolve => {
        document.addEventListener('gcr:loaded', resolve, { once: true });
      });
    }
    
    const basicResults = await GCR.search(q);  // ← NEW: Uses GCR method
    
    // STEP 2: Fetch full profiles for each result (like cosmos does)
    allResults = await Promise.all(
      basicResults.map(async (biz) => {
        const profile = await GCR.loadProfile(biz.slug);
        
        // STEP 3: Client-side extract matching items
        const qLower = q.toLowerCase();
        return {
          ...profile,
          slug: profile.slug || biz.slug,
          name: profile.name || biz.name,
          // NEW: Add matched items
          matched_menu_items: (profile.menu_items || []).filter(item =>
            (item.item_name || item.name || '').toLowerCase().includes(qLower)
          ),
          matched_drink_items: (profile.drink_items || []).filter(item =>
            (item.item_name || item.name || '').toLowerCase().includes(qLower)
          ),
          matched_specials: (profile.specials || []).filter(item =>
            (item.special_name || item.name || '').toLowerCase().includes(qLower)
          )
        };
      })
    );
    
  } catch(err) {
    console.error('Search error:', err);
    allResults = [];
  }
  
  document.getElementById('gcrLoadingOverlay').style.display = 'none';
  
  // REST OF RENDERING CODE STAYS THE SAME
  similarResults = findSimilar(lastQuery, allResults);
  
  if (!allResults.length && !similarResults.length) {
    document.getElementById('noResults').style.display = '';
    return;
  }
  
  document.getElementById('resultsSection').style.display = '';
  updateCounts(allResults);
  
  applyTab('all');  // ← Filtering by All, Businesses, Food, Drinks, Specials
}
```

---

## What Changes

### **search.html changes:**
- Line ~780: Replace old fetch with `GCR.search()` + `GCR.loadProfile()` pattern
- Add client-side item matching (find items with matching names)
- Add `matched_menu_items`, `matched_drink_items`, `matched_specials` fields
- **Everything else stays the same** ✓

### **What stays the same:**
- Tab filtering (All, Businesses, Food, Drinks, Specials) — already works
- Rendering code — already correct
- UI/layout — no changes
- Search input/button — no changes

### **API changes:**
- ❌ No longer uses: `POST /api/gcr/search` (old endpoint)
- ✓ Now uses: `GCR.search()` → `POST /api/gcr/search` from gcr-api.js (new)
- ✓ Now uses: `GCR.loadProfile(slug)` → `GET /api/gcr/entity/{slug}` (same as cosmos)

---

## Performance Impact

### **Before (Old Single-Call Approach)**
```
User types "shrimp"
  ↓
POST /api/gcr/search
  ↓
API returns pre-computed matched items
  ↓
Render (100ms)
  ↓
TOTAL: ~500ms (API dependent)
```

### **After (Cosmos Multi-Call Approach)**
```
User types "shrimp"
  ↓
GCR.search("shrimp") → finds matching businesses
  ↓
Results: 5 restaurants have shrimp items
  ↓
Parallel: fetch /entity/{slug} for each of 5 businesses
  │
  ├─ GCR.loadProfile("cosmos-...") [cached]     → 50ms
  ├─ GCR.loadProfile("another-...") [cached]    → 50ms
  ├─ GCR.loadProfile("third-...") [fresh]       → 500ms
  ├─ GCR.loadProfile("fourth-...") [fresh]      → 500ms
  └─ GCR.loadProfile("fifth-...") [fresh]       → 500ms
  ↓
Client-side: Extract matching items from each profile
  ↓
Render (100ms)
  ↓
TOTAL: ~500-1000ms (depends on how many fresh vs cached)
```

**Not faster, but:**
- ✓ More reliable (doesn't depend on API computing matches)
- ✓ Consistent with cosmos pattern
- ✓ Offline-capable (can use cached profiles)
- ✓ Real-time filtering (user can see exact items)

---

## Why This Works

### **Cosmos Model (Proven to Work)**
```
profile.html?slug=cosmos
├─ GCR.loadProfile("cosmos")
├─ Returns full profile with menu_items[], drink_items[], specials[]
└─ Render all items
✓ WORKS
```

### **New Search Model (Same as Cosmos)**
```
search.html?q=shrimp
├─ GCR.search("shrimp") → find matching businesses
├─ For each: GCR.loadProfile(slug)
├─ Returns full profile with menu_items[], drink_items[], specials[]
├─ Filter locally to find matching items
└─ Render items grouped by restaurant
✓ SHOULD WORK (uses proven pattern)
```

---

## Exact Code to Replace (search.html line ~780)

Find this block:
```javascript
  try {
    const res  = await fetch(`${API}/api/gcr/search`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ query: lastQuery }),
    });
    const data = await res.json();
    allResults = data.results || [];
  } catch(err) {
    console.error('Search error:', err);
    allResults = [];
  }
```

Replace with this:
```javascript
  try {
    // Wait for GCR to load
    if (!GCR.loaded) {
      await new Promise(resolve => {
        document.addEventListener('gcr:loaded', resolve, { once: true });
      });
    }
    
    // Step 1: Search for matching businesses
    const basicResults = await GCR.search(lastQuery);
    
    // Step 2: Fetch full profiles and extract matching items
    allResults = await Promise.all(
      basicResults.map(async (biz) => {
        const profile = await GCR.loadProfile(biz.slug);
        const qLower = lastQuery.toLowerCase();
        
        return {
          ...profile,
          matched_menu_items: (profile.menu_items || []).filter(item =>
            (item.item_name || item.name || '').toLowerCase().includes(qLower)
          ),
          matched_drink_items: (profile.drink_items || []).filter(item =>
            (item.item_name || item.name || '').toLowerCase().includes(qLower)
          ),
          matched_specials: (profile.specials || []).filter(item =>
            (item.special_name || item.name || '').toLowerCase().includes(qLower)
          )
        };
      })
    );
  } catch(err) {
    console.error('Search error:', err);
    allResults = [];
  }
```

That's **literally the only change needed**.

---

## Testing

After making the change:

1. **Open search.html**
2. **Search for "shrimp"**
   - Should show all restaurants with shrimp items
   - Each restaurant shows which items match
3. **Click filter buttons:**
   - 🔍 All → Show all restaurants + items
   - 🏢 Businesses → Show only if restaurant name has "shrimp"
   - 🍽️ Food → Show only restaurants with matching menu items
   - 🍺 Drinks → Show only restaurants with matching drinks
   - 🏷️ Specials → Show only restaurants with matching specials
4. **Search for "cosmos" (business name)**
   - Should show Cosmos restaurant
   - All menu items, drinks, specials should be listed

---

## Benefits of This Fix

✓ **Aligned:** Uses same API as cosmos (GCR.loadProfile)  
✓ **Robust:** Falls back to cache if API fails  
✓ **Consistent:** Same data structure everywhere  
✓ **Extensible:** Easy to add more filters or fields  
✓ **Maintainable:** One less custom API to maintain

