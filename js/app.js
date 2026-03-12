/* ============================================
   GCR — Gulf Coast Radar  |  app.js
   Core logic: nav, search, card rendering
   All data-dependent rendering waits for
   gcr:loaded event from gcr-api.js
   ============================================ */

/* ── Mobile Menu + Nav (no data needed) ── */
document.addEventListener('DOMContentLoaded', () => {

  const ham  = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (ham && menu) {
    ham.addEventListener('click', () => menu.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!ham.contains(e.target) && !menu.contains(e.target))
        menu.classList.remove('open');
    });
  }

  /* ── Search bar ── */
  const searchInput = document.getElementById('mainSearch');
  const searchBtn   = document.getElementById('searchBtn');
  if (searchBtn && searchInput) {
    const doSearch = () => {
      const q = searchInput.value.trim();
      if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
    };
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  }

  /* ── Tag pills on homepage ── */
  document.querySelectorAll('.search-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const q = tag.dataset.q || tag.textContent.trim();
      window.location.href = `search.html?q=${encodeURIComponent(q)}`;
    });
  });

  /* ── Filter chips ── */
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterListings(chip.dataset.filter);
    });
  });

  /* ── Profile tabs ── */
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const panel = tab.dataset.panel;
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
      tab.classList.add('active');
      const el = document.getElementById(panel);
      if (el) el.style.display = 'block';
    });
  });

  /* ── Wire data rendering once GCR is ready ── */
  if (typeof GCR !== 'undefined' && GCR.loaded) {
    onGCRLoaded();
  } else {
    document.addEventListener('gcr:loaded', onGCRLoaded, { once: true });
  }
});

/* ── Called once GCR data is available ── */
function onGCRLoaded() {
  renderPageListings();    // category pages (restaurants, things-to-do, etc.)
  renderSpecialsPage();    // specials.html
  renderHappyHourPage();   // happy-hours.html
  renderEventsPage();      // events.html
  renderCalendar();        // events.html calendar widget
  runSearch();             // search.html
}

/* ══════════════════════════════════════════
   BUSINESS CARD — standard card for grids
══════════════════════════════════════════ */
function renderBizCard(biz, context) {
  const featured = biz.featured ? `<div class="biz-featured-badge">Featured</div>` : '';
  const rating   = biz.rating || biz.rating_avg;
  const reviews  = biz.review_count || biz.reviewCount || 0;
  const stars    = rating ? '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating)) : '';

  const isBookingCtx    = context === 'things-to-do' || context === 'services';
  const isRestaurantCtx = context === 'restaurants'  || context === 'coffee-sweets';
  const isHappyHourCtx  = context === 'happy-hours';
  const isMixed         = !context || context === 'search';

  const showBookBtn  = biz.booking_required && (isBookingCtx || isMixed);
  const showMenuBtn  = biz.links?.menu && (isRestaurantCtx || isMixed) && !biz.booking_required;
  const showHHTag    = (biz.happy_hour || biz.happyHour) && (isHappyHourCtx || isMixed);
  const showCatTag   = isMixed;
  const hhText       = biz.happy_hour || biz.happyHour || '';
  const slug         = biz.slug || biz.site_id || biz.id;
  const priceRange   = biz.price_range || biz.priceRange || '';
  const category     = biz.type || biz.category || '';

  return `
  <div class="biz-card" data-tags="${(biz.tags||[]).join(' ')} ${category}">
    <div class="biz-card-img">
      ${featured}
      <span>${biz.emoji || '🏖️'}</span>
    </div>
    <div class="biz-card-body">
      <h4>${escGcr(biz.name)}</h4>
      <div class="biz-meta">
        ${showCatTag ? `<span class="biz-tag">${categoryLabel(category)}</span>` : ''}
        ${priceRange ? `<span class="biz-tag">${priceRange}</span>` : ''}
        ${showHHTag ? `<span class="biz-tag" style="background:#e6f9f0;color:#1a7a47">🍻 HH ${hhText}</span>` : ''}
      </div>
      ${rating ? `<div class="biz-rating"><span class="stars">${stars}</span> ${rating} <span style="color:var(--gray-400)">(${reviews})</span></div>` : ''}
      <p class="biz-desc">${escGcr(biz.description || biz.tagline || '')}</p>
      <div class="biz-card-actions">
        <a href="business.html?id=${slug}" class="biz-btn-view">View Profile</a>
        ${showBookBtn  ? `<button class="biz-btn-book" onclick="openBookingModal('${slug}')">📅 Book Now</button>` : ''}
        ${showMenuBtn  ? `<a href="${biz.links.menu}" class="biz-btn-menu">Full Menu</a>` : ''}
      </div>
    </div>
  </div>`;
}

