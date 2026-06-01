/**
 * GCR API client - queries REST API instead of Supabase directly
 * This ensures frontend always syncs with admin edits
 */
window.GCRApi = (function() {
  const API_URL = 'https://gcr-api-gules.vercel.app/api/gcr';

  async function fetchAllBusinesses() {
    try {
      console.log('[GCRApi] Fetching all businesses from REST API...');
      const resp = await fetch(`${API_URL}/entities?limit=500`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const businesses = data.entities || data.businesses || [];
      console.log(`[GCRApi] ✓ Fetched ${businesses.length} businesses`);
      return businesses;
    } catch (err) {
      console.error('[GCRApi] Error fetching businesses:', err.message);
      return [];
    }
  }

  async function fetchBusiness(id) {
    try {
      console.log(`[GCRApi] Fetching business ${id}...`);
      const resp = await fetch(`${API_URL}/entity/${id}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const business = data.entity || {};
      console.log(`[GCRApi] ✓ Fetched business: ${business.name}`);
      return business;
    } catch (err) {
      console.error(`[GCRApi] Error fetching business ${id}:`, err.message);
      return null;
    }
  }

  async function fetchEvents() {
    try {
      const resp = await fetch(`${API_URL}/events`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data.events || [];
    } catch (err) {
      console.error('[GCRApi] Error fetching events:', err.message);
      return [];
    }
  }

  async function fetchSpecials() {
    try {
      const resp = await fetch(`${API_URL}/specials`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data.specials || [];
    } catch (err) {
      console.error('[GCRApi] Error fetching specials:', err.message);
      return [];
    }
  }

  async function fetchHappyHours() {
    try {
      const resp = await fetch(`${API_URL}/happy-hours`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data.happyHours || [];
    } catch (err) {
      console.error('[GCRApi] Error fetching happy hours:', err.message);
      return [];
    }
  }

  return {
    fetchAllBusinesses,
    fetchBusiness,
    fetchEvents,
    fetchSpecials,
    fetchHappyHours
  };
})();

console.log('[GCRApi] ✓ API client ready');
