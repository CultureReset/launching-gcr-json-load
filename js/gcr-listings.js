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
  return tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  const location = [city, state].filter(Boolean).join(', ');

  // Normalize tags
  const rawTags = (entity.tags || []).map(t => typeof t === 'string' ? t : (t.tag || '')).filter(Boolean);

  const statusBadge = computeStatus(entity.hours || [], rawTags);

  // Price info — check priceRange or tags for price indicators
  const priceRange = entity.priceRange || entity.price_range || '';
  const priceTag = rawTags.find(t => t.startsWith('$') || t.includes('from_'));
  const priceDisplay = priceRange || (priceTag ? priceTag.replace(/_/g,' ') : '');

  const chipLinks = rawTags.slice(0, 4).map(tag => {
    const dest = tagToPage(tag);
    const norm = tag.toLowerCase().replace(/ /g, '_');
    return `<a href="${dest}?tag=${encodeURIComponent(norm)}" class="gcr-chip"
      onclick="event.stopPropagation()">${tagLabel(tag)}</a>`;
  }).join('');

  const ratingBlock = rating ? `
    <div class="gcr-card-rating">
      <span class="gcr-stars">${starsHtml(rating)}</span>
      <span>${Number(rating).toFixed(1)}</span>
      ${reviews ? `<span style="color:#8fa3b1">(${reviews})</span>` : ''}
    </div>` : '';

  const dirBtn = dir
    ? `<a href="${dir}" target="_blank" rel="noopener" class="gcr-btn"
        onclick="event.stopPropagation()">📍 Directions</a>`
    : '';
  const callBtn = phone
    ? `<a href="tel:${phone.replace(/\D/g,'')}" class="gcr-btn"
        onclick="event.stopPropagation()">📞 Call</a>`
    : '';
  const webBtn = (!dir && !phone && website)
    ? `<a href="${website}" target="_blank" rel="noopener" class="gcr-btn"
        onclick="event.stopPropagation()">🌐 Website</a>`
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
          ${ratingBlock}
          ${chipLinks ? `<div class="gcr-chips">${chipLinks}</div>` : ''}
          <div class="gcr-card-bottom">
            <div class="gcr-card-addr">${addr}</div>
            <div class="gcr-card-actions">${dirBtn}${callBtn}${webBtn}</div>
          </div>
        </div>
      </div>
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

/* ── Wire filter chips (handles .tag-btn and .filter-chip) ── */
function wireFilterChips(grid) {
  const chips = document.querySelectorAll('.tag-btn, .filter-chip');
  chips.forEach(btn => {
    btn.addEventListener('click', () => {
      chips.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter || 'all';
      applyFilter(grid, filter);
      const url = new URL(window.location);
      filter !== 'all' ? url.searchParams.set('tag', filter) : url.searchParams.delete('tag');
      window.history.replaceState({}, '', url);
    });
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

  function render(businesses) {
    const entities = getEntitiesForCategory(businesses, category);

    if (!entities.length) {
      grid.innerHTML = `
        <div class="gcr-empty">
          <div class="gcr-empty-icon">🌊</div>
          <h3>Coming Soon</h3>
          <p>We're adding Gulf Coast businesses every day. Check back soon!</p>
        </div>`;
      const meta = document.querySelector('.toolbar-meta');
      if (meta) meta.textContent = '0 listed';
      return;
    }

    grid.innerHTML = entities.map(buildCard).join('');

    const meta = document.querySelector('.toolbar-meta');
    if (meta) meta.textContent = `${entities.length} listed`;

    wireFilterChips(grid);
    populateSidebar(entities);

    if (urlTag) applyFilter(grid, urlTag);
  }

  if (window.GCR && GCR.loaded) {
    render(GCR.businesses);
  } else {
    document.addEventListener('gcr:loaded', e => render(e.detail.businesses || []));
  }

  // Wire chips immediately for visual feedback
  wireFilterChips(grid);
}

/* ── Boot ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStandardPage);
} else {
  initStandardPage();
}
