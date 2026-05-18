/* ============================================
   GCR — Gulf Coast Radar
   gcr-api.js — Live data from Supabase via API
   Replaces data.js — same GCR.* interface
   ============================================ */

const GCR_API = 'https://cybercheck-api-database.vercel.app/api/gcr';

/* ── Cache layer ──────────────────────────────────────────────
   Stale-while-revalidate: pages render from cache instantly,
   fresh data fetched in background to update cache for next visit.
   Bump GCR_CACHE_VERSION to force-invalidate everyone's cache. */
const GCR_CACHE_VERSION = 'v8';
const GCR_CACHE_TTL_MS  = 5 * 60 * 1000; // 5 minutes — keep events fresh

function _gcrCacheGet(key) {
  try {
    const raw = localStorage.getItem('gcr:' + GCR_CACHE_VERSION + ':' + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { stale: (Date.now() - parsed.ts) > GCR_CACHE_TTL_MS, data: parsed.data };
  } catch (e) { return null; }
}
function _gcrCacheSet(key, data) {
  try {
    localStorage.setItem('gcr:' + GCR_CACHE_VERSION + ':' + key, JSON.stringify({ ts: Date.now(), data }));
  } catch (e) { /* quota exceeded or disabled — silent */ }
}
function gcrCacheClear() {
  try {
    Object.keys(localStorage).forEach(k => { if (k.startsWith('gcr:')) localStorage.removeItem(k); });
  } catch (e) {}
}
window.gcrCacheClear = gcrCacheClear; // expose for debugging

// ── GA4 + Meta Pixel auto-injection ──────────────────────────
// Fetches IDs from /api/gcr/settings and injects tracking scripts once.
(function gcrInjectTracking() {
  const TRACK_CACHE_KEY = 'gcr:tracking:v1';
  const TRACK_TTL = 60 * 60 * 1000; // 1 hour

  function inject(ga4, meta) {
    if (ga4 && !document.getElementById('gcr-ga4')) {
      const s = document.createElement('script');
      s.id = 'gcr-ga4';
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4}`;
      document.head.appendChild(s);
      const cfg = document.createElement('script');
      cfg.id = 'gcr-ga4-cfg';
      cfg.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}');`;
      document.head.appendChild(cfg);
    }
    if (meta && !document.getElementById('gcr-meta-pixel')) {
      const s = document.createElement('script');
      s.id = 'gcr-meta-pixel';
      s.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${meta}');fbq('track','PageView');`;
      document.head.appendChild(s);
    }
  }

  try {
    const cached = JSON.parse(localStorage.getItem(TRACK_CACHE_KEY) || 'null');
    if (cached && (Date.now() - cached.ts) < TRACK_TTL) {
      inject(cached.ga4, cached.meta);
      return;
    }
  } catch (_) {}

  Promise.all([
    fetch(GCR_API + '/settings/ga4_id').then(r => r.json()).catch(() => ({})),
    fetch(GCR_API + '/settings/meta_pixel_id').then(r => r.json()).catch(() => ({}))
  ]).then(([ga4Data, metaData]) => {
    const ga4 = ga4Data.value || '';
    const meta = metaData.value || '';
    if (ga4 || meta) {
      try { localStorage.setItem(TRACK_CACHE_KEY, JSON.stringify({ ts: Date.now(), ga4, meta })); } catch (_) {}
      inject(ga4, meta);
    }
  }).catch(() => {});
})();

