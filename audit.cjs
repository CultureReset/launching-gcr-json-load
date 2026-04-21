#!/usr/bin/env node
/**
 * GCR Site Audit — uses Claude Haiku to check every page and API endpoint.
 * Run: node audit.js
 *
 * Requires: ANTHROPIC_API_KEY in env, and a local or live URL to test against.
 * Set SITE_URL env var to your local dev server (default: https://gulfcoastradar.com)
 * Set API_URL  env var to the API base          (default: https://cybercheck-api-database.vercel.app)
 */

const Anthropic = require('/Users/owner/cybercheck-api-database/node_modules/@anthropic-ai/sdk');
const https = require('https');
const http  = require('http');
const path  = require('path');
const fs    = require('fs');

const SITE_URL = (process.env.SITE_URL || 'https://gulfcoastradar.com').replace(/\/$/, '');
const API_URL  = (process.env.API_URL  || 'https://cybercheck-api-database.vercel.app').replace(/\/$/, '');
const LOCAL_DIR = __dirname;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Colour helpers ────────────────────────────────────────────────────────────
const G = s => `\x1b[32m${s}\x1b[0m`;   // green
const R = s => `\x1b[31m${s}\x1b[0m`;   // red
const Y = s => `\x1b[33m${s}\x1b[0m`;   // yellow
const B = s => `\x1b[34m${s}\x1b[0m`;   // blue (dim)
const W = s => `\x1b[1m${s}\x1b[0m`;    // bold

// ── HTTP fetch (plain Node, no deps beyond sdk) ───────────────────────────────
function fetchUrl(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, {
      method:  opts.method  || 'GET',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'GCR-Audit/1.0', ...(opts.headers || {}) },
      timeout: 15000,
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

// ── Ask Haiku ─────────────────────────────────────────────────────────────────
async function askHaiku(systemPrompt, userContent) {
  const msg = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: userContent }],
  });
  return msg.content[0].text.trim();
}

// ── Results store ─────────────────────────────────────────────────────────────
const results = { pass: [], warn: [], fail: [] };
function pass(label, note = '') { results.pass.push({ label, note }); console.log(`  ${G('✓')} ${label}${note ? ' — '+B(note) : ''}`); }
function warn(label, note = '') { results.warn.push({ label, note }); console.log(`  ${Y('⚠')} ${label}${note ? ' — '+Y(note) : ''}`); }
function fail(label, note = '') { results.fail.push({ label, note }); console.log(`  ${R('✗')} ${label}${note ? ' — '+R(note) : ''}`); }

