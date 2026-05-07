/* ============================================================
   gcr-master-card.js — Restaurant card renderer
   Vertical card layout matching card-preview.html design.
   Deduplicates multiple DB records for the same business,
   merges all data arrays, enriches from HH/specials/events.
   ============================================================ */

(function injectStyles() {
  if (document.getElementById('gcr-rc-styles')) return;
  const s = document.createElement('style');
  s.id = 'gcr-rc-styles';
  s.textContent = `
    .gcr-rc {
      background:#fff; border-radius:16px; overflow:hidden;
      box-shadow:0 2px 16px rgba(0,0,0,.1);
      width:100%;
      display:block; text-decoration:none; color:inherit; cursor:pointer;
      transition:transform .14s ease, box-shadow .14s ease;
    }
    .gcr-rc:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,.15); }
    .gcr-rc-img {
      height:220px; background-size:cover; background-position:center; position:relative;
    }
    .gcr-rc-badge {
      position:absolute; top:12px; left:12px;
      background:rgba(11,122,117,.88); color:#fff;
      padding:5px 12px; border-radius:999px; font-size:12px; font-weight:700;
    }
    .gcr-rc-status {
      position:absolute; top:12px; right:12px;
      padding:5px 12px; border-radius:999px; font-size:12px; font-weight:700;
    }
    .gcr-rc-status.open    { background:rgba(22,163,74,.88);  color:#fff; }
    .gcr-rc-status.closing { background:rgba(234,179,8,.88);  color:#fff; }
    .gcr-rc-status.opening { background:rgba(59,130,246,.88); color:#fff; }
    .gcr-rc-status.closed  { background:rgba(220,38,38,.78);  color:#fff; }
    .gcr-rc-img-badges {
      position:absolute; bottom:12px; left:12px; display:flex; gap:6px; flex-wrap:wrap;
    }
    .gcr-rc-img-badge {
      background:rgba(0,0,0,.52); color:#fff;
      padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700;
      backdrop-filter:blur(4px);
    }
    .gcr-rc-img-badge.music   { background:rgba(109,40,217,.78); }
    .gcr-rc-img-badge.water   { background:rgba(14,165,233,.78); }
    .gcr-rc-img-badge.outdoor { background:rgba(22,163,74,.72); }
    .gcr-rc-price {
      position:absolute; bottom:12px; right:12px;
      background:rgba(46,155,85,.92); color:#fff;
      padding:6px 12px; border-radius:999px; font-weight:800; font-size:13px;
    }
    .gcr-rc-body { padding:16px 18px 0; }
    .gcr-rc-name { font-size:17px; font-weight:800; color:#1a2b3c; }
    .gcr-rc-sub  { font-size:13px; color:#5c6b81; margin-top:2px; }
    .gcr-rc-desc {
      margin-top:8px; font-size:13px; color:#5c6b81; line-height:1.65;
      display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;
    }
    .gcr-rc-rating { display:flex; align-items:center; gap:6px; margin-top:8px; font-size:14px; font-weight:700; color:#1a2b3c; }
    .gcr-rc-stars  { color:#f59e0b; }
    .gcr-rc-tags   { margin-top:12px; display:flex; flex-direction:column; gap:8px; }
    .gcr-rc-tag-row { display:flex; flex-direction:column; gap:4px; }
    .gcr-rc-tag-label { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:#8fa3b1; padding:0 2px; }
    .gcr-rc-tag-scroll { display:flex; gap:6px; overflow-x:auto; padding-bottom:2px; scrollbar-width:none; }
    .gcr-rc-tag-scroll::-webkit-scrollbar { display:none; }
    .gcr-rc-chip { background:#f0f4f8; color:#42596c; padding:5px 11px; border-radius:999px; font-size:12px; font-weight:600; white-space:nowrap; flex-shrink:0; }
    .gcr-rc-chip.food    { background:#fff7ed; color:#c2410c; }
    .gcr-rc-chip.drink   { background:#fdf4ff; color:#7e22ce; }
    .gcr-rc-chip.vibe    { background:#f0fdf4; color:#15803d; }
    .gcr-rc-chip.service { background:#f0f9ff; color:#0369a1; }
    .gcr-rc-chip.other   { background:#f0f4f8; color:#42596c; }
    .gcr-rc-info { padding:10px 18px 0; display:flex; flex-direction:column; gap:5px; }
    .gcr-rc-info-row { font-size:13px; font-weight:600; }
    .gcr-rc-bottom { padding:12px 18px 16px; }
    .gcr-rc-addr { font-size:12px; color:#8fa3b1; margin-bottom:8px; }
    .gcr-rc-actions { display:flex; flex-wrap:wrap; gap:6px; }
    .gcr-rc-btn {
      padding:7px 13px; border-radius:8px; border:1px solid #d1dbe6;
      background:#fff; color:#1a2b3c; font-size:12px; font-weight:700;
      text-decoration:none; cursor:pointer; white-space:nowrap; font-family:inherit;
    }
    .gcr-rc-btn:hover { background:#f0f4f8; }
    .gcr-rc-btn.primary { background:#0b7a75; color:#fff; border-color:#0b7a75; }
    .gcr-rc-btn.hh      { background:#d97706; color:#fff; border-color:#d97706; }
    .gcr-rc-btn.reserve { background:#22c55e; color:#fff; border-color:#22c55e; }
    .gcr-rc-btn.order   { background:#f59e0b; color:#fff; border-color:#f59e0b; }
    .gcr-rc-hh-panel {
      display:none; border-top:1px solid #fde68a;
      background:#fffbeb; padding:14px 18px;
    }
    .gcr-rc-hh-panel.open { display:block; }
    .gcr-rc-hh-header { font-weight:800; font-size:14px; color:#92400e; margin-bottom:4px; }
    .gcr-rc-hh-time   { font-size:13px; color:#78350f; font-weight:600; margin-bottom:10px; }
    .gcr-rc-hh-desc   { font-size:13px; color:#92400e; margin-bottom:12px; line-height:1.5; }
    .gcr-rc-hh-items  { display:flex; flex-direction:column; gap:8px; }
    .gcr-rc-hh-item   {
      display:flex; justify-content:space-between; align-items:flex-start; gap:12px;
      background:#fff8e7; border-radius:10px; padding:10px 12px;
    }
    .gcr-rc-hh-item-info  { flex:1; }
    .gcr-rc-hh-item-name  { font-size:13px; font-weight:800; color:#78350f; }
    .gcr-rc-hh-item-desc  { font-size:12px; color:#92400e; margin-top:2px; line-height:1.4; }
    .gcr-rc-hh-item-price { font-size:14px; font-weight:800; color:#d97706; white-space:nowrap; }
  `;
  document.head.appendChild(s);
})();