const GCR = {
  businesses: [],
  events: [],
  specials: [],
  happyHours: [],
  loaded: false,

  /* ── CATEGORIES (static — these don't change) ── */
  categories: [
    { id: "restaurants",    label: "Restaurants",    emoji: "🍽️", sub: ["All","Seafood","Bar & Grill","Fine Dining","Casual","Breakfast","Lunch","Dinner","Happy Hour"] },
    { id: "things-to-do",  label: "Things To Do",   emoji: "🎯", sub: ["All","Water Sports","Fishing","Boat Rentals","Family","Outdoor","Tours","Golf","Attractions"] },
    { id: "nightlife",     label: "Nightlife",      emoji: "🎶", sub: ["All","Bars","Live Music","Clubs","Rooftop","Sports Bars"] },
    { id: "coffee-sweets", label: "Coffee & Sweets", emoji: "☕", sub: ["All","Coffee","Ice Cream","Bakery","Desserts"] },
    { id: "shopping",      label: "Shopping",       emoji: "🛍️", sub: ["All","Souvenirs","Clothing","Boutique","Art & Gifts","Beach Gear"] },
    { id: "hotels",        label: "Hotels",         emoji: "🏨", sub: ["All","Beachfront","Pet Friendly","Family","Luxury","Budget"] },
    { id: "services",      label: "Services",       emoji: "🎯", sub: ["All","Photography","Weddings","Transportation","Wellness","Hair & Beauty"] },
    { id: "other",         label: "Other",          emoji: "✨", sub: ["All","Rentals","Health & Wellness","Transportation"] },
    { id: "specials",      label: "Specials",       emoji: "🏷️", sub: ["All"] },
    { id: "events",        label: "Events",         emoji: "🎉", sub: ["All","Live Music","Festivals","Family","Holiday"] },
  ],

  /* ── LOAD ALL DATA ── */
  // Filter out test/spam entities
  _isTestEntity(b) {
    if (b.is_active === false) return true;
    const s = (b.slug || b.subdomain || '').toLowerCase();
    const n = (b.name || '').toLowerCase();
    const a = (b.address_line_1 || b.address || '').toLowerCase();
    return s.startsWith('gcr-upload-test') || s.startsWith('888') ||
           n.includes('upload test') || n.startsWith('888') ||
           a.includes('test lane');
  },

  _dedupeBusinesses(raw) {
    const slugSet = new Set();
    return raw.filter(b => {
      const s = b.slug || b.subdomain || '';
      if (slugSet.has(s)) return false;
      if (s.match(/-1$/) && raw.some(o => (o.slug || o.subdomain) === s.replace(/-1$/, ''))) return false;
      slugSet.add(s);
      return true;
    });
  },

  _dedupeById(arr) {
    const seenIds = new Set();
    const seenKeys = new Set();
    return arr.filter(item => {
      // Dedup by id
      if (item.id) {
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
      }
      // Dedup by content key (name + entity + date + time + day)
      const norm = s => (s||'').toLowerCase().replace(/[^a-z0-9]/g,'').trim();
      const key = [
        norm(item.artist_name || item.event_name || ''),
        norm(item.entity_name || item.entity_id || ''),
        (item.event_date || item.date || '').trim(),
        (item.start_time || '').trim(),
        (item.day_of_week || '').toLowerCase().trim()
      ].join('|');
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });
  },

  _dedupeSpecials(arr) {
    const seen = new Set();
    return arr.filter(item => {
      const id = item.id;
      if (id && seen.has(id)) return false;
      if (id) seen.add(id);
      // Also dedupe by entity+name+time content key
      const ck = `${item.entity_id||''}|${item.special_name||item.name||''}|${item.start_time||''}`;
      if (seen.has(ck)) return false;
      seen.add(ck);
      return true;
    });
  },

  async load(forceRefresh) {
    // 1. Hydrate from cache first — instant render
    const cachedBiz = _gcrCacheGet('entities');
    const cachedEv  = _gcrCacheGet('events');
    const cachedSp  = _gcrCacheGet('specials');
    const cachedHh  = _gcrCacheGet('happy-hours');

    if (cachedBiz) this.businesses = cachedBiz.data;
    if (cachedEv)  this.events     = cachedEv.data;
    if (cachedSp)  this.specials   = cachedSp.data;
    if (cachedHh)  this.happyHours = cachedHh.data;

    const haveCache = cachedBiz && cachedEv && cachedSp && cachedHh;
    const allFresh  = haveCache && !cachedBiz.stale && !cachedEv.stale && !cachedSp.stale && !cachedHh.stale;

    // If we have a complete fresh cache and no force, use it and skip network entirely
    if (allFresh && !forceRefresh) {
      this.loaded = true;
      document.dispatchEvent(new CustomEvent('gcr:loaded', { detail: this }));
      return;
    }

    // If we have cache (even stale), dispatch loaded NOW so pages render —
    // then refresh in background (stale-while-revalidate).
    if (haveCache && !forceRefresh) {
      this.loaded = true;
      document.dispatchEvent(new CustomEvent('gcr:loaded', { detail: this }));
      this._refreshInBackground();
      return;
    }

    // No cache — do the full fetch and block until done
    await this._fetchAndPopulate(true);
  },

  async _fetchAndPopulate(dispatchLoaded) {
    try {
      const [bizRes, evRes, spRes, hhRes] = await Promise.all([
        fetch(GCR_API + '/entities?limit=500').catch(() => null),
        fetch(GCR_API + '/events').catch(() => null),
        fetch(GCR_API + '/specials').catch(() => null),
        fetch(GCR_API + '/happy-hours').catch(() => null),
      ]);

      if (bizRes && bizRes.ok) {
        const data = await bizRes.json();
        const raw = (data.entities || data.businesses || []).filter(b => !this._isTestEntity(b));
        this.businesses = this._dedupeBusinesses(raw);
        _gcrCacheSet('entities', this.businesses);
      }
      if (evRes && evRes.ok) {
        const evRaw = await evRes.json();
        this.events = this._dedupeById(Array.isArray(evRaw) ? evRaw : []);
        _gcrCacheSet('events', this.events);
      }
      if (spRes && spRes.ok) {
        const spRaw = await spRes.json();
        this.specials = this._dedupeSpecials(Array.isArray(spRaw) ? spRaw : []);
        _gcrCacheSet('specials', this.specials);
      }
      if (hhRes && hhRes.ok) {
        const hhRaw = await hhRes.json();
        this.happyHours = (Array.isArray(hhRaw) ? hhRaw : []).filter(b => !this._isTestEntity(b));
        _gcrCacheSet('happy-hours', this.happyHours);
      }

      this.loaded = true;
      if (dispatchLoaded) document.dispatchEvent(new CustomEvent('gcr:loaded', { detail: this }));
      else document.dispatchEvent(new CustomEvent('gcr:refreshed', { detail: this }));
    } catch(e) {
      console.warn('GCR API unavailable:', e.message);
      this.loaded = true;
      if (dispatchLoaded) document.dispatchEvent(new CustomEvent('gcr:loaded', { detail: this }));
    }
  },

  async _refreshInBackground() {
    // Fire and forget — page has already rendered from cache
    await this._fetchAndPopulate(false);
  },

  /* ── HELPERS (same interface as data.js) ── */
  getByCategory(cat) {
    const aliases = {
      'restaurants':    ['restaurants','restaurant','food','dining','seafood','bar_grill','steakhouse','pizza','mexican','southern','breakfast_spot','beach_bar','casual_dining','hybrid_venue','seafood_restaurant'],
      'things-to-do':  ['things-to-do','rental','rentals','activities','tours','activity','attraction','attractions','parasailing','boat_rental','boat-rentals','boat-tours','jet_ski','jet-ski-rentals-tours','dolphin_cruise','dolphin-cruises-tours','sunset-cruises-tours','kayak_rental','canoe-kayak-paddleboard','canoe-kayak-paddleboard-rentals','fishing_charter','charter-fishing','charter_fishing','snorkeling','paddleboard','banana-boat-rides','banana_boat','tour','helicopter-airplane-tours','helicopter_airplane_tours','helicopter','airplane','car-rentals-transportation','marina','marina-and-rentals','watersports','entertainment','cinema','amusement-park','amusement_park','golf-course','golf_course','pier','park-facility-rental','tourism-destination','festival','park','beach_access'],
      'nightlife':     ['nightlife','bar','bars','club','clubs','bar_club','nightclub','sports_bar','lounge','rooftop_bar'],
      'coffee-sweets': ['coffee-sweets','coffee','cafe','coffee_shop','sweets','desserts','bakery','ice_cream','dessert_bar','smoothie','catering'],
      'shopping':      ['shopping','shop','retail','boutique','souvenir','surf_shop','gift_shop','clothing','art_gallery','liquor-store','liquor_store','florist','pharmacy','pharmacy-retail','convenience-store','convenience_store','gas-station','gas_station'],
      'services':      ['services','service','salon','spa','salon-spa','salon_spa','spa-wellness','spa_wellness','beauty-salon','beauty_salon','photographer','photography','wellness','transportation','laundry-service','laundromat','car-wash','car_wash','cleaning-services','cleaning_services','restoration-services','fitness','medical-practice','medical_practice','real-estate','real_estate','real-estate-agent','financial-services','financial_services','agency','artist','influencer'],
      'hotels':        ['hotels','hotel','condo','resort','vacation_rental','vacation-rental','vacation-rental-resort','bed-and-breakfast','bed_and_breakfast','rv-resort','RV Resort','apartment-community','condominium-association'],
      'other':         ['other','misc','miscellaneous','parking','parking-lot','boat_launch','government','municipal-government','government-services','bank'],
    };
    const valid = aliases[cat] || [cat];

    // Build set of every subtype claimed by some non-"other" category
    const claimedByOther = new Set();
    for (const [k, list] of Object.entries(aliases)) {
      if (k === 'other') continue;
      list.forEach(v => { claimedByOther.add(v); claimedByOther.add(v.replace(/-/g,'_')); });
    }

    return this.businesses.filter(b => {
      const t = (b.type || '').toLowerCase();
      const c = (b.category || '').toLowerCase();
      const sub = (b.entity_subtype || '').toLowerCase();
      const matches = valid.includes(t) || valid.includes(c) || valid.includes(sub) ||
                      valid.includes(t.replace(/-/g,'_')) || valid.includes(sub.replace(/-/g,'_'));
      if (matches) return true;
      // "other" catch-all: anything whose subtype isn't claimed by another category
      if (cat === 'other' && sub && !claimedByOther.has(sub) && !claimedByOther.has(sub.replace(/-/g,'_'))) {
        return true;
      }
      return false;
    });
  },
  getFeatured() {
    return this.businesses.filter(b => b.featured);
  },
  getHappyHours() {
    // Prefer the dedicated happy-hours endpoint data (most complete)
    if (this.happyHours && this.happyHours.length) return this.happyHours;
    // Fallback: filter businesses for any hh fields
    return this.businesses.filter(b => {
      if (b.hh_days && b.hh_days.trim()) return true;
      const hh = b.happyHour || b.happy_hour;
      if (!hh) return false;
      if (hh === true) return true;
      if (typeof hh === 'string' && hh.trim().length > 0) return true;
      const tags = (b.tags || []).map(t => typeof t === 'string' ? t : (t.tag || '')).map(t => t.toLowerCase());
      return tags.includes('happy_hour') || tags.includes('happy hour');
    });
  },
  getSpecials() {
    return this.specials.filter(s => s.active !== false && s.is_active !== false);
  },
  getByTag(tag) {
    return this.businesses.filter(b => b.tags && b.tags.some(t => (typeof t === 'string' ? t : t.tag || '') === tag));
  },
  getEventsByMonth(year, month) {
    const prefix = `${year}-${String(month).padStart(2,'0')}`;
    return this.events.filter(e => (e.date || e.event_date || '').startsWith(prefix));
  },
  getEventsByDate(dateStr) {
    return this.events.filter(e => {
      const d = e.date || e.event_date || '';
      return d === dateStr;
    });
  },
  getUpcomingEvents(limit) {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = this.events
      .filter(e => {
        const d = e.date || e.event_date || '';
        const dow = (e.day_of_week || '').trim();
        return d >= today || dow.length > 0;
      })
      .sort((a, b) => (a.date || a.event_date || '').localeCompare(b.date || b.event_date || ''));
    return limit ? upcoming.slice(0, limit) : upcoming;
  },
  getRecurringEvents() {
    return this.events.filter(e => (e.day_of_week || '').trim().length > 0);
  },
  getOneTimeEvents(limit) {
    const today = new Date().toISOString().split('T')[0];
    const events = this.events
      .filter(e => {
        const d = e.date || e.event_date || '';
        const dow = (e.day_of_week || '').trim();
        return d >= today && !dow;
      })
      .sort((a, b) => (a.date || a.event_date || '').localeCompare(b.date || b.event_date || ''));
    return limit ? events.slice(0, limit) : events;
  },
  // Full search — hits backend which queries entity, menu_items, drink_items, specials, events, tags, activities
  async search(q) {
    const term = q.toLowerCase().replace(/[\u{1F300}-\u{1FAF6}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '').trim();
    if (!term) return [];
    try {
      const res = await fetch(GCR_API + '/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: term }),
      });
      if (!res.ok) throw new Error('search failed');
      const data = await res.json();
      return data.results || [];
    } catch(e) {
      // Fallback to local search if API fails
      const stripEmoji = s => (s||'').replace(/[\u{1F300}-\u{1FAF6}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '');
      return this.businesses.filter(b => {
        if (stripEmoji(b.name).toLowerCase().includes(term)) return true;
        if ((b.subtitle || '').toLowerCase().includes(term)) return true;
        if ((b.description || '').toLowerCase().includes(term)) return true;
        if ((b.city || '').toLowerCase().includes(term)) return true;
        if ((b.entity_subtype || '').toLowerCase().replace(/_/g,' ').includes(term)) return true;
        if (b.tags && b.tags.some(t => {
          const tagStr = typeof t === 'string' ? t : (t.tag || '');
          return tagStr.toLowerCase().replace(/_/g,' ').includes(term);
        })) return true;
        return false;
      });
    }
  },
  getBusiness(slugOrId) {
    return this.businesses.find(b => b.slug === slugOrId || b.id === slugOrId || b.site_id === slugOrId || b.subdomain === slugOrId);
  },
  getSpecialsByBusiness(slug) {
    return this.specials.filter(s => s.slug === slug || s.subdomain === slug);
  },

  /* ── Fetch full profile (fleet, pricing, addons, reviews, etc.) ── */
  async loadProfile(slug, forceRefresh) {
    const key = 'profile:' + slug;
    const cached = _gcrCacheGet(key);
    if (cached && !cached.stale && !forceRefresh) return cached.data;

    try {
      const res = await fetch(`${GCR_API}/entity/${encodeURIComponent(slug)}`);
      if (!res.ok) return cached ? cached.data : null;
      const data = await res.json();
      _gcrCacheSet(key, data);
      return data;
    } catch(e) {
      console.warn('GCR profile load failed:', e.message);
      return cached ? cached.data : null;
    }
  },
};

// Auto-load on script parse
GCR.load();
