/* ============================================================
   gcr-saves.js — Tourist saves + auth + personalization
   One identity shared with Trip Swipe.
   Add <script src="js/gcr-saves.js"></script> to every GCR page.
   ============================================================ */

const GCR_API = 'https://cybercheck-api-database.vercel.app';

window.GCRSaves = (function() {
  let _user = null;
  let _token = null;
  let _saves = new Set();
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
    .gcr-auth-tabs { display:flex;gap:6px;margin-bottom:18px; }
    .gcr-auth-tab {
      flex:1;padding:8px 4px;border:1px solid #d1dce5;border-radius:8px;
      background:#f8fafc;font-size:13px;font-weight:600;cursor:pointer;color:#66788a;
    }
    .gcr-auth-tab.active { background:#0b7a75;color:#fff;border-color:#0b7a75; }
    .gcr-google-btn {
      width:100%;padding:12px;background:#fff;color:#3c4043;
      border:1px solid #d1dce5;border-radius:10px;font-size:15px;
      font-weight:600;cursor:pointer;margin-bottom:10px;
      display:flex;align-items:center;justify-content:center;gap:10px;
    }
    .gcr-google-btn:hover { background:#f8fafc; }
    .gcr-auth-panel { display:none; }
    .gcr-auth-panel.active { display:block; }
    .gcr-phone-row { display:flex;gap:6px;margin-bottom:10px; }
    .gcr-phone-row input:first-child { width:70px;flex-shrink:0; }
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
      <div style="font-size:32px;margin-bottom:6px;">❤️</div>
      <h2 style="margin:0 0 4px;font-size:20px;color:#0f2233;">Save your favourites</h2>
      <p style="font-size:13px;color:#66788a;margin:0 0 16px;">One account works on GCR &amp; Trip Swipe</p>

      <div class="gcr-auth-tabs">
        <button class="gcr-auth-tab active" data-tab="phone">📱 Phone</button>
        <button class="gcr-auth-tab" data-tab="google">G Google</button>
        <button class="gcr-auth-tab" data-tab="email" id="gcr-tab-email">✉️ Email</button>
      </div>

      <div id="gcr-auth-err" class="gcr-auth-error" style="display:none;"></div>

      <!-- Phone / SMS OTP -->
      <div class="gcr-auth-panel active" id="gcr-panel-phone">
        <div id="gcr-phone-step1">
          <div class="gcr-phone-row">
            <input class="gcr-auth-input" id="gcr-phone-cc" value="+1" style="margin-bottom:0;">
            <input class="gcr-auth-input" id="gcr-phone-num" type="tel" placeholder="(555) 555-5555" style="margin-bottom:0;flex:1;">
          </div>
          <p style="font-size:11px;color:#aaa;margin:4px 0 10px;">We'll text you a 6-digit code. No spam, ever.</p>
          <button class="gcr-auth-submit" id="gcr-phone-send">Send Code</button>
        </div>
        <div id="gcr-phone-step2" style="display:none;">
          <p style="font-size:13px;color:#0b7a75;margin:0 0 10px;font-weight:600;">Code sent! Enter it below:</p>
          <input class="gcr-auth-input" id="gcr-otp-code" type="number" placeholder="6-digit code" maxlength="6" style="letter-spacing:8px;font-size:22px;text-align:center;">
          <button class="gcr-auth-submit" id="gcr-otp-verify">Verify Code</button>
          <button class="gcr-auth-switch" id="gcr-phone-back">← Change number</button>
        </div>
      </div>

      <!-- Google -->
      <div class="gcr-auth-panel" id="gcr-panel-google">
        <button class="gcr-google-btn" id="gcr-google-btn">
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/></svg>
          Continue with Google
        </button>
        <p style="font-size:12px;color:#aaa;text-align:center;">You'll be redirected to Google, then back here.</p>
      </div>

      <!-- Email / Password -->
      <div class="gcr-auth-panel" id="gcr-panel-email">
        <input class="gcr-auth-input" type="email" id="gcr-auth-email" placeholder="Email address">
        <input class="gcr-auth-input" type="password" id="gcr-auth-pw" placeholder="Password">
        <button class="gcr-auth-submit" id="gcr-auth-go">Sign In</button>
        <button class="gcr-auth-switch" id="gcr-auth-switch">Don't have an account? Sign up</button>
      </div>

      <br>
      <button onclick="GCRSaves.closeModal()" style="font-size:12px;color:#aaa;background:none;border:none;cursor:pointer;">Cancel</button>
    </div>`;
  document.body.appendChild(modal);

  // ── Tab switching ─────────────────────────────────────────────
  modal.querySelectorAll('.gcr-auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      modal.querySelectorAll('.gcr-auth-tab').forEach(t => t.classList.remove('active'));
      modal.querySelectorAll('.gcr-auth-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('gcr-panel-' + tab.dataset.tab).classList.add('active');
      document.getElementById('gcr-auth-err').style.display = 'none';
    });
  });

  // ── SMS OTP ───────────────────────────────────────────────────
  let _pendingPhone = '';
  document.getElementById('gcr-phone-send').addEventListener('click', async () => {
    const cc  = document.getElementById('gcr-phone-cc').value.trim();
    const num = document.getElementById('gcr-phone-num').value.replace(/\D/g,'');
    const phone = cc + num;
    const errEl = document.getElementById('gcr-auth-err');
    errEl.style.display = 'none';
    if (num.length < 10) { errEl.textContent = 'Enter a valid phone number'; errEl.style.display = ''; return; }
    const btn = document.getElementById('gcr-phone-send');
    btn.textContent = 'Sending…'; btn.disabled = true;
    try {
      await GCRAuth.sendOtp(phone);
      _pendingPhone = phone;
      document.getElementById('gcr-phone-step1').style.display = 'none';
      document.getElementById('gcr-phone-step2').style.display = '';
    } catch(e) { errEl.textContent = e.message || 'Could not send code'; errEl.style.display = ''; }
    btn.textContent = 'Send Code'; btn.disabled = false;
  });

  document.getElementById('gcr-otp-verify').addEventListener('click', async () => {
    const code = document.getElementById('gcr-otp-code').value.trim();
    const errEl = document.getElementById('gcr-auth-err');
    errEl.style.display = 'none';
    if (code.length !== 6) { errEl.textContent = 'Enter the 6-digit code'; errEl.style.display = ''; return; }
    const btn = document.getElementById('gcr-otp-verify');
    btn.textContent = 'Verifying…'; btn.disabled = true;
    try {
      await GCRAuth.verifyOtp(_pendingPhone, code);
      closeModal(); showToast('Welcome! ✨');
    } catch(e) { errEl.textContent = e.message || 'Invalid code'; errEl.style.display = ''; }
    btn.textContent = 'Verify Code'; btn.disabled = false;
  });

  document.getElementById('gcr-phone-back').addEventListener('click', () => {
    document.getElementById('gcr-phone-step1').style.display = '';
    document.getElementById('gcr-phone-step2').style.display = 'none';
  });

  document.getElementById('gcr-google-btn').addEventListener('click', () => GCRAuth.signInGoogle());

  let _emailMode = 'signin';
  function setEmailMode(mode) {
    _emailMode = mode;
    const s = mode === 'signup';
    document.getElementById('gcr-auth-go').textContent = s ? 'Create Account' : 'Sign In';
    document.getElementById('gcr-auth-switch').textContent = s ? 'Already have an account? Sign in' : "Don't have an account? Sign up";
  }
  document.getElementById('gcr-auth-switch').addEventListener('click', () => setEmailMode(_emailMode === 'signin' ? 'signup' : 'signin'));
  document.getElementById('gcr-auth-go').addEventListener('click', async () => {
    const email = document.getElementById('gcr-auth-email').value.trim();
    const pw    = document.getElementById('gcr-auth-pw').value;
    const errEl = document.getElementById('gcr-auth-err');
    errEl.style.display = 'none';
    if (!email || !pw) { errEl.textContent = 'Please enter email and password'; errEl.style.display = ''; return; }
    try {
      await GCRAuth.signInEmail(email, pw, _emailMode === 'signup');
      closeModal(); showToast('Welcome! ✨');
    } catch(e) {
      if (e.confirmEmail) { errEl.style.color='#0b7a75'; errEl.textContent='Check your email to confirm.'; errEl.style.display=''; return; }
      errEl.textContent = e.message || 'Sign in failed'; errEl.style.display = '';
    }
  });

  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  function openModal()  { modal.classList.add('open'); }
  function closeModal() { modal.classList.remove('open'); }

  // ── Init via GCRAuth ──────────────────────────────────────────
  async function init() {
    await GCRAuth.init();
    _user  = GCRAuth.getUser();
    _token = GCRAuth.getToken();
    if (_user) { await loadSaves(); }

    // Show/hide tabs based on admin config
    const mode = GCRAuth.getAuthMode();
    const phoneTab  = modal.querySelector('[data-tab="phone"]');
    const googleTab = modal.querySelector('[data-tab="google"]');
    const phonePanel  = document.getElementById('gcr-panel-phone');
    const googlePanel = document.getElementById('gcr-panel-google');

    if (mode === 'email') {
      // Hide phone + google, show email tab if it exists
      if (phoneTab)  { phoneTab.style.display  = 'none'; phonePanel.classList.remove('active'); }
      if (googleTab) { googleTab.style.display = 'none'; googlePanel.classList.remove('active'); }
    } else if (mode === 'phone_google') {
      // Hide email, show phone + google (already default)
      phoneTab.classList.add('active'); phonePanel.classList.add('active');
    }
    // mode === 'all' → show everything (tabs already rendered)

    GCRAuth.onChange(async (user, token) => {
      _user = user; _token = token;
      if (_user) { await loadSaves(); renderUserBar(); personalizeListings(); }
      else { _saves.clear(); renderUserBar(); updateAllSaveBtns(); }
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
      _saves = new Set((d.saves || d || []).map(s => s.entity_slug));
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
    const saves = savedItems.saves || savedItems || [];
    const preferredCategories = new Set(saves.map(s => (s.category||'').toLowerCase()));
    const savedSlugs = new Set(saves.map(s => s.entity_slug));

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
    await GCRAuth.signOut();
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