/* ── Auto-render #listingsGrid on category pages ── */
function renderPageListings() {
  const grid = document.getElementById('listingsGrid');
  if (!grid || typeof GCR === 'undefined') return;
  const cat    = grid.dataset.category;
  const tag    = grid.dataset.tag;
  const method = grid.dataset.method;
  let items    = [];
  let context  = cat || null;
  if (method === 'getHappyHours') context = 'happy-hours';
  else if (method) context = 'search';
  else if (tag) context = 'search';

  if (method && typeof GCR[method] === 'function') items = GCR[method]();
  else if (cat) items = GCR.getByCategory(cat);
  else if (tag) items = GCR.getByTag(tag);
  else items = GCR.businesses;

  if (!items.length) {
    grid.innerHTML = '<p class="text-muted text-center" style="grid-column:1/-1;padding:40px">No listings yet. Check back soon!</p>';
    return;
  }
  grid.innerHTML = items.map(b => renderBizCard(b, context)).join('');
}

/* ── Filter visible cards ── */
function filterListings(filter) {
  document.querySelectorAll('.biz-card').forEach(card => {
    if (!filter || filter === 'all') { card.style.display = ''; return; }
    const tags = (card.dataset.tags || '').toLowerCase();
    card.style.display = tags.includes(filter.toLowerCase()) ? '' : 'none';
  });
  /* also filter expand-cards (specials/happy-hours) */
  document.querySelectorAll('.listing-expand-card').forEach(card => {
    if (!filter || filter === 'all') { card.style.display = ''; return; }
    const tags = (card.dataset.tags || '').toLowerCase();
    card.style.display = tags.includes(filter.toLowerCase()) ? '' : 'none';
  });
}

