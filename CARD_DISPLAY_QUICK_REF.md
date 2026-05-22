# Listing Cards: Quick Reference Visual

## All Pages Use Same Function: `renderBizCard(business, context)`

---

## Horizontal Layout (Restaurants, Activities, Coffee)

```
┌─────────────────────────────────────────────────────┐
│ [Image]  Cosmos Restaurant & Bar              [✨]  │
│          Orange Beach · $$                           │
│  ★★★★★ 4.8 (247 reviews)                           │
│                                                      │
│  🏷️ Italian  🏷️ Waterfront  🏷️ Live Music         │
│                                                      │
│  Premium Italian and seafood restaurant...          │
│  [More]                                              │
│                                                      │
│  📍 123 Main St, Orange Beach, AL 36561              │
│                                                      │
│  [☎️ Call] [📍 Directions] [View Page] or          │
│  [☎️ Call] [📍 Directions] [📅 Book Now]            │
└─────────────────────────────────────────────────────┘
```

**Data Used:**
```
image:       logo_url, logo, hero_image, cover_image
name:        name
location:    city + price_range
rating:      rating (with stars) + review_count
tags:        tags[] (first 4)
description: description (180 chars) + "More" link
address:     address
phone:       phone → [Call] button
booking:     booking_required → [Book Now] button
featured:    featured badge [✨]
```

---

## Vertical Layout (Search Results)

```
┌──────────────────────────────────┐
│ [Image 1/1]                      │
│                                  │
│ Cosmos Restaurant & Bar          │
│ ★★★★★ 4.8 (247)                 │
│                                  │
│ 🏷️ Restaurants  🏷️ Italian       │
│ 💰 $$                             │
│                                  │
│ Premium Italian and seafood...   │
│                                  │
│ [View Page]                      │
│ [📅 Book Now] [Full Menu]        │
└──────────────────────────────────┘
```

**Data Used:** Same as above, but different layout order

---

## What Each Field Contains

| Field | Data | Examples |
|-------|------|----------|
| **Image** | logo_url / logo / hero_image / cover_image | `https://...jpg` |
| **Name** | Business name | "Cosmos Restaurant & Bar" |
| **Location** | City + Price | "Orange Beach · $$" |
| **Rating** | Stars + score + count | "★★★★★ 4.8 (247)" |
| **Tags** | Array (first 4) | ["waterfront", "live-music", "happy-hour", "outdoor"] |
| **Description** | 180-char snippet | "Premium Italian and seafood restaurant overlooking the Gulf..." |
| **Address** | Street address | "123 Main St, Orange Beach, AL 36561" |
| **Phone** | Clickable tel link | `<a href="tel:251-123-4567">☎️ Call</a>` |
| **Featured** | Badge | "✨ Featured" or hidden |
| **Happy Hour** | Tag + times | "🍻 HH Mon-Fri" |

---

## Pages & Their Data Sources

### Restaurants
```
restaurants.html
    ↓
GCR.getByCategory('restaurants')
    ↓
renderBizCard(biz, 'restaurants')
    ↓
Horizontal layout card
```

### Activities / Things to Do
```
things-to-do.html
    ↓
GCR.getByCategory('things-to-do')
    ↓
renderBizCard(biz, 'things-to-do')
    ↓
Horizontal layout card with [Book Now] if booking_required=true
```

### Coffee & Sweets
```
coffee-sweets.html
    ↓
GCR.getByCategory('coffee-sweets')
    ↓
renderBizCard(biz, 'coffee-sweets')
    ↓
Horizontal layout card
```

### Happy Hours
```
happy-hours.html
    ↓
GCR.getHappyHours()
    ↓
Expandable card layout
    ↓
Shows 🍻 HH Mon-Fri tag
```

### Search
```
search.html?q=shrimp
    ↓
GCR.search('shrimp')
    ↓
For each result: renderBizCard(biz, 'search')
    ↓
Vertical layout card (different order than horizontal)
```

---

## Field Visibility Matrix

