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
    .gcr-card:hover{transform:translateY(-2px);box-shadow:0 16px 36px rgba(15,34,51,.13);}
    .gcr-card-img{
      min-height:210px;background-size:cover;background-position:center;
      position:relative;
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

/* ── Fallback hero image ── */
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80';

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
  'things_to_do':'things-to-do',

  // Nightlife
  nightlife:'nightlife',
  bar_club:'nightlife', nightclub:'nightlife', sports_bar:'nightlife',
  rooftop_bar:'nightlife', lounge:'nightlife',

  // Services
  services:'services', service:'services',
  salon:'services', spa:'services', photographer:'services', photography:'services',
  wellness:'services', transportation:'services',

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
  photography:'other.html',        photographer:'other.html',
};

function tagToPage(tag) {
  const lower = (tag || '').toLowerCase();
  const key = lower.replace(/ /g, '_');
  if (TAG_TO_PAGE[key]) return TAG_TO_PAGE[key];
  if (TAG_TO_PAGE[lower]) return TAG_TO_PAGE[lower];
  // Fuzzy match — check if tag contains a known keyword
  if (/happy.?hour/.test(lower)) return 'happy-hours.html';
  if (/live.?music/.test(lower)) return 'events.html';
  if (/waterfront/.test(lower)) return 'restaurants.html';
  if (/seafood/.test(lower))    return 'restaurants.html';
  if (/parasail/.test(lower))   return 'things-to-do.html';
  if (/fishing/.test(lower))    return 'things-to-do.html';
  if (/coffee/.test(lower))     return 'coffee-sweets.html';
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

/* ── Time-aware status badge ── */
function computeStatus(hours, tags) {
  const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const now = new Date();
  const todayName = DAYS[now.getDay()];
  const nowMins = now.getHours() * 60 + now.getMinutes();

  // Find today's hours row
  const todayRow = (hours || []).find(h =>
    h.day_of_week && h.day_of_week.toLowerCase() === todayName
  );

  let statusHtml = '';

  if (todayRow) {
    if (todayRow.is_closed) {
      statusHtml = '<div class="gcr-status closed">Closed Today</div>';
    } else if (todayRow.open_time && todayRow.close_time) {
      const parseMins = t => {
        if (!t) return null;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + (m || 0);
      };
      const fmt12 = t => {
        if (!t) return '';
        let [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'pm' : 'am';
        h = h % 12 || 12;
        return m ? `${h}:${String(m).padStart(2,'0')}${ampm}` : `${h}${ampm}`;
      };
      const openMins  = parseMins(todayRow.open_time);
      const closeMins = parseMins(todayRow.close_time);

      if (openMins !== null && closeMins !== null) {
        if (nowMins < openMins - 60) {
          // More than 1hr before open — closed but not "opening soon"
          statusHtml = `<div class="gcr-status closed">Opens ${fmt12(todayRow.open_time)}</div>`;
        } else if (nowMins < openMins) {
          statusHtml = `<div class="gcr-status opening">Opening Soon · ${fmt12(todayRow.open_time)}</div>`;
        } else if (nowMins >= openMins && nowMins < closeMins - 60) {
          statusHtml = `<div class="gcr-status open">Open · Closes ${fmt12(todayRow.close_time)}</div>`;
        } else if (nowMins >= closeMins - 60 && nowMins < closeMins) {
          statusHtml = `<div class="gcr-status closing">Closing Soon · ${fmt12(todayRow.close_time)}</div>`;
        } else {
          statusHtml = `<div class="gcr-status closed">Closed · Opens ${fmt12(todayRow.open_time)}</div>`;
        }
      }
    }
  }

  // Live music overlay — if entity has live_music tag and it's evening
  const tagList = (tags || []).map(t => (typeof t === 'string' ? t : t.tag || '').toLowerCase());
  if (tagList.includes('live_music') || tagList.includes('live music')) {
    const hour = now.getHours();
    if (hour >= 16 && hour < 23) {
      statusHtml = '<div class="gcr-status music">🎸 Live Music Tonight</div>';
    }
  }

  return statusHtml;
}

/* ── Today's hours one-liner for card ── */
function computeHoursLine(hours) {
  if (!hours || !hours.length) return '';
  const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const todayName = DAYS[new Date().getDay()];
  const todayRow = hours.find(h => h.day_of_week && h.day_of_week.toLowerCase() === todayName);
  if (!todayRow) return '';
  if (todayRow.is_closed) return 'Closed Today';
  if (todayRow.open_time && todayRow.close_time) {
    const fmt = t => { let [h,m] = t.split(':').map(Number); const ap = h>=12?'pm':'am'; h=h%12||12; return m ? `${h}:${String(m).padStart(2,'0')}${ap}` : `${h}${ap}`; };
    return `Today ${fmt(todayRow.open_time)} – ${fmt(todayRow.close_time)}`;
  }
  return '';
}

/* ── Build one card ── */
function buildCard(entity) {
  const slug   = entity.slug || entity.subdomain || entity.id || '';
  const name   = entity.name || 'Business';
  const icon   = entity.icon || entity.emoji || '📍';
  const sub    = entity.subtitle || entity.tagline || '';
  const subtype = (entity.entity_subtype || entity.type || '').replace(/_/g, ' ');
  const city   = entity.city || '';
  const state  = entity.state || '';
  const hero   = entity.hero_image_url || entity.cover_url || FALLBACK_IMG;
  const rating = entity.rating;
  const reviews = entity.review_count || entity.reviewCount || 0;
  const addr   = entity.address_line_1 || entity.address || '';
  const phone  = entity.phone || '';
  const dir    = entity.directions_url || '';
  const website = entity.website_url || entity.website || '';
  const bookingUrl = entity.booking_url || '';
  const reservationUrl = entity.reservation_url || '';
  const orderUrl = entity.order_url || '';
  const desc = entity.description || '';
  const hhDays = entity.hh_days || '';
  const hhStart = entity.hh_start || '';
  const hhEnd = entity.hh_end || '';

  const location = [city, state].filter(Boolean).join(', ');

  // Normalize tags
  const rawTags = (entity.tags || []).map(t => (typeof t === 'string' ? t : (t.tag || '')).toLowerCase().replace(/ /g, '_')).filter(Boolean);

  const statusBadge = computeStatus(entity.hours || [], rawTags);

  // Price info — check priceRange or tags for price indicators
  const priceRange = entity.priceRange || entity.price_range || '';
  const priceTag = rawTags.find(t => t.startsWith('$') || t.includes('from_'));
  const priceDisplay = priceRange || (priceTag ? priceTag.replace(/_/g,' ') : '');

  const chipLinks = rawTags.slice(0, 4).map(tag => {
    const dest = tagToPage(tag);
    return `<a href="${dest}?tag=${encodeURIComponent(tag)}" class="gcr-chip"
      onclick="event.stopPropagation()">${tagLabel(tag)}</a>`;
  }).join('');

  const ratingBlock = rating ? `
    <div class="gcr-card-rating">
      <span class="gcr-stars">${starsHtml(rating)}</span>
      <span>${Number(rating).toFixed(1)}</span>
      ${reviews ? `<span style="color:#8fa3b1">(${reviews})</span>` : ''}
    </div>` : '';

  // Action buttons — no Website button, no duplicates
  const usedUrls = new Set();
  const dedupeBtn = (url, label, style) => {
    if (!url) return '';
    const key = url.replace(/https?:\/\//, '').replace(/\/$/, '').split('?')[0];
    if (usedUrls.has(key)) return '';
    usedUrls.add(key);
    return `<a href="${url}" target="_blank" rel="noopener" class="gcr-btn" style="${style||''}" onclick="event.stopPropagation()">${label}</a>`;
  };
  const profileUrl = `profile.html?id=${encodeURIComponent(slug)}`;
  const viewBtn    = `<a href="${profileUrl}" class="gcr-btn" style="background:#0b7a75;color:#fff;border-color:#0b7a75;" onclick="event.stopPropagation()">View Profile</a>`;
  const menuBtn    = `<a href="${profileUrl}" class="gcr-btn" onclick="event.stopPropagation()">🍽️ View Menu</a>`;
  const callBtn    = phone ? `<a href="tel:${phone.replace(/\D/g,'')}" class="gcr-btn" onclick="event.stopPropagation()">📞 Call</a>` : '';
  const dirBtn     = dedupeBtn(dir,            '📍 Directions', '');
  const bookBtn    = dedupeBtn(bookingUrl,     '📅 Book Now',   'background:#0ea5e9;color:#fff;border-color:#0ea5e9;');
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
      <div style="font-size:13px;color:#78350f;font-weight:600;">${hhDays}${hhStart ? ' · '+hhStart : ''}${hhEnd ? '–'+hhEnd : ''}</div>
      ${entity.hh_description ? `<div style="margin-top:6px;font-size:13px;color:#92400e;line-height:1.5;">${entity.hh_description}</div>` : ''}
    </div>` : '';

  // About — 3 lines, no fallback
  const aboutBlock = desc
    ? `<div style="margin-top:8px;font-size:13px;color:#5c6b81;line-height:1.65;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${desc}</div>`
    : '';

  // Hours — only if data exists
  const fullAddr  = [addr, city, state].filter(Boolean).join(', ');
  const hoursInfo = computeHoursLine(entity.hours || []);
  const hoursBlock = hoursInfo
    ? `<div style="margin-top:6px;font-size:13px;color:#42596c;font-weight:600;">🕐 ${hoursInfo}</div>`
    : '';

  // Happy hour — only if data exists
  const hhBlock = hhDays
    ? `<div style="margin-top:6px;font-size:13px;color:#d97706;font-weight:700;">🍺 Happy Hour ${hhDays}${hhStart ? ' · '+hhStart : ''}${hhEnd ? '–'+hhEnd : ''}</div>`
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
  const musicBlock = todayMusic.length
    ? `<div style="margin-top:6px;font-size:13px;color:#7c3aed;font-weight:700;">🎸 Live Music Tonight: ${todayMusic.map(e=>e.event_name||'Live Music').join(', ')}</div>`
    : '';

  return `
    <a href="profile.html?id=${encodeURIComponent(slug)}"
       style="text-decoration:none;color:inherit;display:block;"
       data-slug="${slug}"
       data-tags="${rawTags.join(',').toLowerCase()}"
       data-subtype="${(entity.entity_subtype || entity.type || '').toLowerCase()}">
      <div class="gcr-card">
        <div class="gcr-card-img" style="background-image:url('${hero}')">
          <div class="gcr-card-badge">${icon} ${subtype}</div>
          ${statusBadge}
          ${priceDisplay ? `<div style="position:absolute;right:14px;bottom:14px;padding:6px 12px;border-radius:999px;background:rgba(46,155,85,.92);color:#fff;font-weight:800;font-size:13px;">${priceDisplay}</div>` : ''}
        </div>
        <div class="gcr-card-body">
          <div class="gcr-card-name">${name}</div>
          <div class="gcr-card-sub">${[sub, location].filter(Boolean).join(' · ')}</div>
          ${aboutBlock}
          ${ratingBlock}
          ${chipLinks ? `<div class="gcr-chips">${chipLinks}</div>` : ''}
          ${hoursBlock}
          ${hhBlock}
          ${musicBlock}
          <div class="gcr-card-bottom">
            <div class="gcr-card-addr">${fullAddr || location}</div>
            <div class="gcr-card-actions">${viewBtn}${menuBtn}${hhBtn}${bookBtn}${reserveBtn}${orderBtn}${dirBtn}${callBtn}</div>
          </div>
        </div>
      </div>
      ${hhPanel}
    </a>`;
}

/* ── Populate sidebar with real top-rated entities ── */
function populateSidebar(entities) {
  const heading = document.querySelector('.panel h3');
  if (!heading || heading.textContent.trim() !== 'Popular Nearby') return;
  const panel = heading.closest('.panel');
  if (!panel) return;

  const top = [...entities]
    .filter(e => e.hero_image_url || e.cover_url)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);

  if (!top.length) return;

  panel.innerHTML = `<h3>Popular Nearby</h3>` + top.map(e => {
    const slug = e.slug || e.subdomain || e.id;
    const img  = e.hero_image_url || e.cover_url;
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

  cards.forEach(card => {
    if (filter === 'all') { card.style.display = ''; visible++; return; }
    const tags    = (card.dataset.tags || '').split(',');
    const subtype = card.dataset.subtype || '';
    const match   = tags.some(t => t === norm || t.includes(norm)) || subtype.includes(norm);
    card.style.display = match ? '' : 'none';
    if (match) visible++;
  });

  const meta = document.querySelector('.toolbar-meta');
  if (meta) meta.textContent = `${visible} result${visible !== 1 ? 's' : ''}`;
}

/* ── Build dynamic filter chips from actual entity tags ── */
function buildDynamicFilters(entities) {
  const chipContainer = document.querySelector('.tag-row, .filter-row, .chips-row');
  if (!chipContainer) return;

  // Count tags across all entities on this page
  const tagCounts = {};
  entities.forEach(e => {
    const tags = (e.tags || []).map(t => typeof t === 'string' ? t : (t.tag || '')).filter(Boolean);
    tags.forEach(t => {
      const norm = t.toLowerCase().replace(/ /g, '_');
      tagCounts[norm] = (tagCounts[norm] || 0) + 1;
    });
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

  // Reset delegation flag so new container gets wired
  if (chipContainer._wired) chipContainer._wired = false;

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
    const raw = (b.entity_subtype || b.type || b.category || '').toLowerCase();
    // Direct match: subtype IS the category (e.g., "restaurants" on restaurants page)
    if (raw === category) return true;
    // Normalize hyphens → underscores for map lookup
    const norm = raw.replace(/-/g, '_');
    return SUBTYPE_TO_CATEGORY[raw] === category || SUBTYPE_TO_CATEGORY[norm] === category;
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
    grid.innerHTML = entities.map(buildCard).join('');
    const meta = document.getElementById('resultCount') || document.querySelector('.toolbar-meta');
    if (meta) meta.textContent = `${entities.length} listed`;
    wireFilterChips(grid);
    if (urlTag) applyFilter(grid, urlTag);
  }

  function render(businesses) {
    _allEntities = getEntitiesForCategory(businesses, category);
    buildDynamicFilters(_allEntities);
    renderEntities(_allEntities);
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

/* ── Boot ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStandardPage);
} else {
  initStandardPage();
}
