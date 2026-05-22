# Listing Cards: Data Map & Display Fields

## Overview

All listing pages (restaurants.html, activities.html, etc.) use the **same card rendering function** (`renderBizCard()` in app.js) but display different fields based on **context** (page type).

---

## Card Rendering Flow

```
1. Page loads (e.g., restaurants.html)
   ↓
2. GCR.load() completes
   ├─ GCR.businesses = [{...}, {...}, ...]
   ├─ Each business has: name, slug, rating, tags, description, etc.
   │
3. renderPageListings() called
   ├─ Detect context: "restaurants", "activities", "coffee-sweets", etc.
   ├─ Get businesses: GCR.getByCategory(context)
   │
4. For each business, call renderBizCard(biz, context)
   ├─ Context determines layout & fields to show
   └─ Return HTML card
   
5. Display cards in grid
```

---

## Business Object (What GCR.businesses[] Contains)

Each business in `GCR.businesses` has these fields available:

```javascript
{
  id: "...",
  slug: "cosmos-restaurant-bar-zJgenE",
  site_id: "...",
  subdomain: "...",
  
  // Basic info
  name: "Cosmos Restaurant & Bar",
  category: "restaurants",
  type: "restaurants",
  subcategory: "italian-seafood",
  subtype: "restaurant",
  emoji: "🍽️",
  
  // Location
  address: "123 Main St, Orange Beach, AL 36561",
  address_line_1: "123 Main St",
  city: "Orange Beach",
  state: "AL",
  zip: "36561",
  location: "Orange Beach",
  
  // Contact
  phone: "251-123-4567",
  email: "info@cosmos.com",
  website: "https://cosmos.com",
  
  // Images
  logo_url: "https://...",
  logo: "https://...",
  image: "https://...",
  hero_image: "https://...",
  cover_image: "https://...",
  cover_url: "https://...",
  
  // Rating & reviews
  rating: 4.8,
  rating_avg: 4.8,
  review_count: 247,
  reviewCount: 247,
  
  // Description
  description: "Premium Italian and seafood restaurant...",
  tagline: "Fine dining overlooking the Gulf",
  subtitle: "Italian • Seafood",
  
  // Pricing & features
  price_range: "$$",
  price_from: "$$",
  priceRange: "$$",
  
  // Features
  tags: ["waterfront", "live-music", "happy-hour", "outdoor"],
  waterfront: true,
  beachfront: false,
  liveMusic: true,
  live_music: true,
  happyHour: true,
  happy_hour: true,
  hh_days: "Mon-Fri",
  kidsFriendly: true,
  outdoor: true,
  featured: true,
  
  // Links
  links: {
    menu: "https://cosmos.com/menu",
    booking: "https://booking.cosmos.com",
    reservation: "https://resy.com/cosmos",
    instagram: "https://instagram.com/cosmos",
    facebook: "https://facebook.com/cosmos"
  },
  
  // Booking
  booking_required: false,
  
  // Menu data (only in full profiles, not in listings)
  menu_items: [...],
  drink_items: [...],
  specials: [...]
}
```

---

## Card Display by Context (Page Type)

### **Context 1: Restaurants** 
**Pages:** `restaurants.html`  
**Get data via:** `GCR.getByCategory('restaurants')`

**Card Layout:** Horizontal (image on left, content on right)

**Fields Displayed:**

```
┌─────────────────────────────────────────┐
│ [Image]  Cosmos Restaurant & Bar [✨]   │
│          Orange Beach · $$              │
│          ★★★★★ 4.8 (247 reviews)       │
│          🏷️ Italian  🏷️ Waterfront      │
│                                         │
│   Premium Italian and seafood...        │
│                                         │
│   📍 123 Main St, Orange Beach, AL     │
│   [☎️ Call] [📍 Directions] [View Page] │
└─────────────────────────────────────────┘
```

**Data shown:**
- ✓ Image (logo_url, logo, hero_image)
- ✓ Name
- ✓ Location (city + price_range)
- ✓ Rating & review count
- ✓ Tags (first 4)
- ✓ Description (truncated to 180 chars)
- ✓ Address
- ✓ Phone (Call button)
- ✓ Directions button
- ✓ View Page button
- ✓ Featured badge (if featured=true)

**Buttons:**
- Call (if phone exists)
- Directions (if address exists)
- View Page (always)

---

