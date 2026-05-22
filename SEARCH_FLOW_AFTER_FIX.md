# Search Flow After Fix — Complete Walkthrough

## Scenario 1: User Searches "shrimp"

### **T=0ms: User opens search.html**

```html
<input id="searchInput" placeholder="Find food, drinks, specials...">
<button id="searchBtn">🔍 Search</button>
```

Page loads:
```javascript
// search.html loads
<script src="js/gcr-api.js"></script>  // GCR data layer loads
<script src="js/gcr-saves.js"></script> // User saves load
// ... page initialization
```

---

### **T=100ms: GCR.load() completes (from cache)**

```
GCR.businesses = [
  {slug: "cosmos-restaurant-bar-zJgenE", name: "Cosmos Restaurant & Bar", ...},
  {slug: "another-seafood", name: "Another Place", ...},
  {slug: "steakhouse-grill", name: "Steakhouse Grill", ...},
  ... (all businesses loaded)
]

GCR.events = [...]
GCR.specials = [...]
```

Page renders search box, ready for input.

---

### **T=500ms: User types "shrimp" and clicks Search button**

```javascript
searchBtn.click()
  └─ doSearch("shrimp")
```

**What happens inside doSearch():**

```
T=500ms: searchBtn clicked
  ├─ Show loading spinner
  ├─ lastQuery = "shrimp"
  │
  └─ Step 1: GCR.search("shrimp")
     ├─ Query the cached GCR.businesses array
     ├─ Find all businesses matching "shrimp":
     │  └─ Business name includes "shrimp"? No
     │  └─ Business subtitle includes "shrimp"? No
     │  └─ Business tags include "shrimp"? No
     │  └─ (Client-side search on cached data = instant)
     │
     ├─ POST /api/gcr/search with query:"shrimp"
     │  └─ API searches across all menu_items, drink_items, specials
     │  └─ Returns: [{slug: "cosmos"}, {slug: "another-seafood"}, {slug: "steakhouse"}]
     │  └─ (5 businesses have shrimp items)
     │
     └─ Return: [
         {slug: "cosmos-restaurant-bar-zJgenE", name: "Cosmos"},
         {slug: "another-seafood", name: "Another Place"},
         {slug: "steakhouse-grill", name: "Steakhouse Grill"},
         {slug: "seafood-shack", name: "Seafood Shack"},
         {slug: "tropical-bar", name: "Tropical Bar"}
       ]
```

---

### **T=600ms: Fetch full profiles (parallel)**

Now for each of the 5 results, fetch the full profile:

```javascript
// Step 2: Fetch full profiles
await Promise.all([
  GCR.loadProfile("cosmos-restaurant-bar-zJgenE"),
  GCR.loadProfile("another-seafood"),
  GCR.loadProfile("steakhouse-grill"),
  GCR.loadProfile("seafood-shack"),
  GCR.loadProfile("tropical-bar")
])

// What each returns:
```

**Example: Cosmos profile**

```javascript
{
  slug: "cosmos-restaurant-bar-zJgenE",
  name: "Cosmos Restaurant & Bar",
  menu_items: [
    {item_name: "Shrimp Pasta", price: 18.99, description: "..."},
    {item_name: "Coconut Shrimp", price: 12.99, description: "..."},
    {item_name: "Grilled Salmon", price: 24.99, description: "..."},
    {item_name: "Crab Cakes", price: 15.99, description: "..."}
    // ... 20 more items
  ],
  drink_items: [
    {item_name: "Shrimp Shooter", price: 8.99, description: "..."},
    {item_name: "Mai Tai", price: 12.99, description: "..."}
    // ... more drinks
  ],
  specials: [
    {special_name: "Shrimp Special - 20% off all shrimp items"},
    {special_name: "Happy Hour - 4-6pm"}
    // ... more specials
  ]
}
```

**Example: Another Place profile**

```javascript
{
  slug: "another-seafood",
  name: "Another Place",
  menu_items: [
    {item_name: "Grilled Shrimp", price: 24.99, description: "..."},
    {item_name: "Pasta Primavera", price: 16.99, description: "..."},
    // ... more items
  ],
  drink_items: [
    // ... drinks (no shrimp drinks)
  ],
  specials: [
    // ... no shrimp specials
  ]
}
```

---

### **T=700-1200ms: Parallel loads finish**

Depending on cache:
- Cosmos (cached): 50ms
- Another Place (cached): 50ms
- Steakhouse (fresh): 500ms
- Seafood Shack (fresh): 500ms
- Tropical Bar (fresh): 500ms

All complete in parallel, slowest = ~500ms

