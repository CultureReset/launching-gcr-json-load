window.GCRSupabase = (function() {
  const URL = 'https://xbptmkpbiqzvxptjkfoi.supabase.co';
  const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFub24iLCJraWQiOiJ2MWkzOGFjdTk0ZTEzMDMxIn0.eyJpc3MiOiJodHRwczovL3N1cGFiYXNlLmNvIiwic3ViIjoiYW5vbiIsImlhdCI6MTcwNTMyNTE3OCwiZXhwIjoyNDA5NTI1MTc4LCJhdWQiOiJhdXRoZW50aWNhdGVkIiwicm9sZSI6ImFub24iLCJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7fX0.VPbIAGRiH2b2v1KOLuaCxBOvEHw-hINHfy5_Rppd-N8';
  let client = null;

  async function getClient() {
    if (client) return client;
    if (!window.supabase) {
      return new Promise((resolve) => {
        let attempts = 0;
        const poll = () => {
          if (window.supabase) {
            client = window.supabase.createClient(URL, KEY);
            console.log('✓ Supabase connected');
            resolve(client);
          } else if (attempts < 100) {
            attempts++;
            setTimeout(poll, 50);
          } else {
            console.error('❌ Supabase lib failed');
            resolve(null);
          }
        };
        poll();
      });
    }
    client = window.supabase.createClient(URL, KEY);
    return client;
  }

  async function fetchAllBusinesses() {
    const c = await getClient();
    if (!c) return [];
    const { data, error } = await c.from('entity').select('*').eq('is_active', true).order('name');
    if (error) { console.error('Error:', error.message); return []; }
    console.log('✓ Fetched', data.length, 'businesses');
    return data || [];
  }

  async function fetchBusinessProfile(slug) {
    const c = await getClient();
    if (!c) return null;
    const { data: entity } = await c.from('entity').select('*').eq('slug', slug).single();
    if (!entity) return null;
    const { data: photos } = await c.from('entity_photos').select('*').eq('entity_id', entity.id).order('sort_order');
    const { data: events } = await c.from('entity_events').select('*').eq('entity_id', entity.id).eq('is_active', true);
    const { data: specials } = await c.from('entity_specials').select('*').eq('entity_id', entity.id).eq('is_active', true);
    const { data: tags } = await c.from('entity_tags').select('*').eq('entity_id', entity.id);
    const { data: happyHours } = await c.from('entity_happy_hours').select('*').eq('entity_id', entity.id);
    const { data: sections } = await c.from('entity_sections').select('*').eq('entity_id', entity.id);
    return { entity, photos: photos || [], events: events || [], specials: specials || [], tags: tags || [], happyHours: happyHours || [], sections: sections || [] };
  }

  async function updateBusiness(slug, updates) {
    const c = await getClient();
    if (!c) return false;
    const { error } = await c.from('entity').update(updates).eq('slug', slug);
    if (error) { console.error('Update error:', error); return false; }
    return true;
  }

  return { getClient, fetchAllBusinesses, fetchBusinessProfile, updateBusiness };
})();

console.log('✓ GCRSupabase ready');