```
Field            Restaurants  Activities  Coffee  Search  HappyHours
─────────────────────────────────────────────────────────────────────
Image                ✓           ✓          ✓       ✓        ✓
Name                 ✓           ✓          ✓       ✓        ✓
City/Location        ✓           ✓          ✓       ✗        ✗
Price Range          ✓           ✓          ✓       ✓        ✓
Rating               ✓           ✓          ✓       ✓        ✓
Tags (4)             ✓           ✓          ✓       ✓        ✗
Description          ✓           ✓          ✓       ✓        ✓
Address              ✓           ✓          ✓       ✗        ✗
[Call]               ✓           ✓          ✓       ✗        ✗
[Directions]         ✓           ✓          ✓       ✗        ✗
[View Page]          ✓           ✓          ✓       ✓        ✓
[Book Now]           ✗           ✓          ✗       ✓        ✗
[Full Menu]          ✗           ✗          ✗       ✓        ✓
Featured Badge       ✓           ✓          ✓       ✓        ✓
HH Badge             ✓           ✓          ✓       ✓        ✓
```

---

## Code Path

```javascript
// Step 1: Get businesses (depends on page)
const items = GCR.getByCategory(cat)
           || GCR.getByTag(tag)
           || GCR.getHappyHours()
           || GCR.businesses

// Step 2: Determine context
const context = cat || 'search'  // 'restaurants', 'activities', etc.

// Step 3: Render each
const html = items.map(biz => renderBizCard(biz, context)).join('')

// Step 4: Display
document.getElementById('listingsGrid').innerHTML = html

// Step 5: When user clicks card
onclick="window.location.href='profile.html?id=${slug}'"
    ↓
    → Loads full profile
    → Fetches GCR.loadProfile(slug)
    → Shows menu items, hours, photos, etc.
```

---

## Business Object Nesting

```javascript
GCR.businesses = [
  {
    // Basic
    id: "...",
    slug: "cosmos-...",
    name: "Cosmos Restaurant & Bar",
    
    // From listing card (renderBizCard shows these)
    image/logo_url: "...",
    rating: 4.8,
    review_count: 247,
    tags: ["waterfront", "live-music"],
    description: "...",
    city: "Orange Beach",
    price_range: "$$",
    address: "...",
    phone: "...",
    featured: true,
    
    // From profile page (NOT shown in card, shown after click)
    menu_items: [{...}, {...}],      // ← NOT in card
    drink_items: [{...}],             // ← NOT in card
    specials: [{...}],                // ← NOT in card
    sections: [{...}],                // ← NOT in card
    hours: {...},                     // ← NOT in card
    photos: [...]                     // ← NOT in card
  }
]
```

**Key:** Cards show ~15-20 fields, profiles show ~100+ fields (lazy-loaded)

---

## Tag Filtering

Cards have `data-tags` attribute (space-separated):

```html
<article 
  class="restaurant-card" 
  data-tags="waterfront live-music happy-hour restaurants italian-seafood outdoor"
  onclick="window.location.href='profile.html?id=cosmos-...'">
  ...
</article>
```

When user clicks filter button (e.g., "waterfront"), JavaScript:
```javascript
document.querySelectorAll('.biz-card').forEach(card => {
  const tags = card.dataset.tags.toLowerCase()
  card.style.display = tags.includes('waterfront') ? '' : 'none'
})
```

---

## Summary: What's Displayed vs What's Not

### **DISPLAYED in Cards (Lightweight)**
```
✓ Image (hero/logo)
✓ Name
✓ Rating + reviews
✓ Tags (4)
✓ Price range
✓ Short description
✓ City
✓ Phone
✓ Address
✓ Featured badge
✓ Happy Hour badge
✓ Buttons: Call, Directions, Book, View Page, Menu
```

### **NOT DISPLAYED in Cards (Lazy-loaded on click)**
```
✗ Full menu items
✗ Drink items
✗ Specials
✗ Hours
✗ Multiple photos
✗ Rich sections
✗ Community photos
✗ Detailed reviews
✗ Social links
✗ Booking calendar
```

This keeps cards fast & light, loads full data only when needed.

