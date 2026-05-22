# Search: Correct Architecture (Content-Based Search)

## What This Search Actually Is

**NOT:** "Find restaurants named X"  
**YES:** "Find ALL items matching X across all restaurants"

When user searches **"shrimp"**, they want:

```
Results showing which restaurants HAVE shrimp:

🍤 Cosmos Restaurant & Bar
   🍽️ Shrimp Pasta — $18.99
   🍽️ Coconut Shrimp — $12.99

🍤 Another Restaurant
   🍽️ Grilled Shrimp — $24.99

🍤 Third Place
   🏷️ Shrimp Special — 20% off all shrimp items
```

**Filter by content type:**
- 🔍 All — Everything (businesses, items, specials)
- 🏢 Businesses — Just business names matching "shrimp"
- 🍽️ Food — Menu items matching "shrimp"
- 🍺 Drinks — Drink items matching "shrimp"
- 🏷️ Specials — Specials matching "shrimp"

---

## Current Broken State

search.html **expects the API to return:**

```javascript
{
  results: [
    {
      slug: "cosmos-restaurant-bar-zJgenE",
      name: "Cosmos Restaurant & Bar",
      matched_menu_items: [
        {item_name: "Shrimp Pasta", price: 18.99, _type: 'menu'},
        {item_name: "Coconut Shrimp", price: 12.99, _type: 'menu'}
      ],
      matched_drink_items: [
        {item_name: "Shrimp Shooter", price: 8.99, _type: 'drink'}
      ],
      matched_specials: [
        {special_name: "Shrimp Special 20% off", _type: 'special'}
      ]
    },
    {
      slug: "another-restaurant",
      name: "Another Place",
      matched_menu_items: [
        {item_name: "Grilled Shrimp", price: 24.99, _type: 'menu'}
      ],
      matched_drink_items: [],
      matched_specials: []
    }
  ]
}
```

But **API probably returns:**

```javascript
{
  results: [
    {
      slug: "cosmos-restaurant-bar-zJgenE",
      name: "Cosmos Restaurant & Bar",
      // NO matched_menu_items, matched_drink_items, matched_specials!
    }
  ]
}
```

---

## Why search.html Has All That Tab Code

The old code structure makes perfect sense now:

```javascript
// search.html line 633-639
if (currentTab === 'all') {
  filteredResults = allResults;  // Show all matches
}
else if (currentTab === 'businesses') {
  filteredResults = allResults.filter(e => (e.name||'').toLowerCase().includes(q));
}
else if (currentTab === 'food') {
  filteredResults = allResults.filter(e => 
    (e.matched_menu_items||[]).some(i => i._type === 'menu')
  );
}
else if (currentTab === 'drinks') {
  filteredResults = allResults.filter(e => 
    (e.matched_drink_items||[]).some(i => i._type === 'drink')
  );
}
else if (currentTab === 'specials') {
  filteredResults = allResults.filter(e => 
    (e.matched_specials||[]).length > 0
  );
}
```

This is **filtering by content type**, which only works if API returns the matched items per business.

---

## The Real Problem

The API's `/api/gcr/search` endpoint probably:

1. **Old version:** Returned rich structure with matched items per business
2. **New version:** Only returns matching businesses (basic info)

Result: search.html code breaks because `matched_menu_items` doesn't exist.

---

## Solution: Two Approaches

### **Approach A: Fix the API (Best, if possible)**

**Ideal endpoint:** `POST /api/gcr/search`

```javascript
Request:
{
  query: "shrimp",
  limit: 50
}

Response:
{
  results: [
    {
      slug: "cosmos-restaurant-bar-zJgenE",
      name: "Cosmos Restaurant & Bar",
      city: "Orange Beach",
      
      // Matched content (what made this result relevant)
      matched_menu_items: [
        {id: 123, item_name: "Shrimp Pasta", price: 18.99},
        {id: 124, item_name: "Coconut Shrimp", price: 12.99}
      ],
      matched_drink_items: [
        {id: 456, item_name: "Shrimp Shooter", price: 8.99}
      ],
      matched_specials: [
        {id: 789, special_name: "Shrimp Special"}
      ]
    },
    {
      slug: "another-place",
      name: "Another Place",
      matched_menu_items: [
        {id: 234, item_name: "Grilled Shrimp", price: 24.99}
      ],
      matched_drink_items: [],
      matched_specials: []
    }
  ]
}
```

**If API can return this:** search.html code works perfectly as-is.

---

### **Approach B: Hybrid Client-Side (Fallback)**

If API can't be changed, search.html does:

