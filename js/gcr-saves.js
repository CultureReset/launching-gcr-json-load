/* ============================================================
   gcr-saves.js — Tourist saves + auth + personalization
   One identity shared with Trip Swipe.
   Add <script src="js/gcr-saves.js"></script> to every GCR page.
   ============================================================ */

const GCR_API = 'https://cybercheck-api-database.vercel.app';
const SUPA_URL = 'https://mhafixflyffflwjhcgfn.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oYWZpeGZseWZmZmx3amhjZ2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTA4MzUsImV4cCI6MjA4NzM4NjgzNX0.3KW-rGnLhJQ1u3IsSeoGFfgQpcoJNdBGFOGnhc88tHw';

window.GCRSaves = (function() {
  let _supabase = null;
  let _user = null;
  let _token = null;
  let _saves = new Set(); // slugs the user has saved
  let _ready = false;
  const _listeners = [];

  // ── Inject styles ─────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .gcr-save-btn {
      position:absolute;top:12px;right:12px;
      width:36px;height:36px;border-radius:50%;
      background:rgba(255,255,255,.92);
      border:none;cursor:pointer;font-size:18px;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,.18);
      transition:transform .15s,background .15s;
      z-index:10;
    }
    .gcr-save-btn:hover { transform:scale(1.15); background:#fff; }
    .gcr-save-btn.saved { background:#fff0f0; }
    .gcr-user-bar {
      display:flex;align-items:center;gap:10px;
      font-size:13px;color:#fff;
    }
    .gcr-user-avatar {
      width:30px;height:30px;border-radius:50%;
      background:#0b7a75;color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;
    }
    .gcr-login-btn {
      background:#fff;color:#0b7a75;border:none;
      padding:5px 12px;border-radius:999px;
      font-size:12px;font-weight:700;cursor:pointer;
    }
    .gcr-saves-toast {
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      background:#0b7a75;color:#fff;padding:10px 20px;
      border-radius:999px;font-size:14px;font-weight:600;
      z-index:9999;opacity:0;transition:opacity .2s;pointer-events:none;
    }
    .gcr-saves-toast.show { opacity:1; }
    .gcr-auth-modal {
      display:none;position:fixed;inset:0;
      background:rgba(0,0,0,.6);z-index:9998;
      align-items:center;justify-content:center;
    }
    .gcr-auth-modal.open { display:flex; }
    .gcr-auth-box {
      background:#fff;border-radius:20px;padding:32px;
      max-width:380px;width:92%;text-align:center;
    }
    .gcr-auth-box h2 { font-size:20px;margin:0 0 6px;color:#0f2233; }
    .gcr-auth-box p { font-size:14px;color:#66788a;margin:0 0 20px; }
    .gcr-auth-input {
      width:100%;padding:12px;border:1px solid #d1dce5;
      border-radius:10px;font-size:15px;margin-bottom:10px;
      box-sizing:border-box;
    }
    .gcr-auth-submit {
      width:100%;padding:12px;background:#0b7a75;color:#fff;
      border:none;border-radius:10px;font-size:15px;
      font-weight:700;cursor:pointer;margin-bottom:8px;
    }
    .gcr-auth-switch {
      font-size:13px;color:#0b7a75;cursor:pointer;
      background:none;border:none;text-decoration:underline;
    }
    .gcr-auth-error { color:#e53e3e;font-size:13px;margin-bottom:8px; }
    .gcr-personalized-banner {
      background:linear-gradient(135deg,#0b7a75,#0ea5e9);
      color:#fff;padding:10px 18px;border-radius:12px;
      font-size:13px;font-weight:600;margin-bottom:14px;
      display:none;
    }
  `;
  document.head.appendChild(style);

  // ── Toast ─────────────────────────────────────────────────────
  const toast = document.createElement('div');
  toast.className = 'gcr-saves-toast';
  document.body.appendChild(toast);
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ── Auth modal ────────────────────────────────────────────────
  const modal = document.createElement('div');
  modal.className = 'gcr-auth-modal';
  modal.innerHTML = `
    <div class="gcr-auth-box">
      <div style="font-size:36px;margin-bottom:8px;">❤️</div>
      <h2 id="gcr-auth-title">Save your favourites</h2>
      <p id="gcr-auth-sub">Sign in to save places and get personalized recommendations across GCR and Trip Swipe.</p>
      <div id="gcr-auth-err" class="gcr-auth-error" style="display:none;"></div>
      <input class="gcr-auth-input" type="email" id="gcr-auth-email" placeholder="Email address">
      <input class="gcr-auth-input" type="password" id="gcr-auth-pw" placeholder="Password">
      <button class="gcr-auth-submit" id="gcr-auth-go">Sign In</button>
      <button class="gcr-auth-switch" id="gcr-auth-switch">Don't have an account? Sign up</button>
      <br><br>
      <button onclick="GCRSaves.closeModal()" style="font-size:12px;color:#aaa;background:none;border:none;cursor:pointer;">Cancel</button>
    </div>`;
  document.body.appendChild(modal);

  let _authMode = 'signin';
  function setAuthMode(mode) {
    _authMode = mode;
    const isSignup = mode === 'signup';
    document.getElementById('gcr-auth-title').textContent = isSignup ? 'Create account' : 'Sign in to save';
    document.getElementById('gcr-auth-go').textContent = isSignup ? 'Create Account' : 'Sign In';
    document.getElementById('gcr-auth-switch').textContent = isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up";
  }
  document.getElementById('gcr-auth-switch').addEventListener('click', () => setAuthMode(_authMode === 'signin' ? 'signup' : 'signin'));
  document.getElementById('gcr-auth-go').addEventListener('click', async () => {
    const email = document.getElementById('gcr-auth-email').value.trim();
    const pw = document.getElementById('gcr-auth-pw').value;
    const errEl = document.getElementById('gcr-auth-err');
    errEl.style.display = 'none';
    if (!email || !pw) { errEl.textContent = 'Please enter email and password'; errEl.style.display = ''; return; }
    try {
      const fn = _authMode === 'signup'
        ? () => _supabase.auth.signUp({ email, password: pw })
        : () => _supabase.auth.signInWithPassword({ email, password: pw });
      const { data, error } = await fn();
      if (error) throw error;
      if (_authMode === 'signup' && !data.session) {
        errEl.style.display = '';
        errEl.style.color = '#0b7a75';
        errEl.textContent = 'Check your email to confirm your account.';
        return;
      }
      closeModal();
      showToast('Welcome! Loading your personalized GCR ✨');
    } catch(e) { errEl.textContent = e.message || 'Sign in failed'; errEl.style.display = ''; }
  });
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  function openModal() { modal.classList.add('open'); }
  function closeModal() { modal.classList.remove('open'); }

  // ── Init Supabase ─────────────────────────────────────────────
  async function init() {
    // Load Supabase JS if not already loaded
    if (!window.supabase || !window.supabase.createClient) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    _supabase = window.supabase.createClient(SUPA_URL, SUPA_ANON);

    // Check session
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
      _user = session.user;
      _token = session.access_token;
      await loadSaves();
    }

    // Listen for auth changes
    _supabase.auth.onAuthStateChange(async (event, session) => {
      _user = session?.user || null;
      _token = session?.access_token || null;
      if (_user) {
        await loadSaves();
        renderUserBar();
        personalizeListings();
      } else {
        _saves.clear();
        renderUserBar();
        updateAllSaveBtns();
      }
    });

    renderUserBar();
    _ready = true;
    _listeners.forEach(fn => fn());
  }

  // ── Load user's saves from API ────────────────────────────────
  async function loadSaves() {
    if (!_token) return;
    try {
      const r = await fetch(GCR_API + '/api/tourist/saves', {
        headers: { 'Authorization': 'Bearer ' + _token }
      });
      const d = await r.json();
      _saves = new Set((d || []).map(s => s.entity_slug));
      updateAllSaveBtns();
    } catch(e) {}
  }

  // ── Toggle save ───────────────────────────────────────────────
  async function toggle(slug, entity) {
    if (!_user) { openModal(); return; }
    const wasSaved = _saves.has(slug);
    // Optimistic update
    if (wasSaved) { _saves.delete(slug); } else { _saves.add(slug); }
    updateSaveBtn(slug);
    showToast(wasSaved ? 'Removed from saves' : '❤️ Saved!');

    try {
      if (wasSaved) {
        await fetch(GCR_API + '/api/tourist/saves/' + encodeURIComponent(slug), {
          method: 'DELETE', headers: { 'Authorization': 'Bearer ' + _token }
        });
      } else {
        await fetch(GCR_API + '/api/tourist/saves', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + _token, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_slug: slug,
            business_name: entity.name || slug,
            hero_image_url: entity.hero_image_url || '',
            subtitle: entity.tagline || entity.subtitle || '',
            category: entity.entity_subtype || entity.type || '',
            price_range: entity.price_range || '',
          })
        });
      }
    } catch(e) {
      // Rollback on error
      if (wasSaved) { _saves.add(slug); } else { _saves.delete(slug); }
      updateSaveBtn(slug);
    }
  }

  function isSaved(slug) { return _saves.has(slug); }

  // ── Update heart buttons ──────────────────────────────────────
  function updateSaveBtn(slug) {
    document.querySelectorAll(`.gcr-save-btn[data-slug="${CSS.escape(slug)}"]`).forEach(btn => {
      btn.textContent = _saves.has(slug) ? '❤️' : '🤍';
      btn.classList.toggle('saved', _saves.has(slug));
      btn.title = _saves.has(slug) ? 'Saved' : 'Save';
    });
  }
  function updateAllSaveBtns() {
    document.querySelectorAll('.gcr-save-btn[data-slug]').forEach(btn => {
      updateSaveBtn(btn.dataset.slug);
    });
  }

  // ── Render user bar in header ─────────────────────────────────
  function renderUserBar() {
    let bar = document.getElementById('gcr-user-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'gcr-user-bar';
      bar.className = 'gcr-user-bar';
      bar.style.cssText = 'position:fixed;top:12px;right:16px;z-index:1000;';
      document.body.appendChild(bar);
    }
    if (_user) {
      const initials = (_user.email || '?')[0].toUpperCase();
      bar.innerHTML = `
        <div class="gcr-user-avatar" title="${_user.email}">${initials}</div>
        <button class="gcr-login-btn" onclick="GCRSaves.signOut()" style="background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.4);">Sign Out</button>`;
    } else {
      bar.innerHTML = `<button class="gcr-login-btn" onclick="GCRSaves.openModal()">❤️ Sign In to Save</button>`;
    }
  }

  // ── Personalize listing order ─────────────────────────────────
  async function personalizeListings() {
    if (!_token || _saves.size === 0) return;
    const grid = document.getElementById('listingsGrid');
    if (!grid) return;

    const banner = document.createElement('div');
    banner.className = 'gcr-personalized-banner';
    banner.textContent = '✨ Personalized for you based on your saves';
    banner.style.display = 'block';
    grid.parentNode.insertBefore(banner, grid);

    // Get all cards and sort: unsaved first but preferred categories on top
    const cards = Array.from(grid.querySelectorAll('[data-slug]'));
    if (!cards.length) return;

    // Build preference map from saves
    const r = await fetch(GCR_API + '/api/tourist/saves', {
      headers: { 'Authorization': 'Bearer ' + _token }
    }).catch(() => null);
    if (!r?.ok) return;
    const savedItems = await r.json();
    const preferredCategories = new Set(savedItems.map(s => (s.category||'').toLowerCase()));
    const savedSlugs = new Set(savedItems.map(s => s.entity_slug));

    cards.sort((a, b) => {
      const aSlug = a.dataset.slug || '';
      const bSlug = b.dataset.slug || '';
      const aSaved = savedSlugs.has(aSlug);
      const bSaved = savedSlugs.has(bSlug);
      // Already saved → push to bottom (they've seen it)
      if (aSaved && !bSaved) return 1;
      if (!aSaved && bSaved) return -1;
      // Prefer matching categories
      const aSubtype = (a.dataset.subtype || '').toLowerCase();
      const bSubtype = (b.dataset.subtype || '').toLowerCase();
      const aPref = preferredCategories.has(aSubtype) ? -1 : 0;
      const bPref = preferredCategories.has(bSubtype) ? -1 : 0;
      return aPref - bPref;
    });

    cards.forEach(card => grid.appendChild(card.closest('a') || card));
  }

  // ── Sign out ──────────────────────────────────────────────────
  async function signOut() {
    await _supabase.auth.signOut();
    showToast('Signed out');
  }

  // ── Build save button HTML for cards ─────────────────────────
  function saveBtnHtml(slug) {
    const saved = _saves.has(slug);
    return `<button class="gcr-save-btn${saved?' saved':''}" data-slug="${slug}"
      title="${saved?'Saved':'Save'}"
      onclick="event.preventDefault();event.stopPropagation();GCRSaves.toggle('${slug.replace(/'/g,"\\'")}', window._gcrEntityCache&&window._gcrEntityCache['${slug.replace(/'/g,"\\'")}']||{})">
      ${saved?'❤️':'🤍'}
    </button>`;
  }

  // Store entity data so toggle can access it
  window._gcrEntityCache = window._gcrEntityCache || {};
  function cacheEntity(entity) {
    const slug = entity.slug || entity.subdomain || entity.id || '';
    if (slug) window._gcrEntityCache[slug] = entity;
  }

  // Boot
  init().catch(console.error);

  return { toggle, isSaved, saveBtnHtml, cacheEntity, openModal, closeModal, signOut, personalizeListings };
})();
