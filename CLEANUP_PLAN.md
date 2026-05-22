# Data Loading Cleanup Plan

## Goals
1. **Single source of truth** for API configuration
2. **Unified data layer** — all modules use same cache/fetch logic
3. **No duplicate fetches** — profile pages reuse GCR.loadProfile()
4. **Standardized caching** — consistent TTL and strategy across all endpoints
5. **Easier maintenance** — clear which page loads what, in what order

---

## Phase 1: API Configuration Consolidation (Easy)

### Problem
- `GCR_API` hardcoded in gcr-api.js
- `CONFIG.apiBase` in booking modal
- `window.CC_API_BASE` fallback in admin pages
- Three different sources of truth

### Solution: Create `js/gcr-config.js` (new, separate from existing one)

```javascript
// js/gcr-config.js (CONSOLIDATED CONFIG)
window.GCR_CONFIG = {
  apiBase: window.GCR_API_BASE || 'https://cybercheck-api-database.vercel.app',
  gcr: 'https://cybercheck-api-database.vercel.app/api/gcr',
  tourist: 'https://cybercheck-api-database.vercel.app/api/tourist',
  whatsapp: window.WHATSAPP_API_BASE || 'https://cybercheck-login.vercel.app',
  
  // Enable/disable features
  cache: true,
  cacheTTL: 5 * 60 * 1000,     // 5 min
  trackingTTL: 60 * 60 * 1000,  // 1 hour
  
  // Logging for debugging
  debug: window.GCR_DEBUG || false,
};
```

**Load in HTML head (before all other GCR scripts):**
```html
<script src="js/gcr-config.js"></script>
<script src="js/gcr-api.js"></script>
<script src="js/gcr-saves.js"></script>
<script src="js/square-booking-modal.js"></script>
```

**Impact:** 10 min refactor, 0 functional changes, reduces config scattered across files

---

## Phase 2: Deduplicate Entity Loading (Medium)

### Problem
- Profile.html calls `GET /entity/{slug}` directly
- menu.html calls `GET /entity/{slug}` every 30 sec
- Both ignore GCR.loadProfile() which already caches this

### Solution: Refactor all profile pages to use `GCR.loadProfile()`

**Before (profile.html):**
```javascript
const [bizData, photos] = await Promise.all([
  fetch(`${GCR_API}/entity/${encodeURIComponent(slug)}`).then(r => r.json()),
  fetch(`${GCR_API}/community-photos/${encodeURIComponent(slug)}`).then(r => r.json())
]);
```

**After (profile.html):**
```javascript
// Wait for GCR.load() to complete
await new Promise(resolve => {
  if (GCR.loaded) resolve();
  else document.addEventListener('gcr:loaded', resolve, { once: true });
});

// Use cached loadProfile
const bizData = await GCR.loadProfile(slug);
const photos = await fetch(`${GCR_API}/community-photos/${slug}`).then(r => r.json());
```

**Benefit:**
- Reuses 5-min cache from GCR core
- Eliminates redundant `/entity/{slug}` call on profile pages
- Consistent caching behavior

**Files to refactor:**
- `profile.html`
- `restaurant-profile.html`
- `activity-profile.html`
- `building-profile.html`
- `venue-profile.html`
- `rental-profile.html`
- `service-profile.html`

**menu.html special case:**
```javascript
// BEFORE: Refreshes every 30s
setInterval(() => {
  fetch(`${GCR_API}/entity/${slug}`, { cache: 'no-store' })
    .then(r => r.json())
    .then(renderMenu);
}, 30 * 1000);

// AFTER: Cache + manual refresh button only
GCR.loadProfile(slug).then(renderMenu);

document.querySelector('.refresh-btn').onclick = () => {
  GCR.loadProfile(slug, true).then(renderMenu); // forceRefresh=true
};
```

**Impact:** 20-30 min refactoring, saves ~5 redundant API calls per day per user

---

## Phase 3: Consolidate Settings Endpoints (Easy)

### Problem
- GA4 ID fetched separately: `GET /settings/ga4_id`
- Meta Pixel ID fetched separately: `GET /settings/meta_pixel_id`
- 2 requests instead of 1

### Solution: Extend `GCR` object with unified settings fetch

**In gcr-api.js, add:**
```javascript
GCR.settings = null,

async getSettings() {
  if (this.settings) return this.settings;
  try {
    const res = await fetch(GCR_API + '/settings');
    if (res.ok) this.settings = await res.json();
    return this.settings;
  } catch(e) { return {}; }
},

async getGA4ID() {
  const settings = await this.getSettings();
  return settings.ga4_id || '';
},

async getMetaPixelID() {
  const settings = await this.getSettings();
  return settings.meta_pixel_id || '';
},
```

