#!/usr/bin/env node
/**
 * GCR Business Upload Script
 * Reads a staged business folder and pushes to Supabase
 *
 * Usage:
 *   node upload-business.js brick-and-spoon
 *   node upload-business.js brick-and-spoon --dry-run   (preview only, no DB writes)
 */

const https  = require('https');
const fs     = require('fs');
const path   = require('path');

/* ── config ── */
const SUPABASE_URL = 'https://mhafixflyffflwjhcgfn.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oYWZpeGZseWZmZmx3amhjZ2ZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTgxMDgzNSwiZXhwIjoyMDg3Mzg2ODM1fQ.Et9U_jWYPNiqH4_c_DaCPJjLAaQoPMMTw6BKqqUonhA';

const [,, folderArg, flag] = process.argv;
const DRY_RUN = flag === '--dry-run';

if (!folderArg) {
  console.error('Usage: node upload-business.js <folder-name> [--dry-run]');
  process.exit(1);
}

const dir = path.join(__dirname, folderArg);
if (!fs.existsSync(dir)) {
  console.error(`Folder not found: ${dir}`);
  process.exit(1);
}

/* ── helpers ── */
function readJSON(filename) {
  const p = path.join(dir, filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch(e) { console.error(`  ✗ Invalid JSON in ${filename}:`, e.message); process.exit(1); }
}

function supabaseRequest(tablePath, method, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const url     = new URL(`${SUPABASE_URL}/rest/v1/${tablePath}`);
    const options = {
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method,
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'resolution=merge-duplicates,return=representation',
      }
    };
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(bodyStr);
    req.end();
  });
}

/* ── parse "27267 Canal Rd, Orange Beach, AL 36561" → parts ── */
function parseAddress(full) {
  if (!full) return { address: '', city: '', state: '', zip: '' };
  const m = full.match(/^(.+),\s*(.+),\s*([A-Z]{2})\s*(\d{5})?$/);
  if (m) return { address: m[1].trim(), city: m[2].trim(), state: m[3].trim(), zip: m[4] || '' };
  return { address: full, city: '', state: '', zip: '' };
}

/* ── split business.json into DB records ── */
function buildRecords(b) {
  const subdomain = b.subdomain || b.slug;
  const addr      = parseAddress(b.address);

  const bizRecord = {
    subdomain,
    name:             b.name,
    type:             b.type || 'restaurant',
    plan:             'free',
    gcr_listed:       true,
    gcr_category:     b.category || null,
    gcr_tags:         b.tags     || [],
    gcr_description:  b.description || '',
    gcr_phone:        b.phone    || '',
    gcr_website:      b.website  || '',
    gcr_hours:        b.hours    ? JSON.stringify(b.hours) : '',
    gcr_image:        (b.images && b.images[0]) || b.cover_url || '',
    gcr_price_level:  b.price_level || 2,
  };

  const contentRecord = {
    address:       addr.address,
    city:          addr.city,
    state:         addr.state,
    contact_phone: b.phone || '',
    hours:         b.hours || {},
    social_links:  b.social || {},
    about_text:    b.description || '',
  };

  return { subdomain, bizRecord, contentRecord };
}

/* ── build gcr_menu JSONB for businesses.gcr_menu ── */
/* Format: { brunch: [{name, desc, price, tags, section}], happy_hour: [...] } */
function buildGcrMenu(menuData) {
  const gcr_menu = {};
  const menus = menuData.menus || {};
  for (const [menuType, menuDef] of Object.entries(menus)) {
    const items = [];
    (menuDef.sections || []).forEach(sec => {
      (sec.items || []).forEach(item => {
        if (item.active === false) return;
        items.push({
          name:    item.name,
          desc:    item.description || '',
          price:   String(item.price || ''),
          tags:    item.tags || [],
          section: sec.section,
        });
      });
    });
    if (items.length) gcr_menu[menuType] = items;
  }
  return gcr_menu;
}

/* ── flatten menu_items.json → gcr_menu_items rows ── */
function flattenMenuItems(menuData, subdomain) {
  const rows  = [];
  const menus = menuData.menus || {};

  for (const [menuType, menuDef] of Object.entries(menus)) {
    const { available_days = [], available_start = null, available_end = null, sections = [] } = menuDef;
    sections.forEach((sec, secIdx) => {
      const section_order = sec.section_order ?? secIdx + 1;
      (sec.items || []).forEach((item, itemIdx) => {
        rows.push({
          subdomain,
          menu_type:      menuType,
          section:        sec.section,
          section_order,
          name:           item.name,
          description:    item.description || '',
          price:          String(item.price || ''),
          price_variants: item.price_variants || [],
          available_days,
          available_start,
          available_end,
          tags:           item.tags || [],
          sort_order:     itemIdx,
          active:         item.active !== false,
        });
      });
    });
  }
  return rows;
}

/* ── validate: no TODO fields remain ── */
function hasTodos(obj) {
  return JSON.stringify(obj).includes('TODO');
}

/* ══════════════════════════════════════════
   MAIN
   ══════════════════════════════════════════ */