/* ══════════════════════════════════════════
   HAPPY HOURS PAGE — expandable listings
══════════════════════════════════════════ */
function renderHappyHourPage() {
  const grid = document.getElementById('hhGrid');
  if (!grid || typeof GCR === 'undefined') return;

  const businesses = GCR.getHappyHours();
  if (!businesses.length) {
    grid.innerHTML = '<p class="text-muted text-center" style="padding:40px">No happy hours listed yet.</p>';
    return;
  }

  grid.innerHTML = businesses.map(biz => {
    const slug    = biz.slug || biz.site_id || biz.id;
    const cardId  = 'hh-' + slug;
    const hhText  = biz.happy_hour || biz.happyHour || '';
    const tags    = (biz.tags || []).join(' ');

    /* Check if this business has specials related to happy hour */
    const hhSpecials = GCR.specials.filter(s =>
      (s.site_id === biz.site_id || s.site_id === biz.id) && s.active !== false
    );

    const detailsHtml = hhSpecials.length
      ? hhSpecials.map(s => `
          <div class="expand-item-row">
            <div>
              <div class="expand-item-name">${escGcr(s.name || 'Special')}</div>
              ${s.description ? `<div class="expand-item-desc">${escGcr(s.description)}</div>` : ''}
            </div>
            ${s.discount ? `<div class="expand-item-price">${escGcr(s.discount)}</div>` : ''}
          </div>`).join('')
      : `<div class="expand-item-row"><div class="expand-item-desc" style="font-style:italic">Happy hour details not yet added — call to confirm</div></div>`;

    return `
    <div class="listing-expand-card" id="${cardId}" data-tags="${tags}">
      <div class="listing-expand-header">
        <span class="listing-expand-emoji">${biz.emoji || '🍻'}</span>
        <div class="listing-expand-info">
          <h4>${escGcr(biz.name)}</h4>
          <p>${escGcr(hhText)}${biz.address ? ` · ${escGcr(biz.address)}` : ''}</p>
        </div>
        <div class="listing-expand-actions">
          <a href="business.html?id=${slug}" class="btn btn-outline btn-sm">View Profile</a>
          <button class="expand-btn btn btn-sm" onclick="toggleExpand('${cardId}')">Details ▼</button>
        </div>
      </div>
      <div class="listing-expand-details" id="${cardId}-details">
        ${detailsHtml}
      </div>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════
   SPECIALS PAGE — expandable listings
══════════════════════════════════════════ */
function renderSpecialsPage() {
  const grid = document.getElementById('specialsGrid');
  if (!grid || typeof GCR === 'undefined') return;

  const specials = GCR.getSpecials();
  if (!specials.length) {
    grid.innerHTML = '<p class="text-muted text-center" style="padding:40px">No active specials right now. Check back soon!</p>';
    return;
  }

  /* Group specials by business */
  const byBiz = {};
  specials.forEach(s => {
    const key = s.site_id || 'unknown';
    if (!byBiz[key]) byBiz[key] = [];
    byBiz[key].push(s);
  });

  let html = '';
  Object.entries(byBiz).forEach(([siteId, items]) => {
    const biz     = GCR.businesses.find(b => b.site_id === siteId || b.id === siteId);
    const name    = biz ? biz.name    : 'Local Business';
    const emoji   = biz ? (biz.emoji || '🏪') : '🏪';
    const slug    = biz ? (biz.slug || biz.site_id || biz.id) : siteId;
    const tags    = biz ? (biz.tags || []).join(' ') : '';
    const cardId  = 'sp-' + siteId.replace(/[^a-z0-9]/gi, '-');

    html += `
    <div class="listing-expand-card" id="${cardId}" data-tags="${tags}">
      <div class="listing-expand-header">
        <span class="listing-expand-emoji">${emoji}</span>
        <div class="listing-expand-info">
          <h4>${escGcr(name)}</h4>
          <p>${items.length} active special${items.length > 1 ? 's' : ''}</p>
        </div>
        <div class="listing-expand-actions">
          <a href="business.html?id=${slug}" class="btn btn-outline btn-sm">View Profile</a>
          <button class="expand-btn btn btn-sm" onclick="toggleExpand('${cardId}')">See Specials ▼</button>
        </div>
      </div>
      <div class="listing-expand-details" id="${cardId}-details">
        ${items.map(s => `
          <div class="expand-item-row">
            <div>
              <div class="expand-item-name">${escGcr(s.name || 'Special')}</div>
              ${s.description ? `<div class="expand-item-desc">${escGcr(s.description)}</div>` : ''}
            </div>
            ${s.discount ? `<div class="expand-item-price">${escGcr(s.discount)}</div>` : ''}
          </div>`).join('')}
      </div>
    </div>`;
  });

  grid.innerHTML = html;
}

/* ══════════════════════════════════════════
   EVENTS PAGE — card view + list toggle
   List view: sorted earliest → latest,
   date shown prominently at top of each row
══════════════════════════════════════════ */
function renderEventsPage() {
  const cardContainer = document.getElementById('eventsCardView');
  const listContainer = document.getElementById('eventsListView');
  const fullList      = document.getElementById('eventsFullList'); // legacy fallback
  if (typeof GCR === 'undefined') return;

  const months   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fullMons = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const catColors = { 'live-music':'', concert:'concert', festival:'festival', sports:'sports', holiday:'holiday', 'bar-event':'' };

  const events = GCR.getUpcomingEvents();

  /* ── Card view (existing event-row style) ── */
  function buildCardView(evts) {
    if (!evts.length) return '<p class="text-muted text-center" style="padding:40px">No upcoming events.</p>';
    return evts.map(ev => {
      const dateStr = ev.date || ev.event_date || '';
      const d   = dateStr ? new Date(dateStr + 'T12:00:00') : null;
      const mon = d ? months[d.getMonth()]   : '—';
      const day = d ? d.getDate()            : '—';
      const cls = catColors[ev.category] || '';
      const biz = GCR.businesses.find(b => b.site_id === ev.site_id || b.id === ev.site_id);
      const bizSlug = biz ? (biz.slug || biz.site_id) : null;
      return `
      <div class="event-row" data-tags="${ev.category || ''}">
        <div class="event-date-box">
          <div class="month">${mon}</div>
          <div class="day">${day}</div>
        </div>
        <div class="event-info">
          <h4>${escGcr(ev.title || ev.name || 'Event')}</h4>
          <p>${escGcr(ev.venue || (biz && biz.name) || '')}${ev.time ? ` · ${escGcr(ev.time)}` : ''}</p>
          <div class="event-meta">
            ${ev.category ? `<span class="event-cat-badge ${cls}">${ev.category.replace(/-/g,' ')}</span>` : ''}
            ${ev.cover !== undefined ? `<span class="event-cat-badge" style="background:${ev.cover==='Free'?'#dcfce7':'#fef3c7'};color:${ev.cover==='Free'?'#16a34a':'#d97706'}">${escGcr(ev.cover)}</span>` : ''}
          </div>
        </div>
        <div class="event-actions">
          ${bizSlug ? `<a href="business.html?id=${bizSlug}" class="btn btn-primary btn-sm">Details</a>` : '<span></span>'}
        </div>
      </div>`;
    }).join('');
  }

  /* ── List view: date header + sorted rows ── */
  function buildListView(evts) {
    if (!evts.length) return '<p class="text-muted text-center" style="padding:40px">No upcoming events.</p>';

    /* Group by date */
    const grouped = {};
    evts.forEach(ev => {
      const dateStr = ev.date || ev.event_date || 'Unknown';
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(ev);
    });

    let html = '';
    Object.keys(grouped).sort().forEach(dateStr => {
      const d     = new Date(dateStr + 'T12:00:00');
      const today = new Date(); today.setHours(0,0,0,0);
      const diff  = Math.round((d - today) / 86400000);
      const label = diff === 0 ? 'Today'
                  : diff === 1 ? 'Tomorrow'
                  : diff <= 6 ? d.toLocaleDateString('en-US', { weekday:'long' })
                  : d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

      html += `<div class="event-date-header">
        <span class="event-date-label">${label}</span>
        <span class="event-date-sub">${d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</span>
      </div>`;

      grouped[dateStr].forEach(ev => {
        const biz     = GCR.businesses.find(b => b.site_id === ev.site_id || b.id === ev.site_id);
        const bizSlug = biz ? (biz.slug || biz.site_id) : null;
        html += `
        <div class="event-list-row" data-tags="${ev.category || ''}">
          <div class="event-list-left">
            <span class="event-list-emoji">${(biz && biz.emoji) || '🎉'}</span>
            <div>
              <div class="event-list-title">${escGcr(ev.title || ev.name || 'Event')}</div>
              <div class="event-list-meta">
                ${ev.time ? `⏰ ${escGcr(ev.time)}` : ''}
                ${ev.venue || (biz && biz.name) ? ` · 📍 ${escGcr(ev.venue || biz.name)}` : ''}
                ${ev.cover ? ` · ${escGcr(ev.cover)}` : ''}
              </div>
            </div>
          </div>
          ${bizSlug ? `<a href="business.html?id=${bizSlug}" class="btn btn-outline btn-sm">Details</a>` : ''}
        </div>`;
      });
    });
    return html;
  }

  /* Render both views */
  if (cardContainer) cardContainer.innerHTML = buildCardView(events);
  if (listContainer) listContainer.innerHTML = buildListView(events);

  /* Legacy fallback */
  if (fullList && !cardContainer) fullList.innerHTML = buildCardView(events);

  /* ── View toggle ── */
  const toggleBtns = document.querySelectorAll('.events-view-toggle');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      if (cardContainer) cardContainer.style.display = view === 'card' ? '' : 'none';
      if (listContainer) listContainer.style.display = view === 'list' ? '' : 'none';
    });
  });

  /* ── Filter chips on events page ── */
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      document.querySelectorAll('.event-row, .event-list-row').forEach(row => {
        if (!filter || filter === 'all') { row.style.display = ''; return; }
        const tags = (row.dataset.tags || '').toLowerCase();
        row.style.display = tags.includes(filter.toLowerCase()) ? '' : 'none';
      });
      /* Re-hide date headers that have no visible events */
      document.querySelectorAll('.event-date-header').forEach(header => {
        let next = header.nextElementSibling;
        let hasVisible = false;
        while (next && !next.classList.contains('event-date-header')) {
          if (next.style.display !== 'none') hasVisible = true;
          next = next.nextElementSibling;
        }
        header.style.display = hasVisible ? '' : 'none';
      });
    });
  });
}

/* ══════════════════════════════════════════
   EXPAND / COLLAPSE dropdown on listing cards
══════════════════════════════════════════ */
window.toggleExpand = function(cardId) {
  const details = document.getElementById(cardId + '-details');
  const btn     = document.querySelector('#' + cardId + ' .expand-btn');
  if (!details) return;
  const open = details.classList.toggle('open');
  if (btn) btn.textContent = open ? 'Hide ▲' : (btn.textContent.includes('Special') ? 'See Specials ▼' : 'Details ▼');
};

/* ══════════════════════════════════════════
   CALENDAR (events.html)
══════════════════════════════════════════ */
function renderCalendar() {
  const calGrid = document.getElementById('calGrid');
  if (!calGrid || typeof GCR === 'undefined') return;

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const months= ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const firstDay     = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const today        = now.getDate();
  const titleEl      = document.getElementById('calMonth');
  if (titleEl) titleEl.textContent = `${months[month]} ${now.getFullYear()}`;

  const eventDates = GCR.events.map(e => {
    const d = new Date((e.date || e.event_date || '') + 'T12:00:00');
    return d.getMonth() === month && d.getFullYear() === year ? d.getDate() : null;
  }).filter(Boolean);

  let html = '';
  for (let i = 0; i < firstDay; i++) html += `<div class="cal-day other-month"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    html += `<div class="cal-day ${d === today ? 'today' : ''} ${eventDates.includes(d) ? 'has-event' : ''}">${d}</div>`;
  }
  calGrid.innerHTML = html;
}

/* ══════════════════════════════════════════
   SEARCH RESULTS PAGE
══════════════════════════════════════════ */
function runSearch() {
  const params  = new URLSearchParams(window.location.search);
  const q       = params.get('q') || '';
  const input   = document.getElementById('searchResultsInput');
  const heading = document.getElementById('searchHeading');
  const grid    = document.getElementById('searchGrid');
  if (!q || !grid || typeof GCR === 'undefined') return;
  if (input) input.value = q;
  const results = GCR.search(q);
  if (heading) heading.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`;
  grid.innerHTML = results.length
    ? results.map(b => renderBizCard(b, 'search')).join('')
    : '<p class="text-muted text-center" style="grid-column:1/-1;padding:40px">No results found. Try "seafood", "boat rentals", or "happy hour".</p>';
}

/* ══════════════════════════════════════════
   BUSINESS PROFILE PAGE
   Called from business.html after gcr:loaded
══════════════════════════════════════════ */
function loadBusinessProfile() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  if (!id || typeof GCR === 'undefined') return;

  // Fetch full profile from API (includes fleet, pricing, addons, reviews, specials, events)
  GCR.loadProfile(id).then(profile => {
    if (profile) _renderBusinessProfile(profile);
    else {
      // Fallback to in-memory basic data
      const biz = GCR.getBusiness(id);
      if (biz) _renderBusinessProfile(biz);
      else document.getElementById('profileName') && (document.getElementById('profileName').textContent = 'Business not found');
    }
  });
}

function _renderBusinessProfile(biz) {
  const slug = biz.slug || biz.subdomain || biz.id;

  /* Basic fields */
  const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.innerHTML = val; };
  const setText = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };

  setText('#profileName',    biz.name || '');
  setText('#profileTagline', biz.tagline || '');
  const emojiEl = document.getElementById('profileEmoji');
  if (emojiEl) emojiEl.textContent = biz.emoji || '🏖️';

  if (biz.phone) {
    const ph = document.getElementById('profilePhone');
    if (ph) { ph.textContent = `📞 ${biz.phone}`; ph.href = 'tel:' + biz.phone.replace(/\D/g,''); }
  }
  if (biz.website) {
    const wb = document.getElementById('profileWebsite');
    if (wb) wb.href = biz.website;
  }

  const addr = biz.address || '';
  if (addr) {
    set('#profileAddress', `📍 ${escGcr(addr)}`);
    const af = document.getElementById('profileAddressFull');
    if (af) af.textContent = addr;
    const dl = document.getElementById('profileDirectionsLink');
    if (dl) dl.href = `https://maps.google.com?q=${encodeURIComponent(addr)}`;
    const db = document.getElementById('profileDirections');
    if (db) db.href = `https://maps.google.com?q=${encodeURIComponent(addr)}`;
  }

  setText('#profileDesc', biz.description || '');

  /* Rating */
  const rating  = biz.rating || biz.rating_avg;
  const reviews = biz.review_count || biz.reviewCount || 0;
  if (rating) {
    const rEl = document.getElementById('profileRating');
    if (rEl) rEl.textContent = `★ ${rating} (${reviews})`;
    const rdEl = document.getElementById('profileRatingDisplay');
    if (rdEl) rdEl.innerHTML = `<span style="font-size:2.5rem;font-weight:800;color:var(--teal);">${rating}</span>
      <span style="font-size:1.2rem;color:#f59e0b;margin-left:8px;">${'★'.repeat(Math.round(rating))}${'☆'.repeat(5-Math.round(rating))}</span>
      <span style="font-size:.85rem;color:var(--text-muted);margin-left:6px;">(${reviews} reviews)</span>`;
  }

  /* Price range */
  const pr = document.getElementById('profilePriceRange');
  if (pr && biz.price_range) pr.textContent = biz.price_range;
  const prDetail = document.getElementById('profilePrice');
  if (prDetail && biz.price_range) prDetail.textContent = biz.price_range;

  /* Quick info */
  const hh = document.getElementById('profileHHour');
  if (hh) hh.textContent = biz.happy_hour || biz.happyHour || '—';
  const kf = document.getElementById('profileKids');
  if (kf) kf.textContent = (biz.kids_friendly || biz.kidsFriendly) ? '✅ Yes' : '✗ No';
  const od = document.getElementById('profileOutdoor');
  if (od) od.textContent = biz.outdoor ? '✅ Yes' : '✗ No';

  /* Badges */
  const badgeEl = document.getElementById('profileBadges');
  if (badgeEl && biz.tags && biz.tags.length) {
    badgeEl.innerHTML = biz.tags.map(t => `<span class="profile-badge">${t.replace(/-/g,' ')}</span>`).join('');
  }

  /* Hours */
  const hoursEl = document.getElementById('profileHours');
  if (hoursEl && biz.hours) {
    const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    hoursEl.innerHTML = days.map(d =>
      `<div class="hours-row ${d === today ? 'today' : ''}"><span>${d}</span><span>${biz.hours[d] || biz.hours[d.toLowerCase()] || 'Closed'}</span></div>`
    ).join('');
  }

  /* Specials tab — use profile's own specials array (from full profile API) */
  const specEl = document.getElementById('profileSpecials');
  if (specEl) {
    const bizSpecials = biz.specials && biz.specials.length
      ? biz.specials
      : GCR.specials.filter(s => (s.site_id === biz.site_id || s.site_id === biz.id));
    if (bizSpecials.length) {
      specEl.innerHTML = bizSpecials.map(s => `
        <div class="event-item" style="margin-bottom:12px">
          <h4>${escGcr(s.name || 'Special')}</h4>
          ${s.description ? `<p>${escGcr(s.description)}</p>` : ''}
          ${s.discount ? `<span class="biz-tag" style="margin-top:4px;display:inline-block">${escGcr(s.discount)}</span>` : ''}
        </div>`).join('');
    } else {
      specEl.innerHTML = '<p class="text-muted">No active specials right now.</p>';
    }
  }

  /* Events tab — use profile's own events array */
  const evEl = document.getElementById('profileEvents');
  if (evEl) {
    const bizEvents = biz.events && biz.events.length
      ? biz.events.sort((a,b) => (a.event_date||a.date||'').localeCompare(b.event_date||b.date||''))
      : GCR.events.filter(e => (e.site_id === biz.site_id || e.site_id === biz.id));
    if (bizEvents.length) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      evEl.innerHTML = '<div class="events-list">' + bizEvents.map(ev => {
        const dateStr = ev.event_date || ev.date || '';
        const d = dateStr ? new Date(dateStr + 'T12:00:00') : null;
        const label = d ? `${d.toLocaleDateString('en-US',{weekday:'short'})} ${months[d.getMonth()]} ${d.getDate()} · ${ev.time||''}` : ev.time || '';
        return `<div class="event-item">
          <div class="event-item-date">${escGcr(label)}</div>
          <h4>${escGcr(ev.title || ev.name || '')}</h4>
          ${ev.description ? `<p>${escGcr(ev.description)}</p>` : ''}
          ${ev.cover ? `<p>${escGcr(ev.cover)}</p>` : ''}
        </div>`;
      }).join('') + '</div>';
    } else {
      evEl.innerHTML = '<p class="text-muted">No upcoming events.</p>';
    }
  }

  /* Reviews tab — use profile's own reviews array */
  const revListEl = document.getElementById('profileReviewsList');
  if (revListEl && biz.reviews && biz.reviews.length) {
    revListEl.innerHTML = biz.reviews.map(r => {
      const initial = (r.reviewer || r.customer_name || 'A').charAt(0).toUpperCase();
      const stars = Math.round(r.rating || 5);
      return `<div class="review-card">
        <div class="review-header">
          <div class="review-avatar">${escGcr(initial)}</div>
          <div>
            <div class="review-meta-name">${escGcr(r.reviewer || r.customer_name || 'Guest')}</div>
            <div class="review-meta-date">${escGcr(r.time_ago || r.source || '')}</div>
          </div>
        </div>
        <div class="review-stars">${'★'.repeat(stars)}${'☆'.repeat(5-stars)}</div>
        <div class="review-text">${escGcr(r.text || '')}</div>
      </div>`;
    }).join('');
  }

  /* Menu highlights */
  const mh = document.getElementById('profileMenuHighlights');
  if (mh && biz.menu_highlights) {
    mh.innerHTML = (biz.menu_highlights || []).map(item =>
      `<span style="background:var(--sky);color:var(--teal);padding:4px 12px;border-radius:20px;font-size:.78rem;font-weight:600;">${escGcr(item)}</span>`
    ).join('');
  }

  /* Breadcrumb */
  const catMap = { restaurants:'Restaurants','things-to-do':'Things To Do','coffee-sweets':'Coffee & Sweets', events:'Events', shopping:'Shopping', other:'Other', nightlife:'Nightlife' };
  const cat    = biz.type || biz.category || '';
  const bcCat  = document.getElementById('breadcrumbCat');
  const bcName = document.getElementById('breadcrumbName');
  if (bcCat) bcCat.textContent = catMap[cat] || cat;
  if (bcName) bcName.textContent = biz.name;
  document.title = `${biz.name} — Gulf Coast Radar`;

  /* Tag links in sidebar */
  const tagLinks = document.getElementById('profileTagLinks');
  if (tagLinks && biz.tags) {
    const tagPages = { seafood:'restaurants.html','happy-hour':'happy-hours.html','live-music':'events.html','boat-rentals':'things-to-do.html', fishing:'things-to-do.html', restaurant:'restaurants.html' };
    tagLinks.innerHTML = biz.tags.slice(0,6).map(t => {
      const href = tagPages[t] || `search.html?q=${encodeURIComponent(t)}`;
      return `<a href="${href}" class="biz-tag" style="text-decoration:none;">${t.replace(/-/g,' ')}</a>`;
    }).join('');
  }

  /* Booking panel + menu tabs (defined in business.html) */
  if (typeof renderBookingPanel === 'function') renderBookingPanel(biz);
  if (typeof renderMenuTabs    === 'function') renderMenuTabs(biz);
  if (typeof renderPricingTab  === 'function') renderPricingTab(biz);
}

