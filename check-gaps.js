#!/usr/bin/env node

/**
 * Data Completeness Report
 * Shows which restaurants are missing which fields
 */

const API = 'https://cybercheck-api-database.vercel.app/api/gcr';

async function checkGaps() {
  console.log('Fetching restaurants...\n');

  const res = await fetch(`${API}/entities?limit=500`);
  const data = await res.json();
  const restaurants = (data.entities || []).filter(e =>
    (e.entity_subtype || e.type || '').includes('restaurant') ||
    (e.entity_subtype || e.type || '').includes('bar') ||
    (e.entity_subtype || e.type || '').includes('seafood')
  );

  console.log(`Found ${restaurants.length} restaurants\n`);
  console.log('=' .repeat(80));

  const gaps = {
    noDescription: [],
    noTags: [],
    noPhotos: [],
    noHours: [],
    noHappyHour: [],
    incomplete: []
  };

  restaurants.forEach(r => {
    const missing = [];

    if (!r.description || r.description.trim() === '') missing.push('description');
    if (!r.tags || r.tags.length === 0) missing.push('tags');
    if (!r.photos || r.photos.length === 0) missing.push('photos');
    if (!r.hours || r.hours.length === 0) missing.push('hours');
    if (!r.hh_days) missing.push('hh_days');

    if (missing.length > 0) {
      gaps.incomplete.push({ name: r.name, slug: r.slug, missing });
      if (missing.includes('description')) gaps.noDescription.push(r.name);
      if (missing.includes('tags')) gaps.noTags.push(r.name);
      if (missing.includes('photos')) gaps.noPhotos.push(r.name);
      if (missing.includes('hours')) gaps.noHours.push(r.name);
      if (missing.includes('hh_days')) gaps.noHappyHour.push(r.name);
    }
  });

  console.log('\nGAPS SUMMARY:');
  console.log(`  Missing Descriptions: ${gaps.noDescription.length}/${restaurants.length}`);
  console.log(`  Missing Tags:         ${gaps.noTags.length}/${restaurants.length}`);
  console.log(`  Missing Photos:       ${gaps.noPhotos.length}/${restaurants.length}`);
  console.log(`  Missing Hours:        ${gaps.noHours.length}/${restaurants.length}`);
  console.log(`  Missing HH Data:      ${gaps.noHappyHour.length}/${restaurants.length}`);
  console.log(`  INCOMPLETE RECORDS:   ${gaps.incomplete.length}/${restaurants.length}\n`);

  console.log('=' .repeat(80));
  console.log('\nDETAILED GAPS:\n');

  gaps.incomplete.forEach(item => {
    console.log(`❌ ${item.name} (${item.slug})`);
    console.log(`   Missing: ${item.missing.join(', ')}\n`);
  });

  // Top priority: which restaurants need most work
  const byMissing = gaps.incomplete
    .sort((a, b) => b.missing.length - a.missing.length)
    .slice(0, 10);

  console.log('=' .repeat(80));
  console.log('\nTOP 10 PRIORITY (most missing fields):\n');
  byMissing.forEach(item => {
    console.log(`${item.missing.length} fields missing: ${item.name}`);
  });
}

checkGaps().catch(console.error);
