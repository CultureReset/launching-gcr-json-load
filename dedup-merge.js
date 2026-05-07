#!/usr/bin/env node

/**
 * Deduplicate & Merge from CyberCheck API
 * Pulls from all endpoints, finds duplicates, merges data, exports clean CSV
 */

const fs = require('fs');
const API = 'https://cybercheck-api-database.vercel.app/api/gcr';

function getAllIds(record) {
  const ids = new Set();
  if (record.id) ids.add(record.id);
  if (record.site_id) ids.add(record.site_id);
  if (record.slug) ids.add(record.slug);
  if (record.subdomain) ids.add(record.subdomain);
  if (record.entity_id) ids.add(record.entity_id);
  if (record.entity_slug) ids.add(record.entity_slug);
  const gMatch = (record.slug || record.entity_slug || '').match(/ChIJ[a-zA-Z0-9_-]+/);
  if (gMatch) ids.add(gMatch[0]);
  return ids;
}

function matches(a, b) {
  const aIds = getAllIds(a);
  const bIds = getAllIds(b);
  for (let id of aIds) {
    if (id && bIds.has(id)) return true;
  }
  return false;
}

function mergeGroup(group) {
  const primary = group.find(e => (e.slug||e.subdomain||'').includes('ChIJ')) ||
    group.reduce((b,e) => ((e.rating||0)>(b.rating||0)?e:b), group[0]);

  const merged = { ...primary };
  const allKeys = new Set();
  group.forEach(e => Object.keys(e||{}).forEach(k => allKeys.add(k)));

  // Fields that should NOT be merged with " • " — keep primary value only
  const singleValueFields = new Set([
    'id', 'site_id', 'slug', 'subdomain', 'entity_id', 'entity_slug',
    'entity_type', 'entity_subtype', 'type', 'category', 'secondary_types',
    'zip', 'state', 'city', 'price_range', 'price_unit', 'price_from', 'price_to',
    'icon', 'emoji', 'status', 'is_active', 'gcr_listed', 'featured'
  ]);

  for (const key of allKeys) {
    if (singleValueFields.has(key)) continue; // Keep primary value, don't merge

    const vals = [];
    const seen = new Set();

    group.forEach(e => {
      const v = e[key];
      if (v === undefined || v === null || v === '') return;

      if (Array.isArray(v)) {
        v.forEach(item => {
          const dedupeKey = typeof item === 'string'
            ? item.toLowerCase()
            : (item.id || item.slug || item.name || JSON.stringify(item)).toLowerCase();
          if (!seen.has(dedupeKey)) {
            seen.add(dedupeKey);
            vals.push(item);
          }
        });
      } else if (typeof v === 'string') {
        const str = v.trim();
        if (str && !seen.has(str.toLowerCase())) {
          seen.add(str.toLowerCase());
          vals.push(str);
        }
      } else if (typeof v === 'number') {
        if (!merged[key] || v > merged[key]) merged[key] = v;
      } else if (typeof v === 'boolean') {
        if (v) merged[key] = true;
      } else if (typeof v === 'object') {
        if (!merged[key]) merged[key] = v;
      }
    });

    if (vals.length > 0) {
      if (Array.isArray(merged[key])) {
        const existing = new Set(merged[key].map((x, i) => {
          const k = typeof x === 'string' ? x.toLowerCase() : (x.id||x.slug||x.name||'').toLowerCase();
          return k || String(i);
        }));
        vals.forEach(v => {
          const k = typeof v === 'string' ? v.toLowerCase() : (v.id||v.slug||v.name||'').toLowerCase();
          if (!existing.has(k)) {
            merged[key].push(v);
            existing.add(k);
          }
        });
      } else if (typeof merged[key] === 'string') {
        merged[key] = [merged[key], ...vals].join(' • ');
      } else {
        merged[key] = vals[0];
      }
    }
  }

  return merged;
}

async function dedupMerge() {
  console.log('Fetching from CyberCheck API...\n');

  const [bizRes, hhRes, spRes, evRes] = await Promise.all([
    fetch(`${API}/entities?limit=500`).then(r => r.json()).catch(() => ({})),
    fetch(`${API}/happy-hours`).then(r => r.json()).catch(() => ({})),
    fetch(`${API}/specials`).then(r => r.json()).catch(() => ({})),
    fetch(`${API}/events`).then(r => r.json()).catch(() => ({})),
  ]);

  let entities = bizRes.entities || [];
  const happyHours = hhRes.happyHours || hhRes || [];
  const specials = spRes.specials || spRes || [];
  const events = evRes.events || evRes || [];

  console.log(`Got ${entities.length} entities`);
  console.log(`Got ${happyHours.length} HH records`);
  console.log(`Got ${specials.length} specials`);
  console.log(`Got ${events.length} events\n`);

  // Combine all data sources
  const allData = [
    ...entities,
    ...happyHours.filter(hh => !entities.some(e => matches(hh, e))),
  ];

  console.log(`Total unique records: ${allData.length}\n`);

  // Find & merge duplicates
  const groups = [];
  const assigned = new Set();

  allData.forEach(entity => {
    const ids = getAllIds(entity);
    const firstId = Array.from(ids)[0];
    if (!firstId || assigned.has(firstId)) return;

    const group = allData.filter(o => !o ? false : matches(entity, o));
    group.forEach(g => getAllIds(g).forEach(id => assigned.add(id)));
    groups.push(group);
  });

  console.log(`After deduplication: ${groups.length} unique businesses\n`);

  const merged = groups.map(g =>
    g.length > 1 ? mergeGroup(g) : g[0]
  );

  // Export CSV
  if (merged.length > 0) {
    const keys = new Set();
    merged.forEach(m => Object.keys(m).forEach(k => keys.add(k)));
    const cols = Array.from(keys).sort();

    const csv = [
      cols.map(c => `"${c}"`).join(','),
      ...merged.map(m => cols.map(c => {
        const v = m[c];
        if (v === null || v === undefined) return '';
        if (Array.isArray(v)) return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
        if (typeof v === 'object') return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    fs.writeFileSync('clean-data.csv', csv);
    console.log(`✓ Exported ${merged.length} clean records to clean-data.csv\n`);

    // Also JSON
    fs.writeFileSync('clean-data.json', JSON.stringify(merged, null, 2));
    console.log(`✓ Also saved to clean-data.json\n`);

    console.log('Now you can:');
    console.log('1. Review clean-data.csv');
    console.log('2. Import into single Supabase table');
    console.log('3. Done — no duplicates, all data merged\n');
  }
}

dedupMerge().catch(console.error);