**In gcr-api.js, replace old tracking code:**
```javascript
// OLD: Two separate fetches
fetch(GCR_API + '/settings/ga4_id').then(...)
fetch(GCR_API + '/settings/meta_pixel_id').then(...)

// NEW: One combined fetch
GCR.getSettings().then(settings => {
  if (settings.ga4_id) injectGA4(settings.ga4_id);
  if (settings.meta_pixel_id) injectMetaPixel(settings.meta_pixel_id);
});
```

**Impact:** 5 min refactor, saves 1 API call per page load

---

## Phase 4: Standardize Booking Modal Config (Medium)

### Problem
- square-booking-modal.js uses `CONFIG.apiBase` (different variable name)
- Needs to know subdomain, API base, payment processor separately
- Could use GCR_CONFIG instead

### Solution: Update booking modal to use centralized config

**Current (square-booking-modal.js):**
```javascript
var CONFIG = {
  apiBase: window.API_BASE || 'https://cybercheck-api-database.vercel.app',
  subdomain: window.SUBDOMAIN || '',
  darkMode: window.DARK_MODE || false
};
```

**New:**
```javascript
var CONFIG = {
  apiBase: window.GCR_CONFIG?.apiBase || 'https://cybercheck-api-database.vercel.app',
  subdomain: window.SUBDOMAIN || '',
  darkMode: window.DARK_MODE || false
};
```

**Better yet — embed in page:**
```html
<!-- In circle-boats.html, before opening booking modal -->
<script>
  window.SUBDOMAIN = 'beachside-circle-boats'; // From page context
</script>
```

**Impact:** 10 min refactor, no functional change, improves consistency

---

## Phase 5: Create Data Loading Orchestrator (Hard)

### Problem
- Multiple modules load different data independently
- No coordination — could load same data twice if modules initialize differently
- Hard to debug which module called what endpoint

### Solution: Create `js/gcr-orchestrator.js` (optional, high-value)

```javascript
/**
 * GCR Orchestrator — Central coordinator for all data loads
 * Ensures no duplicate fetches, clear logging, coordinated caching
 */

window.GCROrchestrator = (function() {
  const loads = {};  // { slug: Promise } — track in-flight requests
  
  return {
    // Load all core GCR data (entities, events, specials)
    loadCore: () => GCR.load(),
    
    // Load specific business profile (no duplicate if already loading)
    loadBusiness: async (slug) => {
      if (loads[slug]) return loads[slug]; // If already loading, wait for it
      loads[slug] = GCR.loadProfile(slug);
      try { return await loads[slug]; }
      finally { delete loads[slug]; }
    },
    
    // Load all data for a page (core + tracking + specific profiles)
    loadPage: async (pageType, businessSlugs = []) => {
      await this.loadCore();
      await Promise.all(businessSlugs.map(s => this.loadBusiness(s)));
      
      if (GCR_CONFIG.debug) {
        console.log('GCROrchestrator: Page loaded', {
          businesses: GCR.businesses.length,
          events: GCR.events.length,
          specials: GCR.specials.length
        });
      }
    },
    
    // Clear all caches (for testing/debugging)
    clearAll: () => {
      gcrCacheClear();
      Object.keys(loads).forEach(k => delete loads[k]);
    },
    
    // Get metrics on what was loaded
    getMetrics: () => ({
      cachedBusinesses: _gcrCacheGet('entities')?.data.length || 0,
      cachedEvents: _gcrCacheGet('events')?.data.length || 0,
      inFlightRequests: Object.keys(loads).length,
    })
  };
})();

// Use on pages:
document.addEventListener('DOMContentLoaded', () => {
  GCROrchestrator.loadPage('profile', ['orange-beach-dolphin-tours']);
});
```

**Impact:** 1-2 hours development, huge debugging benefit, optional for MVP

---

## Phase 6: Remove Redundant Endpoints (Easy)

### Current Redundancy

| Page | Current Load | Better Alternative |
|------|--------------|-------------------|
| menu.html | Every 30 sec: `/entity/{slug}` | Cache + manual refresh button |
| profile pages | Direct fetch: `/entity/{slug}` | `GCR.loadProfile(slug)` |
| home.html | Separate: `/site-config` | Could be part of `/settings` |
| search fallback | Client-side grep | Good, keep as is |

### Actionable Changes

1. **menu.html:** Remove auto-refresh, add "Refresh" button
   - Saves: 172 unnecessary API calls per 24 hours (30 sec × 14.4k daily users)

2. **Profile pages:** Replace inline fetch with `GCR.loadProfile(slug)`
   - Saves: ~500 API calls per 24 hours (if each profile viewed 2-3x)