async function main() {
  console.log(`\n${'═'.repeat(55)}`);
  console.log(` GCR Upload: ${folderArg}${DRY_RUN ? '  [DRY RUN]' : ''}`);
  console.log(`${'═'.repeat(55)}\n`);

  const business   = readJSON('business.json');
  const specials   = readJSON('specials.json');
  const menuData   = readJSON('menu_items.json');
  const eventsData = readJSON('events.json');

  if (!business) { console.error('business.json is required'); process.exit(1); }
  if (hasTodos(business)) { console.error('✗ business.json still has TODO fields'); process.exit(1); }

  const { subdomain, bizRecord, contentRecord } = buildRecords(business);
  if (menuData && !hasTodos(menuData)) {
    bizRecord.gcr_menu = buildGcrMenu(menuData);
  }
  console.log(`  subdomain: ${subdomain}`);

  /* ── 1. Upsert businesses row ── */
  console.log('\n[1/5] Business record (businesses table)...');
  let siteId = null;

  if (DRY_RUN) {
    console.log('  (dry run) bizRecord:', JSON.stringify(bizRecord, null, 2));
  } else {
    try {
      const r = await supabaseRequest('businesses', 'POST', bizRecord);
      const row = Array.isArray(r.data) ? r.data[0] : r.data;
      siteId = row?.site_id;
      console.log(`  ✓ upserted (${r.status}) — site_id: ${siteId}`);
    } catch(e) {
      // POST failed — try fetching existing site_id then PATCH
      try {
        const g = await supabaseRequest(
          `businesses?subdomain=eq.${encodeURIComponent(subdomain)}&select=site_id`,
          'GET', null
        );
        const rows = Array.isArray(g.data) ? g.data : [];
        if (rows.length) {
          siteId = rows[0].site_id;
          await supabaseRequest(
            `businesses?subdomain=eq.${encodeURIComponent(subdomain)}`,
            'PATCH', bizRecord
          );
          console.log(`  ✓ patched existing — site_id: ${siteId}`);
        } else {
          throw e;
        }
      } catch(e2) {
        console.error('  ✗ business failed:', e2.message);
        process.exit(1);
      }
    }
  }

  /* ── 2. Upsert site_content row ── */
  console.log('\n[2/5] Site content (address, phone, hours, social)...');
  if (DRY_RUN) {
    console.log('  (dry run) contentRecord:', JSON.stringify(contentRecord, null, 2));
  } else if (siteId) {
    try {
      await supabaseRequest(
        `site_content?site_id=eq.${siteId}`,
        'PATCH', contentRecord
      );
      console.log(`  ✓ site_content updated`);
    } catch(e) {
      try {
        await supabaseRequest('site_content', 'POST', { ...contentRecord, site_id: siteId });
        console.log(`  ✓ site_content inserted`);
      } catch(e2) {
        console.warn(`  ⚠ site_content failed:`, e2.message);
      }
    }
  }

  /* ── 3. Upsert specials ── */
  console.log('\n[3/5] Specials...');
  if (!specials || specials.length === 0 || hasTodos(specials)) {
    console.log('  — skipped');
  } else {
    for (const s of specials) {
      const row = { ...s, site_id: siteId };
      delete row.slug;       // not a column
      delete row.subdomain;  // not a column
      if (DRY_RUN) { console.log('  (dry run) special:', s.name); continue; }
      try {
        await supabaseRequest('specials', 'POST', row);
        console.log(`  ✓ ${s.name}`);
      } catch(e) { console.error(`  ✗ ${s.name}:`, e.message); }
    }
  }

  /* ── 4. Upsert gcr_menu_items ── */
  console.log('\n[4/5] Menu items (gcr_menu_items)...');
  if (!menuData || hasTodos(menuData)) {
    console.log('  — skipped (no menu data or TODOs remain)');
  } else {
    const rows = flattenMenuItems(menuData, subdomain);
    console.log(`  ${rows.length} items across ${Object.keys(menuData.menus || {}).length} menu type(s)`);

    if (DRY_RUN) {
      rows.forEach(r => console.log(`  (dry run) [${r.menu_type}] ${r.section} → ${r.name}  $${r.price}`));
    } else {
      try {
        await supabaseRequest(
          `gcr_menu_items?subdomain=eq.${encodeURIComponent(subdomain)}`,
          'DELETE', null
        );
        console.log(`  ✓ cleared old menu items`);
      } catch(e) { console.warn('  ⚠ could not clear old items:', e.message); }

      const BATCH = 50;
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        try {
          await supabaseRequest('gcr_menu_items', 'POST', batch);
          console.log(`  ✓ inserted items ${i + 1}–${Math.min(i + BATCH, rows.length)}`);
        } catch(e) { console.error(`  ✗ batch ${i}:`, e.message); }
      }
    }
  }

  /* ── 5. Upsert events ── */
  console.log('\n[5/5] Events...');
  const events = Array.isArray(eventsData) ? eventsData.filter(e => !hasTodos(e)) : [];
  if (events.length === 0) {
    console.log('  — skipped');
  } else {
    for (const ev of events) {
      if (DRY_RUN) { console.log('  (dry run) event:', ev.title); continue; }
      try {
        await supabaseRequest('events', 'POST', { ...ev, subdomain });
        console.log(`  ✓ ${ev.title}`);
      } catch(e) { console.error(`  ✗ ${ev.title}:`, e.message); }
    }
  }

  console.log(`\n${'═'.repeat(55)}`);
  console.log(DRY_RUN ? ' DRY RUN complete — nothing written to DB' : ` Upload complete: ${subdomain}`);
  console.log(`${'═'.repeat(55)}\n`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
