#!/usr/bin/env node
/**
 * convert-happy-hours.js
 * Scans ALL gcr-directory-v2 and legacy data files for happy hour info.
 * Merges both formats and outputs happy_hour_upload.csv ready for Supabase.
 *
 * Run: node convert-happy-hours.js
 * Output: happy_hour_upload.csv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Paths to scan ──────────────────────────────────────────────
const DIRS = [
  '/Users/owner/build-main/gcr-directory-v2',
  '/Users/owner/build-main/gcr-directory',
];

const LEGACY_FILES = [
  '/Users/owner/build-main/tools/pulled-data/by-business/cobalt-restaurant/legacy_gcr-data-complete__happy-hour-businesses.json',
  '/Users/owner/build-main/tools/pulled-data/by-business/cobalt-restaurant/GCR-Cobalt-Demo_data__happy-hour-data.json',
  '/Users/owner/build-main/tools/pulled-data/by-business/cobalt-restaurant/repos_GCRHotMessvTrea__happy-hour-businesses.json',
  '/Users/owner/build-main/tools/pulled-data/by-business/lulus/Downloads_Business_json_files___Lulus_Gulf_Shores_happyhour_specials.json',
];

// ── Parse schedule string → { days, start, end } ──────────────
function parseSchedule(schedule) {
  if (!schedule) return { days: '', start: '', end: '' };
  const s = schedule.replace(/\u2013|\u2014/g, '-').replace(/\u00a0/g, ' ').trim();

  // Patterns like "Daily 4:00 PM - 6:00 PM" or "Mon-Fri 3 PM–5 PM"
  const fullMatch = s.match(/^(.+?)\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)$/i);
  if (fullMatch) {
    return {
      days: cleanDays(fullMatch[1].trim()),
      start: normalizeTime(fullMatch[2].trim()),
      end:   normalizeTime(fullMatch[3].trim()),
    };
  }

  // "Weekday afternoons (times vary seasonally; recent posts show 3–6 PM or 2–6 PM)"
  const weekdayMatch = s.match(/weekday/i);
  if (weekdayMatch) {
    const times = s.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i);
    return {
      days:  'Mon-Fri',
      start: times ? normalizeTime(times[1]) : '',
      end:   times ? normalizeTime(times[2]) : '',
    };
  }

  // Just a time range with no day prefix
  const rangeOnly = s.match(/^(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)$/i);
  if (rangeOnly) {
    return { days: 'Daily', start: normalizeTime(rangeOnly[1]), end: normalizeTime(rangeOnly[2]) };
  }

  // Fallback — store whole string as days
  return { days: s.slice(0, 100), start: '', end: '' };
}

function cleanDays(d) {
  const map = { daily: 'Daily', everyday: 'Daily', 'mon-fri': 'Mon-Fri', 'monday-friday': 'Mon-Fri',
                weekdays: 'Mon-Fri', weekday: 'Mon-Fri', 'mon-sat': 'Mon-Sat',
                'mon-sun': 'Daily', 'sunday-thursday': 'Sun-Thu', 'sun-thu': 'Sun-Thu' };
  const lower = d.toLowerCase().replace(/\s+/g, '-');
  return map[lower] || d;
}

function normalizeTime(t) {
  if (!t) return '';
  // "4 PM" → "4:00 PM", "4:00PM" → "4:00 PM"
  return t.replace(/(\d)(AM|PM)/i, '$1 $2').replace(/(\d{1,2}:\d{2})\s*(AM|PM)/i, '$1 $2').trim();
}

// ── Extract price from item name like "Cheese Pizza $8" ────────
function extractPrice(name) {
  const m = (name || '').match(/\$(\d+(?:\.\d+)?)/);
  return m ? '$' + m[1] : '';
}
function stripPrice(name) {
  return (name || '').replace(/\s*\$\d+(?:\.\d+)?/, '').trim();
}

// ── CSV escape ─────────────────────────────────────────────────
function csv(...fields) {
  return fields.map(f => {
    const s = String(f == null ? '' : f).replace(/\r?\n/g, ' ').trim();
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? '"' + s.replace(/"/g, '""') + '"'
      : s;
  }).join(',');
}

// ── Collect rows ───────────────────────────────────────────────
const rows = []; // { slug, hh_days, hh_start, hh_end, hh_description, section_name, item_name, description, regular_price, hh_price, price_text }
const seen = new Set(); // track slug+item pairs to avoid exact dupes

function addRows(slug, hhDays, hhStart, hhEnd, hhDesc, items, sectionName = 'Happy Hour', sourceDate = '') {
  if (!slug) return;

  // If no items, emit one header row so the schedule still shows up
  if (!items || !items.length) {
    const key = slug + '|' + hhDays;
    if (!seen.has(key)) {
      seen.add(key);
      rows.push({ slug, hh_days: hhDays, hh_start: hhStart, hh_end: hhEnd, hh_description: hhDesc,
                  section_name: '', item_name: '', description: '', regular_price: '', hh_price: '', price_text: '', source_date: sourceDate });
    }
    return;
  }

  items.forEach(item => {
    const itemName = stripPrice(item.name || item.item || item.item_name || '');
    const key = slug + '|' + itemName.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const rawPrice = extractPrice(item.name || item.item_name || '');
    const hhPrice  = item.hh_price || item.price || rawPrice || '';
    const priceText = item.price_text || (hhPrice ? hhPrice : '');

    rows.push({
      slug,
      hh_days:       hhDays,
      hh_start:      hhStart,
      hh_end:        hhEnd,
      hh_description: hhDesc || '',
      section_name:  item.category || item.type || sectionName || 'Happy Hour',
      item_name:     itemName,
      description:   item.description || '',
      regular_price: item.regular_price || '',
      hh_price:      typeof hhPrice === 'number' ? '$' + hhPrice : hhPrice,
      price_text:    priceText,
      source_date:   sourceDate,
    });
  });
}

function fileDate(filePath) {
  try { return fs.statSync(filePath).mtime.toISOString().split('T')[0]; } catch { return ''; }
}

// ── Process a single data.json (gcr-directory-v2 format) ──────
function processDataJson(filePath) {
  let data;
  try { data = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return; }

  const slug = data.slug || path.basename(path.dirname(filePath));
  const srcDate = fileDate(filePath);

  // New format: data.happy_hour.schedule + data.happy_hour.deals
  if (data.happy_hour && (data.happy_hour.schedule || data.happy_hour.deals)) {
    const { days, start, end } = parseSchedule(data.happy_hour.schedule || '');
    const desc = data.happy_hour.description || data.happy_hour.notes || '';
    const items = data.happy_hour.deals || data.happy_hour.items || [];
    addRows(slug, days, start, end, desc, items, 'Happy Hour', srcDate);
    return;
  }

  // Old format embedded in data.json: data.happyHour + data.happyHourSpecials
  if (data.happyHour || data.happyHourSpecials) {
    const { days, start, end } = parseSchedule(typeof data.happyHour === 'string' ? data.happyHour : '');
    addRows(slug, days, start, end, '', data.happyHourSpecials || [], 'Happy Hour', srcDate);
  }
}

// ── Recursively find all data.json files ──────────────────────
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'data.json') processDataJson(full);
  });
}

// ── Process legacy array files (array of business objects) ────
function processLegacyFile(filePath) {
  let data;
  try { data = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return; }

  const list = Array.isArray(data) ? data : [data];
  const srcDate = fileDate(filePath);
  list.forEach(biz => {
    if (!biz.happyHour && !biz.happyHourSpecials && !biz.happy_hour) return;

    const slug = biz.slug || biz.id || (biz.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    if (biz.happyHour || biz.happyHourSpecials) {
      const { days, start, end } = parseSchedule(typeof biz.happyHour === 'string' ? biz.happyHour : '');
      addRows(slug, days, start, end, '', biz.happyHourSpecials || [], 'Happy Hour', srcDate);
    }
    if (biz.happy_hour && (biz.happy_hour.schedule || biz.happy_hour.deals)) {
      const { days, start, end } = parseSchedule(biz.happy_hour.schedule || '');
      addRows(slug, days, start, end, biz.happy_hour.description || '', biz.happy_hour.deals || [], 'Happy Hour', srcDate);
    }
  });
}

// ── Process Lulu's special CSV format ─────────────────────────
function processLulusFile(filePath) {
  let data;
  try { data = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return; }
  if (!Array.isArray(data)) return;

  const hhEntries = data.filter(r => (r.Type || '').toLowerCase().includes('happy hour'));
  const srcDate = fileDate(filePath);
  hhEntries.forEach(r => {
    const slug = (r.Restaurant || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/['']/g, '').replace(/^-|-$/g, '');
    const { days, start, end } = parseSchedule(r['Days/Times'] || '');
    const details = r.Details || '';
    const verifiedAt = r['Verified At'] ? r['Verified At'].split('T')[0] : srcDate;
    const items = details.split(/,\s*/).map(d => ({
      name: stripPrice(d.trim()),
      price_text: extractPrice(d),
      description: d.trim(),
    })).filter(i => i.name);
    addRows(slug, days, start, end, details, items.length ? items : [], 'Happy Hour', verifiedAt);
  });
}

