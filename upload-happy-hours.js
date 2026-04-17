#!/usr/bin/env node
/**
 * upload-happy-hours.js
 * Reads happy_hour_upload.csv and pushes data directly to the admin API.
 * For each business: sets hh_days/hh_start/hh_end, creates a section, adds items.
 *
 * Run: node upload-happy-hours.js
 * Requires: ADMIN_EMAIL and ADMIN_PASS in environment (or .env file)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env if present
const envPath = path.join(path.dirname(__dirname), 'cybercheck-api-database', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  });
}

const BASE  = 'https://cybercheck-api-database.vercel.app';
const EMAIL = process.env.ADMIN_EMAIL;
const PASS  = process.env.ADMIN_PASS;
const CSV   = path.join(__dirname, 'happy_hour_upload.csv');

if (!EMAIL || !PASS) {
  console.error('❌ Set ADMIN_EMAIL and ADMIN_PASS environment variables');
  process.exit(1);
}

// ── Helpers ────────────────────────────────────────────────────
let token = null;

async function api(method, endpoint, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + endpoint, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { ok: res.status < 400, status: res.status, data };
}

async function login() {
  const r = await api('POST', '/api/admin/login', { username: EMAIL, password: PASS });
  if (r.ok && r.data?.token) { token = r.data.token; return true; }
  console.error('❌ Login failed:', r.data);
  process.exit(1);
}

// ── Parse CSV ──────────────────────────────────────────────────
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { values.push(cur); cur = ''; continue; }
      cur += ch;
    }
    values.push(cur);
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = (values[i] || '').trim());
    return obj;
  }).filter(r => r.slug);
}

// ── Group CSV rows by slug ─────────────────────────────────────
function groupBySlug(rows) {
  const map = {};
  rows.forEach(r => {
    if (!map[r.slug]) map[r.slug] = { slug: r.slug, hh_days: r.hh_days, hh_start: r.hh_start, hh_end: r.hh_end, hh_description: r.hh_description, items: [] };
    if (r.item_name) {
      map[r.slug].items.push({ section_name: r.section_name || 'Happy Hour', item_name: r.item_name, description: r.description, hh_price: r.hh_price, price_text: r.price_text });
    }
  });
  return Object.values(map);
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  console.log('🍺 GCR Happy Hours Uploader');
  console.log('===========================\n');

  await login();
  console.log('✅ Logged in\n');

  // Load all entities once to build slug → id map
  console.log('📋 Loading entity list...');
  const entRes = await api('GET', '/api/admin/gcr/entities');
  if (!entRes.ok) { console.error('❌ Failed to load entities'); process.exit(1); }
  const slugToId = {};
  (entRes.data.entities || []).forEach(e => { if (e.slug) slugToId[e.slug] = e.id; });
  console.log(`   ${Object.keys(slugToId).length} entities loaded\n`);

  // Parse CSV
  const csv = fs.readFileSync(CSV, 'utf8');
  const rows = parseCSV(csv);
  const businesses = groupBySlug(rows);
  console.log(`📄 CSV: ${businesses.length} businesses, ${rows.length} rows\n`);

  let updated = 0, skipped = 0, errors = 0;

  for (const biz of businesses) {
    const entityId = slugToId[biz.slug];
    if (!entityId) {
      console.log(`  ⚠️  Skipped (not in DB): ${biz.slug}`);
      skipped++;
      continue;
    }

    process.stdout.write(`  → ${biz.slug} ... `);

    // 1. Set hh_days / hh_start / hh_end on entity
    const schedRes = await api('PUT', `/api/admin/gcr/entities/${entityId}/happy-hour`, {
      hh_days:       biz.hh_days || null,
      hh_start:      biz.hh_start || null,
      hh_end:        biz.hh_end || null,
      hh_description: biz.hh_description || null,
    });

    if (!schedRes.ok) {
      console.log(`❌ schedule update failed (${schedRes.status})`);
      errors++;
      continue;
    }

    // 2. Create section + items if any
    if (biz.items.length) {
      // Group items by section_name
      const sections = {};
      biz.items.forEach(item => {
        const sn = item.section_name || 'Happy Hour';
        if (!sections[sn]) sections[sn] = [];
        sections[sn].push(item);
      });

      for (const [sectionName, items] of Object.entries(sections)) {
        // Create section
        const secRes = await api('POST', `/api/admin/gcr/entities/${entityId}/hh-sections`, {
          section_name: sectionName, sort_order: 0,
        });
        const sectionId = secRes.data?.id || null;

        // Add items
        for (const item of items) {
          await api('POST', `/api/admin/gcr/entities/${entityId}/hh-items`, {
            item_name:   item.item_name,
            description: item.description || null,
            price_text:  item.price_text || item.hh_price || null,
            hh_section_id: sectionId,
          });
        }
      }
      console.log(`✅ schedule + ${biz.items.length} items`);
    } else {
      console.log(`✅ schedule only`);
    }

    updated++;
  }

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`✅ Done: ${updated} updated, ${skipped} skipped (slug not in DB), ${errors} errors`);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
