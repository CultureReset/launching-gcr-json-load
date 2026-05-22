#!/usr/bin/env node
/**
 * GCR UI/UX Review Agent
 * Launches ALL pages in PARALLEL with Haiku agents
 * Auto-discovers .html files in directory
 * Run: node review-uiux.js
 * Output: uiux-report.md
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ROOT = __dirname;
const GCR_API = 'https://gcr-api-gules.vercel.app/api/gcr';

// Auto-discover all .html files in root
function discoverPages() {
  const files = fs.readdirSync(ROOT)
    .filter(f => f.endsWith('.html'))
    .sort();

  return files.map(file => ({
    file,
    name: file.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    category: null
  }));
}

const PAGES = discoverPages();

function readFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

async function fetchApiSample() {
  try {
    const res = await fetch(`${GCR_API}/entities?limit=5`);
    if (!res.ok) return `API returned ${res.status}`;
    const data = await res.json();
    const businesses = data.entities || data.businesses || [];
    return JSON.stringify(businesses.slice(0, 2), null, 2);
  } catch (e) {
    return `API fetch failed: ${e.message}`;
  }
}

async function reviewPage(page, sharedContext, apiSample) {
  const html = readFile(page.file);
  if (!html) return { page, error: `file not found: ${page.file}` };

  const prompt = `You are a senior UI/UX engineer auditing the Gulf Coast Radar (GCR) web app — a beach/tourist guide for Orange Beach & Gulf Shores, Alabama.

## Page: ${page.name} (${page.file})

## Live API Sample:
\`\`\`json
${apiSample}
\`\`\`

## Shared JS context (gcr-api.js + gcr-listings.js):
${sharedContext}

## Full HTML of this page:
\`\`\`html
${html.slice(0, 18000)}
\`\`\`

## Your audit — be SPECIFIC with line numbers:

1. **Data Loading** — Does it call GCR.load()? Listen for gcr:loaded? Will data actually load and render?

2. **Layout** — Header, nav, filter chips, listing grid, footer present? Empty containers or missing IDs?

3. **Filter Chips** — Present? Do data-filter values match API tags?

4. **Card Rendering** — Will cards render with live data? Check field names (name, description, images, address, rating).

5. **Missing Features** — What's incomplete, placeholder, or hardcoded that should be dynamic?

6. **Responsive Issues** — Any obvious mobile/tablet problems?

7. **Broken Code** — JS errors, undefined vars, missing scripts, broken logic?

8. **Top 3 Fixes** — Priority things to fix first.

Use markdown with clear sections. Be direct.`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    return { page, text };
  } catch (e) {
    return { page, error: e.message };
  }
}

async function main() {
  console.log('🚀 GCR UI/UX Review — Parallel Haiku Agents');
  console.log('==========================================\n');

  // Load shared context
  console.log('📖 Loading shared files...');
  const gcrApi    = (readFile('js/gcr-api.js')      || '').slice(0, 4000);
  const gcrList   = (readFile('js/gcr-listings.js') || '').slice(0, 3000);
  const appJs     = (readFile('js/app.js')           || '').slice(0, 2000);
  const styles    = (readFile('css/styles.css')      || '').slice(0, 2000);

  const sharedContext = `
=== gcr-api.js (first 4000 chars) ===
${gcrApi}

=== gcr-listings.js (first 3000 chars) ===
${gcrList}

=== app.js (first 2000 chars) ===
${appJs}

=== styles.css (first 2000 chars) ===
${styles}
`.trim();

  console.log('🌐 Fetching live API sample...');
  const apiSample = await fetchApiSample();

  console.log(`\n🎯 Launching ${PAGES.length} Haiku agents in PARALLEL...\n`);
  const start = Date.now();

  // ===== ALL AGENTS RUN AT ONCE =====
  const allResults = await Promise.all(
    PAGES.map(page => reviewPage(page, sharedContext, apiSample))
  );

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`✅ All agents completed in ${elapsed}s\n`);

  // Build report
  const sections = [];
  sections.push(`# GCR UI/UX Audit Report

**Generated:** ${new Date().toLocaleString()}
**Pages reviewed:** ${PAGES.length}
**API:** ${GCR_API}
**Model:** Haiku (all agents in parallel)
**Time:** ${elapsed}s

---

`);

  allResults.forEach(result => {
    if (result.error) {
      sections.push(`## ${result.page.name} \`${result.page.file}\`\n\n❌ Error: ${result.error}\n\n`);
    } else {
      sections.push(`## ${result.page.name} \`${result.page.file}\`\n\n${result.text}\n\n`);
    }
  });

  const report = sections.join('');
  const outPath = path.join(ROOT, 'uiux-report.md');
  fs.writeFileSync(outPath, report);

  console.log(`📄 Report saved: uiux-report.md (${(report.length / 1024).toFixed(1)} KB)`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