/* ── Category label ── */
function categoryLabel(cat) {
  const map = { restaurants:'Restaurant','coffee-sweets':'Coffee & Sweets','happy-hours':'Happy Hour', specials:'Special', events:'Event','things-to-do':'Things To Do', shopping:'Shopping', other:'Other', nightlife:'Nightlife', services:'Services' };
  return map[cat] || cat;
}

/* ── XSS-safe string escape ── */
function escGcr(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ══════════════════════════════════════════
   BOOKING MODAL
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('gcrBookingModal')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="gcrBookingModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;align-items:center;justify-content:center;padding:16px;overflow-y:auto;">
      <div style="background:#fff;border-radius:18px;max-width:500px;width:100%;max-height:92vh;overflow-y:auto;padding:28px 24px;position:relative;box-shadow:0 24px 60px rgba(0,0,0,.3);">
        <button onclick="closeBookingModal()" style="position:absolute;top:12px;right:14px;background:rgba(0,0,0,.07);border:none;width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer;color:#555;display:flex;align-items:center;justify-content:center;">✕</button>
        <div id="gcrBookingContent"></div>
      </div>
    </div>`);
});

window.openBookingModal = function(bizId) {
  if (typeof GCR === 'undefined') return;
  const biz = GCR.getBusiness(bizId);
  if (!biz) return;

  const typeLabel = { rental:'Rental Options', charter:'Charter Packages', tickets:'Admission & Tickets', reservation:'Reserve a Table', inquiry:'Book an Inquiry' };
  const heading   = typeLabel[biz.bookingType] || 'Book Now';
  const slug      = biz.slug || biz.site_id || biz.id;

  let html = `
    <div style="text-align:center;font-size:3rem;margin-bottom:8px;">${biz.emoji||'🎯'}</div>
    <h2 style="font-size:1.25rem;font-weight:800;margin-bottom:4px;color:#0d2137;">${escGcr(biz.name)}</h2>
    <p style="font-size:.83rem;color:#666;margin-bottom:20px;">${escGcr(biz.tagline||'')}</p>
    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0b7a75;margin-bottom:10px;">${heading}</div>`;

  if (biz.packages && biz.packages.length) {
    html += biz.packages.map(p => `
      <div style="border:2px solid #e5e7eb;border-radius:12px;padding:14px 16px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="font-size:.92rem;font-weight:700;color:#0d2137;">${escGcr(p.name)}</div>
          <div style="font-size:.92rem;font-weight:800;color:#0b7a75;white-space:nowrap;">${escGcr(p.price)}</div>
        </div>
        <div style="font-size:.78rem;color:#666;margin-top:4px;">${escGcr(p.desc||p.description||'')}</div>
        ${p.maxGuests||p.max_guests ? `<div style="font-size:.7rem;color:#888;margin-top:4px;">👥 Max ${p.maxGuests||p.max_guests} guests</div>` : ''}
      </div>`).join('');
  }

  if (biz.phone) {
    html += `<a href="tel:${biz.phone.replace(/\D/g,'')}" style="display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#0b7a75,#14B8A6);color:#fff;padding:14px;border-radius:12px;font-weight:700;text-decoration:none;font-size:.95rem;margin:20px 0 8px;">📞 Call to Book — ${escGcr(biz.phone)}</a>`;
  }
  html += `<a href="business.html?id=${slug}" style="display:block;text-align:center;padding:10px;font-size:.82rem;color:#0b7a75;text-decoration:none;font-weight:600;">View Full Profile →</a>`;

  document.getElementById('gcrBookingContent').innerHTML = html;
  const modal = document.getElementById('gcrBookingModal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

window.closeBookingModal = function() {
  const modal = document.getElementById('gcrBookingModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
};

document.addEventListener('click', e => {
  const modal = document.getElementById('gcrBookingModal');
  if (modal && e.target === modal) closeBookingModal();
});
