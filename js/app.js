/* ============================================
   GCR — Gulf Coast Radar  |  app.js
   Core logic: nav, search, card rendering
   All data-dependent rendering waits for
   gcr:loaded event from gcr-api.js
   ============================================ */

/* ── Analytics: fires once per page load ── */
(function gcrAnalytics() {
  var API = 'https://cybercheck-api-database.vercel.app';
  var sess = sessionStorage.getItem('gcr_sess_id');
  if (!sess) { sess = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('gcr_sess_id', sess); }
  var qs = new URLSearchParams(location.search);
  var utm = {};
  ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(function(k) {
    var v = qs.get(k) || sessionStorage.getItem('gcr_' + k);
    if (v) { utm[k] = v; sessionStorage.setItem('gcr_' + k, v); }
  });
  var device = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
  var t0 = Date.now();
  function send(extra) {
    fetch(API + '/api/gcr/track', {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ page_path: location.pathname, page_title: document.title, referrer: document.referrer || null, session_id: sess, device_type: device, source: 'gcr' }, utm, extra || {}))
    }).catch(function(){});
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', send); } else { send(); }
  window.addEventListener('pagehide', function() { var s = Math.round((Date.now()-t0)/1000); if (s >= 3) send({ duration_secs: s }); });
})();

/* ══════════════════════════════════════════
   GLOBAL SEARCH HELPERS (called from HTML onclick)
══════════════════════════════════════════ */
/* ══════════════════════════════════════════
   LOYALTY / SIGNUP MODAL — captures leads → GCR dashboard
══════════════════════════════════════════ */
window.openSignupModal = function() {
  if (document.getElementById('_gcrSignupModal')) {
    document.getElementById('_gcrSignupModal').style.display = 'flex';
    return;
  }
  const modal = document.createElement('div');
  modal.id = '_gcrSignupModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
  modal.innerHTML = `
    <div style="background:#1a1a2e;border:1px solid #f59e0b;border-radius:16px;padding:32px;max-width:420px;width:100%;position:relative;color:#fff;">
      <button onclick="document.getElementById('_gcrSignupModal').style.display='none'" style="position:absolute;top:14px;right:18px;background:none;border:none;color:#aaa;font-size:24px;cursor:pointer;">×</button>
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:2rem;">⭐</div>
        <h2 style="margin:8px 0 4px;font-size:1.4rem;color:#f59e0b;">Join Our Loyalty Program</h2>
        <p style="color:#aaa;font-size:0.9rem;margin:0;">Get exclusive deals, early event access & rewards from Gulf Coast businesses.</p>
      </div>
      <div id="_gcrSignupError" style="display:none;background:#7f1d1d;color:#fca5a5;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:14px;"></div>
      <div id="_gcrSignupSuccess" style="display:none;background:#14532d;color:#86efac;padding:16px;border-radius:8px;font-size:14px;text-align:center;"></div>
      <form id="_gcrSignupForm" onsubmit="window._submitLoyaltySignup(event)" style="display:flex;flex-direction:column;gap:12px;">
        <input name="name" placeholder="Your name" required style="padding:11px 14px;border-radius:8px;border:1px solid #374151;background:#111827;color:#fff;font-size:14px;">
        <input name="email" type="email" placeholder="Email address" style="padding:11px 14px;border-radius:8px;border:1px solid #374151;background:#111827;color:#fff;font-size:14px;">
        <input name="phone" placeholder="Phone number" style="padding:11px 14px;border-radius:8px;border:1px solid #374151;background:#111827;color:#fff;font-size:14px;">
        <button type="submit" style="padding:12px;background:#f59e0b;color:#000;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;">🎁 Sign Me Up!</button>
      </form>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
};

window._submitLoyaltySignup = async function(e) {
  e.preventDefault();
  const form   = document.getElementById('_gcrSignupForm');
  const errEl  = document.getElementById('_gcrSignupError');
  const sucEl  = document.getElementById('_gcrSignupSuccess');
  const data   = Object.fromEntries(new FormData(form));

  if (!data.email && !data.phone) {
    errEl.textContent = 'Please enter an email or phone number.';
    errEl.style.display = 'block'; return;
  }
  errEl.style.display = 'none';

  try {
    const res = await fetch('https://cybercheck-api-database.vercel.app/api/gcr/tourist/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, email: data.email || null, phone: data.phone || null, source: 'loyalty_popup', page: window.location.pathname })
    });
    if (res.ok) {
      form.style.display = 'none';
      sucEl.innerHTML = '🎉 <strong>You\'re in!</strong><br>Welcome to the GCR Loyalty Program. Watch for exclusive deals!';
      sucEl.style.display = 'block';
      setTimeout(() => { document.getElementById('_gcrSignupModal').style.display = 'none'; form.style.display = 'flex'; sucEl.style.display = 'none'; form.reset(); }, 3500);
    } else {
      const d = await res.json().catch(() => ({}));
      errEl.textContent = d.error || 'Something went wrong. Please try again.';
      errEl.style.display = 'block';
    }
  } catch {
    errEl.textContent = 'Network error. Please check your connection.';
    errEl.style.display = 'block';
  }
};

window.doHeroSearch = function() {
  const q = (document.getElementById('heroSearch') || {}).value?.trim();
  if (q) window.location.href = 'search.html?q=' + encodeURIComponent(q);
};
window.doTagSearch = function(q) {
  if (q) window.location.href = 'search.html?q=' + encodeURIComponent(q);
};
window.installApp = function() {
  if (window._deferredInstallPrompt) {
    window._deferredInstallPrompt.prompt();
    window._deferredInstallPrompt.userChoice.then(() => { window._deferredInstallPrompt = null; });
  }
};
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  window._deferredInstallPrompt = e;
  document.querySelectorAll('#installBtn').forEach(b => b.style.display = 'inline-flex');
});

/* ══════════════════════════════════════════
   NAV TAB SCROLL PERSISTENCE + ACTIVE STATE
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.getElementById('gcrCatTabs') || document.querySelector('.gcr-cat-tabs');
  if (tabs) {
    // Mark active tab based on current page
    const page = window.location.pathname.split('/').pop() || 'index3.html';
    tabs.querySelectorAll('.gcr-cat-tab').forEach(a => {
      a.classList.remove('active');
      if (a.getAttribute('href') === page) a.classList.add('active');
    });
    // Restore scroll position from sessionStorage
    const saved = sessionStorage.getItem('gcr_tabs_scroll');
    if (saved) tabs.scrollLeft = parseInt(saved, 10);
    // Scroll active tab into view if nothing was saved
    else {
      const active = tabs.querySelector('.gcr-cat-tab.active');
      if (active) setTimeout(() => active.scrollIntoView({ behavior:'instant', block:'nearest', inline:'center' }), 30);
    }
    // Save scroll on every tab click
    tabs.querySelectorAll('.gcr-cat-tab').forEach(a => {
      a.addEventListener('click', () => sessionStorage.setItem('gcr_tabs_scroll', tabs.scrollLeft));
    });
  }
});

/* ══════════════════════════════════════════
   MASTER CALENDAR MODAL  (works on every page)
══════════════════════════════════════════ */
let _gcrCalDate   = new Date();
let _gcrCalTypes  = new Set(['events','happy_hour','special','live-music']);

/* Inject modal HTML once into page body */
function _gcrInjectCal() {
  if (document.getElementById('gcrCalModal')) return;
  const style = `
    <style>
    #gcrCalModal{display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.65);overflow-y:auto;padding:12px;box-sizing:border-box;}
    #gcrCalModal .cal-inner{background:#fff;border-radius:18px;max-width:920px;width:100%;margin:0 auto;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.35);}
    #gcrCalModal .cal-head{background:linear-gradient(135deg,#0b7a75,#065f5b);color:#fff;padding:18px 20px 14px;display:flex;justify-content:space-between;align-items:flex-start;}
    #gcrCalModal .cal-daterow{display:flex;align-items:center;justify-content:center;gap:10px;padding:12px 20px;border-bottom:1px solid #f0f0f0;background:#fafafa;flex-wrap:wrap;}
    #gcrCalModal .cal-navbtn{background:#e0f2fe;border:none;cursor:pointer;border-radius:8px;padding:7px 14px;font-weight:700;font-size:.85rem;color:#0369a1;}
    #gcrCalModal .cal-datelabel{font-size:1rem;font-weight:800;color:#0d2137;min-width:200px;text-align:center;}
    #gcrCalModal .cal-filters{padding:10px 20px;border-bottom:1px solid #f0f0f0;display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
    #gcrCalModal .cal-toggle{background:#f3f4f6;color:#374151;border:1.5px solid #d1d5db;cursor:pointer;border-radius:20px;padding:5px 12px;font-size:.75rem;font-weight:700;transition:.15s;}
    #gcrCalModal .cal-toggle.on{background:#0b7a75;color:#fff;border-color:#0b7a75;}
    #gcrCalModal .cal-body{display:flex;flex-wrap:wrap;min-height:360px;}
    #gcrCalModal .cal-mini{width:268px;min-width:268px;padding:16px;border-right:1px solid #f0f0f0;background:#fafafa;flex-shrink:0;}
    #gcrCalModal .cal-events{flex:1;min-width:260px;padding:16px;overflow-y:auto;max-height:500px;}
    #gcrCalModal .cal-day-cell{text-align:center;padding:5px 3px;cursor:pointer;border-radius:7px;font-size:.82rem;transition:.12s;}
    #gcrCalModal .cal-day-cell:hover{background:#e0f2fe;}
    #gcrCalModal .cal-day-sel{background:#0b7a75!important;color:#fff;font-weight:700;}
    #gcrCalModal .cal-day-today{background:#e0f2fe;color:#0369a1;font-weight:700;}
    #gcrCalModal .cal-day-hasdot::after{content:'';display:block;width:5px;height:5px;background:#0b7a75;border-radius:50%;margin:1px auto 0;}
    #gcrCalModal .cal-ev-card{display:flex;gap:12px;padding:12px;border-radius:10px;margin-bottom:9px;}
    #gcrCalModal .cal-closebtn{background:rgba(255,255,255,.2);border:none;color:#fff;font-size:1.1rem;cursor:pointer;border-radius:8px;padding:7px 11px;}
    @media(max-width:600px){#gcrCalModal .cal-mini{width:100%;min-width:0;border-right:none;border-bottom:1px solid #f0f0f0;} #gcrCalModal .cal-events{max-height:360px;}}
    </style>`;

  const html = `${style}
  <div id="gcrCalModal">
    <div class="cal-inner">
      <div class="cal-head">
        <div>
          <div style="font-size:.68rem;opacity:.8;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Gulf Coast Radar</div>
          <div style="font-size:1.25rem;font-weight:800;margin-top:2px;">📅 Master Calendar</div>
          <div id="gcrCalToday" style="font-size:.8rem;opacity:.8;margin-top:3px;"></div>
        </div>
        <button class="cal-closebtn" onclick="closeCalendarModal()">✕</button>
      </div>
      <div class="cal-daterow">
        <button class="cal-navbtn" onclick="gcrCalNav(-1)">◀ Prev</button>
        <div id="gcrCalLabel" class="cal-datelabel"></div>
        <button class="cal-navbtn" onclick="gcrCalNav(1)">Next ▶</button>
      </div>
      <div class="cal-filters">
        <span style="font-size:.7rem;font-weight:700;color:#888;">Show:</span>
        <button class="cal-toggle on" data-t="events"     onclick="gcrCalToggle(this)">🎉 Events</button>
        <button class="cal-toggle on" data-t="happy_hour" onclick="gcrCalToggle(this)">🍻 Happy Hours</button>
        <button class="cal-toggle on" data-t="special"    onclick="gcrCalToggle(this)">🏷️ Specials</button>
        <button class="cal-toggle on" data-t="live-music" onclick="gcrCalToggle(this)">🎸 Live Music</button>
      </div>
      <div class="cal-body">
        <div class="cal-mini" id="gcrMiniCal"></div>
        <div class="cal-events" id="gcrCalEvents"></div>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('gcrCalModal').addEventListener('click', e => {
    if (e.target.id === 'gcrCalModal') closeCalendarModal();
  });
}

window.openCalendarModal = function(dateStr) {
  _gcrInjectCal();
  _gcrCalDate = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  document.getElementById('gcrCalModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
  const now = new Date();
  document.getElementById('gcrCalToday').textContent =
    'Today: ' + now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  _gcrCalRender();
};

window.closeCalendarModal = function() {
  const m = document.getElementById('gcrCalModal');
  if (m) m.style.display = 'none';
  document.body.style.overflow = '';
};

window.gcrCalNav = function(dir) {
  _gcrCalDate = new Date(_gcrCalDate);
  _gcrCalDate.setDate(_gcrCalDate.getDate() + dir);
  _gcrCalRender();
};

window.gcrCalToggle = function(btn) {
  btn.classList.toggle('on');
  const t = btn.dataset.t;
  if (_gcrCalTypes.has(t)) _gcrCalTypes.delete(t); else _gcrCalTypes.add(t);
  _gcrCalRenderEvents();
};

window.gcrCalSelectDay = function(ds) {
  _gcrCalDate = new Date(ds + 'T12:00:00');
  _gcrCalRender();
};

window.gcrCalMiniNav = function(dir) {
  _gcrCalDate = new Date(_gcrCalDate);
  _gcrCalDate.setMonth(_gcrCalDate.getMonth() + dir);
  _gcrCalRenderMini();
};

function _gcrCalRender() {
  const d = _gcrCalDate;
  document.getElementById('gcrCalLabel').textContent =
    d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  _gcrCalRenderMini();
  _gcrCalRenderEvents();
}

function _gcrCalRenderMini() {
  const d     = _gcrCalDate;
  const yr    = d.getFullYear(), mo = d.getMonth();
  const MONS  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const first = new Date(yr, mo, 1).getDay();
  const dim   = new Date(yr, mo + 1, 0).getDate();
  const now   = new Date();
  const selStr= `${yr}-${String(mo+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  // Gather dates with events this month (for dot indicators)
  let dotDates = new Set();
  if (typeof GCR !== 'undefined' && GCR.loaded) {
    const prefix = `${yr}-${String(mo+1).padStart(2,'0')}`;
    (GCR.events || []).forEach(ev => { if ((ev.date||ev.event_date||'').startsWith(prefix)) {
      dotDates.add(parseInt((ev.date||ev.event_date).split('-')[2]));
    }});
  }

  let h = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
    <button onclick="gcrCalMiniNav(-1)" style="background:none;border:none;cursor:pointer;font-size:.9rem;color:#0b7a75;padding:4px;">◀</button>
    <span style="font-size:.85rem;font-weight:800;color:#0b7a75;">${MONS[mo]} ${yr}</span>
    <button onclick="gcrCalMiniNav(1)" style="background:none;border:none;cursor:pointer;font-size:.9rem;color:#0b7a75;padding:4px;">▶</button>
  </div>
  <table style="width:100%;border-collapse:collapse;">
  <tr>${SHORT.map(s=>`<th style="text-align:center;font-size:.72rem;color:#888;font-weight:700;padding:3px 0;">${s}</th>`).join('')}</tr><tr>`;

  let col = 0;
  for (let i = 0; i < first; i++) { h += `<td></td>`; col++; }

  for (let day = 1; day <= dim; day++) {
    const ds  = `${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const isTd = now.getFullYear()===yr && now.getMonth()===mo && now.getDate()===day;
    const isSel= ds === selStr;
    const hasDot = dotDates.has(day);
    const cls = 'cal-day-cell' + (isSel?' cal-day-sel':isTd?' cal-day-today':'') + (hasDot&&!isSel?' cal-day-hasdot':'');
    h += `<td class="${cls}" onclick="gcrCalSelectDay('${ds}')">${day}</td>`;
    col++;
    if (col === 7 && day < dim) { h += `</tr><tr>`; col = 0; }
  }
  h += `</tr></table>`;

  const todayStr = now.toISOString().split('T')[0];
  const tmrStr   = new Date(now.getTime()+86400000).toISOString().split('T')[0];
  h += `<div style="margin-top:12px;display:flex;gap:6px;">
    <button onclick="gcrCalSelectDay('${todayStr}')" style="flex:1;background:#0b7a75;color:#fff;border:none;cursor:pointer;border-radius:8px;padding:7px 4px;font-size:.73rem;font-weight:700;">Today</button>
    <button onclick="gcrCalSelectDay('${tmrStr}')" style="flex:1;background:#e0f2fe;color:#0369a1;border:none;cursor:pointer;border-radius:8px;padding:7px 4px;font-size:.73rem;font-weight:700;">Tomorrow</button>
  </div>`;

  document.getElementById('gcrMiniCal').innerHTML = h;
}

function _gcrCalToMin(t) {
  if (!t) return null;
  const m = t.match(/(\d+):?(\d*)\s*(AM|PM)?/i);
  if (!m) return null;
  let h=parseInt(m[1]), mn=parseInt(m[2]||'0');
  const ap=(m[3]||'').toUpperCase();
  if(ap==='PM'&&h!==12)h+=12; if(ap==='AM'&&h===12)h=0;
  return h*60+mn;
}

function _gcrCalRenderEvents() {
  const el = document.getElementById('gcrCalEvents');
  if (!el) return;
  if (typeof GCR === 'undefined' || !GCR.loaded) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">Loading data…</div>';
    return;
  }

  const d       = _gcrCalDate;
  const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const dayName = d.toLocaleDateString('en-US',{weekday:'long'}).toLowerCase();
  const DAY_NAMES = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const isWeekend = d.getDay()===0 || d.getDay()===6;
  const now     = new Date();
  const isToday = dateStr === now.toISOString().split('T')[0];
  const nowMin  = now.getHours()*60+now.getMinutes();

  const bizMap = {};
  (GCR.businesses||[]).forEach(b=>{ bizMap[b.id]=b; bizMap[b.site_id]=b; bizMap[b.slug]=b; });

  const items = [];
  const seenIds = new Set();

  const _pushItem = (item) => {
    // Primary dedup: by ID
    const idKey = item.id || item.event_id || item.special_id;
    if (idKey && seenIds.has(idKey)) return;
    if (idKey) seenIds.add(idKey);
    // Secondary dedup: by entity+name+time (catches DB dupes with different IDs)
    const contentKey = `${item.entity_slug||item.slug||item.entity_id||''}|${item.special_name||item.event_name||item.name||''}|${item.start_time||item.event_time||item.time||''}`;
    if (seenIds.has(contentKey)) return;
    seenIds.add(contentKey);
    items.push(item);
  };

  // — Dated events —
  (GCR.events||[]).filter(ev=>{
    const evDate = ev.event_date || ev.date || '';
    const evType = (ev.event_type||'').toLowerCase();
    const isLiveMusic = evType.includes('live_music') || evType.includes('live music') || evType.includes('open_mic') || evType.includes('karaoke') || evType.includes('show_performance');
    const isEvent = !isLiveMusic;

    // Filter by date (dated events) or day_of_week (recurring)
    const matchesDate = evDate.startsWith(dateStr);
    const matchesRecurring = !evDate && ev.recurring && (ev.day_of_week||'').toLowerCase() === dayName;
    if (!matchesDate && !matchesRecurring) return false;

    // Apply type filters
    if (isLiveMusic && _gcrCalTypes.has('live-music')) return true;
    if (isEvent && _gcrCalTypes.has('events')) return true;
    // Live music also shows under events if events is on
    if (isLiveMusic && _gcrCalTypes.has('events')) return true;
    return false;
  }).forEach(ev=>{
    const isLiveMusic = (ev.event_type||'').toLowerCase().includes('live_music') || (ev.event_type||'').toLowerCase().includes('open_mic');
    _pushItem({...ev, _src: isLiveMusic ? 'live_music' : 'event'});
  });

  // — Specials + Happy Hours —
  (GCR.specials||[]).filter(sp=>{
    if (sp.is_active===false || sp.active===false) return false;
    // Parse days — GCR uses sp.days (JSON string or array)
    let daysRaw = sp.days || sp.day_of_week || [];
    if (typeof daysRaw === 'string') {
      try { daysRaw = JSON.parse(daysRaw); } catch(e) { daysRaw = daysRaw.split(/[,;]+/).map(s=>s.trim()); }
    }
    const days = (Array.isArray(daysRaw) ? daysRaw : []).map(d=>d.toLowerCase());
    const dayMatch = !days.length || ['daily','everyday','all'].some(k=>days.includes(k)) ||
      days.includes(dayName) || (isWeekend&&(days.includes('weekend')||days.includes('weekends')));
    if (!dayMatch) return false;
    // GCR uses special_type, old DB uses type
    const type = (sp.special_type || sp.type || 'special').toLowerCase();
    if (type === 'happy_hour') return _gcrCalTypes.has('happy_hour');
    return _gcrCalTypes.has('special');
  }).forEach(sp=>{
    const type = (sp.special_type || sp.type || 'special').toLowerCase();
    _pushItem({...sp, _src: type==='happy_hour' ? 'happy_hour' : 'special'});
  });

  // Sort by time
  items.sort((a,b)=>{
    const at = _gcrCalToMin(a.start_time||a.time||a.event_time||'') ?? 9999;
    const bt = _gcrCalToMin(b.start_time||b.time||b.event_time||'') ?? 9999;
    return at - bt;
  });

  if (!items.length) {
    el.innerHTML=`<div style="text-align:center;padding:48px 16px;color:#888;">
      <div style="font-size:2.5rem;margin-bottom:10px;">🗓️</div>
      <div style="font-weight:600;font-size:.95rem;">Nothing scheduled</div>
      <p style="font-size:.82rem;margin-top:6px;">Try a different day or adjust filters above.</p>
    </div>`;
    return;
  }

  const CLRS = {
    'event'     : {bg:'#f0fdf4', bdr:'#16a34a', ic:'🎉', lbl:'Event'},
    'live_music': {bg:'#f5f3ff', bdr:'#7c3aed', ic:'🎸', lbl:'Live Music'},
    'happy_hour': {bg:'#fff7ed', bdr:'#ea580c', ic:'🍻', lbl:'Happy Hour'},
    'special'   : {bg:'#fef9c3', bdr:'#ca8a04', ic:'🏷️', lbl:'Special'},
  };

  let html = `<div style="font-size:.75rem;font-weight:700;color:#888;margin-bottom:10px;">${items.length} item${items.length!==1?'s':''} · ${d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div>`;

  items.forEach(item => {
    // GCR DB field names: event_name, venue_location, entity_name, entity_slug
    // Old DB field names: name, title, venue, businessName
    const title = item.event_name || item.special_name || item.name || item.title || 'Event';
    const venue = item.venue_location || item.entity_name || item.businessName ||
                  bizMap[item.entity_id]?.name || bizMap[item.site_id]?.name || '';
    const slug  = item.entity_slug || item.slug ||
                  bizMap[item.entity_id]?.slug || bizMap[item.site_id]?.slug || '';
    const t     = item.start_time || item.time || item.event_time || '';
    const desc  = item.description || '';
    const eMin  = _gcrCalToMin(t);
    const live  = isToday && eMin !== null && nowMin >= eMin && nowMin < eMin + 180;
    const past  = isToday && eMin !== null && eMin < nowMin - 180;
    const c     = CLRS[item._src] || CLRS['event'];

    // Format time from 24hr "19:00" → "7pm"
    let timeDisplay = t;
    if (t && t.match(/^\d{2}:\d{2}/)) {
      const [hh, mm] = t.split(':').map(Number);
      const ap = hh >= 12 ? 'pm' : 'am';
      const h12 = hh % 12 || 12;
      timeDisplay = mm ? `${h12}:${String(mm).padStart(2,'0')}${ap}` : `${h12}${ap}`;
    }

    html += `<div class="cal-ev-card" style="background:${c.bg};border:1.5px solid ${c.bdr}22;${past?'opacity:.45':''}">
      <div style="font-size:1.5rem;flex-shrink:0;line-height:1;">${c.ic}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:.88rem;margin-bottom:1px;">${title}</div>
        ${venue ? `<div style="font-size:.75rem;color:#666;">📍 ${venue}</div>` : ''}
        ${timeDisplay ? `<div style="font-size:.75rem;color:#666;">⏰ ${timeDisplay}${live ? ' · <span style="color:#059669;font-weight:700;">🟢 Live Now</span>' : ''}</div>` : ''}
        ${desc ? `<div style="font-size:.75rem;color:#555;margin-top:3px;line-height:1.4;">${desc}</div>` : ''}
        ${item.artist_name ? `<div style="font-size:.75rem;color:#be185d;font-weight:600;margin-top:3px;">🎤 ${item.artist_name}</div>` : ''}
        <div style="margin-top:5px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          <span style="background:${c.bdr}18;color:${c.bdr};font-size:.67rem;font-weight:700;padding:2px 7px;border-radius:12px;">${c.lbl}</span>
          ${slug ? `<a href="profile.html?id=${slug}" style="font-size:.7rem;color:#0b7a75;font-weight:600;text-decoration:none;">View →</a>` : ''}
        </div>
      </div>
    </div>`;
  });

  el.innerHTML = html;
}

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

  /* ── Search bar (generic, for pages with #mainSearch) ── */
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

  /* ── Hero search (index3.html — #heroSearch + dropdown) ── */
  const heroInput    = document.getElementById('heroSearch');
  const heroDropdown = document.getElementById('heroDropdown');
  if (heroInput) {
    heroInput.addEventListener('keydown', e => { if (e.key === 'Enter') doHeroSearch(); });
    heroInput.addEventListener('input', () => {
      const q = heroInput.value.trim();
      if (!heroDropdown) return;
      if (!q || q.length < 2 || typeof GCR === 'undefined' || !GCR.loaded) {
        heroDropdown.classList.remove('open');
        return;
      }
      const results = GCR.search(q).slice(0, 6);
      if (!results.length) { heroDropdown.classList.remove('open'); return; }
      heroDropdown.innerHTML = results.map(b => `
        <a href="profile.html?id=${b.slug || b.site_id}" class="sri-item">
          <span style="font-size:1.4rem">${b.emoji || '🏖️'}</span>
          <div>
            <div style="font-weight:600;font-size:.88rem">${b.name}</div>
            <div style="font-size:.75rem;color:#888">${b.tagline || b.type || ''}</div>
          </div>
        </a>`).join('');
      heroDropdown.classList.add('open');
    });
    document.addEventListener('click', e => {
      if (heroDropdown && !heroInput.contains(e.target) && !heroDropdown.contains(e.target))
        heroDropdown.classList.remove('open');
    });
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

  /* ── Tag filter buttons (new toolbar) ── */
  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterListings(btn.dataset.filter);
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
  renderDealsPage();       // deals.html (combined happy hours + specials)
  renderEventsPage();      // events.html
  renderPublicSpotsPage(); // public-spots.html
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
  const imgUrl   = biz.logo_url || biz.logo || biz.image || biz.hero_image || biz.cover_image || biz.cover_url || '';

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

  // Use specific card classes for different contexts
  const isCoffeeCtx = context === 'coffee-sweets';
  const isActivityCtx = context === 'things-to-do';
  const cardClass = isRestaurantCtx ? 'restaurant-card' : (isCoffeeCtx ? 'cafe-card' : (isActivityCtx ? 'activity-card' : 'biz-card'));
  const imageClass = isRestaurantCtx ? 'restaurant-image' : (isCoffeeCtx ? 'cafe-image' : (isActivityCtx ? 'activity-image' : 'biz-card-img'));
  const bodyClass = isRestaurantCtx ? 'restaurant-body' : (isCoffeeCtx ? 'cafe-body' : (isActivityCtx ? 'activity-body' : 'biz-card-body'));
  const nameClass = isRestaurantCtx ? 'name' : '';
  const sublineClass = isRestaurantCtx ? 'subline' : '';
  const chipsClass = isRestaurantCtx ? 'chips' : '';
  const descClass = isRestaurantCtx ? 'desc' : 'biz-desc';
  const actionClass = isRestaurantCtx ? 'action' : 'biz-btn-view';
  const actionPrimaryClass = isRestaurantCtx ? 'action primary' : 'biz-btn-book';

  const useHorizontalLayout = isRestaurantCtx || isCoffeeCtx || isActivityCtx;

  const _tags = [
    ...(biz.tags||[]),
    category,
    biz.subcategory||'',
    (biz.subcategory||'').replace(/-/g,' '),
    (biz.waterfront||biz.beachfront) ? 'waterfront' : '',
    (biz.liveMusic||biz.live_music)  ? 'live-music'  : '',
    (biz.happyHour||biz.happy_hour)  ? 'happy-hour'  : '',
    biz.kidsFriendly ? 'family'  : '',
    biz.outdoor      ? 'outdoor' : '',
  ].filter(Boolean).join(' ');

  return `
  <article class="${cardClass}" data-tags="${_tags}" onclick="window.location.href='profile.html?id=${slug}'" style="cursor:pointer">
    <div class="${imageClass}" ${!useHorizontalLayout ? '' : 'style="background-image:url(' + (imgUrl ? `'${imgUrl}'` : '') + ')"'}>
      ${featured}
      ${!useHorizontalLayout && imgUrl ? `<img src="${imgUrl}" alt="${escGcr(biz.name)}" loading="lazy" onerror="this.style.display='none'">` : ''}
      ${!useHorizontalLayout && !imgUrl ? `<span>${biz.emoji || '🏖️'}</span>` : ''}
      ${useHorizontalLayout && biz.featured ? '<div class="image-badge">Featured</div>' : ''}
    </div>
    <div class="${bodyClass}">
      ${useHorizontalLayout ? `<div class="title-row"><div><div class="${nameClass}">${escGcr(biz.name)}</div>` : `<h4>${escGcr(biz.name)}</h4>`}
      ${useHorizontalLayout ? `<div class="${sublineClass}"><span>${biz.city || biz.location || 'Gulf Coast'}</span>${priceRange ? `<span>${priceRange}</span>` : ''}</div></div>` : ''}
      ${useHorizontalLayout && biz.featured ? `<div class="status">Featured</div></div>` : (useHorizontalLayout ? `</div>` : '')}

      ${rating ? `<div class="rating"><span class="stars">${stars}</span> ${rating} <span style="color:var(--gray-400)">(${reviews})</span></div>` : `${!useHorizontalLayout ? `<div class="biz-rating"><span class="stars">${stars}</span> ${rating} <span style="color:var(--gray-400)">(${reviews})</span></div>` : ''}`}

      ${useHorizontalLayout ? `<div class="${chipsClass}">
        ${(biz.tags||[]).slice(0,4).map(t => `<span class="chip">${escGcr(t)}</span>`).join('')}
      </div>` : `<div class="biz-card-meta">
        ${showCatTag ? `<span class="biz-tag">${categoryLabel(category)}</span>` : ''}
        ${priceRange ? `<span class="biz-tag">${priceRange}</span>` : ''}
        ${showHHTag ? `<span class="biz-tag" style="background:#e6f9f0;color:#1a7a47">🍻 HH ${hhText}</span>` : ''}
      </div>`}

      <p class="${descClass}">${escGcr((biz.description || biz.tagline || '').substring(0, 180))}${(biz.description || biz.tagline || '').length > 180 ? '... <a href="profile.html?id=' + slug + '" style="color:var(--brand);font-weight:800;text-decoration:underline;cursor:pointer">More</a>' : ''}</p>

      ${useHorizontalLayout ? `<div class="bottom-row">
        <div class="venue">📍 ${biz.address || biz.city || biz.location || 'See details for address'}</div>
        <div class="actions">
          ${biz.phone ? `<a href="tel:${(biz.phone||'').replace(/\D/g,'')}" class="${actionClass}" onclick="event.stopPropagation()">Call</a>` : ''}
          ${biz.address ? `<a href="https://maps.google.com?q=${encodeURIComponent(biz.address)}" target="_blank" class="${actionClass}" onclick="event.stopPropagation()">Directions</a>` : ''}
          <a href="profile.html?id=${slug}" class="${actionPrimaryClass}">View Page</a>
        </div>
      </div>` : `<div class="biz-card-actions">
        <a href="profile.html?id=${slug}" class="${actionClass}">View Profile</a>
        ${showBookBtn  ? `<button class="${actionPrimaryClass}" onclick="openBookingModal('${slug}')">📅 Book Now</button>` : ''}
        ${showMenuBtn  ? `<a href="${biz.links.menu}" class="biz-btn-menu">Full Menu</a>` : ''}
      </div>`}
    </div>
  </article>`;
}

/* ── Auto-render #listingsGrid on category pages ── */
function renderPageListings() {
  const grid = document.getElementById('listingsGrid');
  if (!grid || typeof GCR === 'undefined') return;
  if (window._gcrListingsActive) return; // gcr-listings.js handles rendering on this page
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
  document.querySelectorAll('.biz-card, .restaurant-card, .activity-card, .cafe-card').forEach(card => {
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
  /* also filter deal-cards */
  document.querySelectorAll('.deal-card').forEach(card => {
    if (!filter || filter === 'all') { card.style.display = ''; return; }
    const tags = (card.dataset.tags || '').toLowerCase();
    card.style.display = tags.includes(filter.toLowerCase()) ? '' : 'none';
  });
}

/* ══════════════════════════════════════════
   HAPPY HOURS PAGE — expandable listings
══════════════════════════════════════════ */
function renderHappyHourPage() {
  const nowGrid   = document.getElementById('hhNowGrid');
  const soonGrid  = document.getElementById('hhSoonGrid');
  const laterGrid = document.getElementById('hhLaterGrid');
  const grid      = document.getElementById('hhGrid');
  if (!nowGrid && !grid) return;
  if (typeof GCR === 'undefined') return;

  const businesses = GCR.getHappyHours();

  // Old layout fallback
  if (!nowGrid) {
    if (!businesses.length) {
      grid.innerHTML = '<p class="text-muted text-center" style="padding:40px">No happy hours listed yet.</p>';
      return;
    }
    grid.innerHTML = businesses.map(biz => {
      const slug    = biz.slug || biz.site_id || biz.id;
      const cardId  = 'hh-' + slug;
      const hhText  = biz.happy_hour || biz.happyHour || '';
      const tags    = (biz.tags || []).join(' ');
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
            <a href="profile.html?id=${slug}" class="btn btn-outline btn-sm">View Profile</a>
            <button class="expand-btn btn btn-sm" onclick="toggleExpand('${cardId}')">Details ▼</button>
          </div>
        </div>
        <div class="listing-expand-details" id="${cardId}-details">${detailsHtml}</div>
      </div>`;
    }).join('');
    return;
  }

  // New mockup layout — categorize by current time
  function parseHHTime(text) {
    if (!text) return null;
    const m = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (!m) return null;
    let sh = parseInt(m[1]), sm = parseInt(m[2]||0), sap = (m[3]||'').toLowerCase();
    let eh = parseInt(m[4]), em = parseInt(m[5]||0), eap = (m[6]||'').toLowerCase();
    if (eap === 'pm' && eh < 12) eh += 12;
    if (eap === 'am' && eh === 12) eh = 0;
    if (sap === 'pm' && sh < 12) sh += 12;
    if (sap === 'am' && sh === 12) sh = 0;
    return { startMin: sh * 60 + sm, endMin: eh * 60 + em };
  }

  function hhStatus(biz) {
    const parsed = parseHHTime(biz.happy_hour || biz.happyHour || '');
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    if (!parsed) return 'later';
    if (cur >= parsed.startMin && cur < parsed.endMin) return 'now';
    if (parsed.startMin > cur && parsed.startMin - cur <= 120) return 'soon';
    return 'later';
  }

  function hhFullCard(biz) {
    const slug = biz.slug || biz.site_id || biz.id;
    const hhText = biz.happy_hour || biz.happyHour || '';
    const photo = biz.photo || biz.cover_photo || '';
    const hhSpecials = GCR.specials.filter(s =>
      (s.site_id === biz.site_id || s.site_id === biz.id) && s.active !== false
    );
    const dealsHtml = hhSpecials.length
      ? hhSpecials.slice(0,3).map(s => `<div class="deal">${escGcr(s.name||'Special')}${s.discount ? ' — '+escGcr(s.discount) : ''}</div>`).join('')
      : `<div class="deal">Happy hour specials — call to confirm</div>`;
    const chips = (biz.tags||[]).slice(0,3).map(t=>`<span class="chip">${escGcr(t)}</span>`).join('');
    const stars = biz.rating ? '★'.repeat(Math.round(biz.rating))+'☆'.repeat(5-Math.round(biz.rating)) : '';
    return `
    <div class="hh-card">
      <div class="hh-image" style="background-image:url('${escGcr(photo)}');background-color:#d9edf5">
        <div class="image-badge">🍻 Happy Hour</div>
      </div>
      <div class="hh-body">
        <div class="title-row">
          <div class="name">${escGcr(biz.name)}</div>
          <div class="status">● Live Now</div>
        </div>
        <div class="subline">${escGcr(biz.area||biz.city||'')}${biz.cuisine?' · '+escGcr(biz.cuisine):''}</div>
        ${stars?`<div class="rating"><span class="stars">${stars}</span> ${biz.rating}</div>`:''}
        <div class="timepill">🕒 ${escGcr(hhText)}</div>
        <div class="deals">${dealsHtml}</div>
        ${chips?`<div class="chips">${chips}</div>`:''}
        <div class="bottom-row">
          <div class="address">${escGcr(biz.address||'')}</div>
          <div class="actions">
            <a href="profile.html?id=${slug}" class="action">Details</a>
            <a href="profile.html?id=${slug}" class="action primary">View Specials</a>
          </div>
        </div>
      </div>
    </div>`;
  }

  function hhCompactCard(biz) {
    const slug = biz.slug || biz.site_id || biz.id;
    const hhText = biz.happy_hour || biz.happyHour || '';
    const parsed = parseHHTime(hhText);
    const cur = new Date().getHours()*60 + new Date().getMinutes();
    const minsUntil = parsed && parsed.startMin > cur ? parsed.startMin - cur : null;
    const countdown = minsUntil
      ? `<span class="countdown">In ${minsUntil>=60?Math.floor(minsUntil/60)+'h ':''}${minsUntil%60}m</span>` : '';
    const hhSpecials = GCR.specials.filter(s =>
      (s.site_id === biz.site_id || s.site_id === biz.id) && s.active !== false
    );
    const deal = hhSpecials[0]
      ? escGcr(hhSpecials[0].name+(hhSpecials[0].discount?' — '+hhSpecials[0].discount:''))
      : 'Specials available';
    return `
    <div class="compact-card">
      <h4>${escGcr(biz.name)}</h4>
      ${countdown}
      <div class="compact-meta">${escGcr(hhText)}${biz.area?' · '+escGcr(biz.area):''}</div>
      <div class="compact-deal">${deal}</div>
      <div class="compact-actions">
        <a href="profile.html?id=${slug}">Details</a>
        <a href="profile.html?id=${slug}">View Specials</a>
      </div>
    </div>`;
  }

  const nowBiz   = businesses.filter(b => hhStatus(b) === 'now');
  const soonBiz  = businesses.filter(b => hhStatus(b) === 'soon');
  const laterBiz = businesses.filter(b => hhStatus(b) === 'later');

  // Update livebox stats
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit', hour12:true});
  const hhTimeEl = document.getElementById('hh-time');
  if (hhTimeEl) hhTimeEl.textContent = days[now.getDay()] + ' • ' + timeStr;
  const hhActiveEl = document.getElementById('hh-active-count');
  if (hhActiveEl) hhActiveEl.textContent = nowBiz.length + ' active now';
  const hhSoonEl = document.getElementById('hh-soon-count');
  if (hhSoonEl) hhSoonEl.textContent = soonBiz.length + ' starting soon';
  const hhNowSub = document.getElementById('hh-now-sub');
  if (hhNowSub) hhNowSub.textContent = nowBiz.length
    ? nowBiz.length + ' live special' + (nowBiz.length !== 1 ? 's' : '')
    : 'None right now — check back later';

  if (!businesses.length) {
    const ctaHtml = '<div class="empty" style="grid-column:1/-1;text-align:center;padding:40px 20px"><p style="font-size:1.1em;margin-bottom:12px">No happy hours listed yet.</p><a href="mailto:hello@gulfcoastranked.com" class="btn btn-primary">Add Your Happy Hour →</a></div>';
    nowGrid.innerHTML = ctaHtml;
    if (soonGrid) soonGrid.innerHTML = '';
    if (laterGrid) laterGrid.innerHTML = '';
    return;
  }

  nowGrid.innerHTML = nowBiz.length
    ? nowBiz.map(hhFullCard).join('')
    : '<div class="empty">No happy hours happening right now. Check "Starting Soon" below.</div>';
  soonGrid.innerHTML = soonBiz.length
    ? soonBiz.map(hhCompactCard).join('')
    : '<div class="empty" style="grid-column:1/-1">None starting in the next 2 hours.</div>';
  laterGrid.innerHTML = laterBiz.length
    ? laterBiz.map(hhCompactCard).join('')
    : '<div class="empty" style="grid-column:1/-1">No more happy hours scheduled today.</div>';
}

/* ══════════════════════════════════════════
   SPECIALS PAGE — expandable listings
══════════════════════════════════════════ */
function renderSpecialsPage() {
  const activeGrid = document.getElementById('spActiveGrid');
  const soonGrid   = document.getElementById('spSoonGrid');
  const laterGrid  = document.getElementById('spLaterGrid');
  const grid       = document.getElementById('specialsGrid');
  if (!activeGrid && !grid) return;
  if (typeof GCR === 'undefined') return;

  let specials = GCR.getSpecials();
  // Exclude happy hour specials — show only daily/food/AYCE specials
  specials = specials.filter(s => !s.type || s.type !== 'happy_hour');

  // New mockup layout
  if (activeGrid) {
    if (!specials.length) {
      activeGrid.innerHTML = '<div class="empty">No active specials right now. Check "Starting Soon" below.</div>';
      if (soonGrid) soonGrid.innerHTML = '<div class="empty" style="grid-column:1/-1">None starting soon.</div>';
      if (laterGrid) laterGrid.innerHTML = '<div class="empty" style="grid-column:1/-1">No more specials today.</div>';
      return;
    }

    function spStatus(spec) {
      const now = new Date();
      const cur = now.getHours() * 60 + now.getMinutes();
      if (!spec.start_time) return 'active';
      const m = spec.start_time.match(/(\d{1,2}):?(\d{2})?/);
      if (!m) return 'active';
      const sh = parseInt(m[1]), sm = parseInt(m[2]||0);
      const startMin = sh * 60 + sm;
      if (cur >= startMin && cur < startMin + 120) return 'active';
      if (startMin > cur && startMin - cur <= 120) return 'soon';
      return 'later';
    }

    function spFullCard(spec) {
      const biz = GCR.businesses.find(b => b.site_id === spec.site_id || b.id === spec.site_id);
      const slug = spec.site_id || (biz && biz.slug);
      const photo = biz && (biz.photo || biz.cover_photo) || '';
      return `
      <div class="hh-card">
        <div class="hh-image" style="background-image:url('${escGcr(photo)}');background-color:#fef3c7">
          <div class="image-badge">🏷️ Special</div>
        </div>
        <div class="hh-body">
          <div class="title-row">
            <div class="name">${escGcr(spec.name || 'Special')}</div>
            <div class="status">● Active</div>
          </div>
          <div class="subline">${escGcr(biz && biz.area || '')}</div>
          <div class="timepill">🕒 ${escGcr(spec.start_time || 'All day')}${spec.end_time ? ' – ' + escGcr(spec.end_time) : ''}</div>
          <div class="deals"><div class="deal">${escGcr(spec.description || spec.discount || 'Special offer')}</div></div>
          <div class="bottom-row">
            <div class="address">${escGcr(biz && biz.address || '')}</div>
            <div class="actions">
              <a href="profile.html?id=${slug}" class="action">Details</a>
              <a href="profile.html?id=${slug}" class="action primary">View</a>
            </div>
          </div>
        </div>
      </div>`;
    }

    function spCompactCard(spec) {
      const biz = GCR.businesses.find(b => b.site_id === spec.site_id || b.id === spec.site_id);
      const slug = spec.site_id || (biz && biz.slug);
      const m = spec.start_time && spec.start_time.match(/(\d{1,2}):?(\d{2})?/);
      const sh = m ? parseInt(m[1]) : null;
      const sm = m ? parseInt(m[2]||0) : null;
      const cur = new Date().getHours()*60 + new Date().getMinutes();
      const startMin = sh !== null ? sh * 60 + sm : null;
      const minsUntil = startMin && startMin > cur ? startMin - cur : null;
      const countdown = minsUntil ? `<span class="countdown">In ${minsUntil>=60?Math.floor(minsUntil/60)+'h ':''}${minsUntil%60}m</span>` : '';
      return `
      <div class="compact-card">
        <h4>${escGcr(spec.name || 'Special')}</h4>
        ${countdown}
        <div class="compact-meta">${escGcr(spec.start_time || 'All day')}${biz && biz.area ? ' · ' + escGcr(biz.area) : ''}</div>
        <div class="compact-deal">${escGcr(spec.description || spec.discount || 'Special offer')}</div>
        <div class="compact-actions">
          <a href="profile.html?id=${slug}">Details</a>
          <a href="profile.html?id=${slug}">View</a>
        </div>
      </div>`;
    }

    const activeSp = specials.filter(s => spStatus(s) === 'active');
    const soonSp = specials.filter(s => spStatus(s) === 'soon');
    const laterSp = specials.filter(s => spStatus(s) === 'later');

    activeGrid.innerHTML = activeSp.length
      ? activeSp.map(spFullCard).join('')
      : '<div class="empty">No active specials right now. Check "Starting Soon" below.</div>';
    if (soonGrid) soonGrid.innerHTML = soonSp.length
      ? soonSp.map(spCompactCard).join('')
      : '<div class="empty" style="grid-column:1/-1">None starting in the next 2 hours.</div>';
    if (laterGrid) laterGrid.innerHTML = laterSp.length
      ? laterSp.map(spCompactCard).join('')
      : '<div class="empty" style="grid-column:1/-1">No more specials today.</div>';
    return;
  }

  // Old layout fallback
  if (!grid) return;

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
          <a href="profile.html?id=${slug}" class="btn btn-outline btn-sm">View Profile</a>
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
   DEALS PAGE — restaurant-style cards with expandable details
══════════════════════════════════════════ */
function renderDealsPage() {
  const grid = document.getElementById('listingsGrid');
  if (!grid || typeof GCR === 'undefined' || grid.dataset.category !== 'deals') return;

  // Get both happy hour and regular specials
  const happyHours = (GCR.specials || []).filter(s => s.active !== false && (s.type === 'happy_hour' || (s.name || '').toLowerCase().includes('happy hour')));
  const specials = (GCR.specials || []).filter(s => s.active !== false && (!s.type || s.type !== 'happy_hour'));
  const allDeals = [...happyHours, ...specials];

  if (!allDeals.length) {
    grid.innerHTML = '<p style="padding:40px;text-align:center;color:#888;">No deals found right now. Check back soon!</p>';
    return;
  }

  // Group by business
  const byBiz = {};
  allDeals.forEach(deal => {
    const key = deal.site_id || 'unknown';
    if (!byBiz[key]) byBiz[key] = { biz: null, deals: [] };
    byBiz[key].deals.push(deal);
  });

  // Enrich with business info
  (GCR.businesses || []).forEach(biz => {
    const key = biz.site_id || biz.id;
    if (byBiz[key]) byBiz[key].biz = biz;
  });

  let html = '';
  Object.entries(byBiz).forEach(([siteId, { biz, deals }]) => {
    const name = biz ? biz.name : 'Local Business';
    const emoji = biz ? (biz.emoji || '🏪') : '🏪';
    const image = biz ? (biz.logo_url || biz.logo || biz.image || '') : '';
    const slug = biz ? (biz.slug || biz.site_id || biz.id) : siteId;
    const tags = biz ? (biz.tags || []).join(' ') : '';
    const cardId = 'deal-' + siteId.replace(/[^a-z0-9]/gi, '-');
    const location = biz ? (biz.location || '') : '';

    html += `
    <div class="deal-item-wrapper">
      <article class="deal-card" id="${cardId}" data-tags="${tags}">
        <div class="deal-image" style="background-image: url('${escGcr(image)}'); background-size: cover; background-position: center;">
          ${emoji ? `<div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem;opacity:.3">${emoji}</div>` : ''}
        </div>
        <div class="deal-body">
          <div class="title-row">
            <div>
              <div class="deal-name">${escGcr(name)}</div>
              <div class="deal-subline">
                <span>${location || 'See details'}</span>
              </div>
            </div>
          </div>
          <div class="deal-summary">
            <strong>${deals.length} deal${deals.length > 1 ? 's' : ''} available</strong>
          </div>
          <div class="deal-actions">
            <a href="profile.html?id=${slug}" class="deal-btn">View Profile</a>
            <button class="deal-btn deal-btn-primary" onclick="toggleDealExpand('${cardId}')">View Details ▼</button>
          </div>
        </div>
      </article>
      <div class="deal-details" id="${cardId}-details">
        <div style="padding:16px 20px;border-top:1px solid var(--line);">
          ${deals.map(d => `
            <div class="deal-item-row">
              <div>
                <div class="deal-item-name">${escGcr(d.name || 'Deal')}</div>
                ${d.description ? `<div class="deal-item-desc">${escGcr(d.description)}</div>` : ''}
                ${d.time ? `<div class="deal-item-desc">⏰ ${escGcr(d.time)}</div>` : ''}
                ${d.days ? `<div class="deal-item-desc">📅 ${Array.isArray(d.days) ? d.days.join(', ') : escGcr(d.days)}</div>` : ''}
              </div>
              ${d.discount || d.price ? `<div class="deal-item-price">${escGcr(d.discount || d.price)}</div>` : ''}
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  });

  grid.innerHTML = html;
  wireDealsFilters();
}

/* ──────────────────────────────────────────── */
function toggleDealExpand(cardId) {
  const el = document.getElementById(cardId + '-details');
  if (!el) return;
  el.classList.toggle('open');
  const btn = event?.target;
  if (btn) btn.textContent = el.classList.contains('open') ? 'Hide Details ▲' : 'View Details ▼';
}

function wireDealsFilters() {
  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.deal-card').forEach(card => {
        if (!filter || filter === 'all') {
          card.style.display = '';
        } else {
          const tags = (card.dataset.tags || '').toLowerCase();
          card.style.display = tags.includes(filter.toLowerCase()) ? '' : 'none';
        }
      });
    });
  });
}

/* ══════════════════════════════════════════
   PUBLIC SPOTS PAGE — beach access, boats, parks
══════════════════════════════════════════ */
function renderPublicSpotsPage() {
  const container = document.getElementById('spotsContainer');
  if (!container || typeof GCR === 'undefined') return;

  // Sample public spots data structure
  const publicSpots = [
    { name: 'Gulf Place Beach Access', location: 'Orange Beach', type: 'beach-access', tags: ['beach-access', 'showers', 'restrooms'], description: 'Popular public beach entry with wide sandy beach and strong visitor access.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', features: ['Showers', 'Restrooms', 'Parking', 'Family Friendly'] },
    { name: 'Romar Beach Access', location: 'Orange Beach', type: 'beach-access', tags: ['beach-access', 'parking'], description: 'Simpler beach entry with less buildup than main public beach zones.', image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80', features: ['Beach Access', 'Parking Nearby'] },
    { name: 'Gulf Shores Public Beach', location: 'Gulf Shores', type: 'beach-access', tags: ['beach-access', 'lifeguards', 'restrooms'], description: 'Main public beach with lifeguards, restrooms, showers, and central tourist setup.', image: 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80', features: ['Lifeguards', 'Restrooms', 'Showers', 'Paid Parking'] },
    { name: 'Gulf State Park Beach', location: 'Gulf State Park', type: 'beach-access', tags: ['beach-access', 'ada'], description: 'State park beach with better facilities and more organized setup.', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80', features: ['Park Fee', 'Restrooms', 'Showers', 'Snorkeling'] },
    { name: 'Boggy Point Boat Launch', location: 'Orange Beach', type: 'boat-launch', tags: ['boat-launch', 'parking'], description: 'Popular public launch with trailer parking and convenient water access.', image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80', features: ['Boat Ramp', 'Trailer Parking', 'Fishing Access'] },
    { name: 'Cotton Bayou Boat Launch', location: 'Orange Beach', type: 'boat-launch', tags: ['boat-launch'], description: 'Direct water access without going through private marinas.', image: 'https://images.unsplash.com/photo-1468581264429-2548ef9eb732?auto=format&fit=crop&w=1200&q=80', features: ['Boat Ramp', 'Parking', 'Water Access'] },
    { name: 'Gulf State Park Pier', location: 'Gulf Shores', type: 'pier-fishing', tags: ['pier-fishing'], description: 'Large public pier with bait shop and no fishing license required.', image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80', features: ['No License Needed', 'Bait Shop', 'Small Fee'] },
    { name: 'Bon Secour National Wildlife Refuge', location: 'Fort Morgan', type: 'parks', tags: ['parks'], description: 'Nature-focused area for trails, quiet spaces, and wildlife viewing.', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', features: ['Nature Trails', 'Wildlife'] },
    { name: 'Gulf Shores Public Beach Pavilion', location: 'Gulf Shores', type: 'restrooms', tags: ['restrooms', 'ada'], description: 'Main facility stop with bathrooms, showers, and convenience.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', features: ['Restrooms', 'Showers', 'ADA Accessible'] },
    { name: 'Orange Beach Waterfront Park', location: 'Orange Beach', type: 'restrooms', tags: ['restrooms', 'parks'], description: 'Park facilities for restrooms and family convenience.', image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80', features: ['Restrooms', 'Family Friendly', 'Park Access'] },
  ];

  let html = '';
  publicSpots.forEach(spot => {
    const typePill = spot.type === 'beach-access' ? 'Beach Access' :
                     spot.type === 'boat-launch' ? 'Boat Launch' :
                     spot.type === 'pier-fishing' ? 'Pier & Fishing' :
                     spot.type === 'parks' ? 'Park' : 'Restrooms';
    const typeEmoji = spot.type === 'beach-access' ? '🏖️' :
                      spot.type === 'boat-launch' ? '🚤' :
                      spot.type === 'pier-fishing' ? '🎣' :
                      spot.type === 'parks' ? '🌳' : '🚽';

    html += `
    <div class="section">
      <div class="cards utility-card-section">
        <article class="utility-card" data-tags="${spot.tags.join(' ')}">
          <div class="utility-image" style="background-image:url('${spot.image}')"><div class="utility-image-badge">${typeEmoji} ${typePill}</div></div>
          <div class="title-row"><div><div class="name">${escGcr(spot.name)}</div><div class="subline">${escGcr(spot.location)} • ${typePill}</div></div><div class="type-pill">${typePill}</div></div>
          <div class="copy">${escGcr(spot.description)}</div>
          <div class="chips">${spot.features.map(f => `<span class="chip">${escGcr(f)}</span>`).join('')}</div>
          <div class="bottom-row"><div class="location">📍 ${escGcr(spot.location)}</div><div class="actions"><a href="#" class="action primary">Get Directions</a></div></div>
        </article>
      </div>
    </div>`;
  });

  container.innerHTML = html;
  wirePublicSpotsFilters();
}

function wirePublicSpotsFilters() {
  const toolbar = document.querySelector('.toolbar-top')?.parentElement?.querySelector('.tag-row');
  if (!toolbar) return;

  toolbar.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toolbar.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.utility-card').forEach(card => {
        if (!filter || filter === 'all') {
          card.style.display = '';
        } else {
          const tags = (card.dataset.tags || '').toLowerCase();
          card.style.display = tags.includes(filter.toLowerCase()) ? '' : 'none';
        }
      });
    });
  });
}

/* ══════════════════════════════════════════
   EVENTS PAGE — card view + list toggle
   List view: sorted earliest → latest,
   date shown prominently at top of each row
══════════════════════════════════════════ */
function renderEventsPage() {
  const grid = document.getElementById('listingsGrid');
  if (grid && grid.dataset.category === 'events' && typeof GCR !== 'undefined') {
    const events = GCR.getUpcomingEvents();
    if (!events.length) {
      grid.innerHTML = '<p class="text-muted text-center" style="padding:40px">No upcoming events.</p>';
      return;
    }
    grid.innerHTML = events.map(ev => {
      const dateStr = ev.date || ev.event_date || '';
      const d = dateStr ? new Date(dateStr + 'T12:00:00') : null;
      const bizSlug = ev.site_id;
      const biz = GCR.businesses.find(b => b.site_id === ev.site_id || b.id === ev.site_id);
      const photo = ev.photo || ev.cover_image || (biz && biz.photo) || '';
      const category = (ev.category || '').replace(/-/g, ' ');
      const chips = [category, ev.cover].filter(Boolean).map(c => `<span class="chip">${escGcr(c)}</span>`).join('');
      return `
      <article class="event-card" data-tags="${ev.category || ''}">
        <div class="event-image" style="background-image:url('${escGcr(photo)}');background-color:#e0f2fe"><div class="image-badge">${escGcr(category)}</div></div>
        <div class="event-body">
          <div class="title-row"><div><div class="name">${escGcr(ev.title || ev.name || 'Event')}</div><div class="subline"><span>${escGcr(ev.venue || (biz && biz.name) || 'Orange Beach')}</span></div></div><div class="status">● Coming</div></div>
          <div class="timepill">🕐 ${escGcr(dateStr)}${ev.time ? ' • ' + escGcr(ev.time) : ''}</div>
          <div class="event-copy">${escGcr((ev.description || ev.descr || 'Event details — check details for more info.').substring(0, 180))}</div>
          ${chips ? `<div class="chips">${chips}</div>` : ''}
          <div class="bottom-row"><div class="venue">📍 ${escGcr(ev.venue || (biz && biz.address) || '')}</div><div class="actions"><a href="profile.html?id=${bizSlug}" class="action">Details</a><a href="profile.html?id=${bizSlug}" class="action primary">Save</a></div></div>
        </div>
      </article>`;
    }).join('');
    return;
  }

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
          ${bizSlug ? `<a href="profile.html?id=${bizSlug}" class="btn btn-primary btn-sm">Details</a>` : '<span></span>'}
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
          ${bizSlug ? `<a href="profile.html?id=${bizSlug}" class="btn btn-outline btn-sm">Details</a>` : ''}
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

  /* ── Profile logo / pic (covers all Supabase field names) ── */
  const logoUrl  = biz.logo_url  || biz.logo  || biz.image || biz.hero_image || biz.cover_image  || biz.cover_url  || '';
  const coverUrl = biz.cover_url || biz.hero_image || biz.cover_image || biz.logo_url || biz.image || biz.logo || '';

  /* New layout: #profilePic (circular) */
  const picEl = document.getElementById('profilePic');
  if (picEl) {
    if (logoUrl) {
      picEl.innerHTML = `<img src="${logoUrl}" alt="${escGcr(biz.name || '')}" onerror="this.parentElement.textContent='${biz.emoji || '🏖️'}'">`;
    } else {
      picEl.textContent = biz.emoji || '🏖️';
    }
  }

  /* Cover banner image (#profileCoverWrap) */
  const coverEl = document.getElementById('profileCoverWrap');
  if (coverEl && coverUrl) {
    coverEl.style.backgroundImage = `url('${coverUrl}')`;
  }

  /* Legacy: #profileEmoji (old layout fallback) */
  const emojiEl = document.getElementById('profileEmoji');
  if (emojiEl) {
    if (logoUrl) {
      emojiEl.innerHTML = `<img src="${logoUrl}" alt="${escGcr(biz.name || '')}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.parentElement.textContent='${biz.emoji || '🏖️'}'">`;
    } else {
      emojiEl.textContent = biz.emoji || '🏖️';
    }
  }

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

  /* Business type — used throughout this function */
  const cat             = biz.type || biz.category || '';
  const isRestaurantType = cat === 'restaurants' || cat === 'coffee-sweets' ||
                           cat === 'nightlife'   || cat === 'happy-hours';
  const isActivity      = cat === 'things-to-do' || cat === 'services';

  /* ── Tab visibility: switch Menu ↔ Pricing based on type ── */
  const tabMenuEl    = document.getElementById('tabMenu');
  const tabPricingEl = document.getElementById('tabPricing');
  if (isActivity) {
    if (tabMenuEl)    tabMenuEl.style.display    = 'none';
    if (tabPricingEl) tabPricingEl.style.display = '';
  }

  const quickGrid = document.getElementById('quickInfoGrid');
  if (quickGrid) {
    if (!isRestaurantType) {
      quickGrid.style.display = 'none'; /* hide for rentals/tours/activities */
    } else {
      const hh = document.getElementById('profileHHour');
      if (hh) hh.textContent = biz.happy_hour || biz.happyHour || '—';
      const kf = document.getElementById('profileKids');
      if (kf) kf.textContent = (biz.kids_friendly || biz.kidsFriendly) ? '✅ Yes' : '✗ No';
      const od = document.getElementById('profileOutdoor');
      if (od) od.textContent = biz.outdoor ? '✅ Yes' : '✗ No';
    }
  }

  /* Menu Highlights — only for restaurants */
  const mhEl = document.getElementById('profileMenuHighlights');
  if (mhEl && !isRestaurantType) mhEl.style.display = 'none';

  /* Badges */
  const badgeEl = document.getElementById('profileBadges');
  if (badgeEl && biz.tags && biz.tags.length) {
    badgeEl.innerHTML = biz.tags.map(t => `<span class="profile-badge">${t.replace(/-/g,' ')}</span>`).join('');
  }

  /* Hours — handles both string ("Mon 08:00–18:00, Tue...") and object {Mon:"..."} */
  const hoursEl = document.getElementById('profileHours');
  if (hoursEl && biz.hours) {
    if (typeof biz.hours === 'string') {
      /* Convert military times → AM/PM */
      let hStr = biz.hours.replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h, min) => {
        h = parseInt(h);
        const ap = h >= 12 ? 'PM' : 'AM';
        if (h > 12) h -= 12; if (h === 0) h = 12;
        return h + ':' + min + ' ' + ap;
      });
      /* Split by newline first, fall back to comma */
      let lines = hStr.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) lines = hStr.split(',').map(l => l.trim()).filter(Boolean);
      hoursEl.innerHTML = lines.map(l => `<div class="hours-row"><span>${escGcr(l)}</span></div>`).join('');
    } else {
      const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
      hoursEl.innerHTML = days.map(d =>
        `<div class="hours-row ${d === today ? 'today' : ''}"><span>${d}</span><span>${biz.hours[d] || biz.hours[d.toLowerCase()] || 'Closed'}</span></div>`
      ).join('');
    }
  }

  /* Specials tab — hide tab entirely if no specials */
  const specEl = document.getElementById('profileSpecials');
  const specTab = document.querySelector('[data-panel="tab-specials"]');
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
      /* No specials — hide the tab */
      if (specTab) specTab.style.display = 'none';
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
      /* No events — hide the tab */
      const evTab = document.querySelector('[data-panel="tab-events"]');
      if (evTab) evTab.style.display = 'none';
    }
  }

  /* Gallery tab — real photos from profile data */
  const galEl = document.getElementById('tab-gallery');
  if (galEl) {
    const gallery = biz.gallery || biz.images || [];
    const galGrid = document.getElementById('galleryGrid') || galEl.querySelector('.gallery-grid');
    if (galGrid && gallery.length) {
      galGrid.innerHTML = gallery.slice(0, 12).map(img => {
        const src = typeof img === 'string' ? img : (img.url || img.src || '');
        return src ? `<div class="gallery-item"><img src="${src}" alt="${escGcr(biz.name)}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>` : '';
      }).join('');
    }
    /* If no gallery but business has a main image, show that as first photo */
    else if (galGrid && logoUrl) {
      galGrid.innerHTML = `<div class="gallery-item"><img src="${logoUrl}" alt="${escGcr(biz.name)}" loading="lazy"></div>`;
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

  /* Booking panel + content tabs (defined in business.html) */
  if (typeof renderBookingPanel === 'function') renderBookingPanel(biz);
  /* Only render menu for restaurant-type businesses */
  if (typeof renderMenuTabs === 'function' && isRestaurantType) renderMenuTabs(biz);
  /* Only render pricing/fleet for activity businesses */
  if (typeof renderPricingTab === 'function' && isActivity) renderPricingTab(biz);
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

  const isRental  = biz.bookingType === 'rental' || (biz.tags || []).includes('boat-rentals') || (biz.type||'').includes('things-to-do');
  const typeLabel = { rental:'Rental Options', charter:'Charter Packages', tickets:'Admission & Tickets', reservation:'Reserve a Table', inquiry:'Book an Inquiry' };
  const heading   = typeLabel[biz.bookingType] || (isRental ? 'Rental Options' : 'Book Now');
  const slug      = biz.slug || biz.site_id || biz.id;
  const logoUrl   = biz.logo || biz.image || biz.hero_image || biz.cover_image || '';

  let html = ``;

  /* Header — show real photo if available */
  if (logoUrl) {
    html += `<img src="${logoUrl}" alt="${escGcr(biz.name)}" style="width:100%;height:160px;object-fit:cover;border-radius:12px;margin-bottom:14px;" onerror="this.style.display='none'">`;
  } else {
    html += `<div style="text-align:center;font-size:3rem;margin-bottom:8px;">${biz.emoji||'🎯'}</div>`;
  }
  html += `<h2 style="font-size:1.25rem;font-weight:800;margin-bottom:4px;color:#0d2137;">${escGcr(biz.name)}</h2>
    <p style="font-size:.83rem;color:#666;margin-bottom:16px;">${escGcr(biz.tagline||'')}</p>
    <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0b7a75;margin-bottom:12px;">${heading}</div>`;

  /* Fleet packages (rentals) — show image + time slots */
  const fleet   = biz.fleet || [];
  const pricing = biz.pricing || [];
  if (isRental && fleet.length) {
    const priceMap = {};
    pricing.forEach(p => {
      if (!priceMap[p.fleet_type_id]) priceMap[p.fleet_type_id] = {};
      priceMap[p.fleet_type_id][p.slot_label] = p.price;
    });
    html += fleet.map(ft => {
      const prices  = priceMap[ft.fleet_type_id || ft.id] || {};
      const slots   = Object.entries(prices);
      const minPrice = slots.length ? Math.min(...slots.map(([,v]) => v)) : null;
      return `<div style="border:2px solid #e5e7eb;border-radius:12px;padding:14px 16px;margin-bottom:10px;">
        ${ft.image ? `<img src="${ft.image}" alt="${escGcr(ft.name)}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:10px;" loading="lazy">` : ''}
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;">
          <div style="font-size:.92rem;font-weight:700;color:#0d2137;">${escGcr(ft.name)}</div>
          ${minPrice ? `<div style="font-size:.85rem;font-weight:800;color:#0b7a75;white-space:nowrap;">from $${minPrice}</div>` : ''}
        </div>
        ${ft.description ? `<div style="font-size:.75rem;color:#666;margin-bottom:8px;">${escGcr(ft.description)}</div>` : ''}
        ${slots.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;">${slots.map(([label, price]) => `<span style="background:#f0fafa;color:#0b7a75;border-radius:8px;padding:4px 10px;font-size:.75rem;font-weight:700;">${escGcr(label)} — $${price}</span>`).join('')}</div>` : ''}
      </div>`;
    }).join('');
  } else if (biz.packages && biz.packages.length) {
    /* Legacy packages */
    html += biz.packages.map(p => `
      <div style="border:2px solid #e5e7eb;border-radius:12px;padding:14px 16px;margin-bottom:10px;">
        ${p.image ? `<img src="${p.image}" alt="${escGcr(p.name)}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:10px;" loading="lazy">` : ''}
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="font-size:.92rem;font-weight:700;color:#0d2137;">${escGcr(p.name)}</div>
          <div style="font-size:.92rem;font-weight:800;color:#0b7a75;white-space:nowrap;">${escGcr(p.price||'')}</div>
        </div>
        <div style="font-size:.78rem;color:#666;margin-top:4px;">${escGcr(p.desc||p.description||'')}</div>
        ${p.maxGuests||p.max_guests ? `<div style="font-size:.7rem;color:#888;margin-top:4px;">👥 Max ${p.maxGuests||p.max_guests} guests</div>` : ''}
      </div>`).join('');
  }

  /* Action buttons */
  if (biz.links_page_url || biz.website) {
    const bookUrl = biz.links_page_url || biz.website;
    html += `<a href="${bookUrl}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#0b7a75,#14B8A6);color:#fff;padding:14px;border-radius:12px;font-weight:700;text-decoration:none;font-size:.95rem;margin:16px 0 8px;">📅 Book Now</a>`;
  } else if (biz.phone) {
    html += `<a href="tel:${biz.phone.replace(/\D/g,'')}" style="display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#0b7a75,#14B8A6);color:#fff;padding:14px;border-radius:12px;font-weight:700;text-decoration:none;font-size:.95rem;margin:16px 0 8px;">📞 Call to Book — ${escGcr(biz.phone)}</a>`;
  }
  html += `<a href="profile.html?id=${slug}" style="display:block;text-align:center;padding:10px;font-size:.82rem;color:#0b7a75;text-decoration:none;font-weight:600;">View Full Profile →</a>`;

  /* Load full profile to get fleet/pricing if not already loaded */
  document.getElementById('gcrBookingContent').innerHTML = html;
  const modal = document.getElementById('gcrBookingModal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  /* Upgrade with full profile data (fleet+pricing) if not already present */
  if (isRental && !fleet.length) {
    GCR.loadProfile(slug).then(profile => {
      if (profile && document.getElementById('gcrBookingModal').style.display === 'flex') {
        window.openBookingModal.__cache = window.openBookingModal.__cache || {};
        Object.assign(biz, { fleet: profile.fleet || [], pricing: profile.pricing || [], packages: profile.packages || biz.packages });
        window.openBookingModal(bizId);
      }
    });
  }
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
