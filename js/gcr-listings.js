/* ============================================================
   gcr-listings.js — Gulf Coast Radar
   Card rendering for: restaurants, coffee-sweets, shopping
   (things-to-do, nightlife, events, happy-hours handled separately)

   Add <script src="js/gcr-listings.js"></script> to each page.
   Each page needs: <div id="listingsGrid" data-category="X">
   ============================================================ */

/* ── Inject styles ── */
(function injectStyles() {
  const s = document.createElement('style');
  s.textContent = `
    .layout { padding-top:0 !important; }
    .results-title { margin-top:14px; }
    .toolbar {
      position:sticky;
      top:var(--gcr-header-h, 64px);
      z-index:900;
      border-radius:0 !important;
      margin:0 !important;
      border-left:none !important;
      border-right:none !important;
    }
    .gcr-card {
      display:grid;grid-template-columns:280px minmax(0,1fr);
      background:#fff;border:1px solid #e2e8f0;border-radius:20px;
      box-shadow:0 10px 28px rgba(15,34,51,.08);overflow:hidden;
      text-decoration:none;color:inherit;
      transition:transform .14s ease,box-shadow .14s ease;
      cursor:pointer;
      width:100%;
      margin-bottom:14px;
    }
    .list > a, .cards > a, #listingsGrid > a {
      display:block;
      text-decoration:none;
      color:inherit;
      width:100%;
    }
    .gcr-card-hidden {
      display:none !important;
    }
    .gcr-card:hover{transform:translateY(-2px);box-shadow:0 16px 36px rgba(15,34,51,.13);}
    .gcr-card-img{
      min-height:210px;height:100%;background-size:cover;background-position:center center;
      position:relative;align-self:stretch;
    }
    .gcr-card-badge{
      position:absolute;left:14px;bottom:14px;
      padding:7px 12px;border-radius:999px;
      background:rgba(255,255,255,.92);color:#21485d;
      font-weight:800;font-size:13px;
    }
    .gcr-status{
      position:absolute;right:14px;top:14px;
      padding:6px 11px;border-radius:999px;
      font-size:12px;font-weight:800;
    }
    .gcr-status.open{background:#d4edda;color:#155724;}
    .gcr-status.closing{background:#fff3cd;color:#856404;}
    .gcr-status.opening{background:#cce5ff;color:#004085;}
    .gcr-status.closed{background:#f8d7da;color:#721c24;}
    .gcr-status.music{background:#e8d5f5;color:#5b21b6;}
    .gcr-card-body{padding:16px 18px;display:flex;flex-direction:column;}
    .gcr-card-name{font-size:28px;font-weight:900;letter-spacing:-.03em;line-height:1.1;}
    .gcr-card-sub{margin-top:4px;color:#66788a;font-size:15px;font-weight:600;}
    .gcr-card-rating{
      margin-top:9px;display:flex;align-items:center;gap:8px;
      font-size:14px;font-weight:700;color:#384f61;
    }
    .gcr-stars{color:#f4b400;letter-spacing:1px;font-size:15px;}
    .gcr-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px;}
    a.gcr-chip{
      background:#f7fafc;border:1px solid #e7edf3;color:#496376;
      padding:6px 11px;border-radius:999px;font-size:12px;font-weight:700;
      text-decoration:none;transition:.15s;
    }
    a.gcr-chip:hover{background:#e8f7fa;border-color:#b9e7ef;color:#0b6475;}
    .gcr-card-bottom{
      margin-top:auto;padding-top:13px;border-top:1px solid #edf2f7;
      display:flex;align-items:center;justify-content:space-between;
      flex-wrap:wrap;gap:10px;
    }
    .gcr-card-addr{color:#425b70;font-weight:600;font-size:13px;}
    .gcr-card-actions{display:flex;gap:8px;flex-wrap:wrap;}
    .gcr-btn{
      border:1px solid #e2e8f0;background:#fff;color:#25465b;
      padding:9px 13px;border-radius:11px;font-size:13px;font-weight:800;
      text-decoration:none;display:inline-block;
    }
    .gcr-btn:hover{background:#f0f4f8;}
    .gcr-empty{
      padding:52px 24px;text-align:center;color:#66788a;
    }
    .gcr-empty-icon{font-size:54px;margin-bottom:12px;}
    .gcr-empty h3{font-size:22px;font-weight:800;margin:0 0 8px;}
    .gcr-empty p{font-size:15px;line-height:1.6;margin:0;}
    @media(max-width:760px){
      .gcr-card{grid-template-columns:1fr;}
      .gcr-card-img{min-height:190px;}
      .gcr-card-name{font-size:22px;}
    }
  `;
  document.head.appendChild(s);
})();

/* ── HTML escape helper ── */
function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ── Category fallback images ── */
const FALLBACK_IMGS = {
  restaurants:     'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
  restaurant:      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
  seafood:         'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
  bar_grill:       'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
  bar:             'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
  coffee_shop:     'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
  cafe:            'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
  bakery:          'https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?auto=format&fit=crop&w=800&q=80',
  ice_cream:       'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80',
  shopping:        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
  boutique:        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
  nightlife:       'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&w=800&q=80',
  parasailing:     'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
  boat_rental:     'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
  fishing_charter: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
  dolphin_cruise:  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
  tour:            'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
  hotel:           'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
  spa:             'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
  default:         'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=800&q=80',
};
const FALLBACK_IMG = FALLBACK_IMGS.default;
function getFallbackImg(subtype) {
  const key = (subtype || '').toLowerCase().replace(/-/g, '_');
  return FALLBACK_IMGS[key] || FALLBACK_IMG;
}

/* ── entity_subtype → listing page ── */
/* Keys use underscores. The lookup normalizes hyphens→underscores automatically. */
const SUBTYPE_TO_CATEGORY = {
  // Restaurants
  restaurant:'restaurants', restaurants:'restaurants',
  bar:'restaurants', bar_grill:'restaurants',
  hybrid_venue:'restaurants', seafood_restaurant:'restaurants', seafood:'restaurants',
  casual_dining:'restaurants', steakhouse:'restaurants', pizza:'restaurants',
  mexican:'restaurants', southern:'restaurants', breakfast_spot:'restaurants',
  beach_bar:'restaurants', food:'restaurants', dining:'restaurants',

  // Coffee & Sweets
  coffee_shop:'coffee-sweets', 'coffee_sweets':'coffee-sweets',
  cafe:'coffee-sweets', bakery:'coffee-sweets',
  ice_cream:'coffee-sweets', dessert_bar:'coffee-sweets', smoothie:'coffee-sweets',

  // Shopping
  boutique:'shopping', souvenir:'shopping', retail:'shopping', shopping:'shopping',
  surf_shop:'shopping', gift_shop:'shopping', clothing:'shopping',
  art_gallery:'shopping', gallery_shop:'shopping',

  // Things To Do (water sports, tours, attractions, rentals)
  parasailing:'things-to-do', dolphin_cruise:'things-to-do',
  dolphin_cruises_tours:'things-to-do',
  snorkeling:'things-to-do', kayak_rental:'things-to-do',
  canoe_kayak_paddleboard:'things-to-do',
  boat_rental:'things-to-do', boat_rentals:'things-to-do',
  fishing_charter:'things-to-do',
  tour:'things-to-do', attraction:'things-to-do',
  jet_ski:'things-to-do', jet_ski_rentals_tours:'things-to-do',
  paddleboard:'things-to-do',
  banana_boat_rides:'things-to-do', banana_boat:'things-to-do',
  things_to_do:'things-to-do',

  // Nightlife
  nightlife:'nightlife',
  bar_club:'nightlife', nightclub:'nightlife', sports_bar:'nightlife',
  rooftop_bar:'nightlife', lounge:'nightlife',

  // Services
  services:'services', service:'services',
  salon:'services', spa:'services', photographer:'services', photography:'services',
  wellness:'services', transportation:'services',
  concierge:'services', chair_rental:'services', grocery_delivery:'services',
  cleaning:'services', lawn_care:'services', pest_control:'services',

  // Other
  other:'other',
  boat_launch:'other', parking:'other', vacation_rental:'other',
  hotel:'other', condo:'other', resort:'other',
  beach_access:'other', park:'other',
};

/* ── tag → destination page for clickable chips ── */
const TAG_TO_PAGE = {
  happy_hour:'happy-hours.html',   'happy hour':'happy-hours.html',
  live_music:'events.html',        'live music':'events.html',
  bingo:'events.html',             karaoke:'events.html',
  trivia:'events.html',            concert:'events.html',
  seafood:'restaurants.html',      waterfront:'restaurants.html',
  waterfront_dining:'restaurants.html',
  breakfast:'restaurants.html',    brunch:'restaurants.html',
  bar_grill:'restaurants.html',    southern:'restaurants.html',
  steakhouse:'restaurants.html',   pizza:'restaurants.html',
  mexican:'restaurants.html',
  coffee:'coffee-sweets.html',     'ice cream':'coffee-sweets.html',
  ice_cream:'coffee-sweets.html',  bakery:'coffee-sweets.html',
  desserts:'coffee-sweets.html',
  parasailing:'things-to-do.html', fishing:'things-to-do.html',
  boat_rental:'things-to-do.html', kayak:'things-to-do.html',
  snorkeling:'things-to-do.html',  dolphin:'things-to-do.html',
  boutique:'shopping.html',        souvenir:'shopping.html',
  photography:'services.html',      photographer:'services.html',
};

function tagToPage(tag) {
  const lower = (tag || '').toLowerCase();
  const key = lower.replace(/ /g, '_');
  if (TAG_TO_PAGE[key]) return TAG_TO_PAGE[key];
  if (TAG_TO_PAGE[lower]) return TAG_TO_PAGE[lower];
  if (/happy.?hour/.test(lower)) return 'happy-hours.html';
  if (/live.?music/.test(lower)) return 'events.html';
  if (/waterfront/.test(lower))  return 'restaurants.html';
  if (/seafood/.test(lower))     return 'restaurants.html';
  if (/parasail/.test(lower))    return 'things-to-do.html';
  if (/fishing/.test(lower))     return 'things-to-do.html';
  if (/coffee/.test(lower))      return 'coffee-sweets.html';
  return `search.html?q=${encodeURIComponent(tag)}`;
}