```javascript
// 1. Get basic search results from API
const basicResults = await fetch(`/api/gcr/search`, {
  method: 'POST',
  body: JSON.stringify({query: q})
}).then(r => r.json());

// 2. For each result, fetch full business profile
const enrichedResults = await Promise.all(
  basicResults.results.map(async (business) => {
    const fullProfile = await GCR.loadProfile(business.slug);
    
    // 3. Client-side: find matching items
    const menuTerm = q.toLowerCase();
    return {
      ...business,
      matched_menu_items: (fullProfile.menu_items || []).filter(item =>
        (item.item_name || '').toLowerCase().includes(menuTerm)
      ),
      matched_drink_items: (fullProfile.drink_items || []).filter(item =>
        (item.item_name || '').toLowerCase().includes(menuTerm)
      ),
      matched_specials: (fullProfile.specials || []).filter(item =>
        (item.special_name || '').toLowerCase().includes(menuTerm)
      )
    };
  })
);

// 4. Rest of search.html code works as-is!
allResults = enrichedResults;
applyTab('all');  // Filtering code already works
```

**Trade-off:** Takes 2-3 seconds (fetches full profile for each result), but works perfectly.

---

## Comparison: Your Two Search Scenarios

### **Scenario 1: Search "cosmos" (Business name)**

```
User types: "cosmos"
↓
API search: "cosmos" → "Cosmos Restaurant & Bar"
↓
Results show: 1 business
   - Matched business name ✓
   - All menu items? (if Approach A) or fetch from profile (Approach B)
   - All drinks? Similar
   - All specials? Similar
```

### **Scenario 2: Search "shrimp" (Item name)**

```
User types: "shrimp"
↓
API search: "shrimp" → finds all items named shrimp
↓
Results show: 5 restaurants that HAVE shrimp
   Cosmos:
     🍽️ Shrimp Pasta
     🍽️ Coconut Shrimp
     🍺 Shrimp Shooter
   Another Place:
     🍽️ Grilled Shrimp
   Third Place:
     🏷️ Shrimp Special - 20% off
   ... (etc)
   
Filter buttons:
  🔍 All (show all 5 restaurants + all matched items)
  🏢 Businesses (show only if restaurant name matches "shrimp")
  🍽️ Food (show only restaurants with matched menu items)
  🍺 Drinks (show only restaurants with matched drinks)
  🏷️ Specials (show only restaurants with matched specials)
```

---

## What You Need to Check

### **Question 1: What does the API actually return?**

```javascript
// Test in browser console:
const res = await fetch('https://cybercheck-api-database.vercel.app/api/gcr/search', {
  method: 'POST',
  body: JSON.stringify({query: 'shrimp'})
});
const data = await res.json();
console.log(data);

// Does it have:
// ✓ data.results[0].matched_menu_items?
// ✓ data.results[0].matched_drink_items?
// ✓ data.results[0].matched_specials?

// Or just basic business info?
```

### **Question 2: Can the API be modified?**

If you control `/api/gcr/search` (in cybercheck-api-database repo):
- Can it return matched items per business?
- That's the "clean" fix

---

## Recommended Fix (Based on Your Setup)

**Step 1:** Verify what API returns

```javascript
// Test this
fetch('https://cybercheck-api-database.vercel.app/api/gcr/search', {
  method: 'POST',
  body: JSON.stringify({query: 'shrimp'})
}).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)));
```

**Step 2a (If API has matched items):**
- search.html is correct as-is
- Just need to verify the data structure matches

**Step 2b (If API doesn't have matched items):**
- Use Approach B (fetch full profiles per result)
- Modify search.html to enrich results client-side (~30 min)

---

## search.html Already Has All the UI You Want

The filters are already there:
```
🔍 All, 🏢 Businesses, 🍽️ Food, 🍺 Drinks, 🏷️ Specials
```

The tab-switching logic is already there:
```javascript
applyTab('all');  // renderResults() filters by currentTab
```

The rendering is already there:
```javascript
renderResult(e, lastQuery, currentTab) // renders items per type
buildItemCard(e, [], lastQuery) // shows matched items
```

**The ONLY issue is:** The data structure (matched_menu_items, etc.) doesn't exist.

---

## Action Plan

**Today (5 min):**
1. Test what the API returns with a "shrimp" search
2. Check if it has `matched_menu_items`, `matched_drink_items`, `matched_specials`

**If YES (API returns rich data):**
- search.html likely just needs a small tweak
- Probably a data mapping issue
- 10 min fix

**If NO (API returns basic data):**
- Decide: Approach A (fix API) or Approach B (client-side enrichment)
- Approach B: 30 min implementation, 2-3 sec load time (acceptable)
- Approach A: Better, but requires API changes

---

## Current Code Already Works For This!

Look at search.html lines 430-620:

```javascript
function buildItemCard(e, items, lastQuery) {
  // Builds cards for menu items, drinks, specials
  // This is exactly what you want for "shrimp" search results
}

function renderResult(e, lastQuery, currentTab) {
  // Routes to different rendering based on tab
  // All, Businesses, Food, Drinks, Specials
  // Already implemented!
}
```

The **entire UI and logic is already there**. It just needs the data.

