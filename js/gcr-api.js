/* ============================================
   GCR — Gulf Coast Radar
   gcr-api.js — Live data from Supabase via API
   Replaces data.js — same GCR.* interface
   ============================================ */

const GCR_API = 'https://cybercheck-api-database.vercel.app/api/gcr';

const GCR = {
  businesses: [],
  events: [],
  specials: [],
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
  async load() {
    try {
      const [bizRes, evRes, spRes] = await Promise.all([
        fetch(GCR_API + '/entities?limit=500').catch(() => null),
        fetch(GCR_API + '/events').catch(() => null),
        fetch(GCR_API + '/specials').catch(() => null),
      ]);

      if (bizRes && bizRes.ok) {
        const data = await bizRes.json();
        const raw = data.entities || data.businesses || [];
        // Deduplicate: remove -1 suffix duplicates (keep the base slug version)
        const slugSet = new Set();
        this.businesses = raw.filter(b => {
          const s = b.slug || b.subdomain || '';
          if (slugSet.has(s)) return false;
          // If this is a -1 slug and the base slug exists, skip it
          if (s.match(/-1$/) && raw.some(o => (o.slug || o.subdomain) === s.replace(/-1$/, ''))) return false;
          slugSet.add(s);
          return true;
        });
      }
      if (evRes && evRes.ok) {
        this.events = await evRes.json();
      }
      if (spRes && spRes.ok) {
        this.specials = await spRes.json();
      }

      this.loaded = true;
      document.dispatchEvent(new CustomEvent('gcr:loaded', { detail: this }));
    } catch(e) {
      console.warn('GCR API unavailable, using empty data:', e.message);
      this.loaded = true;
      document.dispatchEvent(new CustomEvent('gcr:loaded', { detail: this }));
    }
  },

  /* ── HELPERS (same interface as data.js) ── */
  getByCategory(cat) {
    const aliases = {
      'restaurants':    ['restaurants','restaurant','food','dining','seafood','bar_grill','steakhouse','pizza','mexican','southern','breakfast_spot','beach_bar','casual_dining','hybrid_venue','seafood_restaurant'],
      'things-to-do':  ['things-to-do','rental','rentals','activities','tours','activity','attraction','parasailing','boat_rental','boat-rentals','jet_ski','jet-ski-rentals-tours','dolphin_cruise','dolphin-cruises-tours','kayak_rental','canoe-kayak-paddleboard','fishing_charter','snorkeling','paddleboard','banana-boat-rides','banana_boat','tour'],
      'nightlife':     ['nightlife','bar','bars','club','clubs','bar_club','nightclub','sports_bar','lounge','rooftop_bar'],
      'coffee-sweets': ['coffee-sweets','coffee','cafe','coffee_shop','sweets','desserts','bakery','ice_cream','dessert_bar','smoothie'],
      'shopping':      ['shopping','shop','retail','boutique','souvenir','surf_shop','gift_shop','clothing','art_gallery'],
      'services':      ['services','service','salon','spa','photographer','photography','wellness','transportation'],
      'other':         ['other','misc','miscellaneous','hotel','condo','resort','vacation_rental','parking','boat_launch','beach_access','park'],
    };
    const valid = aliases[cat] || [cat];
    return this.businesses.filter(b => {
      const t = (b.type || '').toLowerCase();
      const c = (b.category || '').toLowerCase();
      const sub = (b.entity_subtype || '').toLowerCase();
      return valid.includes(t) || valid.includes(c) || valid.includes(sub) ||
             valid.includes(t.replace(/-/g,'_')) || valid.includes(sub.replace(/-/g,'_'));
    });
  },
  getFeatured() {
    return this.businesses.filter(b => b.featured);
  },
  getHappyHours() {
    return this.businesses.filter(b => {
      const hh = b.happyHour || b.happy_hour;
      if (!hh) return false;
      if (hh === true) return true;
      if (typeof hh === 'string' && hh.trim().length > 0) return true;
      return false;
    });
  },
  getSpecials() {
    return this.specials.filter(s => s.active !== false);
  },
  getByTag(tag) {
    return this.businesses.filter(b => b.tags && b.tags.includes(tag));
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
      .filter(e => (e.date || e.event_date || '') >= today)
      .sort((a, b) => (a.date || a.event_date || '').localeCompare(b.date || b.event_date || ''));
    return limit ? upcoming.slice(0, limit) : upcoming;
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
  async loadProfile(slug) {
    try {
      const res = await fetch(`${GCR_API}/entity/${encodeURIComponent(slug)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch(e) {
      console.warn('GCR profile load failed:', e.message);
      return null;
    }
  },
};

// Auto-load on script parse (skip on localhost to avoid CORS errors)
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  GCR.load();
} else {
  // Mark as loaded to dispatch event (pages use hardwired sample data)
  GCR.loaded = true;
  document.dispatchEvent(new CustomEvent('gcr:loaded', { detail: GCR }));
}