function tagLabel(tag) {
  return tag.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/* ── Star rating ── */
function starsHtml(rating) {
  if (!rating) return '';
  const r = Math.round(Number(rating) * 2) / 2;
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

/* ── Parse time string to total minutes — handles "11:00 am", "11:00 AM", "23:00", "9pm" ── */
function parseTimeMins(t) {
  if (!t) return null;
  const s = String(t).trim().toLowerCase();
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2] || '0', 10);
  const ap = m[3];
  if (ap === 'pm' && h !== 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  return h * 60 + min;
}

/* ── Format minutes back to 12hr display ── */
function fmtTimeMins(t) {
  if (!t) return '';
  const mins = parseTimeMins(t);
  if (mins === null) return t; // pass through if unparseable
  const h24 = Math.floor(mins / 60);
  const m   = mins % 60;
  const ap  = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2,'0')}${ap}` : `${h12}${ap}`;
}

/* ── Time-aware status badge ── */
function computeStatus(hours, tags) {
  const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const now = new Date();
  const todayName = DAYS[now.getDay()];
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const todayRow = (hours || []).find(h => h.day_of_week && h.day_of_week.toLowerCase() === todayName);
  let statusHtml = '';
  if (todayRow) {
    if (todayRow.is_closed) {
      statusHtml = '<div class="gcr-status closed">Closed Today</div>';
    } else if (todayRow.open_time && todayRow.close_time) {
      const openMins  = parseTimeMins(todayRow.open_time);
      const closeMins = parseTimeMins(todayRow.close_time);
      if (openMins !== null && closeMins !== null) {
        if (nowMins < openMins - 60)       statusHtml = `<div class="gcr-status closed">Opens ${fmtTimeMins(todayRow.open_time)}</div>`;
        else if (nowMins < openMins)       statusHtml = `<div class="gcr-status opening">Opening Soon · ${fmtTimeMins(todayRow.open_time)}</div>`;
        else if (nowMins < closeMins - 60) statusHtml = `<div class="gcr-status open">Open · Closes ${fmtTimeMins(todayRow.close_time)}</div>`;
        else if (nowMins < closeMins)      statusHtml = `<div class="gcr-status closing">Closing Soon · ${fmtTimeMins(todayRow.close_time)}</div>`;
        else                               statusHtml = `<div class="gcr-status closed">Closed · Opens ${fmtTimeMins(todayRow.open_time)}</div>`;
      }
    }
  }
  const tagList = (tags || []).map(t => (typeof t === 'string' ? t : t.tag || '').toLowerCase());
  if ((tagList.includes('live_music') || tagList.includes('live music')) && now.getHours() >= 16 && now.getHours() < 23) {
    statusHtml = '<div class="gcr-status music">🎸 Live Music Tonight</div>';
  }
  return statusHtml;
}

/* ── Today's hours one-liner ── */
function computeHoursLine(hours) {
  if (!hours || !hours.length) return '';
  const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const todayName = DAYS[new Date().getDay()];
  const todayRow = hours.find(h => h.day_of_week && h.day_of_week.toLowerCase() === todayName);
  if (!todayRow) return '';
  if (todayRow.is_closed) return 'Closed Today';
  if (todayRow.open_time && todayRow.close_time) {
    return `Today ${fmtTimeMins(todayRow.open_time)} – ${fmtTimeMins(todayRow.close_time)}`;
  }
  return '';
}

/* ── Build one card ── */
function buildCard(entity) {
  const slug    = entity.slug || entity.subdomain || entity.id || '';
  const name    = entity.name || 'Business';
  const icon    = entity.icon || entity.emoji || '📍';
  const sub     = entity.subtitle || entity.tagline || '';
  const subtype = (entity.entity_subtype || entity.type || '').replace(/_/g, ' ');
  const city    = entity.city || '';
  const state   = entity.state || '';
  const hero    = (entity.photos && entity.photos[0] && entity.photos[0].image_url) || entity.hero_image_url || entity.cover_url || getFallbackImg(entity.entity_subtype || entity.type);
  const rating  = entity.rating;
  const reviews = entity.review_count || entity.reviewCount || 0;
  const addr    = entity.address_line_1 || entity.address || '';
  const phone   = entity.phone || '';
  const phoneClean = phone.replace(/\D/g, '');
  const dir     = entity.directions_url || '';
  const bookingUrl     = entity.booking_url || '';
  const reservationUrl = entity.reservation_url || '';
  const orderUrl       = entity.order_url || '';
  const desc    = entity.description || '';
  const hhDays  = entity.hh_days || '';
  const hhStart = entity.hh_start || '';
  const hhEnd   = entity.hh_end || '';
  const hhDesc  = entity.hh_description || '';
  const location = [city, state].filter(Boolean).join(', ');

  // Normalize tags — handle both string tags and {tag, tag_category} objects
  const rawTags = (entity.tags || []).map(t => (typeof t === 'string' ? t : (t.tag || '')).toLowerCase().replace(/[\s\-]+/g, '_')).filter(Boolean);

  const statusBadge = computeStatus(entity.hours || [], rawTags);
  const priceRange  = entity.priceRange || entity.price_range || '';
  const priceTag    = rawTags.find(t => t.startsWith('$') || t.includes('from_'));
  const priceDisplay = priceRange || (priceTag ? priceTag.replace(/_/g,' ') : '');

  const displayTags = rawTags.length ? rawTags.slice(0, 4) : (subtype ? [subtype.replace(/ /g,'_')] : []);
  const chipLinks = displayTags.map(tag => {
    const dest = tagToPage(tag);
    return `<a href="${dest}?tag=${encodeURIComponent(tag)}" class="gcr-chip" onclick="event.stopPropagation()">${tagLabel(tag)}</a>`;
  }).join('');

  const ratingBlock = rating ? `
    <div class="gcr-card-rating">
      <span class="gcr-stars">${starsHtml(rating)}</span>
      <span>${Number(rating).toFixed(1)}</span>
      ${reviews ? `<span style="color:#8fa3b1">(${reviews})</span>` : ''}
    </div>` : '';

  const usedUrls = new Set();
  const dedupeBtn = (url, label, style) => {
    if (!url) return '';
    const key = url.replace(/https?:\/\//,'').replace(/\/$/,'').split('?')[0];
    if (usedUrls.has(key)) return '';
    usedUrls.add(key);
    return `<a href="${url}" target="_blank" rel="noopener" class="gcr-btn" style="${style||''}" onclick="event.stopPropagation()">${label}</a>`;
  };
  const profileUrl = `profile.html?id=${encodeURIComponent(slug)}`;
  const viewBtn    = `<a href="${profileUrl}" class="gcr-btn" style="background:#0b7a75;color:#fff;border-color:#0b7a75;" onclick="event.stopPropagation()">View Profile</a>`;
  const menuBtn    = `<a href="${profileUrl}" class="gcr-btn" onclick="event.stopPropagation()">🍽️ View Menu</a>`;
  const callBtn    = phone ? `<a href="tel:${phone.replace(/\D/g,'')}" class="gcr-btn" onclick="event.stopPropagation()">📞 Call</a>` : '';
  const dirBtn     = dedupeBtn(dir,         '📍 Directions','');
  const bookBtn    = dedupeBtn(bookingUrl,  '📅 Book Now',  'background:#0ea5e9;color:#fff;border-color:#0ea5e9;');
  const reserveBtn = dedupeBtn(reservationUrl, '🍽️ Reserve',   'background:#22c55e;color:#fff;border-color:#22c55e;');
  const orderBtn   = dedupeBtn(orderUrl,       '🛵 Order',      'background:#f59e0b;color:#fff;border-color:#f59e0b;');

  // Happy Hour expand button + panel (only if hh_days exists)
  const hhPanelId = `hh-${slug.replace(/[^a-z0-9]/g,'_')}`;
  const hhBtn = hhDays
    ? `<button class="gcr-btn" style="background:#d97706;color:#fff;border-color:#d97706;" onclick="event.stopPropagation();event.preventDefault();var p=document.getElementById('${hhPanelId}');p.style.display=p.style.display==='none'?'block':'none';">🍺 Happy Hour</button>`
    : '';
  const hhPanel = hhDays ? `
    <div id="${hhPanelId}" style="display:none;border-top:1px solid #fde68a;background:#fffbeb;padding:14px 18px;">
      <div style="font-weight:800;font-size:14px;color:#92400e;margin-bottom:6px;">🍺 Happy Hour</div>
      <div style="font-size:13px;color:#78350f;font-weight:600;">${esc(hhDays)}${hhStart ? ' · '+esc(hhStart) : ''}${hhEnd ? '–'+esc(hhEnd) : ''}</div>
      ${entity.hh_description ? `<div style="margin-top:6px;font-size:13px;color:#92400e;line-height:1.5;">${esc(entity.hh_description)}</div>` : ''}
    </div>` : '';

  // About — 3 lines, no fallback
  const aboutBlock = desc
    ? `<div style="margin-top:8px;font-size:13px;color:#5c6b81;line-height:1.65;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${esc(desc)}</div>`
    : '';

  // Hours — only if data exists
  const fullAddr  = [addr, city, state].filter(Boolean).join(', ');
  const hoursInfo = computeHoursLine(entity.hours || []);
  const hoursBlock = hoursInfo
    ? `<div style="margin-top:6px;font-size:13px;color:#42596c;font-weight:600;">🕐 ${hoursInfo}</div>`
    : '';

  // Happy hour — only if data exists
  const hhBlock = hhDays
    ? `<div style="margin-top:6px;font-size:13px;color:#d97706;font-weight:700;">🍺 Happy Hour ${esc(hhDays)}${hhStart ? ' · '+esc(hhStart) : ''}${hhEnd ? '–'+esc(hhEnd) : ''}</div>`
    : '';

  // Live music today — check actual events
  const todayStr2  = new Date().toISOString().split('T')[0];
  const todayName2 = new Date().toLocaleDateString('en-US',{weekday:'long'}).toLowerCase();
  const todayMusic = (window.GCR && GCR.events || []).filter(e => {
    const matchEntity = (e.entity_slug||e.slug||e.entity_id) === (slug||entity.id);
    if (!matchEntity) return false;
    const isToday = e.event_date === todayStr2;
    const isRecurringToday = e.recurring && (e.day_of_week||'').toLowerCase() === todayName2;
    if (!isToday && !isRecurringToday) return false;
    const t = (e.event_type||'').toLowerCase();
    const n = (e.event_name||'').toLowerCase();
    return t.includes('live')||t.includes('music')||t.includes('dj')||n.includes('live')||n.includes('dj');
  });
  const hasLiveMusic = rawTags.some(t => t.includes('live_music') || t.includes('live music')) || todayMusic.length > 0;
  const musicBlock = todayMusic.length
    ? `<div style="margin-top:6px;font-size:13px;color:#7c3aed;font-weight:700;">🎸 Live Music Tonight: ${todayMusic.map(e=>e.event_name||'Live Music').join(', ')}</div>`
    : (hasLiveMusic ? `<div style="margin-top:6px;font-size:13px;color:#7c3aed;font-weight:600;">🎸 Live Music</div>` : '');

  return `
    <a href="profile.html?id=${encodeURIComponent(slug)}"
       style="text-decoration:none;color:inherit;"
       data-slug="${slug}"
       data-tags="${rawTags.join(',').toLowerCase()}"
       data-subtype="${(entity.entity_subtype || entity.type || '').toLowerCase()}"
       data-hh="${entity.hh_days ? '1' : '0'}"
       data-live="${hasLiveMusic ? '1' : '0'}">
      <div class="gcr-card">
        <div class="gcr-card-img" style="background-image:url('${hero}')">
          <div class="gcr-card-badge">${icon} ${subtype}</div>
          ${statusBadge}
          ${priceDisplay ? `<div style="position:absolute;right:14px;bottom:14px;padding:6px 12px;border-radius:999px;background:rgba(46,155,85,.92);color:#fff;font-weight:800;font-size:13px;">${priceDisplay}</div>` : ''}
        </div>
        <div class="gcr-card-body">
          <div class="gcr-card-name">${esc(name)}</div>
          <div class="gcr-card-sub">${esc([sub, location].filter(Boolean).join(' · '))}</div>
          ${aboutBlock}
          ${ratingBlock}
          ${chipLinks ? `<div class="gcr-chips">${chipLinks}</div>` : ''}
          ${hoursBlock}
          ${hhBlock}
          ${musicBlock}
          <div class="gcr-card-bottom">
            <div class="gcr-card-addr">${esc(fullAddr || location)}</div>
            <div class="gcr-card-actions">${viewBtn}${menuBtn}${hhBtn}${bookBtn}${reserveBtn}${orderBtn}${dirBtn}${callBtn}</div>
          </div>
        </div>
      </div>
      ${hhPanel}
    </a>`;
}

