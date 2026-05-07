#!/usr/bin/env node

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const GCR_URL = 'https://adpnhipmdefutkzzltbs.supabase.co';
const GCR_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkcG5oaXBtZGVmdXRrenpsdGJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg2MDA3NCwiZXhwIjoyMDkwNDM2MDc0fQ.qxMRoAuU22Kd6NyVXZsK4iSFFi-_20BUuN5yQfr7oUY';

const gcrDb = createClient(GCR_URL, GCR_KEY);

// Keep only these types
const KEEP_TYPES = new Set([
  // Food/Dining
  'restaurant', 'seafood_restaurant', 'seafood', 'coffee_shop', 'cafe',
  'ice_cream_shop', 'bakery', 'bar', 'bar_and_grill',
  'pizza_restaurant', 'mexican_restaurant', 'american_restaurant',
  'breakfast_restaurant', 'brunch_restaurant', 'steak_house',
  'chinese_restaurant', 'italian_restaurant', 'greek_restaurant',
  'tex_mex_restaurant', 'japanese_restaurant', 'thai_restaurant',
  'hamburger_restaurant', 'chicken_restaurant', 'sandwich_shop',
  'deli', 'donut_shop', 'dessert_shop', 'chocolate_shop', 'cocktail_bar',
  'pub', 'sports_bar', 'night_club', 'brewery', 'meal_takeaway',
  'pizza_delivery', 'health-food-store', 'food_store', 'food',
  // Lodging
  'hotel', 'hotel-chain', 'motel', 'condominium_complex', 'lodging',
  'rentals', 'vacation-rentals', 'vacation-rental', 'vacation-rental-marketplace',
  'bed_and_breakfast', 'rv_park', 'campground', 'resort', 'resort_hotel',
  // Activities
  'fishing_charter', 'charter-fishing', 'tour_agency', 'tour_agency',
  'attraction', 'attractions', 'park', 'parks', 'water_sports',
  'watersports', 'parasailing', 'jet-ski-rentals-tours',
  'canoe-kayak-paddleboard-rentals', 'boat_rental', 'boat_launch',
  'marina', 'marina-and-rentals', 'fishing_pier', 'pier',
  'things-to-do', 'state_park', 'beach_access', 'beach',
  'wildlife_refuge', 'nature_preserve', 'hiking_area', 'golf_course',
  'golf-course', 'miniature_golf_course', 'golf-club', 'amusement_center',
  'amusement-park', 'zoo', 'scenic_spot', 'observation_deck',
  'historical_landmark', 'museum', 'sports_activity_location',
  'event_venue', 'live_music_venue',
]);