// ── Run ───────────────────────────────────────────────────────
console.log('Scanning gcr-directory-v2 and gcr-directory...');
DIRS.forEach(walk);

console.log('Processing legacy files...');
LEGACY_FILES.forEach(f => {
  if (f.includes('lulus')) processLulusFile(f);
  else processLegacyFile(f);
});

// Also scan gcr-directory raw happy hours files
const rawHHFiles = [
  '/Users/owner/build-main/gcr-directory/coffee-sweets/coffee-sweets/buzzcatz-coffee-sweets/raw/11_gcr-happy_hours-COMPLETE_json.json',
  '/Users/owner/build-main/gcr-directory/other/bars/cosmos-restaurant-and-bar/raw/1_gcr-happy_hours-COMPLETE_json.json',
  '/Users/owner/build-main/gcr-directory/other/other/the-beach-house-kitchen-cocktails/raw/1_gcr-happy_hours-COMPLETE_json.json',
  '/Users/owner/build-main/gcr-directory-cleaned/other/other/buzzcatz-coffee-sweets/raw/11_gcr-happy_hours-COMPLETE_json.json',
  '/Users/owner/build-main/gcr-directory-cleaned/other/other/cosmos-restaurant-and-bar/raw/1_gcr-happy_hours-COMPLETE_json.json',
];
rawHHFiles.forEach(processLegacyFile);

// ── Write CSV ─────────────────────────────────────────────────
const header = 'slug,hh_days,hh_start,hh_end,hh_description,section_name,item_name,description,regular_price,hh_price,price_text,item_image_url,source_date';
const lines = rows.map(r => csv(
  r.slug, r.hh_days, r.hh_start, r.hh_end, r.hh_description,
  r.section_name, r.item_name, r.description,
  r.regular_price, r.hh_price, r.price_text, '', r.source_date
));

const outPath = path.join(__dirname, 'happy_hour_upload.csv');
fs.writeFileSync(outPath, [header, ...lines].join('\n'));

// Summary
const uniqueSlugs = new Set(rows.map(r => r.slug));
const withItems = rows.filter(r => r.item_name).length;
console.log(`\n✅ Done!`);
console.log(`   Businesses: ${uniqueSlugs.size}`);
console.log(`   Total rows: ${rows.length} (${withItems} with items)`);
console.log(`   Output: happy_hour_upload.csv`);
console.log(`\nUpload this CSV in your admin dashboard → Happy Hours → Bulk Upload`);