// ─────────────────────────────────────────────────────────────────────────────
// CHECK 1 — Local HTML files: structure checks (no HTTP needed)
// ─────────────────────────────────────────────────────────────────────────────
function checkLocalPages() {
  console.log(`\n${W('── 1. Local HTML Structure')}`);

  const LISTING_PAGES = [
    { file: 'restaurants.html',   cat: 'restaurants'   },
    { file: 'coffee-sweets.html', cat: 'coffee-sweets' },
    { file: 'happy-hours.html',   cat: 'happy-hours'   },
    { file: 'things-to-do.html',  cat: 'things-to-do'  },
    { file: 'services.html',      cat: 'services'       },
    { file: 'events.html',        cat: 'events'         },
    { file: 'public-spots.html',  cat: 'public-spots'  },
  ];
  const ALL_PAGES = LISTING_PAGES.map(p => p.file).concat([
    'index3.html', 'search.html', 'profile.html', 'feed.html',
    'nightlife.html', 'shopping.html', 'specials.html',
  ]);

  // Favicon on every page
  for (const file of ALL_PAGES) {
    const fp = path.join(LOCAL_DIR, file);
    if (!fs.existsSync(fp)) { warn(`${file}`, 'file not found locally'); continue; }
    const html = fs.readFileSync(fp, 'utf8');
    if (!html.includes('rel="icon"')) fail(`${file} — missing favicon`);
    else pass(`${file} — favicon present`);
  }

  // Listing-page specific checks
  for (const { file, cat } of LISTING_PAGES) {
    const fp = path.join(LOCAL_DIR, file);
    if (!fs.existsSync(fp)) continue;
    const html = fs.readFileSync(fp, 'utf8');

    // Script order: gcr-api → app → gcr-listings — check only <script src= tags
    const scriptTags = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m => m[1]);
    const apiIdx      = scriptTags.findIndex(s => s.includes('gcr-api.js'));
    const appIdx      = scriptTags.findIndex(s => s.includes('app.js') && !s.includes('listings') && !s.includes('claim') && !s.includes('config'));
    const listingsIdx = scriptTags.findIndex(s => s.includes('gcr-listings.js'));
    const configIdx   = scriptTags.findIndex(s => s.includes('gcr-config.js'));

    if (apiIdx === -1)             fail(`${file} — missing gcr-api.js`);
    else if (appIdx === -1)        fail(`${file} — missing app.js`);
    else if (listingsIdx === -1)   fail(`${file} — missing gcr-listings.js`);
    else if (apiIdx > appIdx)      fail(`${file} — gcr-api.js must come before app.js`);
    else if (appIdx > listingsIdx) fail(`${file} — app.js must come before gcr-listings.js`);
    else                           pass(`${file} — script order correct`);

    const configTagMatch = html.match(/<script[^>]+gcr-config\.js[^>]*data-category="([^"]+)"/);
    if (!configTagMatch)                      fail(`${file} — missing gcr-config.js`);
    else if (configTagMatch[1] === cat)       pass(`${file} — gcr-config data-category="${cat}"`);
    else fail(`${file} — gcr-config data-category="${configTagMatch[1]}" (expected "${cat}")`);
    const _ = configIdx; // suppress unused warning

    // listingsGrid data-category
    if (file !== 'events.html' && file !== 'public-spots.html') {
      if (html.includes(`data-category="${cat}"`)) pass(`${file} — listingsGrid data-category="${cat}"`);
      else fail(`${file} — listingsGrid data-category wrong`);
    }

    // No hardcoded active class on nav tabs
    const activeMatch = html.match(/gcr-cat-tab active/g);
    if (activeMatch && activeMatch.length > 0) warn(`${file} — hardcoded active class on nav tab`);
  }

  // og:image absolute URL on homepage
  const indexPath = path.join(LOCAL_DIR, 'index3.html');
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf8');
    const ogMatch = html.match(/og:image.*content="([^"]+)"/);
    if (ogMatch && ogMatch[1].startsWith('http')) pass('index3.html — og:image is absolute URL');
    else fail('index3.html — og:image must be an absolute URL for social sharing');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK 2 — API Endpoints