/* ── Build happy hour card with items popup (for happy-hours.html page) ── */
function buildHHCard(entity) {
  const slug    = entity.slug || entity.subdomain || entity.id || '';
  const name    = entity.name || 'Business';
  const icon    = entity.icon || entity.emoji || '📍';
  const sub     = entity.subtitle || entity.tagline || '';
  const subtype = (entity.entity_subtype || entity.type || '').replace(/_/g, ' ');
  const city    = entity.city || '';
  const state   = entity.state || '';
  const hero    = (entity.photos && entity.photos[0] && entity.photos[0].image_url) || entity.hero_image_url || entity.cover_url || getFallbackImg(entity.entity_subtype || entity.type);
  const rating  = entity.rating;
  const reviews = entity.review_count || entity.reviewCount || 0;
  const addr    = entity.address_line_1 || entity.address || '';
  const phone   = entity.phone || '';
  const phoneClean = phone.replace(/\D/g, '');
  const dir     = entity.directions_url || '';
  const bookingUrl     = entity.booking_url || '';
  const reservationUrl = entity.reservation_url || '';
  const orderUrl       = entity.order_url || '';
  const desc    = entity.description || '';
  const hhDays  = entity.hh_days || '';
  const hhStart = entity.hh_start || '';
  const hhEnd   = entity.hh_end || '';
  const hhDesc  = entity.hh_description || '';
  const location = [city, state].filter(Boolean).join(', ');

  const rawTags = (entity.tags || []).map(t => (typeof t === 'string' ? t : (t.tag || '')).toLowerCase().replace(/[\s\-]+/g, '_')).filter(Boolean);
  const statusBadge = computeStatus(entity.hours || [], rawTags);
  const priceRange  = entity.priceRange || entity.price_range || '';
  const priceTag    = rawTags.find(t => t.startsWith('$') || t.includes('from_'));
  const priceDisplay = priceRange || (priceTag ? priceTag.replace(/_/g,' ') : '');

  const displayTags = rawTags.length ? rawTags.slice(0, 4) : (subtype ? [subtype.replace(/ /g,'_')] : []);
  const chipLinks = displayTags.map(tag => {
    const dest = tagToPage(tag);
    return `<a href="${dest}?tag=${encodeURIComponent(tag)}" class="gcr-chip" onclick="event.stopPropagation()">${tagLabel(tag)}</a>`;
  }).join('');

  const ratingBlock = rating ? `
    <div class="gcr-card-rating">
      <span class="gcr-stars">${starsHtml(rating)}</span>
      <span>${Number(rating).toFixed(1)}</span>
      ${reviews ? `<span style="color:#8fa3b1">(${reviews})</span>` : ''}
    </div>` : '';

  const usedUrls = new Set();
  const dedupeBtn = (url, label, style) => {
    if (!url) return '';
    const key = url.replace(/https?:\/\//,'').replace(/\/$/,'').split('?')[0];
    if (usedUrls.has(key)) return '';
    usedUrls.add(key);
    return `<a href="${url}" target="_blank" rel="noopener" class="gcr-btn" style="${style||''}" onclick="event.stopPropagation()">${label}</a>`;
  };
  const profileUrl = `profile.html?id=${encodeURIComponent(slug)}`;
  const viewBtn    = `<a href="${profileUrl}" class="gcr-btn" style="background:#0b7a75;color:#fff;border-color:#0b7a75;" onclick="event.stopPropagation()">View Profile</a>`;
  const callBtn    = phone ? `<a href="tel:${phone.replace(/\D/g,'')}" class="gcr-btn" onclick="event.stopPropagation()">📞 Call</a>` : '';
  const dirBtn     = dedupeBtn(dir,         '📍 Directions','');
  const bookBtn    = dedupeBtn(bookingUrl,  '📅 Book Now',  'background:#0ea5e9;color:#fff;border-color:#0ea5e9;');
  const reserveBtn = dedupeBtn(reservationUrl, '🍽️ Reserve',   'background:#22c55e;color:#fff;border-color:#22c55e;');
  const orderBtn   = dedupeBtn(orderUrl,       '🛵 Order',      'background:#f59e0b;color:#fff;border-color:#f59e0b;');

  const aboutBlock = desc
    ? `<div style="margin-top:8px;font-size:13px;color:#5c6b81;line-height:1.65;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${esc(desc)}</div>`
    : '';

  const fullAddr  = [addr, city, state].filter(Boolean).join(', ');
  const hoursInfo = computeHoursLine(entity.hours || []);
  const hoursBlock = hoursInfo
    ? `<div style="margin-top:6px;font-size:13px;color:#42596c;font-weight:600;">🕐 ${hoursInfo}</div>`
    : '';

  const hhBlock = hhDays
    ? `<div style="margin-top:6px;font-size:13px;color:#d97706;font-weight:700;">🍺 Happy Hour ${esc(hhDays)}${hhStart ? ' · '+esc(hhStart) : ''}${hhEnd ? '–'+esc(hhEnd) : ''}</div>`
    : '';

  const todayStr2  = new Date().toISOString().split('T')[0];
  const todayName2 = new Date().toLocaleDateString('en-US',{weekday:'long'}).toLowerCase();
  const todayMusic = (window.GCR && GCR.events || []).filter(e => {
    const matchEntity = (e.entity_slug||e.slug||e.entity_id) === (slug||entity.id);
    if (!matchEntity) return false;
    const isToday = e.event_date === todayStr2;
    const isRecurringToday = e.recurring && (e.day_of_week||'').toLowerCase() === todayName2;
    if (!isToday && !isRecurringToday) return false;
    const t = (e.event_type||'').toLowerCase();
    const n = (e.event_name||'').toLowerCase();
    return t.includes('live')||t.includes('music')||t.includes('dj')||n.includes('live')||n.includes('dj');
  });
  const hasLiveMusicHH = rawTags.some(t => t.includes('live_music') || t.includes('live music')) || todayMusic.length > 0;
  const musicBlock = todayMusic.length
    ? `<div style="margin-top:6px;font-size:13px;color:#7c3aed;font-weight:700;">🎸 Live Music Tonight: ${todayMusic.map(e=>e.event_name||'Live Music').join(', ')}</div>`
    : (hasLiveMusicHH ? `<div style="margin-top:6px;font-size:13px;color:#7c3aed;font-weight:600;">🎸 Live Music</div>` : '');

  // Happy Hour Items popup — large button for HH page
  const hhItemsPopupId = `hh-items-${slug.replace(/[^a-z0-9]/g,'_')}`;
  const hhItemsBtn = hhDays
    ? `<button class="gcr-btn" style="background:#d97706;color:#fff;border-color:#d97706;flex:1;font-size:14px;font-weight:900;padding:12px 16px;" onclick="event.stopPropagation();event.preventDefault();toggleHHItems('${hhItemsPopupId}')">🍺 View Happy Hour Items</button>`
    : '';
  const hhItemsPopup = hhDays ? `
    <div id="${hhItemsPopupId}" style="display:none;margin-top:14px;border:1px solid #fde68a;border-radius:14px;background:#fffbeb;padding:18px;max-height:500px;overflow-y:auto;">
      <div style="font-weight:900;font-size:16px;color:#92400e;margin-bottom:12px;">🍺 Happy Hour Menu</div>
      <div style="font-size:13px;color:#78350f;font-weight:600;margin-bottom:14px;">${esc(hhDays)}${hhStart ? ' · '+esc(hhStart) : ''}${hhEnd ? '–'+esc(hhEnd) : ''}</div>
      ${hhDesc ? `<div style="margin-bottom:14px;font-size:13px;color:#92400e;line-height:1.5;">${esc(hhDesc)}</div>` : ''}
      <div id="${hhItemsPopupId}-items" style="font-size:13px;color:#78350f;">Loading items...</div>
    </div>` : '';

  return `
    <a href="profile.html?id=${encodeURIComponent(slug)}"
       style="text-decoration:none;color:inherit;"
       data-slug="${slug}"
       data-tags="${rawTags.join(',').toLowerCase()}"
       data-subtype="${(entity.entity_subtype || entity.type || '').toLowerCase()}"
       data-hh="${entity.hh_days ? '1' : '0'}"
       data-live="${hasLiveMusicHH ? '1' : '0'}">
      <div class="gcr-card">
        <div class="gcr-card-img" style="background-image:url('${hero}')">
          <div class="gcr-card-badge">${icon} ${subtype}</div>
          ${statusBadge}
          ${priceDisplay ? `<div style="position:absolute;right:14px;bottom:14px;padding:6px 12px;border-radius:999px;background:rgba(46,155,85,.92);color:#fff;font-weight:800;font-size:13px;">${priceDisplay}</div>` : ''}
        </div>
        <div class="gcr-card-body">
          <div class="gcr-card-name">${esc(name)}</div>
          <div class="gcr-card-sub">${esc([sub, location].filter(Boolean).join(' · '))}</div>
          ${aboutBlock}
          ${ratingBlock}
          ${chipLinks ? `<div class="gcr-chips">${chipLinks}</div>` : ''}
          ${hoursBlock}
          ${hhBlock}
          ${musicBlock}
          ${hhItemsBtn ? `<div style="margin-top:10px;display:flex;gap:8px;">${hhItemsBtn}</div>` : ''}
          <div class="gcr-card-bottom">
            <div class="gcr-card-addr">${esc(fullAddr || location)}</div>
            <div class="gcr-card-actions">${viewBtn}${bookBtn}${reserveBtn}${orderBtn}${dirBtn}${callBtn}</div>
          </div>
        </div>
      </div>
      ${hhItemsPopup}
    </a>`;
}

/* ── Toggle Happy Hour Items Popup ── */
function toggleHHItems(popupId) {
  const popup = document.getElementById(popupId);
  if (!popup) return;

  if (popup.style.display === 'none') {
    popup.style.display = 'block';
    // Load items if not already loaded
    const itemsContainer = document.getElementById(popupId + '-items');
    if (itemsContainer && itemsContainer.textContent === 'Loading items...') {
      loadHHItems(popupId);
    }
  } else {
    popup.style.display = 'none';
  }
}

function loadHHItems(popupId) {
  const itemsContainer = document.getElementById(popupId + '-items');
  const slug = popupId.replace('hh-items-', '').replace(/_/g, '-');

  // Fetch happy hour items for this entity
  fetch(`https://cybercheck-api-database.vercel.app/api/gcr/entity/${encodeURIComponent(slug)}`)
    .then(res => res.json())
    .then(data => {
      const hhItems = (data.happy_hour && data.happy_hour.items) || [];
      if (hhItems.length === 0) {
        itemsContainer.innerHTML = '<div style="color:#92400e;">No items listed</div>';
        return;
      }

      const html = hhItems.map(item => `
        <div style="border-bottom:1px solid #fcd34d;padding:12px 0;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
          <div style="flex:1;">
            <div style="font-weight:700;color:#78350f;">${esc(item.item_name)}</div>
            ${item.description ? `<div style="font-size:12px;color:#92400e;margin-top:4px;line-height:1.4;">${esc(item.description)}</div>` : ''}
          </div>
          <div style="font-weight:800;color:#d97706;white-space:nowrap;">${esc(item.price_text || item.hh_price || '')}</div>
        </div>
      `).join('');

      itemsContainer.innerHTML = html;
    })
    .catch(err => {
      itemsContainer.innerHTML = '<div style="color:#92400e;">Error loading items</div>';
    });
}

/* ── Build specials card (for specials.html page) ── */
function buildSpecialsCard(entity) {
  // Get specials for this entity from GCR.specials
  const entitySpecials = (window.GCR && GCR.specials || []).filter(s =>
    (s.entity_slug || s.slug) === entity.slug || s.entity_id === entity.id
  );

  const slug    = entity.slug || entity.subdomain || entity.id || '';
  const name    = entity.name || 'Business';
  const icon    = entity.icon || entity.emoji || '📍';
  const sub     = entity.subtitle || entity.tagline || '';
  const subtype = (entity.entity_subtype || entity.type || '').replace(/_/g, ' ');
  const city    = entity.city || '';
  const state   = entity.state || '';
  const hero    = (entity.photos && entity.photos[0] && entity.photos[0].image_url) || entity.hero_image_url || entity.cover_url || getFallbackImg(entity.entity_subtype || entity.type);
  const rating  = entity.rating;
  const reviews = entity.review_count || entity.reviewCount || 0;
  const addr    = entity.address_line_1 || entity.address || '';
  const phone   = entity.phone || '';
  const dir     = entity.directions_url || '';
  const desc    = entity.description || '';
  const location = [city, state].filter(Boolean).join(', ');

  const rawTags = (entity.tags || []).map(t => (typeof t === 'string' ? t : (t.tag || '')).toLowerCase().replace(/[\s\-]+/g, '_')).filter(Boolean);
  const statusBadge = computeStatus(entity.hours || [], rawTags);
  const fullAddr = [addr, city, state].filter(Boolean).join(', ');
  const hoursInfo = computeHoursLine(entity.hours || []);
  const hoursBlock = hoursInfo ? `<div style="margin-top:6px;font-size:13px;color:#42596c;font-weight:600;">🕐 ${hoursInfo}</div>` : '';

  const ratingBlock = rating ? `
    <div class="gcr-card-rating">
      <span class="gcr-stars">${starsHtml(rating)}</span>
      <span>${Number(rating).toFixed(1)}</span>
      ${reviews ? `<span style="color:#8fa3b1">(${reviews})</span>` : ''}
    </div>` : '';

  const profileUrl = `profile.html?id=${encodeURIComponent(slug)}`;
  const viewBtn = `<a href="${profileUrl}" class="gcr-btn" style="background:#0b7a75;color:#fff;border-color:#0b7a75;" onclick="event.stopPropagation()">View Profile</a>`;
  const callBtn = phone ? `<a href="tel:${phone.replace(/\D/g,'')}" class="gcr-btn" onclick="event.stopPropagation()">📞 Call</a>` : '';
  const dirBtn  = dir   ? `<a href="${dir}" target="_blank" rel="noopener" class="gcr-btn" onclick="event.stopPropagation()">📍 Directions</a>` : '';

  // Specials preview line — show first special's name + discount
  const firstSpecial = entitySpecials[0];
  const specialsPreview = firstSpecial
    ? `<div style="margin-top:6px;font-size:13px;color:#0369a1;font-weight:700;">🏷️ ${esc(firstSpecial.special_name || firstSpecial.name || '')}${firstSpecial.discount_text ? ' · '+esc(firstSpecial.discount_text) : ''}</div>`
    : '';

  // Specials popup
  const specPopupId = `specials-${slug.replace(/[^a-z0-9]/g,'_')}`;
  const specBtn = entitySpecials.length
    ? `<button class="gcr-btn" style="background:#0369a1;color:#fff;border-color:#0369a1;flex:1;font-size:14px;font-weight:900;padding:12px 16px;" onclick="event.stopPropagation();event.preventDefault();toggleSpecialsPopup('${specPopupId}','${encodeURIComponent(slug)}')">🏷️ View Specials</button>`
    : '';
  const specPopup = entitySpecials.length ? `
    <div id="${specPopupId}" style="display:none;margin-top:14px;border:1px solid #bae6fd;border-radius:14px;background:#f0f9ff;padding:18px;max-height:500px;overflow-y:auto;">
      <div style="font-weight:900;font-size:16px;color:#0369a1;margin-bottom:12px;">🏷️ Specials</div>
      <div id="${specPopupId}-items">
        ${entitySpecials.map(s => `
          <div style="border-bottom:1px solid #bae6fd;padding:12px 0;">
            <div style="font-weight:700;color:#0c4a6e;">${esc(s.special_name || s.name || '')}</div>
            ${s.discount_text ? `<div style="font-size:13px;color:#0369a1;font-weight:700;margin-top:2px;">${esc(s.discount_text)}</div>` : ''}
            ${s.description ? `<div style="font-size:12px;color:#075985;margin-top:4px;line-height:1.4;">${esc(s.description)}</div>` : ''}
            ${s.days ? `<div style="font-size:12px;color:#0369a1;margin-top:4px;font-weight:600;">📅 ${esc(s.days)}</div>` : ''}
          </div>`).join('')}
      </div>
    </div>` : '';

  return `
    <a href="${profileUrl}"
       style="text-decoration:none;color:inherit;"
       data-slug="${slug}"
       data-tags="${rawTags.join(',').toLowerCase()}"
       data-subtype="${(entity.entity_subtype || entity.type || '').toLowerCase()}"
       data-hh="${entity.hh_days ? '1' : '0'}"
       data-live="0">
      <div class="gcr-card">
        <div class="gcr-card-img" style="background-image:url('${hero}')">
          <div class="gcr-card-badge">${icon} ${subtype}</div>
          ${statusBadge}
        </div>
        <div class="gcr-card-body">
          <div class="gcr-card-name">${esc(name)}</div>
          <div class="gcr-card-sub">${esc([sub, location].filter(Boolean).join(' · '))}</div>
          ${desc ? `<div style="margin-top:8px;font-size:13px;color:#5c6b81;line-height:1.65;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(desc)}</div>` : ''}
          ${ratingBlock}
          ${hoursBlock}
          ${specialsPreview}
          ${specBtn ? `<div style="margin-top:10px;display:flex;gap:8px;">${specBtn}</div>` : ''}
          <div class="gcr-card-bottom">
            <div class="gcr-card-addr">${esc(fullAddr || location)}</div>
            <div class="gcr-card-actions">${viewBtn}${dirBtn}${callBtn}</div>
          </div>
        </div>
      </div>
      ${specPopup}
    </a>`;
}

function toggleSpecialsPopup(popupId) {
  const popup = document.getElementById(popupId);
  if (!popup) return;
  popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
}

/* ── Build combined HH + Specials card (for deals.html page) ── */
function buildHHSpecialsCard(entity) {
  // Get specials for this entity
  const entitySpecials = (window.GCR && GCR.specials || []).filter(s =>
    (s.entity_slug || s.slug) === entity.slug || s.entity_id === entity.id
  );

  const slug    = entity.slug || entity.subdomain || entity.id || '';
  const name    = entity.name || 'Business';
  const icon    = entity.icon || entity.emoji || '📍';
  const sub     = entity.subtitle || entity.tagline || '';
  const subtype = (entity.entity_subtype || entity.type || '').replace(/_/g, ' ');
  const city    = entity.city || '';
  const state   = entity.state || '';
  const hero    = (entity.photos && entity.photos[0] && entity.photos[0].image_url) || entity.hero_image_url || entity.cover_url || getFallbackImg(entity.entity_subtype || entity.type);
  const rating  = entity.rating;
  const reviews = entity.review_count || entity.reviewCount || 0;
  const addr    = entity.address_line_1 || entity.address || '';
  const phone   = entity.phone || '';
  const dir     = entity.directions_url || '';
  const desc    = entity.description || '';
  const hhDays  = entity.hh_days || '';
  const hhStart = entity.hh_start || '';
  const hhEnd   = entity.hh_end || '';
  const location = [city, state].filter(Boolean).join(', ');

  const rawTags = (entity.tags || []).map(t => (typeof t === 'string' ? t : (t.tag || '')).toLowerCase().replace(/[\s\-]+/g, '_')).filter(Boolean);
  const statusBadge = computeStatus(entity.hours || [], rawTags);
  const fullAddr = [addr, city, state].filter(Boolean).join(', ');
  const hoursInfo = computeHoursLine(entity.hours || []);
  const hoursBlock = hoursInfo ? `<div style="margin-top:6px;font-size:13px;color:#42596c;font-weight:600;">🕐 ${hoursInfo}</div>` : '';
  const ratingBlock = rating ? `
    <div class="gcr-card-rating"><span class="gcr-stars">${starsHtml(rating)}</span><span>${Number(rating).toFixed(1)}</span>${reviews ? `<span style="color:#8fa3b1">(${reviews})</span>` : ''}</div>` : '';

  const profileUrl = `profile.html?id=${encodeURIComponent(slug)}`;
  const viewBtn = `<a href="${profileUrl}" class="gcr-btn" style="background:#0b7a75;color:#fff;border-color:#0b7a75;" onclick="event.stopPropagation()">View Profile</a>`;
  const callBtn = phone ? `<a href="tel:${phone.replace(/\D/g,'')}" class="gcr-btn" onclick="event.stopPropagation()">📞 Call</a>` : '';
  const dirBtn  = dir   ? `<a href="${dir}" target="_blank" rel="noopener" class="gcr-btn" onclick="event.stopPropagation()">📍 Directions</a>` : '';

  // HH block
  const hhBlock = hhDays
    ? `<div style="margin-top:6px;font-size:13px;color:#d97706;font-weight:700;">🍺 Happy Hour ${esc(hhDays)}${hhStart ? ' · '+esc(hhStart) : ''}${hhEnd ? '–'+esc(hhEnd) : ''}</div>`
    : '';

  // Specials preview
  const firstSpecial = entitySpecials[0];
  const specialsPreview = firstSpecial
    ? `<div style="margin-top:4px;font-size:13px;color:#0369a1;font-weight:700;">🏷️ ${esc(firstSpecial.special_name || firstSpecial.name || '')}${firstSpecial.discount_text ? ' · '+esc(firstSpecial.discount_text) : ''}</div>`
    : '';

  // HH popup button
  const hhItemsPopupId = `hh-items-${slug.replace(/[^a-z0-9]/g,'_')}`;
  const hhItemsBtn = hhDays
    ? `<button class="gcr-btn" style="background:#d97706;color:#fff;border-color:#d97706;font-size:13px;font-weight:900;" onclick="event.stopPropagation();event.preventDefault();toggleHHItems('${hhItemsPopupId}')">🍺 HH Items</button>`
    : '';
  const hhItemsPopup = hhDays ? `
    <div id="${hhItemsPopupId}" style="display:none;margin-top:14px;border:1px solid #fde68a;border-radius:14px;background:#fffbeb;padding:18px;max-height:400px;overflow-y:auto;">
      <div style="font-weight:900;font-size:15px;color:#92400e;margin-bottom:8px;">🍺 Happy Hour</div>
      <div style="font-size:13px;color:#78350f;font-weight:600;margin-bottom:12px;">${esc(hhDays)}${hhStart ? ' · '+esc(hhStart) : ''}${hhEnd ? '–'+esc(hhEnd) : ''}</div>
      <div id="${hhItemsPopupId}-items">Loading items...</div>
    </div>` : '';

  // Specials popup button
  const specPopupId = `specials-${slug.replace(/[^a-z0-9]/g,'_')}`;
  const specBtn = entitySpecials.length
    ? `<button class="gcr-btn" style="background:#0369a1;color:#fff;border-color:#0369a1;font-size:13px;font-weight:900;" onclick="event.stopPropagation();event.preventDefault();toggleSpecialsPopup('${specPopupId}')">🏷️ Specials</button>`
    : '';
  const specPopup = entitySpecials.length ? `
    <div id="${specPopupId}" style="display:none;margin-top:14px;border:1px solid #bae6fd;border-radius:14px;background:#f0f9ff;padding:18px;max-height:400px;overflow-y:auto;">
      <div style="font-weight:900;font-size:15px;color:#0369a1;margin-bottom:8px;">🏷️ Specials</div>
      ${entitySpecials.map(s => `
        <div style="border-bottom:1px solid #bae6fd;padding:10px 0;">
          <div style="font-weight:700;color:#0c4a6e;">${esc(s.special_name || s.name || '')}</div>
          ${s.discount_text ? `<div style="font-size:13px;color:#0369a1;font-weight:700;margin-top:2px;">${esc(s.discount_text)}</div>` : ''}
          ${s.days ? `<div style="font-size:12px;color:#0369a1;margin-top:4px;font-weight:600;">📅 ${esc(s.days)}</div>` : ''}
        </div>`).join('')}
    </div>` : '';

  return `
    <a href="${profileUrl}"
       style="text-decoration:none;color:inherit;"
       data-slug="${slug}"
       data-tags="${rawTags.join(',').toLowerCase()}"
       data-subtype="${(entity.entity_subtype || entity.type || '').toLowerCase()}"
       data-hh="${entity.hh_days ? '1' : '0'}"
       data-live="0">
      <div class="gcr-card">
        <div class="gcr-card-img" style="background-image:url('${hero}')">
          <div class="gcr-card-badge">${icon} ${subtype}</div>
          ${statusBadge}
        </div>
        <div class="gcr-card-body">
          <div class="gcr-card-name">${esc(name)}</div>
          <div class="gcr-card-sub">${esc([sub, location].filter(Boolean).join(' · '))}</div>
          ${desc ? `<div style="margin-top:8px;font-size:13px;color:#5c6b81;line-height:1.65;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(desc)}</div>` : ''}
          ${ratingBlock}
          ${hoursBlock}
          ${hhBlock}
          ${specialsPreview}
          ${(hhItemsBtn || specBtn) ? `<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">${hhItemsBtn}${specBtn}</div>` : ''}
          <div class="gcr-card-bottom">
            <div class="gcr-card-addr">${esc(fullAddr || location)}</div>
            <div class="gcr-card-actions">${viewBtn}${dirBtn}${callBtn}</div>
          </div>
        </div>
      </div>
      ${hhItemsPopup}${specPopup}
    </a>`;
}

/* ── Populate sidebar with real top-rated entities ── */
function populateSidebar(entities) {
  const heading = document.querySelector('.panel h3');
  if (!heading || heading.textContent.trim() !== 'Popular Nearby') return;
  const panel = heading.closest('.panel');
  if (!panel) return;

  const top = [...entities]
    .filter(e => (e.photos && e.photos[0]) || e.hero_image_url || e.cover_url)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);

  if (!top.length) return;

  panel.innerHTML = `<h3>Popular Nearby</h3>` + top.map(e => {
    const slug = e.slug || e.subdomain || e.id;
    const img  = (e.photos && e.photos[0] && e.photos[0].image_url) || e.hero_image_url || e.cover_url;
    return `
      <div class="mini-card">
        <div class="mini-thumb" style="background-image:url('${img}')"></div>
        <div>
          <div class="mini-name">${e.name}</div>
          <div class="mini-meta">${e.city || ''}${e.rating ? ' · ⭐ ' + Number(e.rating).toFixed(1) : ''}</div>
          <div class="mini-links">
            ${e.directions_url ? `<a href="${e.directions_url}" target="_blank">Directions</a>` : ''}
            ${e.phone ? `<a href="tel:${(e.phone||'').replace(/\D/g,'')}">Call</a>` : ''}
            <a href="profile.html?id=${encodeURIComponent(slug)}">View</a>
          </div>
        </div>
      </div>`;
  }).join('');
}

/* ── Show/hide cards by active filter ── */
function applyFilter(grid, filter) {
  const cards = grid.querySelectorAll('[data-slug]');
  let visible = 0;
  const norm = filter.toLowerCase().replace(/-/g, '_');
  const isCategory = grid.dataset.category || '';

  // Day-of-week filter for specials page
  const isDayFilter = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday','daily'].includes(norm);

  cards.forEach(card => {
    if (filter === 'all') { card.classList.remove('gcr-card-hidden'); visible++; return; }

    let match = false;

    if (isDayFilter && isCategory === 'specials') {
      // Match by specials days — check data-days attribute
      const cardSlug = card.dataset.slug || '';
      const cardSpecials = (window.GCR && GCR.specials || []).filter(s =>
        (s.entity_slug === cardSlug || s.entity_id === card.dataset.entityId) && s.is_active !== false
      );
      match = cardSpecials.some(s => {
        let d = s.days || [];
        if (typeof d === 'string') { try { d = JSON.parse(d); } catch(e) { d = [d]; } }
        const days = (Array.isArray(d) ? d : []).map(x => (x||'').toLowerCase());
        if (norm === 'daily') return days.includes('daily') || days.length === 0;
        return days.includes(norm) || days.includes('daily') || days.includes('everyday');
      });
    } else {
      const tags    = (card.dataset.tags || '').split(',');
      const subtype = card.dataset.subtype || '';
      match = tags.some(t => t === norm || t.includes(norm)) || subtype.includes(norm);
      if (norm === 'happy_hour' && card.dataset.hh === '1') match = true;
      if ((norm === 'live_music' || norm === 'live music') && card.dataset.live === '1') match = true;
    }

    card.classList.toggle('gcr-card-hidden', !match);
    if (match) visible++;
  });

  const meta = document.querySelector('.toolbar-meta');
  if (meta) meta.textContent = `${visible} result${visible !== 1 ? 's' : ''}`;
}

/* ── Build dynamic filter chips from actual entity tags ── */
function buildDynamicFilters(entities) {
  const chipContainer = document.querySelector('.tag-row, .filter-row, .chips-row');
  if (!chipContainer) return;

  // Specials page gets day-of-week chips instead of tag chips
  const grid = document.getElementById('listingsGrid');
  if (grid && grid.dataset.category === 'specials') {
    const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday','daily'];
    const dayLabels = { monday:'Mon',tuesday:'Tue',wednesday:'Wed',thursday:'Thu',friday:'Fri',saturday:'Sat',sunday:'Sun',daily:'Daily' };
    // Only show days that have actual specials
    const activeDay = new Set();
    (window.GCR && GCR.specials || []).filter(s => s.is_active !== false).forEach(s => {
      let d = s.days || [];
      if (typeof d === 'string') { try { d = JSON.parse(d); } catch(e) { d = [d]; } }
      (Array.isArray(d) ? d : []).forEach(day => activeDay.add((day||'').toLowerCase()));
    });
    const allBtn = '<button class="tag-btn active" data-filter="all">All</button>';
    const dayBtns = days.filter(d => activeDay.has(d) || d === 'daily').map(d =>
      `<button class="tag-btn" data-filter="${d}">${dayLabels[d]||d}</button>`
    ).join('');
    chipContainer.innerHTML = allBtn + dayBtns;
    return;
  }

  // Count tags across all entities on this page
  const tagCounts = {};
  entities.forEach(e => {
    const tags = (e.tags || []).map(t => typeof t === 'string' ? t : (t.tag || '')).filter(Boolean);
    const tagNorms = tags.map(t => t.toLowerCase().replace(/[\s\-]+/g, '_'));
    tagNorms.forEach(norm => {
      tagCounts[norm] = (tagCounts[norm] || 0) + 1;
    });
    // Count hh_days businesses as happy_hour even if they don't have the tag
    if (e.hh_days && !tagNorms.includes('happy_hour')) {
      tagCounts['happy_hour'] = (tagCounts['happy_hour'] || 0) + 1;
    }
  });

  // Priority tags that should be first if they exist (most useful filters)
  const PRIORITY = [
    'happy_hour', 'live_music', 'waterfront', 'seafood', 'family_friendly',
    'outdoor_seating', 'pet_friendly', 'breakfast', 'brunch', 'bar_grill',
    'southern', 'pizza', 'mexican', 'coffee', 'ice_cream', 'nightlife',
    'parasailing', 'boat_rental', 'fishing', 'kayak', 'dolphin', 'jet_ski',
    'boutique', 'souvenir', 'waterfront_dining', 'reservations', 'delivery', 'takeout'
  ];

  // Sort: priority tags first (in order), then by frequency
  const sorted = Object.entries(tagCounts)
    .sort((a, b) => {
      const aIdx = PRIORITY.indexOf(a[0]);
      const bIdx = PRIORITY.indexOf(b[0]);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return b[1] - a[1];
    })
    .slice(0, 15);

  if (!sorted.length) return;

  // Build new chip HTML — keep "All" as first chip
  const allBtn = '<button class="tag-btn active" data-filter="all">All</button>';
  const tagBtns = sorted.map(([tag]) => {
    const label = tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `<button class="tag-btn" data-filter="${tag}">${label}</button>`;
  }).join('');

  chipContainer.innerHTML = allBtn + tagBtns;
}

/* ── Wire filter chips — use event delegation to avoid stacking listeners ── */
function wireFilterChips(grid) {
  const container = document.querySelector('.tag-row, .filter-row, .chips-row');
  if (!container || container._wired) return;
  container._wired = true;
  container.addEventListener('click', e => {
    const btn = e.target.closest('.tag-btn, .filter-chip');
    if (!btn) return;
    document.querySelectorAll('.tag-btn, .filter-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter || 'all';
    applyFilter(grid, filter);
    const url = new URL(window.location);
    filter !== 'all' ? url.searchParams.set('tag', filter) : url.searchParams.delete('tag');
    window.history.replaceState({}, '', url);
  });
}

/* ── Get entities for this page's category ── */
function getEntitiesForCategory(businesses, category) {
  return businesses.filter(b => {
    // Happy Hours — hh_days set OR happy_hour tag OR has happy_hour_items via specials
    if (category === 'happy-hours') {
      if (b.hh_days) return true;
      const tags = (b.tags || []).map(t => (typeof t === 'string' ? t : t.tag || '').toLowerCase());
      if (tags.some(t => t === 'happy_hour')) return true;
      // Check entity_specials for happy_hour type
      const hhSpecials = (window.GCR && GCR.specials || []).filter(s =>
        (s.special_type || s.type || '').toLowerCase() === 'happy_hour' &&
        s.is_active !== false
      );
      return hhSpecials.some(s =>
        (s.entity_slug && s.entity_slug === b.slug) ||
        (s.entity_id && s.entity_id === b.id)
      );
    }

    // Specials — ONLY businesses that have actual active rows in GCR.specials
    if (category === 'specials') {
      const specials = (window.GCR && GCR.specials || []).filter(s => s.is_active !== false && s.active !== false);
      return specials.some(s =>
        (s.entity_slug && s.entity_slug === b.slug) ||
        (s.entity_id && s.entity_id === b.id) ||
        (s.slug && s.slug === b.slug)
      );
    }

    const raw = (b.entity_subtype || b.type || b.category || '').toLowerCase();
    const norm = raw.replace(/-/g, '_');
    const catMatch = raw === category || SUBTYPE_TO_CATEGORY[raw] === category || SUBTYPE_TO_CATEGORY[norm] === category;
    if (!catMatch) return false;
    // Skip incomplete imports — must have at least one of: image, tags, description, phone, or subtitle
    const hasTags  = (b.tags || []).length > 0;
    const hasImage = !!(b.hero_image_url || b.cover_url);
    const hasDesc  = !!(b.description || b.subtitle || b.tagline);
    const hasPhone = !!b.phone;
    return hasTags || hasImage || hasDesc || hasPhone;
  });
}

/* ── Main init for standard pages ── */
function initStandardPage() {
  const grid = document.getElementById('listingsGrid');
  if (!grid) return;

  const category = grid.dataset.category || '';

  // Show loading state immediately
  if (!grid.children.length) {
    grid.innerHTML = `
      <div style="padding:40px;text-align:center;">
        <div style="display:inline-block;width:36px;height:36px;border:4px solid #e2e8f0;border-top-color:#0b7a75;border-radius:50%;animation:gcr-spin 0.7s linear infinite;"></div>
        <p style="margin-top:14px;color:#66788a;font-size:.9rem;font-weight:600;">Loading Gulf Coast businesses...</p>
      </div>`;
    if (!document.getElementById('gcr-spin-style')) {
      const ss = document.createElement('style');
      ss.id = 'gcr-spin-style';
      ss.textContent = '@keyframes gcr-spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(ss);
    }
  }

  // Pre-activate chip from URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlTag = urlParams.get('tag') || urlParams.get('filter') || '';
  if (urlTag) {
    document.querySelectorAll('.tag-btn, .filter-chip').forEach(btn => {
      const f = (btn.dataset.filter || '').replace(/-/g, '_');
      btn.classList.toggle('active', f === urlTag.replace(/-/g, '_'));
    });
  }

  let _allEntities = [];

  function updateStatRow(entities) {
    const now      = new Date();
    const DAYS     = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const todayName = DAYS[now.getDay()];
    const todayStr  = now.toISOString().split('T')[0];
    const nowMins   = now.getHours() * 60 + now.getMinutes();

    let openCount = 0, waterfrontCount = 0, hhCount = 0;
    entities.forEach(e => {
      const tags = (e.tags || []).map(t => (typeof t === 'string' ? t : t.tag || '').toLowerCase());
      if (tags.some(t => t.includes('waterfront'))) waterfrontCount++;
      if (e.hh_days) hhCount++;
      const todayHours = (e.hours || []).find(h => h.day_of_week && h.day_of_week.toLowerCase() === todayName);
      if (todayHours && !todayHours.is_closed && todayHours.open_time && todayHours.close_time) {
        const [oh, om] = todayHours.open_time.split(':').map(Number);
        const [ch, cm] = todayHours.close_time.split(':').map(Number);
        if (nowMins >= oh*60+(om||0) && nowMins < ch*60+(cm||0)) openCount++;
      }
    });

    // Live music tonight = actual events from GCR.events, not tags
    const entitySlugs = new Set(entities.map(e => e.slug || e.id));
    const musicTonight = (window.GCR && GCR.events || []).filter(e => {
      const isToday = e.event_date === todayStr;
      const isRecurringToday = e.recurring && (e.day_of_week || '').toLowerCase() === todayName;
      if (!isToday && !isRecurringToday) return false;
      const t = (e.event_type || '').toLowerCase();
      const n = (e.event_name || '').toLowerCase();
      return t.includes('live') || t.includes('music') || t.includes('dj') || n.includes('live music') || n.includes('dj');
    }).filter(e => entitySlugs.has(e.entity_slug || e.slug));

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-open',  `🟢 Open Now: ${openCount}`);
    set('stat-water', `🌊 Waterfront: ${waterfrontCount}`);
    set('stat-hh',    `🍻 Happy Hour: ${hhCount}`);
    set('stat-music', `🎸 Live Music Tonight: ${musicTonight.length}`);
  }

  function sortEntities(entities, sortBy) {
    const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const todayName = DAYS[new Date().getDay()];
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

    const copy = [...entities];
    if (sortBy === 'rating') {
      return copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    if (sortBy === 'open') {
      return copy.sort((a, b) => {
        const isOpen = e => {
          const row = (e.hours || []).find(h => h.day_of_week && h.day_of_week.toLowerCase() === todayName);
          if (!row || row.is_closed || !row.open_time || !row.close_time) return 0;
          const [oh, om] = row.open_time.split(':').map(Number);
          const [ch, cm] = row.close_time.split(':').map(Number);
          return (nowMins >= oh*60+(om||0) && nowMins < ch*60+(cm||0)) ? 1 : 0;
        };
        return isOpen(b) - isOpen(a);
      });
    }
    if (sortBy === 'waterfront') {
      return copy.sort((a, b) => {
        const hasTag = e => (e.tags || []).some(t => (typeof t === 'string' ? t : t.tag || '').toLowerCase().includes('waterfront'));
        return hasTag(b) - hasTag(a);
      });
    }
    if (sortBy === 'happy_hour') {
      return copy.sort((a, b) => (b.hh_days ? 1 : 0) - (a.hh_days ? 1 : 0));
    }
    if (sortBy === 'live_music') {
      return copy.sort((a, b) => {
        const hasMusic = e => (e.tags || []).some(t => (typeof t === 'string' ? t : t.tag || '').toLowerCase().includes('live_music'));
        return hasMusic(b) - hasMusic(a);
      });
    }
    return copy;
  }

  function renderEntities(entities) {
    if (!entities.length) {
      grid.innerHTML = `
        <div class="gcr-empty">
          <div class="gcr-empty-icon">🌊</div>
          <h3>Coming Soon</h3>
          <p>We're adding Gulf Coast businesses every day. Check back soon!</p>
        </div>`;
      const meta = document.getElementById('resultCount') || document.querySelector('.toolbar-meta');
      if (meta) meta.textContent = '0 listed';
      return;
    }

    // Capture which filter is currently active BEFORE rebuilding the grid
    const activeChip = document.querySelector('.tag-btn.active, .filter-chip.active');
    const currentFilter = (activeChip ? activeChip.dataset.filter : null) || urlTag || 'all';

    const cardFn = category === 'happy-hours' ? buildHHCard
                 : category === 'specials'    ? buildSpecialsCard
                 : category === 'deals'       ? buildHHSpecialsCard
                 : buildCard;
    grid.innerHTML = entities.map(cardFn).join('');
    const meta = document.getElementById('resultCount') || document.querySelector('.toolbar-meta');
    if (meta) meta.textContent = `${entities.length} listed`;
    wireFilterChips(grid);

    // Activate chip from URL on initial page load
    if (urlTag) {
      document.querySelectorAll('.tag-btn, .filter-chip').forEach(btn => {
        const f = (btn.dataset.filter || '').replace(/-/g, '_');
        btn.classList.toggle('active', f === urlTag.replace(/-/g, '_'));
      });
    }

    // Always re-apply the active filter after rebuilding (preserves filter state across sort)
    if (currentFilter && currentFilter !== 'all') {
      applyFilter(grid, currentFilter);
    }
  }

  function render(businesses) {
    _allEntities = getEntitiesForCategory(businesses, category);
    renderEntities(_allEntities);
    buildDynamicFilters(_allEntities);
    updateStatRow(_allEntities);
    populateSidebar(_allEntities);

    // Wire sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach(b => {
          b.style.background = '#fff';
          b.style.color = '#25465b';
          b.classList.remove('active');
        });
        btn.style.background = '#0b7a75';
        btn.style.color = '#fff';
        btn.classList.add('active');
        const sorted = sortEntities(_allEntities, btn.dataset.sort || 'default');
        renderEntities(sorted);
      });
    });
  }

  if (window.GCR && GCR.loaded) {
    render(GCR.businesses);
  } else {
    document.addEventListener('gcr:loaded', e => render(e.detail.businesses || []));
  }

  wireFilterChips(grid);
}

/* ============================================================
   GCR EVENTS — modular builders, usable on any page
   Usage:
     GCREvents.renderList('#myDiv')                     full list view (events page)
     GCREvents.renderStrip('#myDiv', { limit:4 })       teaser strip (homepage)
     GCREvents.renderForVenue('#myDiv', 'tacky-jacks')  venue profile
     GCREvents.renderLiveMusic('#myDiv')                nightlife page
   ============================================================ */
const GCREvents = (() => {
  const MUSIC_IMG  = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80';
  const EVENT_IMG  = 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80';
  const MARKET_IMG = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80';
  const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fmt12(t) { if (!t) return ''; const [h,m]=t.split(':').map(Number); const ap=h>=12?'pm':'am'; const h12=h%12||12; return m?`${h12}:${String(m).padStart(2,'0')}${ap}`:`${h12}${ap}`; }

  function venueOf(ev) {
    const vp = (ev.venue_location||'').split(',');
    return {
      biz:  ev.entity_name || ev.businessName || vp[0]?.trim() || '',
      city: ev.entity_city || ev.city || vp.slice(1).join(',').trim() || '',
      slug: ev.entity_slug || ev.slug || '',
      hero: ev.entity_hero_image_url || ev.hero_image_url || fallbackImg(ev),
    };
  }

  function fallbackImg(ev) {
    const t = (ev.event_type||'').toLowerCase();
    if (t.includes('music')||t.includes('live')||t.includes('mic')||t.includes('karaoke')) return MUSIC_IMG;
    if (t.includes('market')) return MARKET_IMG;
    return EVENT_IMG;
  }

  function todayStr() { return new Date().toISOString().split('T')[0]; }
  function todayName() { return DAYS[new Date().getDay()]; }

  function isTonight(ev) {
    return ev.event_date === todayStr() || (ev.recurring && (ev.day_of_week||'').toLowerCase() === todayName());
  }

  // ── Single compact list row with expandable detail ──
  function buildRow(ev, idx) {
    const v = venueOf(ev);
    const time = ev.start_time ? fmt12(ev.start_time) : '—';
    const desc = (ev.description||'').slice(0,160);
    const profileUrl = v.slug ? `profile.html?id=${encodeURIComponent(v.slug)}` : '';
    const eid = `gcrev-${idx}`;
    return `
      <div class="gcr-ev-row" id="row-${eid}" onclick="GCREvents.toggle('${eid}')">
        <div class="gcr-ev-time">${esc(time)}</div>
        <div class="gcr-ev-name">${esc(ev.event_name||'')}</div>
        <div class="gcr-ev-venue">📍 ${esc(v.biz)}${v.city?' · '+esc(v.city):''}</div>
        <div class="gcr-ev-chev">▶</div>
      </div>
      <div class="gcr-ev-expand" id="exp-${eid}">
        <div class="gcr-ev-thumb" style="background-image:url('${v.hero}')"></div>
        <div class="gcr-ev-detail">
          <div class="gcr-ev-detail-name">${esc(ev.event_name||'')}</div>
          <div class="gcr-ev-detail-meta">📍 ${esc(v.biz)}${v.city?' · '+esc(v.city):''}${ev.start_time?' &nbsp;·&nbsp; 🕐 '+fmt12(ev.start_time):''}</div>
          ${desc?`<div class="gcr-ev-detail-desc">${esc(desc)}</div>`:''}
          <div class="gcr-ev-detail-btns">
            ${profileUrl?`<a href="${profileUrl}" class="gcr-ev-btn primary">View Venue →</a>`:''}
            ${profileUrl?`<a href="${profileUrl}#events" class="gcr-ev-btn">All Events at ${esc(v.biz)}</a>`:''}
          </div>
        </div>
      </div>`;
  }

  // ── Full card (artist-focused) ──
  function buildCard(ev) {
    const v = venueOf(ev);
    const time = ev.start_time ? fmt12(ev.start_time) : '';
    const desc = (ev.description||'').slice(0,120);
    const profileUrl = v.slug ? `profile.html?id=${encodeURIComponent(v.slug)}` : '';
    const isMusic = (ev.event_type||'').includes('live')||(ev.event_type||'').includes('music')||(ev.event_type||'').includes('mic');
    const etype = (ev.event_type||'').replace(/_/g,' ');
    return `
      <div class="gcr-ev-card">
        <div class="gcr-ev-card-img" style="background-image:url('${v.hero}')">
          <div class="gcr-ev-card-badge">${esc(etype||'Event')}</div>
        </div>
        <div class="gcr-ev-card-body">
          ${isMusic?`<div class="gcr-ev-card-label">🎸 Live Music</div>`:''}
          <div class="gcr-ev-card-name">${esc(ev.event_name||'')}</div>
          <div class="gcr-ev-card-venue">📍 ${esc(v.biz)}${v.city?' · '+esc(v.city):''}</div>
          ${time?`<div class="gcr-ev-card-time">🕐 ${time}</div>`:''}
          ${desc?`<div class="gcr-ev-card-desc">${esc(desc)}</div>`:''}
          <div class="gcr-ev-card-btns">
            ${profileUrl?`<a href="${profileUrl}" class="gcr-ev-btn primary">View Venue →</a>`:''}
          </div>
        </div>
      </div>`;
  }

  // ── Small teaser card for strips/homepage ──
  function buildMiniCard(ev) {
    const v = venueOf(ev);
    const time = ev.start_time ? fmt12(ev.start_time) : '';
    const profileUrl = v.slug ? `profile.html?id=${encodeURIComponent(v.slug)}` : '';
    return `
      <a href="${profileUrl||'events.html'}" class="gcr-ev-mini">
        <div class="gcr-ev-mini-img" style="background-image:url('${v.hero}')">
          ${time?`<div class="gcr-ev-mini-time">🕐 ${esc(time)}</div>`:''}
        </div>
        <div class="gcr-ev-mini-body">
          <div class="gcr-ev-mini-name">${esc(ev.event_name||'')}</div>
          <div class="gcr-ev-mini-venue">📍 ${esc(v.biz)}${v.city?' · '+esc(v.city):''}</div>
        </div>
      </a>`;
  }

  // ── Inject shared CSS once ──
  let _cssInjected = false;
  function injectCSS() {
    if (_cssInjected) return;
    _cssInjected = true;
    const s = document.createElement('style');
    s.textContent = `
      .gcr-ev-row{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:14px;background:#fff;border:1px solid #e2e8f0;margin-bottom:6px;cursor:pointer;transition:.14s ease}
      .gcr-ev-row:hover{background:#f7fbfc;border-color:#b9e7ef}
      .gcr-ev-row.open .gcr-ev-chev{transform:rotate(90deg)}
      .gcr-ev-time{font-size:13px;font-weight:800;color:#7c3aed;min-width:48px;text-align:right;flex-shrink:0}
      .gcr-ev-name{flex:1;font-size:15px;font-weight:800;color:#12263a}
      .gcr-ev-venue{font-size:13px;color:#66788a;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px}
      .gcr-ev-chev{font-size:12px;color:#b0c4ce;transition:.2s ease;flex-shrink:0}
      .gcr-ev-expand{display:none;margin:-4px 0 8px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 14px 14px;background:#fafcfe;padding:14px 16px;gap:12px}
      .gcr-ev-expand.open{display:flex;flex-wrap:wrap;align-items:flex-start}
      .gcr-ev-thumb{width:90px;height:76px;border-radius:12px;background-size:cover;background-position:center;flex-shrink:0}
      .gcr-ev-detail{flex:1;min-width:160px}
      .gcr-ev-detail-name{font-size:17px;font-weight:900;color:#12263a}
      .gcr-ev-detail-meta{font-size:13px;color:#66788a;margin-top:3px;font-weight:600}
      .gcr-ev-detail-desc{font-size:13px;color:#50677a;margin-top:6px;line-height:1.5}
      .gcr-ev-detail-btns{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
      .gcr-ev-btn{padding:8px 14px;border-radius:10px;font-size:12px;font-weight:800;border:1px solid #e2e8f0;background:#fff;color:#25465b;text-decoration:none;cursor:pointer;display:inline-block}
      .gcr-ev-btn.primary{background:#0b7a75;border-color:#0b7a75;color:#fff}
      .gcr-ev-card{display:grid;grid-template-columns:220px 1fr;background:#fff;border:1px solid #e2e8f0;border-radius:20px;box-shadow:0 10px 28px rgba(15,34,51,.08);overflow:hidden;margin-bottom:14px}
      .gcr-ev-card-img{min-height:200px;background-size:cover;background-position:center;position:relative}
      .gcr-ev-card-badge{position:absolute;left:12px;bottom:12px;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.92);color:#21485d;font-weight:800;font-size:12px}
      .gcr-ev-card-body{padding:16px 18px}
      .gcr-ev-card-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#0f7c90;margin-bottom:4px}
      .gcr-ev-card-name{font-size:24px;font-weight:900;color:#12263a;letter-spacing:-.02em}
      .gcr-ev-card-venue{font-size:14px;color:#0f7c90;font-weight:700;margin-top:4px}
      .gcr-ev-card-time{display:inline-flex;align-items:center;gap:6px;margin-top:10px;background:#f4efff;color:#7c3aed;border:1px solid #e1d3ff;border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px}
      .gcr-ev-card-desc{margin-top:10px;color:#42596c;font-size:13px;line-height:1.5}
      .gcr-ev-card-btns{margin-top:12px}
      .gcr-ev-mini{display:flex;flex-direction:column;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;text-decoration:none;color:inherit;transition:.14s ease;min-width:180px;flex:1}
      .gcr-ev-mini:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(15,34,51,.1)}
      .gcr-ev-mini-img{height:110px;background-size:cover;background-position:center;position:relative}
      .gcr-ev-mini-time{position:absolute;bottom:8px;left:8px;background:rgba(15,34,51,.8);color:#fff;padding:4px 8px;border-radius:8px;font-size:12px;font-weight:800}
      .gcr-ev-mini-body{padding:10px 12px}
      .gcr-ev-mini-name{font-size:14px;font-weight:800;color:#12263a}
      .gcr-ev-mini-venue{font-size:12px;color:#66788a;margin-top:2px;font-weight:600}
      .gcr-ev-strip{display:flex;gap:12px;overflow-x:auto;padding-bottom:4px}
      @media(max-width:760px){.gcr-ev-card{grid-template-columns:1fr}.gcr-ev-card-img{min-height:160px}.gcr-ev-venue{max-width:160px}}
    `;
    document.head.appendChild(s);
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  // Full list (events page)
  function renderList(selector, opts={}) {
    const el = document.querySelector(selector); if (!el) return;
    injectCSS();
    const events = _getEvents(opts);
    if (!events.length) { el.innerHTML = _empty('No events found'); return; }
    el.innerHTML = events.map((e,i) => buildRow(e, (opts.offset||0)+i)).join('');
  }

  // Card grid (events page card view)
  function renderCards(selector, opts={}) {
    const el = document.querySelector(selector); if (!el) return;
    injectCSS();
    const events = _getEvents(opts);
    if (!events.length) { el.innerHTML = _empty('No events found'); return; }
    el.innerHTML = events.map(buildCard).join('');
  }

  // Horizontal strip for homepage / sidebars
  function renderStrip(selector, opts={}) {
    const el = document.querySelector(selector); if (!el) return;
    injectCSS();
    const events = _getEvents({ tonight: true, limit: opts.limit||4, ...opts });
    if (!events.length) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="gcr-ev-strip">${events.map(buildMiniCard).join('')}</div>`;
  }

  // Events for a specific venue (profile page)
  function renderForVenue(selector, slug, opts={}) {
    renderList(selector, { slug, ...opts });
  }

  // Live music only (nightlife page)
  function renderLiveMusic(selector, opts={}) {
    renderList(selector, { type: 'live_music_or_event', ...opts });
  }

  // Toggle expand on a list row
  function toggle(eid) {
    const exp = document.getElementById('exp-'+eid);
    const row = document.getElementById('row-'+eid);
    if (!exp || !row) return;
    const open = exp.classList.toggle('open');
    row.classList.toggle('open', open);
  }

  // ── Internal helpers ────────────────────────────────────────────────────────
  function _getEvents(opts={}) {
    let events = (window.GCR && GCR.events) || [];
    if (opts.tonight) events = events.filter(isTonight);
    if (opts.slug)    events = events.filter(e => (e.entity_slug||e.slug||'') === opts.slug);
    if (opts.type)    events = events.filter(e => (e.event_type||'').toLowerCase() === opts.type.toLowerCase());
    if (opts.date)    events = events.filter(e => e.event_date === opts.date);
    events = events.sort((a,b) => (a.start_time||'99:99').localeCompare(b.start_time||'99:99'));
    if (opts.limit)   events = events.slice(0, opts.limit);
    return events;
  }

  function _empty(msg) {
    return `<div style="padding:40px 24px;text-align:center;color:#66788a;font-weight:700;">${msg}</div>`;
  }

  return { renderList, renderCards, renderStrip, renderForVenue, renderLiveMusic, toggle, buildRow, buildCard, buildMiniCard };
})();

/* ── Set --gcr-header-h CSS variable to actual header height so toolbar sticks correctly ── */
function setHeaderHeight() {
  const header = document.querySelector('.gcr-header');
  if (header) {
    document.documentElement.style.setProperty('--gcr-header-h', header.offsetHeight + 'px');
  }
}

/* ── Boot ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { setHeaderHeight(); initStandardPage(); });
} else {
  setHeaderHeight();
  initStandardPage();
}