---

### **T=1200ms: Client-side extract matching items**

```javascript
// Step 3: Filter items locally
const enrichedResults = profiles.map(profile => {
  const qLower = "shrimp";
  return {
    ...profile,
    matched_menu_items: profile.menu_items.filter(item =>
      item.item_name.toLowerCase().includes(qLower)
    ),
    matched_drink_items: profile.drink_items.filter(item =>
      item.item_name.toLowerCase().includes(qLower)
    ),
    matched_specials: profile.specials.filter(item =>
      item.special_name.toLowerCase().includes(qLower)
    )
  };
});
```

**Result: enrichedResults**

```javascript
[
  {
    slug: "cosmos-restaurant-bar-zJgenE",
    name: "Cosmos Restaurant & Bar",
    menu_items: [...], // Full list
    drink_items: [...],
    specials: [...],
    // NEW: Filtered to just matching items
    matched_menu_items: [
      {item_name: "Shrimp Pasta", price: 18.99},
      {item_name: "Coconut Shrimp", price: 12.99}
    ],
    matched_drink_items: [
      {item_name: "Shrimp Shooter", price: 8.99}
    ],
    matched_specials: [
      {special_name: "Shrimp Special - 20% off"}
    ]
  },
  {
    slug: "another-seafood",
    name: "Another Place",
    menu_items: [...],
    matched_menu_items: [
      {item_name: "Grilled Shrimp", price: 24.99}
    ],
    matched_drink_items: [],
    matched_specials: []
  },
  // ... 3 more restaurants
]
```

---

### **T=1250ms: Apply tab filtering**

```javascript
// Existing search.html code kicks in
allResults = enrichedResults;
applyTab('all');  // Show all results
```

**applyTab('all')** shows all restaurants that have ANY matching items:

```javascript
if (currentTab === 'all') {
  filteredResults = allResults;  // All 5 restaurants
}
```

Then **renderResults()** displays:

```html
<div class="results-container">
  <!-- COSMOS -->
  <div class="restaurant-card">
    <h2>🍤 Cosmos Restaurant & Bar</h2>
    <p>4.8 ⭐ · Italian · Orange Beach</p>
    
    <div class="matched-items">
      <h3>🍽️ Menu Items (2 matches)</h3>
      <div class="menu-item">
        <strong>Shrimp Pasta</strong>
        <span class="price">$18.99</span>
      </div>
      <div class="menu-item">
        <strong>Coconut Shrimp</strong>
        <span class="price">$12.99</span>
      </div>
      
      <h3>🍺 Drinks (1 match)</h3>
      <div class="drink-item">
        <strong>Shrimp Shooter</strong>
        <span class="price">$8.99</span>
      </div>
      
      <h3>🏷️ Specials (1 match)</h3>
      <div class="special-item">
        <strong>Shrimp Special - 20% off all shrimp items</strong>
      </div>
    </div>
    
    <a href="profile.html?slug=cosmos-restaurant-bar-zJgenE" class="view-profile">
      View Full Menu →
    </a>
  </div>
  
  <!-- ANOTHER PLACE -->
  <div class="restaurant-card">
    <h2>🍤 Another Place</h2>
    <p>4.5 ⭐ · Seafood · Gulf Shores</p>
    
    <div class="matched-items">
      <h3>🍽️ Menu Items (1 match)</h3>
      <div class="menu-item">
        <strong>Grilled Shrimp</strong>
        <span class="price">$24.99</span>
      </div>
    </div>
  </div>
  
  <!-- ... 3 more restaurants ... -->
</div>
```

---

### **T=1300ms: User sees results**

```
┌─────────────────────────────────────────┐
│ Results for "shrimp" (5 results)        │
├─────────────────────────────────────────┤
│                                         │
│  Filter: 🔍 All 🏢 Business 🍽️ Food  │
│          🍺 Drink 🏷️ Special         │
│                                         │
│  🍤 Cosmos Restaurant & Bar             │
│     ⭐ 4.8 · Italian · Orange Beach    │
│                                         │
│     🍽️ Menu Items (2)                 │
│     • Shrimp Pasta .......... $18.99   │
│     • Coconut Shrimp ........ $12.99   │
│                                         │
│     🍺 Drinks (1)                      │
│     • Shrimp Shooter ........ $8.99    │
│                                         │
│     🏷️ Specials (1)                   │
│     • Shrimp Special - 20% off         │
│                                         │
│     [View Full Menu →]                 │
│                                         │
│  ────────────────────────────────────  │
│                                         │
│  🍤 Another Place                       │
│     ⭐ 4.5 · Seafood · Gulf Shores     │
│                                         │
│     🍽️ Menu Items (1)                 │
│     • Grilled Shrimp ....... $24.99    │
│                                         │
│     [View Full Menu →]                 │
│                                         │
│  ────────────────────────────────────  │
│  [Load More...]                         │
│                                         │
└─────────────────────────────────────────┘
```

