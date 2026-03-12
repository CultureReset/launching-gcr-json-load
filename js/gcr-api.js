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
        fetch(GCR_API + '/businesses?limit=500').catch(() => null),
        fetch(GCR_API + '/events').catch(() => null),
        fetch(GCR_API + '/specials').catch(() => null),
      ]);

      if (bizRes && bizRes.ok) {
        const data = await bizRes.json();
        this.businesses = data.businesses || [];
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
    return this.businesses.filter(b =>
      b.type === cat || b.category === cat
    );
  },
  getFeatured() {
    return this.businesses.filter(b => b.featured);
  },
  getHappyHours() {
    return this.businesses.filter(b => b.happyHour || b.happy_hour);
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
  search(q) {
    const term = q.toLowerCase();
    return this.businesses.filter(b => {
      if ((b.name        || '').toLowerCase().includes(term)) return true;
      if ((b.tagline     || '').toLowerCase().includes(term)) return true;
      if ((b.description || '').toLowerCase().includes(term)) return true;
      if ((b.area        || '').toLowerCase().includes(term)) return true;
      if ((b.type        || '').toLowerCase().includes(term)) return true;
      if (b.tags && b.tags.some(t => t.toLowerCase().includes(term))) return true;
      return false;
    }).sort((a, b) => {
      const aTop = (a.name || '').toLowerCase().startsWith(term) ? 1 : 0;
      const bTop = (b.name || '').toLowerCase().startsWith(term) ? 1 : 0;
      return bTop - aTop;
    });
  },
  getBusiness(slugOrId) {
    return this.businesses.find(b => b.slug === slugOrId || b.id === slugOrId || b.site_id === slugOrId || b.subdomain === slugOrId);
  },

  /* ── Fetch full profile (fleet, pricing, addons, reviews, etc.) ── */
  async loadProfile(slug) {
    try {
      const res = await fetch(`${GCR_API}/businesses/${encodeURIComponent(slug)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch(e) {
      console.warn('GCR profile load failed:', e.message);
      return null;
    }
  },
};

// Auto-load on script parse
GCR.load();