### **Context 2: Coffee & Sweets**
**Pages:** `coffee-sweets.html`  
**Get data via:** `GCR.getByCategory('coffee-sweets')`

**Card Layout:** Same as Restaurants (horizontal)

**Fields Displayed:** Same as restaurants (name, rating, tags, description, address, call, directions)

---

### **Context 3: Activities/Things to Do**
**Pages:** `things-to-do.html`, `activities.html`  
**Get data via:** `GCR.getByCategory('things-to-do')`

**Card Layout:** Horizontal (same as restaurants)

**Fields Displayed:**
- ✓ Image
- ✓ Name
- ✓ Location (city + price_range)
- ✓ Rating
- ✓ Tags
- ✓ Description
- ✓ Address
- ✓ Call button
- ✓ Directions button
- ✓ **Book Now button** (if booking_required=true)

**Special: Booking Button**
- Shows "📅 Book Now" for activities that require booking
- Opens booking modal

---

### **Context 4: Happy Hours**
**Pages:** `happy-hours.html`  
**Get data via:** `GCR.getHappyHours()`

**Card Layout:** Special expandable layout

**Fields Displayed:**
- ✓ Image
- ✓ Name
- ✓ Happy Hour tag (🍻 HH Mon-Fri)
- ✓ Rating
- ✓ Description
- ✓ View Profile button
- ✓ Menu button (if menu link exists)

**Special:** Shows "🍻 HH Mon-Fri" badge for happy hour businesses

---

### **Context 5: Specials/Deals**
**Pages:** `specials.html`  
**Get data via:** `GCR.getSpecials()` (shows businesses with specials)

**Card Layout:** Same as restaurants (horizontal)

**Fields Displayed:** Same as restaurants

---

### **Context 6: Search**
**Pages:** `search.html`, home search  
**Get data via:** `GCR.search(query)`

**Card Layout:** Vertical (image on top)

**Fields Displayed:**
- ✓ Image
- ✓ Name
- ✓ Category tag
- ✓ Price range tag
- ✓ Happy Hour tag (if applicable)
- ✓ Description
- ✓ View Profile button
- ✓ Book Now button (if booking_required)
- ✓ Menu button (if menu link exists)

**Different from listings:** More compact, includes category & price tags

---

## Data Mapping Examples

### **Example 1: Cosmos on Restaurants Page**

```javascript
Business object:
{
  slug: "cosmos-restaurant-bar-zJgenE",
  name: "Cosmos Restaurant & Bar",
  logo_url: "https://... [image]",
  city: "Orange Beach",
  price_range: "$$",
  rating: 4.8,
  review_count: 247,
  tags: ["waterfront", "live-music", "happy-hour", "outdoor"],
  description: "Premium Italian and seafood restaurant...",
  address: "123 Main St, Orange Beach, AL 36561",
  phone: "251-123-4567",
  featured: true
}

Rendered card:
┌────────────────────────────────────┐
│ [Image] Cosmos Restaurant & Bar ✨  │
│         Orange Beach · $$           │
│         ★★★★★ 4.8 (247)            │
│         🏷️ waterfront 🏷️ live-music │
│                                     │
│  Premium Italian and seafood...     │
│                                     │
│  📍 123 Main St, Orange Beach, AL   │
│  [Call] [Directions] [View Page]    │
└────────────────────────────────────┘
```

---

### **Example 2: Adventure Company on Activities Page**

```javascript
Business object:
{
  slug: "adventure-company-zJgenE",
  name: "Adventure Company",
  logo_url: "https://... [image]",
  city: "Gulf Shores",
  price_range: "$$$",
  rating: 4.9,
  review_count: 156,
  tags: ["water-sports", "family", "outdoor"],
  description: "Jet skis, parasailing, boat rentals...",
  address: "456 Beach Ave, Gulf Shores, AL",
  phone: "251-234-5678",
  booking_required: true
}

Rendered card:
┌────────────────────────────────────┐
│ [Image] Adventure Company           │
│         Gulf Shores · $$$           │
│         ★★★★★ 4.9 (156)            │
│         🏷️ water-sports 🏷️ family   │
│                                     │
│  Jet skis, parasailing, boat...     │
│                                     │
│  📍 456 Beach Ave, Gulf Shores, AL  │
│  [Call] [Directions] [📅 Book Now]  │
└────────────────────────────────────┘
```

---

## Field Availability by Context