// ─────────────────────────────────────────────────────────────────────────────
async function checkAPIs() {
  console.log(`\n${W('── 2. API Endpoints')}`);

  const endpoints = [
    { label: 'GET /api/gcr/entities',    url: `${API_URL}/api/gcr/entities?limit=5`,  expectKey: 'entities' },
    { label: 'GET /api/gcr/happy-hours', url: `${API_URL}/api/gcr/happy-hours`,        expectArray: true  },
    { label: 'GET /api/gcr/events',      url: `${API_URL}/api/gcr/events`,             expectArray: true  },
    { label: 'GET /api/gcr/specials',    url: `${API_URL}/api/gcr/specials`,           expectArray: true  },
  ];

  for (const ep of endpoints) {
    try {
      const { status, body } = await fetchUrl(ep.url);
      if (status !== 200) { fail(ep.label, `HTTP ${status}`); continue; }
      const data = JSON.parse(body);
      if (ep.expectKey && !Array.isArray(data[ep.expectKey])) { fail(ep.label, `expected data.${ep.expectKey} array`); continue; }
      const arr = ep.expectKey ? data[ep.expectKey] : (Array.isArray(data) ? data : []);
      const count = arr.length;
      pass(ep.label, `${count} records`);
    } catch (e) {
      fail(ep.label, e.message);
    }
  }

  // POST search
  try {
    const { status, body } = await fetchUrl(`${API_URL}/api/gcr/search`, {
      method: 'POST',
      body:   JSON.stringify({ query: 'seafood' }),
    });
    if (status !== 200) { fail('POST /api/gcr/search', `HTTP ${status}`); }
    else {
      const data = JSON.parse(body);
      const count = (data.results || []).length;
      if (count > 0) pass('POST /api/gcr/search', `${count} results for "seafood"`);
      else warn('POST /api/gcr/search', 'returned 0 results for "seafood"');
    }
  } catch (e) {
    fail('POST /api/gcr/search', e.message);
  }

  // POST claim (dry run — check endpoint exists, not that it saves)
  try {
    const { status, body } = await fetchUrl(`${API_URL}/api/gcr/claim`, {
      method: 'POST',
      body:   JSON.stringify({
        business_name: '__audit_test__',
        category:      'restaurant',
        contact_name:  'Audit Bot',
        email:         'audit@gcr-test.invalid',
        phone:         '0000000000',
      }),
    });
    // 200 or 201 = endpoint exists and accepted
    if (status === 200 || status === 201) pass('POST /api/gcr/claim', 'endpoint live');
    else if (status === 400) pass('POST /api/gcr/claim', 'endpoint live (validation active)');
    else if (status === 404) warn('POST /api/gcr/claim', 'not deployed yet — deploy cybercheck-api-database');
    else fail('POST /api/gcr/claim', `HTTP ${status}`);
  } catch (e) {
    fail('POST /api/gcr/claim', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK 3 — Hidden flag: verify hidden businesses don't appear in public data
// ─────────────────────────────────────────────────────────────────────────────
async function checkHiddenFilter() {
  console.log(`\n${W('── 3. Hidden Business Filter')}`);
  try {
    const { status, body } = await fetchUrl(`${API_URL}/api/gcr/entities?limit=200`);
    if (status !== 200) { fail('Hidden filter check', `Could not fetch entities: HTTP ${status}`); return; }
    const parsed = JSON.parse(body);
    const entities = parsed.entities || parsed.businesses || (Array.isArray(parsed) ? parsed : []);
    const hidden = entities.filter(e => e.hidden === true || e.hidden === 1);
    if (hidden.length === 0) pass('Hidden filter', 'no hidden businesses exposed in /api/gcr/entities');
    else fail('Hidden filter', `${hidden.length} hidden business(es) returned by public API: ${hidden.map(e=>e.name).join(', ')}`);
  } catch (e) {
    fail('Hidden filter check', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK 4 — Haiku AI review of entity data quality
// ─────────────────────────────────────────────────────────────────────────────
async function checkDataQuality() {
  console.log(`\n${W('── 4. Data Quality (Haiku AI Review)')}`);
  try {
    const { status, body } = await fetchUrl(`${API_URL}/api/gcr/entities?limit=30`);
    if (status !== 200) { warn('Data quality', `Could not fetch entities: HTTP ${status}`); return; }
    const parsed = JSON.parse(body);
    const entities = parsed.entities || parsed.businesses || (Array.isArray(parsed) ? parsed : []);

    // Build a compact summary for Haiku to review
    const summary = entities.slice(0, 20).map(e => ({
      name:    e.name,
      type:    e.entity_subtype || e.type,
      city:    e.city,
      phone:   !!e.phone,
      image:   !!(e.hero_image_url || e.cover_url),
      tags:    (e.tags || []).length,
      desc:    !!e.description,
    }));

    const analysis = await askHaiku(
      'You are a data quality auditor for a local business directory on the Gulf Coast (Orange Beach / Gulf Shores, AL). Be concise and direct.',
      `Here is a sample of 20 business listings from the directory. Identify:
1. Any businesses with obviously wrong or missing data (no image, no phone, no tags, missing city)
2. Any business names that look like test data or placeholders
3. Any business types that seem wrong for the Gulf Coast area
4. Overall data quality score (0-100)

Data:
${JSON.stringify(summary, null, 2)}

Reply in this exact format:
SCORE: [0-100]
ISSUES:
- [issue 1]
- [issue 2]
(list up to 5 real issues only, say "None found" if clean)
SUMMARY: [one sentence]`
    );

    const scoreMatch = analysis.match(/SCORE:\s*(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const issuesMatch = analysis.match(/ISSUES:([\s\S]*?)SUMMARY:/);
    const issues = issuesMatch ? issuesMatch[1].trim() : '';
    const summaryMatch = analysis.match(/SUMMARY:\s*(.+)/);
    const summaryText = summaryMatch ? summaryMatch[1] : '';

    if (score >= 75) pass(`Data quality score: ${score}/100`, summaryText);
    else if (score >= 50) warn(`Data quality score: ${score}/100`, summaryText);
    else fail(`Data quality score: ${score}/100`, summaryText);

    if (issues && !issues.includes('None found')) {
      issues.split('\n').filter(l => l.trim().startsWith('-')).forEach(issue => {
        warn('  ' + issue.trim());
      });
    }
  } catch (e) {
    warn('Data quality check', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK 5 — Search result relevance (Haiku checks if results make sense)
// ─────────────────────────────────────────────────────────────────────────────
async function checkSearchRelevance() {
  console.log(`\n${W('── 5. Search Relevance (Haiku AI Review)')}`);
  const queries = ['seafood', 'happy hour', 'boat rental', 'coffee'];

  for (const q of queries) {
    try {
      const { status, body } = await fetchUrl(`${API_URL}/api/gcr/search`, {
        method: 'POST',
        body:   JSON.stringify({ query: q }),
      });
      if (status !== 200) { fail(`Search "${q}"`, `HTTP ${status}`); continue; }
      const data = JSON.parse(body);
      const results = (data.results || []).slice(0, 5).map(r => ({ name: r.name, type: r.entity_subtype }));

      if (!results.length) { warn(`Search "${q}"`, 'no results'); continue; }

      const verdict = await askHaiku(
        'You are checking if a Gulf Coast business directory search returns relevant results. Be very brief.',
        `Query: "${q}"
Top results: ${results.map(r => `${r.name} (${r.type})`).join(', ')}

Are these results relevant to the query? Reply with one of: RELEVANT / MIXED / IRRELEVANT
Then one short sentence why.`
      );

      const isRelevant  = verdict.startsWith('RELEVANT');
      const isMixed     = verdict.startsWith('MIXED');
      const note = verdict.split('\n').slice(1).join(' ').trim() || verdict;
      if (isRelevant)  pass(`Search "${q}"`, note.substring(0, 80));
      else if (isMixed) warn(`Search "${q}"`, note.substring(0, 80));
      else              fail(`Search "${q}"`, note.substring(0, 80));
    } catch (e) {
      fail(`Search "${q}"`, e.message);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(W('\n╔══════════════════════════════════════════════╗'));
  console.log(W('║   Gulf Coast Radar — Full Site Audit         ║'));
  console.log(W('╚══════════════════════════════════════════════╝'));
  console.log(`Site : ${B(SITE_URL)}`);
  console.log(`API  : ${B(API_URL)}`);
  console.log(`Model: ${B('claude-haiku-4-5-20251001')}\n`);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(Y('⚠  ANTHROPIC_API_KEY not set — AI checks (4 & 5) will be skipped.\n'));
  }

  checkLocalPages();
  await checkAPIs();
  await checkHiddenFilter();

  if (process.env.ANTHROPIC_API_KEY) {
    await checkDataQuality();
    await checkSearchRelevance();
  }

  // ── Final report ──────────────────────────────────────────────────────────
  const total = results.pass.length + results.warn.length + results.fail.length;
  console.log('\n' + W('── Report ─────────────────────────────────────'));
  console.log(`  ${G('✓ Passed')}  : ${results.pass.length}`);
  console.log(`  ${Y('⚠ Warnings')}: ${results.warn.length}`);
  console.log(`  ${R('✗ Failed')} : ${results.fail.length}`);
  console.log(`  Total    : ${total}`);

  if (results.fail.length) {
    console.log(`\n${R('Failed checks:')}`);
    results.fail.forEach(f => console.log(`  ${R('✗')} ${f.label}${f.note ? ' — '+f.note : ''}`));
  }
  if (results.warn.length) {
    console.log(`\n${Y('Warnings:')}`);
    results.warn.forEach(w => console.log(`  ${Y('⚠')} ${w.label}${w.note ? ' — '+w.note : ''}`));
  }

  const exitCode = results.fail.length > 0 ? 1 : 0;
  console.log(exitCode === 0
    ? `\n${G('✓ All checks passed!')}\n`
    : `\n${R('✗ Some checks failed — see above.')}\n`
  );
  process.exit(exitCode);
}

main().catch(err => { console.error(R('Fatal error: ' + err.message)); process.exit(1); });