✓ **Page fully interactive**

---

## User Interactions After Search

### **User clicks 🍽️ Food filter**

```javascript
applyTab('food');  // Existing code
```

Shows **only restaurants that have matching MENU ITEMS**:

```
🍤 Cosmos (2 menu items match)
🍤 Another Place (1 menu item matches)
🍤 Steakhouse Grill (3 menu items match)
🍤 Seafood Shack (1 menu item matches)

(Tropical Bar removed — has no matching menu items, only a drink)
```

---

### **User clicks 🍺 Drinks filter**

```javascript
applyTab('drinks');
```

Shows **only restaurants that have matching DRINKS**:

```
🍤 Cosmos (1 drink matches)
🍤 Tropical Bar (2 drinks match)

(Other restaurants removed — no matching drinks)
```

---

### **User clicks 🏷️ Specials filter**

```javascript
applyTab('specials');
```

Shows **only restaurants that have matching SPECIALS**:

```
🍤 Cosmos (1 special matches)

(Other restaurants removed — no matching specials)
```

---

### **User clicks [View Full Menu] on Cosmos**

```html
<a href="profile.html?slug=cosmos-restaurant-bar-zJgenE">
  View Full Menu →
</a>
```

Navigates to profile.html:
- Shows full cosmos menu (not just shrimp items)
- Shows all photos, hours, reviews
- Same as if they'd gone to profile directly
✓ **Works exactly like cosmos model**

---

## Scenario 2: User Searches "cosmos"

### **Search Input**

User types: "cosmos"

### **Search Process**

```
T=500ms: GCR.search("cosmos")
  └─ Find businesses matching "cosmos"
  └─ API returns: [{slug: "cosmos-restaurant-bar-zJgenE", name: "Cosmos"}]
  └─ Only 1 result
  
T=600ms: GCR.loadProfile("cosmos-restaurant-bar-zJgenE")
  └─ Fetch full profile (probably cached)
  └─ Returns: all menu_items, drink_items, specials for Cosmos
  
T=620ms: Extract matching items
  └─ matched_menu_items: items with "cosmos" in name (none, maybe)
  └─ matched_drink_items: items with "cosmos" in name (none, maybe)
  └─ matched_specials: items with "cosmos" in name (none, maybe)
  
T=650ms: Display results
  └─ Shows Cosmos restaurant
  └─ Tabs show: 0 matching menu items, 0 matching drinks, 0 matching specials
  └─ But user can click [View Full Menu] to see everything
```

### **Display**

```
┌─────────────────────────────────────────┐
│ Results for "cosmos" (1 result)          │
├─────────────────────────────────────────┤
│                                         │
│  Filter: 🔍 All 🏢 Business 🍽️ Food  │
│          🍺 Drink 🏷️ Special         │
│                                         │
│  🍤 Cosmos Restaurant & Bar             │
│     ⭐ 4.8 · Italian · Orange Beach    │
│                                         │
│     🍽️ Menu Items (0)                 │
│     (No menu items match "cosmos")     │
│                                         │
│     🍺 Drinks (0)                      │
│     (No drinks match "cosmos")          │
│                                         │
│     🏷️ Specials (0)                   │
│     (No specials match "cosmos")        │
│                                         │
│     [View Full Menu →]                 │
│                                         │
└─────────────────────────────────────────┘
```

User clicks [View Full Menu] → sees full cosmos profile ✓

---

## Tab Filtering Examples

### **Search: "happy"**

Results: 3 restaurants have "happy" in specials

```
Filter: 🔍 All (3 restaurants)
  ✓ Cosmos — Happy Hour Special
  ✓ Another Place — Happy Hour 4-6pm
  ✓ Steakhouse — Happy Hour Drinks

Filter: 🏢 Business (0 restaurants)
  (No restaurant named "happy")

Filter: 🍽️ Food (0 restaurants)
  (No menu items named "happy")

Filter: 🍺 Drinks (0 restaurants)
  (No drinks named "happy")

Filter: 🏷️ Specials (3 restaurants)
  ✓ Cosmos — Happy Hour Special
  ✓ Another Place — Happy Hour 4-6pm
  ✓ Steakhouse — Happy Hour Drinks
```

---

### **Search: "burger"**

