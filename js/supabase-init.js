// ============================================
// Supabase Client — Direct database connection
// ============================================

const SUPABASE_URL = 'https://xbptmkpbiqzvxptjkfoi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6ImFub24iLCJraWQiOiJ2MWkzOGFjdTk0ZTEzMDMxIn0.eyJpc3MiOiJodHRwczovL3N1cGFiYXNlLmNvIiwic3ViIjoiYW5vbiIsImlhdCI6MTcwNTMyNTE3OCwiZXhwIjoyNDA5NTI1MTc4LCJhdWQiOiJhdXRoZW50aWNhdGVkIiwicm9sZSI6ImFub24iLCJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7fX0.VPbIAGRiH2b2v1KOLuaCxBOvEHw-hINHfy5_Rppd-N8';

// Create Supabase client
let supabase = null;

async function initSupabase() {
  if (supabase) return supabase;

  // Load Supabase library if not already loaded
  if (!window.supabase) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    document.head.appendChild(script);

    return new Promise((resolve) => {
      script.onload = () => {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        resolve(supabase);
      };
    });
  }

  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabase;
}

// ============================================
// Fetch businesses with smart pagination
// ============================================
async function fetchAllBusinesses() {
  const client = await initSupabase();

  const { data, error } = await client
    .from('entity')
    .select('id,slug,name,entity_subtype,city,state,phone,address_line_1,rating,review_count,hero_image_url,cover_url,description,subtitle,hh_days,hh_start,hh_end,hh_description,is_featured,is_active,photos:entity_photos(image_url),tags:entity_tags(tag)')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching businesses:', error);
    return [];
  }

  return data || [];
}

// ============================================
// Fetch single business with all related data
// ============================================
async function fetchBusinessProfile(slug) {
  const client = await initSupabase();

  // Get main entity
  const { data: entity, error: entityError } = await client
    .from('entity')
    .select('*')
    .eq('slug', slug)
    .single();

  if (entityError || !entity) return null;

  // Get photos
  const { data: photos } = await client
    .from('entity_photos')
    .select('*')
    .eq('entity_id', entity.id)
    .order('sort_order');

  // Get events
  const { data: events } = await client
    .from('entity_events')
    .select('*')
    .eq('entity_id', entity.id)
    .eq('is_active', true);

  // Get specials
  const { data: specials } = await client
    .from('entity_specials')
    .select('*')
    .eq('entity_id', entity.id)
    .eq('is_active', true);

  // Get tags
  const { data: tags } = await client
    .from('entity_tags')
    .select('*')
    .eq('entity_id', entity.id);

  // Get happy hours
  const { data: happyHours } = await client
    .from('entity_happy_hours')
    .select('*')
    .eq('entity_id', entity.id);

  // Get menu sections with items, bullets, and groups
  const { data: sections } = await client
    .from('entity_sections')
    .select(`
      *,
      section_items(*),
      section_bullets(*),
      section_groups(*)
    `)
    .eq('entity_id', entity.id);

  return {
    entity,
    photos: photos || [],
    events: events || [],
    specials: specials || [],
    tags: tags || [],
    happyHours: happyHours || [],
    sections: sections || []
  };
}

// ============================================
// Save/Update business data
// ============================================
async function updateBusiness(slug, updates) {
  const client = await initSupabase();

  const { error } = await client
    .from('entity')
    .update(updates)
    .eq('slug', slug);

  if (error) {
    console.error('Error updating business:', error);
    return false;
  }

  return true;
}


// Export functions
window.GCRSupabase = {
  initSupabase,
  fetchAllBusinesses,
  fetchBusinessProfile,
  updateBusiness
};

console.log('✓ Supabase client initialized');