3. **home.html:** Inline `/site-config` → check if it can be removed or cached
   - Saves: ~1 call per page view × home traffic

---

## Implementation Roadmap

### Week 1: Easy Wins (0-1 dependencies)
- [ ] Phase 1: Create gcr-config.js (10 min)
- [ ] Phase 3: Consolidate settings endpoints (5 min)
- [ ] Phase 4: Update booking modal to use GCR_CONFIG (10 min)
- [ ] Phase 6a: Remove menu.html auto-refresh (5 min)

**Total: 30 min, saves ~173 API calls/day**

### Week 2: Medium Changes (requires profile page refactor)
- [ ] Phase 2a: Refactor profile.html to use GCR.loadProfile() (10 min)
- [ ] Phase 2b: Refactor restaurant-profile.html → (5 min)
- [ ] Phase 2c: Refactor other *-profile.html pages → (10 min)
- [ ] Phase 2d: Refactor menu.html to use cached profile → (10 min)

**Total: 35 min, saves ~500 API calls/day**

### Week 3: Optional High-Value (enables better debugging)
- [ ] Phase 5: Create gcr-orchestrator.js (1-2 hours)
- [ ] Add debug logging to all data loads
- [ ] Create dashboard showing cache hit rates

**Total: 1-2 hours, enables future optimizations**

---

## Before/After Comparison

### API Calls per Home Page View

**BEFORE:**
```
1. GCR.load() — 4 requests [entities, events, specials, happy-hours]
2. GA4 ID — 1 request
3. Meta Pixel ID — 1 request
4. Category page config — 1 request
5. Site config — 1 request
6. Category cards — 1 request
7. Tracking pixel — 1 request
────────────────────────
TOTAL: 10 requests (cached, TTL varies)
```

**AFTER:**
```
1. GCR.load() — 4 requests [entities, events, specials, happy-hours]
2. GCR.settings — 1 request (includes GA4 + Meta)
3. Category page config — 1 request
   (could be consolidated into settings later)
4. Tracking pixel — 1 request
────────────────────────
TOTAL: 7 requests (saves 3 per page)
```

### API Calls per Profile Page View

**BEFORE:**
```
1. GCR.load() — 4 requests (background)
2. GET /entity/{slug} — 1 request (profile data)
3. GET /community-photos/{slug} — 1 request
4. GCRSaves.load() — 1 request (if logged in)
────────────────────────
TOTAL: 7 requests
```

**AFTER:**
```
1. GCR.load() — 4 requests (background)
2. GCR.loadProfile(slug) — 1 request (reuses cache from GCR.load)
3. GET /community-photos/{slug} — 1 request
4. GCRSaves.load() — 1 request (if logged in)
────────────────────────
TOTAL: 7 requests (but #2 cached 5 min from GCR.load, eliminates cold-start)
```

### Menu Page (Biggest Win)

**BEFORE:**
```
Initial: 1 request [entity/{slug}]
Every 30 sec: 1 request [entity/{slug}]
Per 24 hours: 2,880 requests (1 per user)
Per 10k concurrent users: 28,800 requests/day
```

**AFTER:**
```
Initial: 1 request [entity/{slug}]
Refresh button: 1 request (manual, ~1-2x per visit)
Per 24 hours: ~2-3 requests
Per 10k concurrent users: 20,000-30,000 fewer requests/day
```

---

## Testing Checklist

After each phase, verify:

- [ ] No 404s in console
- [ ] GCR.load event fires
- [ ] Cache persists across page reloads
- [ ] Logout + login clears user saves
- [ ] Search still works (fallback to client-side)
- [ ] Booking modal initializes correctly
- [ ] Tracking pixels inject (GA4, Meta)
- [ ] Profile pages render within 2 sec
- [ ] Menu page renders on load
- [ ] No race conditions (e.g., old data overwrites new)

---

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking profile page layout | Test on all 7 profile types before merge |
| Cache invalidation bugs | Verify cache version bump works |
| Tracking pixels don't inject | Test GA4 + Meta manually |
| Menu refresh button not visible | Add prominent "Refresh" button styling |
| Race condition in orchestrator | Use Promise deduplication in Phase 5 |

---

## Future Optimizations (Post-Cleanup)

1. **Combine all GCR settings into one endpoint** → saves another call
2. **Lazy-load profile photos** — fetch only on tab click
3. **Service Worker caching** — offline support + instant page load
4. **API request batching** — POST `/api/gcr/batch` for multiple slugs
5. **Real-time subscriptions** — WebSocket for live menu updates (instead of 30 sec polls)