Results: Burger business + burger menu items

```
Filter: 🔍 All (5 restaurants)
  ✓ Burger King (business name matches)
  ✓ Restaurant 1 (has burger menu items)
  ✓ Restaurant 2 (has burger menu items)
  ✓ Restaurant 3 (has burger menu items)
  ✓ Restaurant 4 (has burger menu items)

Filter: 🏢 Business (1 restaurant)
  ✓ Burger King

Filter: 🍽️ Food (5 restaurants)
  ✓ Burger King (+ its burgers)
  ✓ Restaurant 1 (has burger items)
  ✓ Restaurant 2 (has burger items)
  ✓ Restaurant 3 (has burger items)
  ✓ Restaurant 4 (has burger items)

Filter: 🍺 Drinks (0 restaurants)

Filter: 🏷️ Specials (2 restaurants)
  ✓ Burger King (Burger Special)
  ✓ Restaurant 3 (Burger Combo Special)
```

---

## Timeline Summary

```
T=0ms    → User opens search.html
T=100ms  → GCR loads from cache
T=500ms  → User types and searches
T=550ms  → GCR.search() returns basic results (instant, cached)
T=600ms  → Parallel: Fetch full profiles
T=700-1200ms → Profiles arrive (mix of cache + fresh)
T=1200ms → Client-side extract matching items
T=1250ms → Render results
T=1300ms → USER SEES RESULTS ✓
T=1300+ms → User can click filters, view profiles, etc.
```

**Total time: ~1.3 seconds from search to seeing results**

(vs old broken state where it would show empty/malformed cards)

---

## What Data Flows

### **Search: "shrimp"**

```
1. GCR.search("shrimp")
   ├─ Client-side: grep cached GCR.businesses
   ├─ Server-side: POST /api/gcr/search
   └─ Returns: 5 business slugs

2. GCR.loadProfile(slug) × 5 (parallel)
   └─ GET /api/gcr/entity/{slug}
   └─ Returns: full profile with menu_items[], drink_items[], specials[]

3. Client-side: Extract matching items
   └─ Filter arrays by query term

4. Render with tab filtering
   └─ Search.html filtering logic already works
   └─ Shows results grouped by restaurant
```

### **Display: "shrimp" → "All" tab**

```
Cosmos
├─ matched_menu_items: [Shrimp Pasta, Coconut Shrimp]
├─ matched_drink_items: [Shrimp Shooter]
└─ matched_specials: [Shrimp Special]

Another Place
├─ matched_menu_items: [Grilled Shrimp]
├─ matched_drink_items: []
└─ matched_specials: []

... (3 more restaurants)
```

### **Display: "shrimp" → "Food" filter**

```
(Show only restaurants with matched_menu_items.length > 0)

Cosmos
└─ matched_menu_items: [Shrimp Pasta, Coconut Shrimp]

Another Place
└─ matched_menu_items: [Grilled Shrimp]

Steakhouse Grill
└─ matched_menu_items: [Coconut Shrimp Appetizer, Shrimp Scampi]

... (2 more with matching items)

(Tropical Bar removed — matched_menu_items is empty)
```

---

## Error Handling

### **Network fails during profile fetch**

```
GCR.loadProfile(slug) fails
├─ Check cache: HIT (profile loaded before)
└─ Return cached profile
```

Result: Shows cached results (stale data, but works)

### **API returns empty results**

```
GCR.search("xyzabc") returns: []
└─ enrichedResults = [] (empty)
```

Result: Shows "No results found for 'xyzabc'"

### **Specific restaurant has no matching items**

```
enrichedResults[0] = {
  slug: "some-restaurant",
  name: "Restaurant Name",
  matched_menu_items: [],
  matched_drink_items: [],
  matched_specials: []
}
```

Result: Restaurant card shows "0 matches" for each tab

---

## Summary: What Changes

### **Before Fix:**
- Search tries to fetch `/api/gcr/search` (old endpoint)
- API doesn't return `matched_menu_items` (old field)
- search.html breaks trying to access undefined fields
- Results show empty or malformed cards

### **After Fix:**
- Search uses `GCR.search()` (new, working)
- Fetches full profiles with `GCR.loadProfile()` (same as cosmos)
- Client-side filters items locally
- search.html filtering/rendering code works perfectly
- Results show rich cards with matched items grouped by restaurant

### **User Experience:**
- Search takes ~1.3 seconds (vs broken state)
- Shows all matching items across all restaurants
- Tabs work (All, Business, Food, Drinks, Specials)
- Filters actually filter correctly
- Users can view full profile from search results