// ── Helpers ───────────────────────────────────────────────────
function rcEsc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function rcStars(r) {
  const n = Math.round(r * 2) / 2;
  let s = '';
  for (let i = 1; i <= 5; i++) {
    s += i <= n ? '★' : (i - 0.5 === n ? '½' : '☆');
  }
  return s;
}

function rcFmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2,'0')} ${ap}` : `${h12}:00 ${ap}`;
}

function rcStatusBadge(hours) {
  if (!hours || !hours.length) return '';
  const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const now = new Date();
  const todayRow = hours.find(h => (h.day_of_week||'').toLowerCase() === DAYS[now.getDay()]);
  if (!todayRow) return '';
  if (todayRow.is_closed) return '<div class="gcr-rc-status closed">Closed Today</div>';
  if (todayRow.open_time && todayRow.close_time) {
    const toMins = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
    const n = now.getHours()*60+now.getMinutes();
    const o = toMins(todayRow.open_time);
    const c = toMins(todayRow.close_time);
    if (n < o-60)  return `<div class="gcr-rc-status closed">Opens ${rcFmtTime(todayRow.open_time)}</div>`;
    if (n < o)     return `<div class="gcr-rc-status opening">Opening Soon</div>`;
    if (n < c-60)  return `<div class="gcr-rc-status open">Open · Closes ${rcFmtTime(todayRow.close_time)}</div>`;
    if (n < c)     return `<div class="gcr-rc-status closing">Closing Soon</div>`;
    return `<div class="gcr-rc-status closed">Closed</div>`;
  }
  return '';
}

function rcHoursLine(hours) {
  if (!hours || !hours.length) return '';
  const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const row = hours.find(h => (h.day_of_week||'').toLowerCase() === DAYS[new Date().getDay()]);
  if (!row) return '';
  if (row.is_closed) return 'Closed Today';
  if (row.open_time && row.close_time) return `Today ${rcFmtTime(row.open_time)} – ${rcFmtTime(row.close_time)}`;
  return '';
}

// ── ID / matching helpers ─────────────────────────────────────
// Collect ALL possible identifiers from a record
function rcGetAllIds(record) {
  const ids = new Set();
  if (record.id) ids.add(record.id);
  if (record.site_id) ids.add(record.site_id);
  if (record.slug) ids.add(record.slug);
  if (record.subdomain) ids.add(record.subdomain);
  if (record.entity_id) ids.add(record.entity_id);
  if (record.entity_slug) ids.add(record.entity_slug);
  // Extract Google Place ID if in slug
  const slugMatch = (record.slug || record.entity_slug || '').match(/ChIJ[a-zA-Z0-9_-]+/);
  if (slugMatch) ids.add(slugMatch[0]);
  return ids;
}

// Normalize address for comparison
function rcNormAddress(addr) {
  if (!addr) return '';
  return addr.toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\brd\b|\brd\.\b/g, 'road')
    .replace(/\bst\b|\bst\.\b/g, 'street')
    .replace(/\bave\b|\bave\.\b/g, 'avenue')
    .replace(/\bblvd\b|\bblvd\.\b/g, 'boulevard')
    .trim();
}

// Check if two records match by ANY ID overlap OR address
function rcMatchesEntity(source, target) {
  const sourceIds = rcGetAllIds(source);
  const targetIds = rcGetAllIds(target);

  // Try ID matching first
  for (let id of sourceIds) {
    if (id && targetIds.has(id)) return true;
  }

  // Fallback: match by normalized address
  const sourceAddr = rcNormAddress(source.address_line_1 || source.address || '');
  const targetAddr = rcNormAddress(target.address_line_1 || target.address || '');
  if (sourceAddr && targetAddr && sourceAddr === targetAddr) return true;

  // Also try matching by name (as last resort for same business, different branch)
  const sourceName = (source.name || '').toLowerCase().trim();
  const targetName = (target.name || '').toLowerCase().trim();
  if (sourceName && targetName && sourceName === targetName && sourceAddr) return true;

  return false;
}

// ── Merge duplicate records for same business ─────────────────
function rcMergeGroup(group) {
  const primary = group.find(e => (e.slug||e.subdomain||'').includes('ChIJ')) ||
    group.reduce((b,e) => ((e.rating||0)>(b.rating||0)?e:b), group[0]);

  const seenTag = new Set();
  const tags = [];
  group.forEach(e => (e.tags||[]).forEach(t => {
    const str = typeof t === 'string' ? t : (t.tag||'');
    if (str && !seenTag.has(str)) { seenTag.add(str); tags.push(t); }
  }));

  const seenPhoto = new Set();
  const photos = [];
  group.forEach(e => (e.photos||[]).forEach(p => {
    const u = p.image_url||p.url||'';
    if (u && !seenPhoto.has(u)) { seenPhoto.add(u); photos.push(p); }
  }));

  function mergeSections(field) {
    const seen = new Set(); const r = [];
    group.forEach(e => (e[field]||[]).forEach(s => {
      const k = (s.section_name||s.name||s.type||JSON.stringify(s)).toLowerCase();
      if (!seen.has(k)) { seen.add(k); r.push(s); }
    }));
    return r;
  }

  function mergeFlat(field) {
    const seen = new Set(); const r = [];
    group.forEach(e => (e[field]||[]).forEach(i => {
      const k = (typeof i==='string' ? i : (i.label||i.name||'')).toLowerCase();
      if (k && !seen.has(k)) { seen.add(k); r.push(i); }
    }));
    return r;
  }

  function best(field) {
    return primary[field] || group.reduce((v,e) => v||e[field], '') || '';
  }

  function mergeText(field) {
    const vals = [];
    const seen = new Set();
    group.forEach(e => {
      const v = (e[field] || '').trim();
      if (v && !seen.has(v.toLowerCase())) {
        seen.add(v.toLowerCase());
        vals.push(v);
      }
    });
    return vals.length ? vals.join(' • ') : '';
  }

  return Object.assign({}, primary, {
    tags, photos,
    description:     mergeText('description'),
    address_line_1:  best('address_line_1') || best('address'),
    phone:           best('phone'),
    website:         best('website') || best('website_url'),
    directions_url:  best('directions_url'),
    menu_url:        best('menu_url'),
    booking_url:     best('booking_url'),
    reservation_url: best('reservation_url'),
    order_url:       best('order_url'),
    hh_days:         best('hh_days'),
    hh_start:        best('hh_start'),
    hh_end:          best('hh_end'),
    hh_description:  mergeText('hh_description'),
    hours: primary.hours?.length ? primary.hours : (group.find(e=>e.hours?.length)||{}).hours||[],
    hh_sections:         mergeSections('hh_sections'),
    happy_hour_sections: mergeSections('happy_hour_sections'),
    menu_sections:       mergeSections('menu_sections'),
    drink_sections:      mergeSections('drink_sections'),
    features:            mergeFlat('features'),
    perfect_for:         mergeFlat('perfect_for'),
    site_id:   best('site_id'),
    subdomain: best('subdomain'),
  });
}

// ── Enrich from GCR.happyHours / specials / events ────────────
function rcEnrich(entity) {
  const e = { ...entity };
  const gcr = window.GCR || {};

  const hhBiz = (gcr.happyHours||[]).find(hh => rcMatchesEntity(hh, e));
  if (hhBiz) {
    e.hh_days        = e.hh_days        || hhBiz.hh_days;
    e.hh_start       = e.hh_start       || hhBiz.hh_start;
    e.hh_end         = e.hh_end         || hhBiz.hh_end;
    e.hh_description = e.hh_description || hhBiz.hh_description;
    if (hhBiz.hh_sections?.length) e.hh_sections = e.hh_sections?.length ? e.hh_sections : hhBiz.hh_sections;
    if (!e.photos?.length && hhBiz.photos?.length) e.photos = hhBiz.photos;
    if (!e.hours?.length  && hhBiz.hours?.length)  e.hours  = hhBiz.hours;
    if (!e.phone && hhBiz.phone) e.phone = hhBiz.phone;
  }
  e._specials = (gcr.specials||[]).filter(sp => rcMatchesEntity(sp, e));
  e._events   = (gcr.events||[]).filter(ev => rcMatchesEntity(ev, e));
  return e;
}

// ── Group duplicate records ───────────────────────────────────
function rcBuildGroups(entities) {
  const groups = [];
  const assignedIds = new Set();

  entities.forEach(entity => {
    const entityIds = rcGetAllIds(entity);
    const firstId = Array.from(entityIds)[0];

    if (!firstId || assignedIds.has(firstId)) return;

    const group = entities.filter(o => {
      if (!o) return false;
      return rcMatchesEntity(entity, o);
    });

    group.forEach(g => {
      rcGetAllIds(g).forEach(id => assignedIds.add(id));
    });

    groups.push(group);
  });

  return groups;
}

// ── Build one vertical card ───────────────────────────────────
function buildRcCard(entity) {
  const slug    = entity.slug || entity.subdomain || entity.id || '';
  const name    = entity.name || 'Business';
  const icon    = entity.icon || entity.emoji || '🍽️';
  const sub     = entity.subtitle || entity.tagline || '';
  const subtype = (entity.entity_subtype || entity.type || '').replace(/_/g,' ');
  const city    = entity.city || '';
  const state   = entity.state || '';
  const desc    = entity.description || '';
  const rating  = entity.rating || 0;
  const reviews = entity.review_count || entity.reviewCount || 0;
  const addr    = entity.address_line_1 || entity.address || '';
  const fullAddr = [addr, city, state].filter(Boolean).join(', ');
  const location = [city, state].filter(Boolean).join(', ');
  const price   = entity.priceRange || entity.price_range || '';

  // Hero image
  const coverPhoto = (entity.photos||[]).find(p => p.is_cover) || (entity.photos||[])[0];
  const hero = (coverPhoto && (coverPhoto.image_url||coverPhoto.url)) ||
               entity.hero_image_url || entity.cover_url ||
               'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80';

  // Status badge
  const statusBadge = rcStatusBadge(entity.hours || []);

  // Tags grouped by category
  const tagBuckets = { food:[], drink:[], vibe:[], service:[], other:[] };
  const tagStrs = [];
  const seenTag = new Set();
  (entity.tags||[]).forEach(t => {
    const str = typeof t === 'string' ? t : (t.tag||'');
    if (!str || seenTag.has(str)) return;
    seenTag.add(str);
    tagStrs.push(str.toLowerCase().replace(/[\s\-]+/g,'_'));
    const cat = (typeof t === 'object' ? (t.tag_category||'') : '').toLowerCase();
    const label = str.replace(/[_\-]+/g,' ').replace(/\b\w/g,l=>l.toUpperCase());
    const chip = `<span class="gcr-rc-chip ${cat||'other'}">${rcEsc(label)}</span>`;
    if (cat === 'food')         tagBuckets.food.push(chip);
    else if (cat === 'drink')   tagBuckets.drink.push(chip);
    else if (cat === 'vibe')    tagBuckets.vibe.push(chip);
    else if (cat === 'service') tagBuckets.service.push(chip);
    else                        tagBuckets.other.push(chip);
  });

  const hasLiveMusic  = tagStrs.some(t => t.includes('live_music'));
  const hasWaterfront = tagStrs.some(t => t.includes('waterfront'));
  const hasOutdoor    = tagStrs.some(t => t.includes('outdoor'));

  // Image badges
  const imgBadges = [
    hasLiveMusic  ? '<span class="gcr-rc-img-badge music">🎸 Live Music</span>'   : '',
    hasWaterfront ? '<span class="gcr-rc-img-badge water">🌊 Waterfront</span>'   : '',
    hasOutdoor    ? '<span class="gcr-rc-img-badge outdoor">🌿 Outdoor</span>'    : '',
  ].filter(Boolean).join('');

  // Tag section rows
  function tagRow(label, chips) {
    if (!chips.length) return '';
    return `<div class="gcr-rc-tag-row">
      <div class="gcr-rc-tag-label">${label}</div>
      <div class="gcr-rc-tag-scroll">${chips.join('')}</div>
    </div>`;
  }

  const tagSections = [
    tagRow('Food',            tagBuckets.food),
    tagRow('Drinks',          tagBuckets.drink),
    tagRow('Vibe & Amenities',tagBuckets.vibe),
    tagRow('Service',         tagBuckets.service),
    tagRow('More',            tagBuckets.other),
  ].filter(Boolean).join('');

  // Info rows
  const hoursLine = rcHoursLine(entity.hours||[]);
  const hhDays  = entity.hh_days || '';
  const hhStart = entity.hh_start || '';
  const hhEnd   = entity.hh_end || '';

  const infoRows = [
    hoursLine   ? `<div class="gcr-rc-info-row" style="color:#42596c;">🕐 ${rcEsc(hoursLine)}</div>` : '',
    hhDays      ? `<div class="gcr-rc-info-row" style="color:#d97706;">🍺 Happy Hour ${rcEsc(hhDays)}${hhStart?' · '+rcFmtTime(hhStart):''}${hhEnd?'–'+rcFmtTime(hhEnd):''}</div>` : '',
    hasLiveMusic ? `<div class="gcr-rc-info-row" style="color:#7c3aed;">🎸 Live Music</div>` : '',
  ].filter(Boolean).join('');

  // HH items panel
  const hhSections = (entity.hh_sections||[]).concat(entity.happy_hour_sections||[]);
  const hhItems = [];
  hhSections.forEach(sec => {
    (sec.items || sec.happy_hour_items || []).forEach(item => {
      hhItems.push({ section: sec.section_name||sec.name||'', ...item });
    });
  });

  const hhPanelId = `gcr-rc-hh-${slug.replace(/[^a-z0-9]/gi,'_')}`;

  let hhPanelHtml = '';
  if (hhDays || hhItems.length) {
    const itemRows = hhItems.map(item => {
      const n = item.item_name || item.name || '';
      if (!n) return '';
      const rawPrice = item.hh_price ?? item.price;
      const priceStr = item.price_text || (rawPrice != null ? '$' + Number(rawPrice).toFixed(2).replace(/\.00$/, '') : '');
      return `<div class="gcr-rc-hh-item">
        <div class="gcr-rc-hh-item-info">
          <div class="gcr-rc-hh-item-name">${rcEsc(n)}</div>
          ${item.description ? `<div class="gcr-rc-hh-item-desc">${rcEsc(item.description)}</div>` : ''}
        </div>
        ${priceStr ? `<div class="gcr-rc-hh-item-price">${rcEsc(priceStr)}</div>` : ''}
      </div>`;
    }).filter(Boolean).join('');

    hhPanelHtml = `<div class="gcr-rc-hh-panel" id="${hhPanelId}">
      <div class="gcr-rc-hh-header">🍺 Happy Hour</div>
      ${hhDays ? `<div class="gcr-rc-hh-time">${rcEsc(hhDays)}${hhStart?' · '+rcFmtTime(hhStart):''}${hhEnd?' – '+rcFmtTime(hhEnd):''}</div>` : ''}
      ${entity.hh_description ? `<div class="gcr-rc-hh-desc">${rcEsc(entity.hh_description)}</div>` : ''}
      ${itemRows ? `<div class="gcr-rc-hh-items">${itemRows}</div>` : ''}
    </div>`;
  }

  // Action buttons
  const profileUrl = `profile.html?id=${encodeURIComponent(slug)}`;
  const dir    = entity.directions_url || '';
  const phone  = entity.phone || '';
  const menuUrl = entity.menu_url || '';
  const bookUrl = entity.booking_url || entity.reservation_url || '';
  const orderUrl = entity.order_url || '';

  const usedUrls = new Set();
  function dedupeLink(url, label, cls) {
    if (!url) return '';
    const k = url.replace(/https?:\/\//,'').replace(/\/$/,'').split('?')[0];
    if (usedUrls.has(k)) return '';
    usedUrls.add(k);
    return `<a href="${url}" target="_blank" rel="noopener" class="gcr-rc-btn ${cls||''}" onclick="event.stopPropagation()">${label}</a>`;
  }

  const hhToggle = (hhDays || hhItems.length)
    ? `<button class="gcr-rc-btn hh" onclick="event.stopPropagation();event.preventDefault();var p=document.getElementById('${hhPanelId}');p.classList.toggle('open')">🍺 Happy Hour</button>`
    : '';

  return `<a href="${profileUrl}" class="gcr-rc" data-slug="${rcEsc(slug)}" data-tags="${tagStrs.join(',')}" data-subtype="${rcEsc((entity.entity_subtype||entity.type||'').toLowerCase())}" data-hh="${hhDays?'1':'0'}" data-live="${hasLiveMusic?'1':'0'}">
    <div class="gcr-rc-img" style="background-image:url('${hero}'),linear-gradient(135deg,#0b7a75,#1a3a4a);">
      <div class="gcr-rc-badge">${rcEsc(icon)} ${rcEsc(subtype)}</div>
      ${statusBadge}
      ${imgBadges ? `<div class="gcr-rc-img-badges">${imgBadges}</div>` : ''}
      ${price ? `<div class="gcr-rc-price">${rcEsc(price)}</div>` : ''}
    </div>
    <div class="gcr-rc-body">
      <div class="gcr-rc-name">${rcEsc(name)}</div>
      <div class="gcr-rc-sub">${rcEsc([sub, location].filter(Boolean).join(' · '))}</div>
      ${desc ? `<div class="gcr-rc-desc">${rcEsc(desc)}</div>` : ''}
      ${rating ? `<div class="gcr-rc-rating"><span class="gcr-rc-stars">${rcStars(rating)}</span><span>${Number(rating).toFixed(1)}</span>${reviews ? `<span style="color:#8fa3b1">(${Number(reviews).toLocaleString()})</span>` : ''}</div>` : ''}
      ${tagSections ? `<div class="gcr-rc-tags">${tagSections}</div>` : ''}
    </div>
    ${infoRows ? `<div class="gcr-rc-info">${infoRows}</div>` : ''}
    <div class="gcr-rc-bottom">
      <div class="gcr-rc-addr">📍 ${rcEsc(fullAddr || location)}</div>
      <div class="gcr-rc-actions">
        <a href="${profileUrl}" class="gcr-rc-btn primary" onclick="event.stopPropagation()">View Profile</a>
        ${menuUrl ? dedupeLink(menuUrl,'🍽️ Menu','') : `<a href="${profileUrl}" class="gcr-rc-btn" onclick="event.stopPropagation()">🍽️ Menu</a>`}
        ${hhToggle}
        ${dedupeLink(bookUrl, '📅 Reserve','reserve')}
        ${dedupeLink(orderUrl,'🛵 Order','order')}
        ${dedupeLink(dir,     '📍 Directions','')}
        ${phone ? `<a href="tel:${phone.replace(/\D/g,'')}" class="gcr-rc-btn" onclick="event.stopPropagation()">📞 Call</a>` : ''}
      </div>
    </div>
    ${hhPanelHtml}
  </a>`;
}

// ── Main: dedup + enrich + render restaurants grid ────────────
function processMCRestaurants(entityOverride) {
  const grid = document.getElementById('listingsGrid');
  if (!grid || grid.dataset.category !== 'restaurants') return;

  const raw = entityOverride || window._gcrAllEntities;
  if (!raw || !raw.length) return;

  const groups = rcBuildGroups(raw);
  if (!groups.length) return;

  const processed = groups.map(group => {
    const merged = group.length > 1 ? rcMergeGroup(group) : group[0];
    return rcEnrich(merged);
  });

  try {
    grid.innerHTML = processed.map(buildRcCard).join('');
    const meta = document.getElementById('resultCount') || document.querySelector('.toolbar-meta');
    if (meta) meta.textContent = `${processed.length} restaurants`;
  } catch(err) {
    console.error('[gcr-master-card] render failed:', err);
  }
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('gcr:loaded', () => {
  setTimeout(processMCRestaurants, 0);
});

if (window.GCR && GCR.loaded) {
  setTimeout(processMCRestaurants, 0);
}