| Field | Restaurants | Activities | Coffee | Happy Hours | Search |
|-------|---|---|---|---|---|
| Image | ✓ | ✓ | ✓ | ✓ | ✓ |
| Name | ✓ | ✓ | ✓ | ✓ | ✓ |
| City | ✓ | ✓ | ✓ | ✓ | ✗ |
| Price Range | ✓ | ✓ | ✓ | ✓ | ✓ |
| Rating | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tags (4) | ✓ | ✓ | ✓ | ✗ | ✓ |
| Description | ✓ | ✓ | ✓ | ✓ | ✓ |
| Address | ✓ | ✓ | ✓ | ✗ | ✗ |
| Phone (Call) | ✓ | ✓ | ✓ | ✗ | ✗ |
| Directions | ✓ | ✓ | ✓ | ✗ | ✗ |
| View Page | ✓ | ✓ | ✓ | ✓ | ✓ |
| Book Now | ✗ | ✓ (if needed) | ✗ | ✗ | ✓ (if needed) |
| Full Menu | ✗ | ✗ | ✗ | ✓ | ✓ |
| Featured Badge | ✓ | ✓ | ✓ | ✓ | ✓ |
| HH Badge | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## CSS Classes Used

### **Card Container**
```javascript
// Based on context:
restaurant-card    // restaurants.html
cafe-card          // coffee-sweets.html
activity-card      // things-to-do.html
biz-card           // default/fallback
```

### **Card Sections**
```javascript
// Image
restaurant-image, cafe-image, activity-image, biz-card-img

// Body
restaurant-body, cafe-body, activity-body, biz-card-body

// Title
restaurant name, nameClass

// Subline (city + price)
sublineClass

// Tags/Chips
chipsClass

// Description
descClass

// Actions
actionClass, actionPrimaryClass
```

---

## Tag Filtering

All cards have `data-tags` attribute with concatenated tags:

```javascript
const _tags = [
  ...(biz.tags || []),           // Array of tags
  category,                       // "restaurants", "activities", etc.
  biz.subcategory || '',          // "italian-seafood", etc.
  (biz.subcategory || '').replace(/-/g,' '),  // "italian seafood"
  (biz.waterfront || biz.beachfront) ? 'waterfront' : '',
  (biz.liveMusic || biz.live_music) ? 'live-music' : '',
  (biz.happyHour || biz.happy_hour) ? 'happy-hour' : '',
  biz.kidsFriendly ? 'family' : '',
  biz.outdoor ? 'outdoor' : '',
].filter(Boolean).join(' ');

// Example result:
// data-tags="waterfront live-music happy-hour outdoor restaurants italian-seafood italian seafood"
```

Used for filtering cards by clicking tag buttons.

---

## Data Source Hierarchy

When rendering a card, the code checks multiple field names (for flexibility):

```javascript
// Name
biz.name

// Image
biz.logo_url || biz.logo || biz.image || biz.hero_image || biz.cover_image || biz.cover_url

// Rating
biz.rating || biz.rating_avg

// Reviews
biz.review_count || biz.reviewCount

// Price
biz.price_from || biz.price_range || biz.priceRange

// Category
biz.type || biz.category

// Slug
biz.slug || biz.site_id || biz.id

// Happy Hour
biz.hh_days || biz.happyHour
```

This allows flexibility if data comes from different sources.

---

## What's NOT Shown in Cards (But Shown in Profile)

These are only in full profiles (after clicking View Page):

- ❌ Menu items
- ❌ Drink items
- ❌ Specials
- ❌ Hours
- ❌ Photos (beyond hero)
- ❌ Sections (rich content)
- ❌ Community photos
- ❌ Detailed reviews
- ❌ Social links

**Reason:** Cards are lightweight, profiles load full data when needed

---

## Summary: Data Flow from GCR to Card

```
GCR.businesses[]
    ↓
    ├─ Category filter: GCR.getByCategory(cat)
    ├─ Tag filter: GCR.getByTag(tag)
    └─ Special filter: GCR.getSpecials(), GCR.getHappyHours()
    ↓
    → For each business, call renderBizCard(biz, context)
    ↓
    → Extract: name, image, rating, tags, description, address, phone
    ↓
    → Create HTML card with layout based on context
    ↓
    → Inject into grid
    ↓
    → User clicks card → goes to profile.html?id={slug}
    ↓
    → Profile fetches full data via GCR.loadProfile(slug)
```

