/* ============================================================
   gcr-auth.js — Platform-wide auth abstraction
   Supports Supabase (default) or Firebase Auth.

   To use:
     <script src="js/gcr-auth.js"></script>

   To switch to Firebase:
     1. Set GCR_AUTH_PROVIDER = 'firebase' below
     2. Fill in FIREBASE_CONFIG from your Firebase console
   ============================================================ */

// ── CONFIG — change this one line to swap providers ──────────
const GCR_AUTH_PROVIDER = 'supabase'; // 'supabase' | 'firebase'

const SUPABASE_URL  = 'https://xbptmkpbiqzvxptjkfoi.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicHRta3BiaXF6dnhwdGprZm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzU5NTYsImV4cCI6MjA5Mzc1MTk1Nn0.VPbIAGRiH2b2v1KOLuaCxBOvEHw-hINHfy5_Rppd-N8';

const FIREBASE_CONFIG = {
  // Fill these in from Firebase Console → Project Settings → Your Apps
  apiKey:            '',
  authDomain:        '',
  projectId:         '',
  storageBucket:     '',
  messagingSenderId: '',
  appId:             '',
};

if (typeof GCR_API === 'undefined') var GCR_API = 'https://cybercheck-api-database.vercel.app';

// ── Internal state ────────────────────────────────────────────
let _client   = null;
let _user     = null;
let _token    = null;
let _ready    = false;
let _authMode = 'phone_google'; // fetched from admin dashboard config
const _onChange = [];

// ── Public API ────────────────────────────────────────────────
window.GCRAuth = {

  // Call once on page load — resolves when auth is ready
  async init() {
    // Fetch auth mode config from admin dashboard in parallel with auth init
    const [, cfg] = await Promise.all([
      GCR_AUTH_PROVIDER === 'firebase' ? _initFirebase() : _initSupabase(),
      fetch(GCR_API + '/api/admin/auth-config').then(r => r.json()).catch(() => ({ mode: 'email' })),
    ]);
    _authMode = cfg.mode || 'email';
    _ready = true;
    return { user: _user, token: _token, authMode: _authMode };
  },

  // Which sign-in methods are active: 'email' | 'phone_google' | 'all'
  getAuthMode() { return _authMode; },

  // Sign in with Google (redirect flow)
  async signInGoogle() {
    if (GCR_AUTH_PROVIDER === 'firebase') {
      const { GoogleAuthProvider, signInWithPopup } = await _fbAuth();
      await signInWithPopup(_client, new GoogleAuthProvider());
    } else {
      await _client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href },
      });
    }
  },

  // Send SMS OTP to phone number (e.g. "+12125551234")
  async sendOtp(phone) {
    if (GCR_AUTH_PROVIDER === 'firebase') {
      // Firebase phone auth — uses invisible reCAPTCHA, free via Google
      const { RecaptchaVerifier, signInWithPhoneNumber } = await _fbAuth();
      if (!window._fbRecaptcha) {
        window._fbRecaptcha = new RecaptchaVerifier(_client, 'gcr-recaptcha', { size: 'invisible' });
      }
      window._fbConfirmation = await signInWithPhoneNumber(_client, phone, window._fbRecaptcha);
      return { ok: true };
    } else {
      const { error } = await _client.auth.signInWithOtp({ phone });
      if (error) throw error;
      return { ok: true };
    }
  },

  // Verify the 6-digit code
  async verifyOtp(phone, code) {
    if (GCR_AUTH_PROVIDER === 'firebase') {
      if (!window._fbConfirmation) throw new Error('Send code first');
      await window._fbConfirmation.confirm(code);
    } else {
      const { error } = await _client.auth.verifyOtp({ phone, token: code, type: 'sms' });
      if (error) throw error;
    }
  },

  // Sign in with email + password
  async signInEmail(email, password, isSignup = false) {
    if (GCR_AUTH_PROVIDER === 'firebase') {
      const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = await _fbAuth();
      const fn = isSignup ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
      await fn(_client, email, password);
    } else {
      const fn = isSignup
        ? () => _client.auth.signUp({ email, password })
        : () => _client.auth.signInWithPassword({ email, password });
      const { data, error } = await fn();
      if (error) throw error;
      if (isSignup && !data.session) throw { confirmEmail: true };
    }
  },

  // Sign out
  async signOut() {
    if (GCR_AUTH_PROVIDER === 'firebase') {
      const { signOut } = await _fbAuth();
      await signOut(_client);
    } else {
      await _client.auth.signOut();
    }
  },

  // Current user + token
  getUser()  { return _user; },
  getToken() { return _token; },
  isReady()  { return _ready; },

  // Listen for auth changes: fn(user, token)
  onChange(fn) {
    _onChange.push(fn);
    if (_ready) fn(_user, _token); // fire immediately if already ready
  },

  // For Trip Swipe iframe: accept token passed via postMessage
  acceptToken(token) {
    _token = token;
    localStorage.setItem('gcr_access_token', token);
  },
};

// ── Supabase init ─────────────────────────────────────────────
async function _initSupabase() {
  if (!window.supabase?.createClient) {
    await _loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
  }
  _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

  const { data: { session } } = await _client.auth.getSession();
  if (session) { _user = session.user; _token = session.access_token; }

  _client.auth.onAuthStateChange((event, session) => {
    _user  = session?.user  || null;
    _token = session?.access_token || null;
    if (_token) localStorage.setItem('gcr_access_token', _token);
    else localStorage.removeItem('gcr_access_token');
    _onChange.forEach(fn => fn(_user, _token));
  });
}

// ── Firebase init ─────────────────────────────────────────────
async function _initFirebase() {
  if (!FIREBASE_CONFIG.apiKey) {
    console.warn('GCRAuth: fill in FIREBASE_CONFIG in gcr-auth.js');
    return;
  }
  await _loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
  await _loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js');

  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  _client = firebase.auth();

  // Add invisible reCAPTCHA div required for phone auth
  if (!document.getElementById('gcr-recaptcha')) {
    const div = document.createElement('div');
    div.id = 'gcr-recaptcha';
    document.body.appendChild(div);
  }

  await new Promise(resolve => {
    _client.onAuthStateChanged(async user => {
      _user = user || null;
      _token = user ? await user.getIdToken() : null;
      if (_token) localStorage.setItem('gcr_access_token', _token);
      else localStorage.removeItem('gcr_access_token');
      _onChange.forEach(fn => fn(_user, _token));
      resolve();
    });
  });
}

// Firebase modular auth helper (compat SDK — no tree-shaking needed)
async function _fbAuth() {
  return firebase.auth; // compat SDK exposes methods on the namespace
}

// ── Utility ───────────────────────────────────────────────────
function _loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}