function normalizeAddress(addr) {
  if (!addr) return '';
  return addr
    .toLowerCase()
    .replace(/\brd\b/g, 'road')
    .replace(/\bst\b/g, 'street')
    .replace(/\bave\b/g, 'avenue')
    .replace(/\bblvd\b/g, 'boulevard')
    .replace(/\bdr\b/g, 'drive')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function levenshtein(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i][j - 1] + 1,
        matrix[i - 1][j] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

function nameSimilarity(a, b) {
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return 1 - (dist / maxLen);
}

function findMatch(cleanRecord, existingRecords) {
  const cleanAddr = normalizeAddress(cleanRecord.address_line_1);
  if (!cleanAddr) return null;

  for (const existing of existingRecords) {
    const existingAddr = normalizeAddress(existing.address_line_1);
    if (existingAddr !== cleanAddr) continue;

    const nameSim = nameSimilarity(cleanRecord.name, existing.name);
    if (nameSim >= 0.7) {
      return existing;
    }
  }
  return null;
}

async function importFiltered() {
  console.log('Loading clean data...');
  let cleanData = JSON.parse(fs.readFileSync('./clean-data.json', 'utf-8'));

  // Filter to only desired types
  cleanData = cleanData.filter(r => KEEP_TYPES.has(r.entity_subtype || r.category));
  console.log(`Filtered to ${cleanData.length} records in desired categories\n`);

  console.log('Fetching existing GCR entities...');
  const { data: existingEntities, error: fetchError } = await gcrDb
    .from('entity')
    .select('id, slug, name, address_line_1, city, state, zip, is_active')
    .eq('is_active', true)
    .range(0, 999);

  if (fetchError) {
    console.error('Error fetching existing entities:', fetchError.message);
    process.exit(1);
  }
  console.log(`Fetched ${existingEntities.length} existing records\n`);

  // Build set of existing slugs
  const existingSlugs = new Set(existingEntities.map(e => e.slug));

  let matches = 0;
  let newRecords = 0;
  let slugConflicts = 0;
  const toInsert = [];
  const insertedSlugs = new Set(); // Track what we're inserting to avoid duplicates

  for (const cleanRec of cleanData) {
    const match = findMatch(cleanRec, existingEntities);
    if (match) {
      matches++;
    } else {
      // Generate slug from name + uuid if original slug conflicts
      let slug = cleanRec.slug ? cleanRec.slug.substring(0, 255) : null;

      // If slug exists or we're already inserting it, regenerate
      if (slug && (existingSlugs.has(slug) || insertedSlugs.has(slug))) {
        slugConflicts++;
        // Use name + random suffix as fallback
        const nameSlug = (cleanRec.name || 'business').toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
        slug = nameSlug + '-' + Math.random().toString(36).substring(2, 9);
      }

      newRecords++;
      if (slug) insertedSlugs.add(slug);

      // Don't include id — let Supabase generate new UUID
      toInsert.push({
        slug: slug,
        name: cleanRec.name,
        subtitle: cleanRec.subtitle,
        entity_type: cleanRec.entity_type,
        entity_subtype: cleanRec.entity_subtype,
        icon: cleanRec.icon,
        phone: cleanRec.phone,
        rating: cleanRec.rating,
        review_count: cleanRec.review_count,
        city: cleanRec.city,
        address_line_1: cleanRec.address_line_1,
        hero_image_url: cleanRec.hero_image_url,
        website_url: cleanRec.website_url,
        directions_url: cleanRec.directions_url,
        is_active: cleanRec.is_active,
        description: cleanRec.description,
      });
    }
  }

  console.log(`Results:`);
  console.log(`  Matched with existing: ${matches}`);
  console.log(`  Slug conflicts (skipped): ${slugConflicts}`);
  console.log(`  New records to insert: ${newRecords}\n`);

  if (toInsert.length > 0) {
    console.log(`Inserting ${toInsert.length} new entities...`);

    // Truncate any string field > 30 chars (conservative limit)
    const truncated = toInsert.map(r => ({
      ...r,
      slug: r.slug ? r.slug.substring(0, 255) : null,
      name: r.name ? r.name.substring(0, 255) : null,
      subtitle: r.subtitle ? r.subtitle.substring(0, 255) : null,
      phone: r.phone ? r.phone.substring(0, 30) : null,
      city: r.city ? r.city.substring(0, 30) : null,
      icon: r.icon ? r.icon.substring(0, 30) : null,
      entity_type: r.entity_type ? r.entity_type.substring(0, 30) : null,
      entity_subtype: r.entity_subtype ? r.entity_subtype.substring(0, 30) : null,
    }));

    const { data: inserted, error: insertError } = await gcrDb
      .from('entity')
      .insert(truncated)
      .select('id, name');

    if (insertError) {
      console.error('Error inserting:', insertError.message);
      if (insertError.details) console.error('Details:', insertError.details);
      process.exit(1);
    }
    console.log(`✓ Inserted ${inserted.length} entities\n`);

    console.log('Done! New businesses added to GCR.');
    console.log('Next: add tags, photos, hours in admin dashboard.');
  } else {
    console.log('No new records to insert.');
  }
}

importFiltered().catch(console.error);
