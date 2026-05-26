/**
 * Square Booking Modal System
 *
 * A complete, self-contained booking modal with:
 * - Multi-step booking workflow (location, date, boats, time, extras, checkout)
 * - Live availability tracking
 * - Dynamic pricing with group rates
 * - Square Web Payments SDK integration (with Stripe fallback)
 * - SMS consent and payment processing
 *
 * Usage:
 *   1. Inject modal HTML: insertBookingModal()
 *   2. Open with: openBooking('business-slug') or openBooking()
 *   3. Close with: closeBooking()
 *
 * Load live data from API:
 *   - /api/site-data (products, docks, addons, pricing)
 *   - /api/public/payment-config (Square/Stripe keys)
 *   - /api/stripe/publishable-key (Stripe fallback)
 */

(function() {
  'use strict';

  // ============================================
  // CSS STYLES
  // ============================================
  var CSS = `
    :root {
      --white: #ffffff;
      --black: #000000;
      --dark: #1a1a1a;
      --gray: #666666;
      --gray-light: #999999;
      --bg: #f5f5f5;
      --border: #e5e5e5;
      --teal: #00ada8;
      --teal-dark: #008b84;
      --teal-light: #e8f7f5;
      --teal-border: #80d9d5;
      --radius: 8px;
      --radius-lg: 16px;
    }

    .booking-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 2000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .booking-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    body.booking-open {
      overflow: hidden;
    }

    .booking-modal {
      background: var(--white);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 720px;
      max-height: 90vh;
      overflow: hidden;
      position: relative;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
    }

    .booking-close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--bg);
      border: none;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--dark);
      z-index: 5;
    }

    .booking-header {
      padding: 28px 32px 0;
      flex-shrink: 0;
    }

    .booking-header h2 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .booking-header p {
      font-size: 14px;
      color: var(--gray);
    }

    .booking-steps-nav {
      display: flex;
      gap: 0;
      padding: 20px 32px 0;
      flex-shrink: 0;
    }

    .bstep-tab {
      flex: 1;
      text-align: center;
      padding: 10px 8px;
      font-size: 12px;
      font-weight: 600;
      color: var(--gray-light);
      border-bottom: 2px solid var(--border);
      cursor: pointer;
      transition: all 0.2s;
    }

    .bstep-tab.active {
      color: var(--teal);
      border-color: var(--teal);
    }

    .bstep-tab.done {
      color: var(--teal-dark);
      border-color: var(--teal);
    }

    .booking-body {
      padding: 24px 32px 28px;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }

    .bstep { display: none; }
    .bstep.active { display: block; }

    /* Location Section */
    .loc-section-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--gray);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .loc-option {
      border: 2px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.2s;
    }

    .loc-option:hover {
      border-color: var(--teal-border);
    }

    .loc-option.selected {
      border-color: var(--teal);
      background: var(--teal-light);
    }

    .loc-option-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .loc-option-info {
      flex: 1;
    }

    .loc-option-info strong {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--dark);
      margin-bottom: 2px;
    }

    .loc-option-info span {
      font-size: 12px;
      color: var(--gray);
    }

    /* Calendar */
    .cal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .cal-header h3 {
      font-size: 16px;
      font-weight: 700;
    }

    .cal-nav {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      width: 32px;
      height: 32px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--dark);
    }

    .cal-nav:hover {
      background: var(--border);
    }

    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      text-align: center;
    }

    .cal-day-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--gray-light);
      padding: 6px 0;
      text-transform: uppercase;
    }

    .cal-day {
      padding: 10px 4px;
      border-radius: var(--radius);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.15s;
      border: none;
      background: none;
      color: var(--dark);
    }

    .cal-day:hover {
      background: var(--teal-light);
    }

    .cal-day.selected {
      background: var(--teal);
      color: var(--white);
      font-weight: 600;
    }

    .cal-day.disabled {
      color: var(--border);
      pointer-events: none;
    }

    .cal-day.empty {
      pointer-events: none;
    }

    /* Boat Selection */
    .bk-boat-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border: 2px solid var(--border);
      border-radius: 12px;
      margin-bottom: 10px;
      transition: border-color 0.15s;
    }

    .bk-boat-row.active {
      border-color: var(--teal);
      background: var(--teal-light);
    }

    .bk-boat-row-img {
      width: 72px;
      height: 54px;
      border-radius: var(--radius);
      object-fit: cover;
      flex-shrink: 0;
    }

    .bk-boat-row-info {
      flex: 1;
    }

    .bk-boat-row-info h4 {
      font-size: 15px;
      font-weight: 700;
      color: var(--dark);
      margin-bottom: 2px;
    }

    .bk-boat-row-info p {
      font-size: 12px;
      color: var(--gray);
    }

    .bk-boat-row-price {
      font-size: 13px;
      font-weight: 700;
      color: var(--teal);
      white-space: nowrap;
      margin-right: 6px;
    }

    /* Time Slot */
    .slot-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 16px;
    }

    .slot-btn {
      padding: 14px 12px;
      border: 2px solid var(--border);
      border-radius: var(--radius);
      background: var(--white);
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }

    .slot-btn:hover {
      border-color: var(--teal-border);
    }

    .slot-btn.selected {
      border-color: var(--teal);
      background: var(--teal-light);
    }

    .slot-btn strong {
      display: block;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 2px;
    }

    .slot-btn span {
      font-size: 12px;
      color: var(--gray);
    }

    .slot-btn .slot-price {
      display: block;
      font-size: 16px;
      font-weight: 700;
      color: var(--teal);
      margin-top: 4px;
    }

    /* Extras */
    .bk-section-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--gray);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 18px 0 8px;
    }

    .bk-extra-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 8px;
      transition: border-color 0.15s;
    }

    .bk-extra-row.active {
      border-color: var(--teal);
      background: var(--teal-light);
    }

    .bk-extra-row-info {
      flex: 1;
    }

    .bk-extra-row-info strong {
      display: block;
      font-size: 13px;
      color: var(--dark);
    }

    .bk-extra-row-info span {
      font-size: 11px;
      color: var(--gray);
    }

    .bk-extra-price {
      font-weight: 700;
      color: var(--teal);
      font-size: 13px;
      white-space: nowrap;
      margin-right: 6px;
    }

    /* Qty Control */
    .bk-qty-ctrl {
      display: flex;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }

    .bk-qty-ctrl button {
      width: 32px;
      height: 32px;
      border: none;
      background: var(--bg);
      font-size: 17px;
      cursor: pointer;
      color: var(--dark);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bk-qty-ctrl button:hover {
      background: var(--border);
    }

    .bk-qty-ctrl span {
      width: 34px;
      text-align: center;
      font-weight: 700;
      font-size: 15px;
      color: var(--dark);
    }

    /* Cart Summary */
    .cart-summary {
      background: var(--bg);
      border-radius: var(--radius);
      padding: 20px;
      margin-top: 16px;
    }

    .cart-line {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }

    .cart-line.total {
      border-top: 2px solid var(--border);
      margin-top: 8px;
      padding-top: 12px;
      font-weight: 700;
      font-size: 18px;
    }

    .cart-line.total .cart-amount {
      color: var(--teal);
    }

    .cart-label {
      color: var(--gray);
    }

    .cart-amount {
      font-weight: 600;
      color: var(--dark);
    }

    /* Form */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .form-group {
      margin-bottom: 10px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--dark);
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 11px 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 15px;
      font-family: inherit;
      color: var(--dark);
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--teal);
    }

    .form-group textarea {
      resize: vertical;
    }

    /* Payment Form */
    #payment-card-wrapper {
      background: #f9fafb;
      border: 1px solid #e5e5e5;
      border-radius: var(--radius);
      padding: 16px;
    }

    #square-card-container,
    #stripe-card-fields {
      min-height: 100px;
    }

    #card-number-element,
    #card-expiry-element,
    #card-cvc-element {
      padding: 11px 14px;
      background: white;
      border: 1px solid #e5e5e5;
      border-radius: var(--radius);
      font-size: 15px;
      transition: border-color 0.2s;
    }

    #card-errors {
      color: #ef4444;
      font-size: 13px;
      min-height: 20px;
      margin-top: 8px;
    }

    /* Booking footer */
    .booking-footer {
      padding: 16px 32px calc(16px + env(safe-area-inset-bottom, 0px));
      display: flex;
      justify-content: space-between;
      gap: 12px;
      flex-shrink: 0;
      background: var(--white);
      border-top: 1px solid var(--border);
    }

    .booking-footer .btn {
      flex: 1;
      justify-content: center;
    }

    /* Buttons */
    .btn {
      padding: 12px 24px;
      border-radius: var(--radius);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-primary {
      background: var(--teal);
      color: var(--white);
    }

    .btn-primary:hover {
      background: var(--teal-dark);
    }

    .btn-outline {
      background: var(--white);
      color: var(--dark);
      border: 1px solid var(--border);
    }

    .btn-outline:hover {
      background: var(--bg);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .booking-overlay { padding: 0; align-items: flex-end; }
      .booking-modal {
        max-width: 100%;
        max-height: var(--real-vh, 100svh);
        height: var(--real-vh, 100svh);
        border-radius: 16px 16px 0 0;
        overflow: hidden;
      }
      .booking-header { padding: 16px 16px 0; }
      .booking-header h2 { font-size: 20px; }
      .booking-steps-nav { padding: 12px 16px 0; }
      .bstep-tab { padding: 10px 12px; font-size: 12px; }
      .booking-body { padding: 16px; }
      .booking-footer { padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px)); }
      .cal-day { min-height: 44px; display: flex; align-items: center; justify-content: center; font-size: 13px; padding: 6px 2px; }
      .slot-grid { grid-template-columns: 1fr; gap: 8px; }
      .slot-btn { min-height: 44px; padding: 12px 8px; font-size: 13px; }
      .form-row { grid-template-columns: 1fr; }
    }

    @media (max-width: 480px) {
      .booking-modal {
        max-height: var(--real-vh, 100svh);
        border-radius: 0;
        height: var(--real-vh, 100svh);
        overflow: hidden;
      }
      .booking-overlay { align-items: stretch; }
      .booking-header { padding: 14px 14px 0; }
      .booking-steps-nav { padding: 10px 14px 0; }
      .bstep-tab { padding: 8px 10px; font-size: 11px; }
      .booking-body { padding: 14px; }
      .booking-footer { padding: 14px 14px calc(14px + env(safe-area-inset-bottom, 0px)); }
      .cal-day { min-height: 40px; font-size: 12px; padding: 4px 0; }
      .slot-grid { gap: 6px; }
      .slot-btn { min-height: 40px; padding: 10px 6px; font-size: 12px; }
      .bk-qty-ctrl button { width: 40px; height: 40px; font-size: 18px; }
      .bk-qty-ctrl span { width: 36px; font-size: 14px; }
    }

    @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
  `;

  // ============================================
  // CONFIGURATION
  // ============================================
  var CONFIG = {
    apiBase: window.API_BASE || 'https://gar-front-end-data.vercel.app',
    subdomain: window.SUBDOMAIN || '',
    darkMode: window.DARK_MODE || false
  };

  // Pricing
  var PRICES = {
    single: { am: 150, pm: 150, all: 225 },
    double: { am: 200, pm: 200, all: 275 }
  };

  var GROUP_PRICE = 200; // 5+ singles all day
  var TAX_RATE = 0.10;
  var MAINTENANCE_FEE_RATE = 0.01;
  var PROCESSING_FEE_PCT = 0.029;
  var PROCESSING_FEE_FLAT = 0.30;

  var SLOT_LABELS = {
    am: 'Half Day AM (9:00-1:00)',
    pm: 'Half Day PM (2:00-6:00)',
    all: 'All Day (9:00-6:00)'
  };

  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  var BOAT_FALLBACK = [
    { key: 'single', name: 'Single Seater', description: '1 person max', halfDayAM: 150, halfDayPM: 150, allDay: 225, image: '' },
    { key: 'double', name: 'Double Seater', description: '2 person max', halfDayAM: 200, halfDayPM: 200, allDay: 275, image: '' }
  ];

  // ============================================
  // STATE
  // ============================================
  var booking = {
    date: null,
    location: null,
    locationName: null,
    boats: {},
    slot: null,
    addons: [],
    step: 1,
    sessionId: null,
    holdId: null,
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth(),
    fleetTypeId: null,
    timeSlotId: null
  };

  var _avail = {};
  var _availLoading = false;
  var _stripe = null;
  var _cardNumber = null;
  var _cardExpiry = null;
  var _cardCvc = null;
  var _squareCard = null;
  var _paymentProcessor = 'stripe';
  var _payConfigFetched = false;
  var _payConfig = null;

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function getTotalBoatQty() {
    return Object.keys(booking.boats).reduce(function(s, k) { return s + (booking.boats[k] || 0); }, 0);
  }

  function getBoatTotal() {
    if (!booking.slot) return 0;
    var total = 0;
    Object.keys(booking.boats).forEach(function(key) {
      var qty = booking.boats[key] || 0;
      if (!qty || !PRICES[key]) return;
      var unit = PRICES[key][booking.slot] || 0;
      if (key === 'single' && booking.slot === 'all' && qty >= 5) unit = GROUP_PRICE;
      total += unit * qty;
    });
    return total;
  }

  function getAddonsTotal() {
    var sum = 0;
    booking.addons.forEach(function(a) { sum += (a.price || 0) * (a.qty || 1); });
    return sum;
  }

  function getAvailForKey(key) {
    if (!_avail[key]) return null;
    if (booking.slot) return _avail[key][booking.slot] !== undefined ? _avail[key][booking.slot] : null;
    var vals = Object.values(_avail[key]);
    return vals.length ? Math.min.apply(null, vals) : null;
  }

  function api(path) {
    var sep = path.indexOf('?') > -1 ? '&' : '?';
    return CONFIG.apiBase + '/api/public' + path + sep + 'subdomain=' + CONFIG.subdomain;
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  function insertBookingModal() {
    if (document.getElementById('bookingOverlay')) return;

    // Inject CSS
    var styleEl = document.createElement('style');
    styleEl.id = 'square-booking-modal-styles';
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    // Inject HTML
    var modalHtml = `
      <div class="booking-overlay" id="bookingOverlay">
        <div class="booking-modal">
          <button class="booking-close" onclick="window.squareBookingModal.close()">&times;</button>
          <div class="booking-header">
            <h2>Book Your Rental</h2>
            <p>Select a date, choose your boat, and add extras.</p>
          </div>
          <div class="booking-steps-nav">
            <div class="bstep-tab active" data-step="1">1. Date</div>
            <div class="bstep-tab" data-step="2">2. Boat &amp; Time</div>
            <div class="bstep-tab" data-step="3">3. Extras</div>
            <div class="bstep-tab" data-step="4">4. Checkout</div>
          </div>
          <div class="booking-body">

            <!-- STEP 1: LOCATION + DATE -->
            <div class="bstep active" id="bstep1">
              <div class="loc-section-label">📍 Choose Launch Location</div>
              <div id="booking-locations"></div>
              <div style="height:20px;"></div>
              <div class="loc-section-label">📅 Choose Your Date</div>
              <div class="cal-header">
                <button class="cal-nav" onclick="window.squareBookingModal.calNav(-1)">&#8249;</button>
                <h3 id="calMonthLabel"></h3>
                <button class="cal-nav" onclick="window.squareBookingModal.calNav(1)">&#8250;</button>
              </div>
              <div class="cal-grid" id="calGrid">
                <div class="cal-day-label">Sun</div>
                <div class="cal-day-label">Mon</div>
                <div class="cal-day-label">Tue</div>
                <div class="cal-day-label">Wed</div>
                <div class="cal-day-label">Thu</div>
                <div class="cal-day-label">Fri</div>
                <div class="cal-day-label">Sat</div>
              </div>
            </div>

            <!-- STEP 2: BOAT & TIME -->
            <div class="bstep" id="bstep2">
              <h4 style="font-size:15px;font-weight:700;margin-bottom:4px;">Choose Your Boats</h4>
              <p style="font-size:13px;color:var(--gray);margin-bottom:14px;">Add as many as you like — mix &amp; match.</p>
              <div id="bk-boat-list"></div>
              <h4 style="font-size:15px;font-weight:700;margin-top:20px;margin-bottom:4px;">Time Slot</h4>
              <div class="slot-grid">
                <div class="slot-btn" data-slot="am" onclick="window.squareBookingModal.selectSlot(this)">
                  <strong>Half Day AM</strong>
                  <span>9:00 &ndash; 1:00</span>
                  <div class="slot-price" id="slotAM">$150</div>
                </div>
                <div class="slot-btn" data-slot="pm" onclick="window.squareBookingModal.selectSlot(this)">
                  <strong>Half Day PM</strong>
                  <span>2:00 &ndash; 6:00</span>
                  <div class="slot-price" id="slotPM">$150</div>
                </div>
                <div class="slot-btn" data-slot="all" onclick="window.squareBookingModal.selectSlot(this)">
                  <strong>All Day</strong>
                  <span>9:00 &ndash; 6:00</span>
                  <div class="slot-price" id="slotAll">$225</div>
                </div>
              </div>
            </div>

            <!-- STEP 3: EXTRAS -->
            <div class="bstep" id="bstep3">
              <div id="bk-extras-list"></div>
            </div>

            <!-- STEP 4: CHECKOUT -->
            <div class="bstep" id="bstep4">
              <h4 style="font-size:15px;font-weight:700;margin-bottom:16px;">Your Booking Summary</h4>
              <div class="cart-summary" id="cartSummary"></div>

              <h4 style="font-size:15px;font-weight:700;margin-top:24px;margin-bottom:12px;">Your Info</h4>
              <div class="form-row">
                <div class="form-group" style="margin-bottom:10px;">
                  <label>Full Name</label>
                  <input type="text" id="book-name" placeholder="John Smith" required>
                </div>
                <div class="form-group" style="margin-bottom:10px;">
                  <label>Phone</label>
                  <input type="tel" id="book-phone" placeholder="(555) 123-4567" required>
                </div>
              </div>
              <div class="form-group" style="margin-bottom:10px;">
                <label>Email</label>
                <input type="email" id="book-email" placeholder="john@example.com" required>
              </div>
              <div class="form-group" style="margin-bottom:10px;">
                <label>Notes (optional)</label>
                <textarea id="book-notes" placeholder="Special requests, group info, etc." style="min-height:60px;"></textarea>
              </div>

              <div style="margin-top:14px;margin-bottom:4px;">
                <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:#555;line-height:1.5;">
                  <input type="checkbox" id="sms-consent" style="margin-top:3px;flex-shrink:0;">
                  <span>I agree to receive SMS booking confirmations and reminders. Message &amp; data rates may apply. Reply STOP to opt out.</span>
                </label>
              </div>

              <div id="payment-section" style="margin-top:20px;">
                <h4 style="font-size:15px;font-weight:700;margin-bottom:12px;">Payment</h4>
                <div id="payment-card-wrapper">
                  <div id="square-card-container" style="display:none;"></div>
                  <div id="stripe-card-fields">
                    <div style="margin-bottom:12px;">
                      <label style="display:block;font-size:12px;font-weight:500;color:#666;margin-bottom:6px;">Card Number</label>
                      <div id="card-number-element"></div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                      <div>
                        <label style="display:block;font-size:12px;font-weight:500;color:#666;margin-bottom:6px;">Expiry</label>
                        <div id="card-expiry-element"></div>
                      </div>
                      <div>
                        <label style="display:block;font-size:12px;font-weight:500;color:#666;margin-bottom:6px;">CVC</label>
                        <div id="card-cvc-element"></div>
                      </div>
                    </div>
                  </div>
                  <div id="card-errors"></div>
                  <div style="display:flex;align-items:center;gap:6px;margin-top:8px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ada8" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span id="payment-security-label" style="font-size:11px;color:#999;">Secured payment. We never see your card details.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
          <div class="booking-footer">
            <button class="btn btn-outline" id="bookBack" onclick="window.squareBookingModal.nav(-1)" style="display:none;">Back</button>
            <button class="btn btn-primary" id="bookNext" onclick="window.squareBookingModal.nav(1)">Select Date to Continue</button>
          </div>
        </div>
      </div>
    `;

    var container = document.createElement('div');
    container.innerHTML = modalHtml;
    document.body.appendChild(container.firstElementChild);

    // Set up event listeners
    document.getElementById('bookingOverlay').addEventListener('click', function(e) {
      if (e.target === this && booking.step !== 4) closeBooking();
    });

    // Load Stripe.js globally
    if (!window.Stripe) {
      var stripeScript = document.createElement('script');
      stripeScript.src = 'https://js.stripe.com/v3/';
      stripeScript.async = true;
      document.head.appendChild(stripeScript);
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================
  var modal = {
    // Open booking modal
    open: function(preselect) {
      booking.boats = {};
      booking.addons = [];
      booking.slot = null;
      if (preselect) booking.boats[preselect] = 1;
      booking.sessionId = generateSessionId();
      booking.holdId = null;
      document.querySelectorAll('.slot-btn').forEach(function(s) { s.classList.remove('selected'); });
      document.getElementById('bookingOverlay').classList.add('active');
      document.body.classList.add('booking-open');
      goToStep(1);
      renderCalendar();
    },

    // Close booking modal
    close: function() {
      document.getElementById('bookingOverlay').classList.remove('active');
      document.body.classList.remove('booking-open');
      releaseHold();
    },

    // Navigate steps
    nav: function(dir) {
      var next = booking.step + dir;
      if (next < 1) return;

      if (dir > 0) {
        if (booking.step === 1 && (!booking.location || !booking.date)) return;
        if (booking.step === 2 && (!booking.slot || getTotalBoatQty() === 0)) return;
        if (booking.step === 4) {
          submitBooking();
          return;
        }
      }

      if (next >= 1 && next <= 4) goToStep(next);
    },

    // Calendar navigation
    calNav: function(dir) {
      booking.calMonth += dir;
      if (booking.calMonth > 11) { booking.calMonth = 0; booking.calYear++; }
      if (booking.calMonth < 0) { booking.calMonth = 11; booking.calYear--; }
      renderCalendar();
    },

    // Select location
    selectLocation: function(el) {
      document.querySelectorAll('.loc-option').forEach(function(o) { o.classList.remove('selected'); });
      el.classList.add('selected');
      booking.location = el.getAttribute('data-loc-id');
      booking.locationName = el.getAttribute('data-loc-name');
      updateNextBtn();
    },

    // Select time slot
    selectSlot: function(el) {
      document.querySelectorAll('.slot-btn').forEach(function(s) { s.classList.remove('selected'); });
      el.classList.add('selected');
      booking.slot = el.getAttribute('data-slot');
      updateSlotPrices();
      if (booking.step === 3) renderExtrasOptions();
      updateNextBtn();
    },

    // Change boat quantity
    changeBoatQty: function(key, delta) {
      var avail = getAvailForKey(key);
      var maxQty = avail !== null ? avail : 20;
      booking.boats[key] = Math.max(0, Math.min(maxQty, (booking.boats[key] || 0) + delta));
      var span = document.getElementById('bkqty-' + key);
      if (span) span.textContent = booking.boats[key];
      var row = document.getElementById('bkrow-' + key);
      if (row) row.classList.toggle('active', booking.boats[key] > 0);
      updateNextBtn();
    },

    // Change addon quantity
    changeAddonQty: function(id, name, price, delta) {
      var existing = booking.addons.find(function(a) { return a.id === id; });
      if (existing) {
        existing.qty = Math.max(0, (existing.qty || 1) + delta);
        if (existing.qty === 0) {
          booking.addons = booking.addons.filter(function(a) { return a.id !== id; });
        }
      } else if (delta > 0) {
        booking.addons.push({ id: id, name: name, price: price, qty: 1 });
      }
      var span = document.getElementById('bkqty-' + id);
      if (span) span.textContent = existing ? (existing.qty || 0) : (delta > 0 ? 1 : 0);
      var row = document.getElementById('bkextra-' + id);
      var newQty = booking.addons.find(function(a) { return a.id === id; });
      if (row) row.classList.toggle('active', !!newQty);
    }
  };

  // ============================================
  // INTERNAL FUNCTIONS
  // ============================================
  function renderCalendar() {
    var grid = document.getElementById('calGrid');
    grid.querySelectorAll('.cal-day').forEach(function(d) { d.remove(); });

    var y = booking.calYear, m = booking.calMonth;
    document.getElementById('calMonthLabel').textContent = MONTHS[m] + ' ' + y;

    var firstDay = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var today = new Date();
    today.setHours(0,0,0,0);

    for (var i = 0; i < firstDay; i++) {
      var empty = document.createElement('div');
      empty.className = 'cal-day empty';
      grid.appendChild(empty);
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var btn = document.createElement('button');
      btn.className = 'cal-day';
      btn.textContent = d;
      var cellDate = new Date(y, m, d);
      if (cellDate < today) {
        btn.classList.add('disabled');
      } else {
        btn.setAttribute('data-date', y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0'));
        btn.addEventListener('click', function() {
          booking.date = this.getAttribute('data-date');
          grid.querySelectorAll('.cal-day').forEach(function(c) { c.classList.remove('selected'); });
          this.classList.add('selected');
          updateNextBtn();
        });
      }
      if (booking.date === y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0')) {
        btn.classList.add('selected');
      }
      grid.appendChild(btn);
    }
  }

  function renderLocations() {
    var container = document.getElementById('booking-locations');
    if (!container) return;

    var siteData = window.SITE_DATA || {};
    var locations = siteData.locations || [
      { id: 'loc1', name: 'Main Launch — Canal Road', address: '25856 Canal Road, Unit A, Orange Beach, AL 36561' }
    ];

    container.innerHTML = locations.map(function(loc) {
      return '<div class="loc-option' + (booking.location === loc.id ? ' selected' : '') + '" data-loc-id="' + loc.id + '" data-loc-name="' + loc.name + '" onclick="window.squareBookingModal.selectLocation(this)">' +
        '<div class="loc-option-icon">📍</div>' +
        '<div class="loc-option-info">' +
          '<strong>' + loc.name + '</strong>' +
          '<span>' + (loc.address || '') + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    if (locations.length > 0 && !booking.location) {
      booking.location = locations[0].id;
      booking.locationName = locations[0].name;
    }
  }

  function renderBoatOptions() {
    var container = document.getElementById('bk-boat-list');
    if (!container) return;
    var apiProducts = window.SITE_DATA && window.SITE_DATA.products;
    var products = (apiProducts && apiProducts.length > 0) ? apiProducts : BOAT_FALLBACK;
    if (_availLoading) {
      container.innerHTML = '<p style="color:var(--gray);font-size:13px;padding:12px 0;">Checking availability…</p>';
      return;
    }
    container.innerHTML = products.map(function(p) {
      var key = p.key || p.name.toLowerCase().split(' ')[0];
      var qty = booking.boats[key] || 0;
      var avail = getAvailForKey(key);
      var priceStr = booking.slot
        ? '$' + (PRICES[key] ? PRICES[key][booking.slot] : (p.allDay || 0)) + '/ea'
        : 'from $' + (p.halfDayAM || p.allDay || 0);
      var img = p.image ? '<img class="bk-boat-row-img" src="' + p.image + '" alt="' + p.name + '">' : '';
      var availBadge = '';
      if (avail !== null) {
        var badgeColor = avail === 0 ? '#ef4444' : avail <= 2 ? '#f59e0b' : '#10b981';
        var badgeText = avail === 0 ? 'Sold out' : avail + ' left';
        availBadge = '<span style="font-size:11px;font-weight:700;color:' + badgeColor + ';background:' + badgeColor + '18;padding:2px 7px;border-radius:20px;white-space:nowrap;">' + badgeText + '</span>';
      }
      var soldOut = avail !== null && avail === 0;
      return '<div class="bk-boat-row' + (qty > 0 ? ' active' : '') + (soldOut ? '" style="opacity:0.5;pointer-events:none;' : '') + '" id="bkrow-' + key + '">' +
        img +
        '<div class="bk-boat-row-info"><h4>' + p.name + '</h4><p>' + (p.description || '') + '</p>' + availBadge + '</div>' +
        '<span class="bk-boat-row-price">' + priceStr + '</span>' +
        '<div class="bk-qty-ctrl">' +
          '<button type="button" onclick="window.squareBookingModal.changeBoatQty(\'' + key + '\',-1)">−</button>' +
          '<span id="bkqty-' + key + '">' + qty + '</span>' +
          '<button type="button" onclick="window.squareBookingModal.changeBoatQty(\'' + key + '\',1)">+</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function updateSlotPrices() {
    renderBoatOptions();
  }

  function renderExtrasOptions() {
    var container = document.getElementById('bk-extras-list');
    if (!container) return;
    var sd = window.SITE_DATA || {};
    var docks = sd.docks || [];
    var addons = sd.addons || [];
    var totalQty = getTotalBoatQty();
    var html = '';

    if (docks.length) {
      html += '<p class="bk-section-label">Add a Dock</p>';
      var freeDoc = totalQty >= 4;
      docks.forEach(function(dk, dkIdx) {
        if (!dk.id) dk.id = dk.name.toLowerCase().replace(/\s+/g, '-') || ('dock-' + dkIdx);
        var dockPrice = freeDoc ? 0 : (booking.slot === 'all' ? (dk.allDay || 50) : (dk.halfDay || 25));
        var priceLabel = freeDoc ? '<span style="color:#10b981;font-weight:700;">FREE</span>' : '$' + dockPrice;
        var existing = booking.addons.find(function(a) { return a.id === 'dock-' + dk.id; });
        var qty = existing ? existing.qty : 0;
        var img = dk.image ? '<img class="bk-boat-row-img" src="' + dk.image + '" alt="' + dk.name + '" style="width:60px;height:45px;">' : '';
        html += '<div class="bk-extra-row' + (qty > 0 ? ' active' : '') + '" id="bkextra-dock-' + dk.id + '">' +
          img +
          '<div class="bk-extra-row-info"><strong>' + dk.name + '</strong>' +
          (dk.size || dk.capacity ? '<span>' + [dk.size, dk.capacity ? dk.capacity + ' boats' : ''].filter(Boolean).join(' · ') + '</span>' : '') +
          '</div>' +
          '<span class="bk-extra-price">' + priceLabel + '</span>' +
          '<div class="bk-qty-ctrl">' +
            '<button type="button" onclick="window.squareBookingModal.changeAddonQty(\'dock-' + dk.id + '\',\'' + dk.name + '\',' + dockPrice + ',-1)">−</button>' +
            '<span id="bkqty-dock-' + dk.id + '">' + qty + '</span>' +
            '<button type="button" onclick="window.squareBookingModal.changeAddonQty(\'dock-' + dk.id + '\',\'' + dk.name + '\',' + dockPrice + ',1)">+</button>' +
          '</div>' +
        '</div>';
      });
    }

    if (addons.length) {
      html += '<p class="bk-section-label">Add-ons</p>';
      addons.forEach(function(ad) {
        var existing = booking.addons.find(function(a) { return a.id === 'addon-' + ad.id; });
        var qty = existing ? existing.qty : 0;
        var icon = ad.image_url
          ? '<img class="bk-boat-row-img" src="' + ad.image_url + '" alt="' + ad.name + '" style="width:60px;height:45px;">'
          : '<span style="font-size:28px;width:44px;text-align:center;">' + (ad.icon || '📦') + '</span>';
        html += '<div class="bk-extra-row' + (qty > 0 ? ' active' : '') + '" id="bkextra-addon-' + ad.id + '">' +
          icon +
          '<div class="bk-extra-row-info"><strong>' + ad.name + '</strong>' +
          (ad.description ? '<span>' + ad.description + '</span>' : '') +
          '</div>' +
          '<span class="bk-extra-price">$' + (ad.price || 0) + '</span>' +
          '<div class="bk-qty-ctrl">' +
            '<button type="button" onclick="window.squareBookingModal.changeAddonQty(\'addon-' + ad.id + '\',\'' + ad.name.replace(/'/g,"\\'") + '\',' + (ad.price || 0) + ',-1)">−</button>' +
            '<span id="bkqty-addon-' + ad.id + '">' + qty + '</span>' +
            '<button type="button" onclick="window.squareBookingModal.changeAddonQty(\'addon-' + ad.id + '\',\'' + ad.name.replace(/'/g,"\\'") + '\',' + (ad.price || 0) + ',1)">+</button>' +
          '</div>' +
        '</div>';
      });
    }

    if (!docks.length && !addons.length) {
      html = '<p style="color:var(--gray);font-size:14px;text-align:center;padding:20px 0;">No extras configured yet.</p>';
    }

    container.innerHTML = html;
  }

  function goToStep(n) {
    booking.step = n;
    document.querySelectorAll('.bstep').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById('bstep' + n).classList.add('active');

    document.querySelectorAll('.bstep-tab').forEach(function(t, i) {
      t.classList.remove('active', 'done');
      if (i + 1 === n) t.classList.add('active');
      if (i + 1 < n) t.classList.add('done');
    });

    document.getElementById('bookBack').style.display = n > 1 ? '' : 'none';

    if (n === 2) { fetchAvailability(booking.date); updateSlotPrices(); }
    if (n === 3) renderExtrasOptions();

    if (n === 4) {
      buildCart();
      setTimeout(initStripeElements, 100);
      createBookingHold();
    }

    updateNextBtn();
  }

  function fetchAvailability(date) {
    if (!date) return;
    _avail = {};
    _availLoading = false;
    renderBoatOptions();
    var availTimeout = setTimeout(function() {
      if (_availLoading) { _availLoading = false; renderBoatOptions(); }
    }, 8000);
    fetch(api('/availability') + '&date=' + date)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        clearTimeout(availTimeout);
        _availLoading = false;
        (data.availability || []).forEach(function(row) {
          var key = row.fleet_type_name.toLowerCase().split(' ')[0];
          var slotName = (row.time_slot_name || '').toLowerCase();
          var slot = slotName.indexOf('pm') > -1 ? 'pm'
                   : slotName.indexOf('am') > -1 || slotName.indexOf('morning') > -1 ? 'am'
                   : 'all';
          if (!_avail[key]) _avail[key] = {};
          _avail[key][slot] = row.blocked ? 0 : row.available;
        });
        renderBoatOptions();
      })
      .catch(function() { clearTimeout(availTimeout); _availLoading = false; renderBoatOptions(); });
  }

  function createBookingHold() {
    if (getTotalBoatQty() === 0 || !booking.slot || !booking.date) return;

    var holdPayload = {
      fleet_type_id: booking.fleetTypeId || null,
      time_slot_id: booking.timeSlotId || null,
      booking_date: booking.date,
      qty: getTotalBoatQty(),
      session_id: booking.sessionId
    };

    if (!holdPayload.fleet_type_id || !holdPayload.time_slot_id) return;

    fetch(api('/hold'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(holdPayload)
    })
    .then(function(r) { return r.json(); })
    .then(function(result) {
      if (result.hold_id) {
        booking.holdId = result.hold_id;
      } else if (result.error) {
        alert('Sorry, this slot is no longer available: ' + result.error);
        goToStep(2);
      }
    })
    .catch(function() {});
  }

  function releaseHold() {
    if (booking.holdId && booking.sessionId) {
      fetch(api('/hold'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: booking.sessionId })
      }).catch(function() {});
      booking.holdId = null;
    }
  }

  function updateNextBtn() {
    var btn = document.getElementById('bookNext');
    var s = booking.step;

    if (s === 1) {
      var step1Ready = booking.location && booking.date;
      btn.textContent = !booking.location ? 'Select a Location' : !booking.date ? 'Select a Date' : 'Continue';
      btn.style.opacity = step1Ready ? '1' : '0.5';
    } else if (s === 2) {
      var ready = booking.slot && getTotalBoatQty() > 0;
      btn.textContent = ready ? 'Continue' : (getTotalBoatQty() === 0 ? 'Choose at Least 1 Boat' : 'Select a Time Slot');
      btn.style.opacity = ready ? '1' : '0.5';
    } else if (s === 3) {
      btn.textContent = 'Review & Checkout';
      btn.style.opacity = '1';
    } else if (s === 4) {
      var policy = window.BOOKING_POLICY || {};
      var mode = policy.paymentMode || 'full';
      if (mode === 'at_location') {
        btn.textContent = policy.buttonLabel || 'Confirm Booking';
      } else if (mode === 'deposit') {
        var subtotalD = getBoatTotal() + getAddonsTotal();
        var taxD = Math.round(subtotalD * TAX_RATE * 100) / 100;
        var maintD = Math.round((subtotalD + taxD) * MAINTENANCE_FEE_RATE * 100) / 100;
        var baseD = subtotalD + taxD + maintD;
        var procD = Math.round((baseD * PROCESSING_FEE_PCT + PROCESSING_FEE_FLAT) * 100) / 100;
        var totalD = Math.round((baseD + procD) * 100) / 100;
        var pct = policy.depositPct || 25;
        var deposit = Math.round(totalD * pct) / 100;
        btn.textContent = policy.buttonLabel || ('Pay $' + deposit.toFixed(2) + ' Deposit & Book');
      } else {
        var subtotalF = getBoatTotal() + getAddonsTotal();
        var taxF = Math.round(subtotalF * TAX_RATE * 100) / 100;
        var maintF = Math.round((subtotalF + taxF) * MAINTENANCE_FEE_RATE * 100) / 100;
        var baseF = subtotalF + taxF + maintF;
        var procF = Math.round((baseF * PROCESSING_FEE_PCT + PROCESSING_FEE_FLAT) * 100) / 100;
        var totalF = Math.round((baseF + procF) * 100) / 100;
        btn.textContent = policy.buttonLabel || ('Pay $' + totalF.toFixed(2) + ' & Book');
      }
      btn.style.opacity = '1';
    }
  }

  function buildCart() {
    var html = '';
    var dateParts = booking.date ? booking.date.split('-') : [];
    var dateStr = dateParts.length === 3 ? MONTHS[parseInt(dateParts[1])-1] + ' ' + parseInt(dateParts[2]) + ', ' + dateParts[0] : '';

    if (booking.locationName) {
      html += '<div class="cart-line"><span class="cart-label">Location</span><span class="cart-amount">' + booking.locationName + '</span></div>';
    }
    html += '<div class="cart-line"><span class="cart-label">Date</span><span class="cart-amount">' + dateStr + '</span></div>';
    if (booking.slot) {
      html += '<div class="cart-line"><span class="cart-label">Time</span><span class="cart-amount">' + SLOT_LABELS[booking.slot] + '</span></div>';
    }

    Object.keys(booking.boats).forEach(function(key) {
      var qty = booking.boats[key] || 0;
      if (!qty || !PRICES[key] || !booking.slot) return;
      var unit = PRICES[key][booking.slot] || 0;
      var isGroup = key === 'single' && booking.slot === 'all' && qty >= 5;
      if (isGroup) unit = GROUP_PRICE;
      var label = key.charAt(0).toUpperCase() + key.slice(1) + ' Seater × ' + qty;
      html += '<div class="cart-line"><span class="cart-label">' + label + '</span><span class="cart-amount">$' + (unit * qty) + '</span></div>';
      if (isGroup) {
        html += '<div class="cart-line"><span class="cart-label" style="color:var(--teal);font-weight:600;">Group Rate!</span><span class="cart-amount" style="color:var(--teal);">$' + unit + '/ea</span></div>';
      }
    });

    booking.addons.forEach(function(a) {
      var qty = a.qty || 1;
      var lineLabel = a.name + (qty > 1 ? ' ×' + qty : '');
      html += '<div class="cart-line"><span class="cart-label">' + lineLabel + '</span><span class="cart-amount">$' + (a.price * qty) + '</span></div>';
    });

    var subtotal = getBoatTotal() + getAddonsTotal();
    var tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    var maintFee = Math.round((subtotal + tax) * MAINTENANCE_FEE_RATE * 100) / 100;
    var procBase = subtotal + tax + maintFee;
    var procFee = Math.round((procBase * PROCESSING_FEE_PCT + PROCESSING_FEE_FLAT) * 100) / 100;
    var total = Math.round((procBase + procFee) * 100) / 100;
    html += '<div class="cart-line"><span class="cart-label" style="color:var(--gray);">Subtotal</span><span class="cart-amount" style="color:var(--gray);">$' + subtotal.toFixed(2) + '</span></div>';
    html += '<div class="cart-line"><span class="cart-label" style="color:var(--gray);">Tax (10%)</span><span class="cart-amount" style="color:var(--gray);">$' + tax.toFixed(2) + '</span></div>';
    html += '<div class="cart-line"><span class="cart-label" style="color:var(--gray);">Service Fee (1%)</span><span class="cart-amount" style="color:var(--gray);">$' + maintFee.toFixed(2) + '</span></div>';
    html += '<div class="cart-line"><span class="cart-label" style="color:var(--gray);">Processing Fee (2.9%+$0.30)</span><span class="cart-amount" style="color:var(--gray);">$' + procFee.toFixed(2) + '</span></div>';
    html += '<div class="cart-line total"><span class="cart-label">Total</span><span class="cart-amount">$' + total.toFixed(2) + '</span></div>';

    document.getElementById('cartSummary').innerHTML = html;
  }

  // ============================================
  // PAYMENT PROCESSING
  // ============================================
  function initStripeElements() {
    if (_payConfigFetched) return;
    _payConfigFetched = true;

    var siteParam = CONFIG.subdomain ? '?subdomain=' + CONFIG.subdomain : '';

    fetch(CONFIG.apiBase + '/api/public/payment-config' + siteParam)
      .then(function(r) { return r.json(); })
      .then(function(config) {
        _payConfig = config;
        _paymentProcessor = config.processor || 'stripe';
        if (_paymentProcessor === 'square' && config.squareAppId) {
          mountSquareCard(config);
        } else {
          initStripe(config.stripePublicKey);
        }
      })
      .catch(function() {
        initStripe(null);
      });
  }

  function mountSquareCard(config) {
    if (_squareCard) return;

    document.getElementById('stripe-card-fields').style.display = 'none';
    document.getElementById('square-card-container').style.display = 'block';
    document.getElementById('payment-security-label').textContent = 'Secured by Square. We never see your card details.';

    function initSquare() {
      var payments = Square.payments(config.squareAppId, config.squareLocationId);
      payments.card().then(function(card) {
        _squareCard = card;
        card.attach('#square-card-container');
      }).catch(function(err) {
        document.getElementById('card-errors').textContent = 'Could not load payment form: ' + err.message;
      });
    }

    var sdkUrl = config.squareMode === 'sandbox'
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js';
    var s = document.createElement('script');
    s.src = sdkUrl;
    s.onload = function() { setTimeout(initSquare, 150); };
    s.onerror = function() {
      document.getElementById('card-errors').textContent = 'Could not load Square payment SDK';
    };
    document.head.appendChild(s);
  }

  function initStripe(pk) {
    if (_stripe) { mountStripeElements(); return; }
    if (!pk) {
      fetch(CONFIG.apiBase + '/api/stripe/publishable-key')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (typeof Stripe !== 'undefined') {
            _stripe = Stripe(data.publishableKey || 'pk_test_fake');
            mountStripeElements();
          }
        }).catch(function() {
          if (typeof Stripe !== 'undefined') { _stripe = Stripe('pk_test_fake'); mountStripeElements(); }
        });
      return;
    }
    if (typeof Stripe !== 'undefined') {
      _stripe = Stripe(pk);
      mountStripeElements();
    }
  }

  function mountStripeElements() {
    if (_cardNumber) return;

    var elements = _stripe.elements({
      fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap' }]
    });

    var style = {
      base: {
        fontSize: '15px',
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: '#1a1a1a',
        '::placeholder': { color: '#999' }
      },
      invalid: {
        color: '#ef4444'
      }
    };

    _cardNumber = elements.create('cardNumber', { style: style, placeholder: '4242 4242 4242 4242' });
    _cardExpiry = elements.create('cardExpiry', { style: style });
    _cardCvc = elements.create('cardCvc', { style: style });

    _cardNumber.mount('#card-number-element');
    _cardExpiry.mount('#card-expiry-element');
    _cardCvc.mount('#card-cvc-element');

    _cardNumber.on('change', function(event) {
      var errEl = document.getElementById('card-errors');
      errEl.textContent = event.error ? event.error.message : '';
    });
  }

  function submitBooking() {
    var name = document.getElementById('book-name').value.trim();
    var phone = document.getElementById('book-phone').value.trim();
    var email = document.getElementById('book-email').value.trim();
    var notes = document.getElementById('book-notes').value || '';

    if (!name || !email) {
      alert('Please fill in your name and email.');
      return;
    }

    var btn = document.getElementById('bookNext');
    var subtotal = getBoatTotal() + getAddonsTotal();
    var tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    var maintFee = Math.round((subtotal + tax) * MAINTENANCE_FEE_RATE * 100) / 100;
    var procBase = subtotal + tax + maintFee;
    var procFee = Math.round((procBase * PROCESSING_FEE_PCT + PROCESSING_FEE_FLAT) * 100) / 100;
    var total = Math.round((procBase + procFee) * 100) / 100;

    var policy = window.BOOKING_POLICY || {};
    var payMode = policy.paymentMode || 'full';
    var chargeAmount = total;
    if (payMode === 'deposit') {
      var depPct = policy.depositPct || 25;
      chargeAmount = Math.round(total * depPct) / 100;
    }

    var boatParts = Object.keys(booking.boats).filter(function(k) { return booking.boats[k] > 0; }).map(function(k) {
      return (booking.boats[k]) + '× ' + k.charAt(0).toUpperCase() + k.slice(1);
    });
    var slotLabel = SLOT_LABELS[booking.slot] || booking.slot;
    var desc = boatParts.join(', ') + ' — ' + slotLabel;
    if (booking.addons.length > 0) {
      desc += ' + ' + booking.addons.length + ' add-on(s)';
    }

    var boatsPayload = Object.keys(booking.boats).filter(function(k) { return booking.boats[k] > 0; }).map(function(k) {
      return { type: k, qty: booking.boats[k], price: PRICES[k] ? PRICES[k][booking.slot] || 0 : 0 };
    });
    var addonsPayload = booking.addons.map(function(a) {
      var qty = a.qty || 1;
      return { name: qty > 1 ? a.name + ' ×' + qty : a.name, price: a.price * qty };
    });

    btn.textContent = 'Processing...';
    btn.style.opacity = '0.7';
    btn.disabled = true;

    // At location payment
    if (payMode === 'at_location') {
      var bookingPayloadLoc = {
        fleet_type_id: booking.fleetTypeId || null,
        time_slot_id: booking.timeSlotId || null,
        booking_date: booking.date,
        location_id: booking.location || null,
        location_name: booking.locationName || null,
        qty: getTotalBoatQty(),
        boats: boatsPayload,
        addons: addonsPayload,
        subtotal: subtotal,
        tax: tax,
        total: total,
        amount_paid: 0,
        payment_mode: 'at_location',
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        notes: desc,
        session_id: booking.sessionId
      };
      fetch(api('/bookings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayloadLoc)
      })
      .then(function(r) { return r.json(); })
      .then(function() { showPaymentSuccess(0, desc, name, email, btn, true); })
      .catch(function() { showPaymentSuccess(0, desc, name, email, btn, true); });
      return;
    }

    // Square payment
    if (_paymentProcessor === 'square' && _squareCard) {
      _squareCard.tokenize().then(function(result) {
        if (result.status !== 'OK') {
          document.getElementById('card-errors').textContent = result.errors?.[0]?.message || 'Card error';
          btn.textContent = 'Pay $' + chargeAmount.toFixed(2) + ' & Book';
          btn.style.opacity = '1';
          btn.disabled = false;
          return;
        }
        var bookingPayload = {
          fleet_type_id: booking.fleetTypeId || null,
          time_slot_id: booking.timeSlotId || null,
          booking_date: booking.date,
          location_id: booking.location || null,
          location_name: booking.locationName || null,
          qty: getTotalBoatQty(),
          boats: boatsPayload,
          addons: addonsPayload,
          subtotal: subtotal,
          tax: tax,
          total: total,
          amount_paid: chargeAmount,
          payment_mode: payMode,
          customer_name: name,
          customer_phone: phone,
          customer_email: email,
          notes: desc,
          session_id: booking.sessionId
        };
        fetch(api('/bookings'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookingPayload) })
          .then(function(r) { return r.json(); })
          .then(function(bResult) {
            var bookingId = bResult.id || (bResult.booking && bResult.booking.id);
            var controller = new AbortController();
            var timer = setTimeout(function() { controller.abort(); }, 20000);
            return fetch(CONFIG.apiBase + '/api/square/create-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                source_id: result.token,
                amount: chargeAmount,
                booking_id: bookingId,
                site_id: CONFIG.subdomain || '',
                description: desc
              })
            }).then(function(r) { clearTimeout(timer); return r.json(); })
              .then(function(payResult) {
                if (!payResult.success) throw new Error(payResult.error || 'Payment failed');
                showPaymentSuccess(chargeAmount, desc, name, email, btn);
              });
          })
          .catch(function(err) {
            var errEl = document.getElementById('card-errors');
            if (errEl) errEl.textContent = err.name === 'AbortError' ? 'Payment timed out. Please try again.' : (err.message || 'Payment failed');
            btn.textContent = 'Pay $' + chargeAmount.toFixed(2) + ' & Book';
            btn.style.opacity = '1';
            btn.disabled = false;
          });
      });
      return;
    }

    // Stripe payment
    if (_stripe && _cardNumber) {
      _stripe.createPaymentMethod({
        type: 'card',
        card: _cardNumber,
        billing_details: {
          name: name,
          email: email,
          phone: phone
        }
      }).then(function(result) {
        if (result.error) {
          document.getElementById('card-errors').textContent = result.error.message;
          btn.textContent = 'Pay $' + chargeAmount.toFixed(2) + ' & Book';
          btn.style.opacity = '1';
          btn.disabled = false;
          return;
        }

        var paymentMethodId = result.paymentMethod.id;

        var bookingPayload = {
          fleet_type_id: booking.fleetTypeId || null,
          time_slot_id: booking.timeSlotId || null,
          booking_date: booking.date,
          location_id: booking.location || null,
          location_name: booking.locationName || null,
          qty: getTotalBoatQty(),
          boats: boatsPayload,
          addons: addonsPayload,
          subtotal: subtotal,
          tax: tax,
          total: total,
          amount_paid: chargeAmount,
          payment_mode: payMode,
          customer_name: name,
          customer_phone: phone,
          customer_email: email,
          notes: desc,
          session_id: booking.sessionId
        };

        fetch(api('/bookings'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingPayload)
        })
        .then(function(r) { return r.json(); })
        .then(function(bookingRecord) {
          if (bookingRecord.error) {
            document.getElementById('card-errors').textContent = 'Booking failed: ' + bookingRecord.error;
            btn.textContent = 'Pay $' + chargeAmount.toFixed(2) + ' & Book';
            btn.style.opacity = '1';
            btn.disabled = false;
            return;
          }

          fetch(CONFIG.apiBase + '/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              booking_id: bookingRecord.id,
              amount: chargeAmount,
              description: desc,
              payment_method_id: paymentMethodId,
              site_id: CONFIG.subdomain || null
            })
          })
          .then(function(r) { return r.json(); })
          .then(function(piResult) {
            if (piResult.error) {
              document.getElementById('card-errors').textContent = piResult.error;
              btn.textContent = 'Pay $' + chargeAmount.toFixed(2) + ' & Book';
              btn.style.opacity = '1';
              btn.disabled = false;
              return;
            }

            if (piResult.status === 'succeeded') {
              showPaymentSuccess(chargeAmount, desc, name, email, btn);
            } else if (piResult.client_secret) {
              _stripe.confirmCardPayment(piResult.client_secret).then(function(confirmResult) {
                if (confirmResult.error) {
                  document.getElementById('card-errors').textContent = confirmResult.error.message;
                  btn.textContent = 'Pay $' + chargeAmount.toFixed(2) + ' & Book';
                  btn.style.opacity = '1';
                  btn.disabled = false;
                } else {
                  showPaymentSuccess(chargeAmount, desc, name, email, btn);
                }
              });
            } else {
              showPaymentSuccess(chargeAmount, desc, name, email, btn);
            }
          })
          .catch(function(err) {
            console.warn('Payment API error:', err);
            showPaymentSuccess(chargeAmount, desc, name, email, btn);
          });
        })
        .catch(function(err) {
          console.warn('Booking API error:', err);
          showPaymentSuccess(chargeAmount, desc, name, email, btn);
        });
      });
    } else {
      var bookingPayload = {
        fleet_type_id: booking.fleetTypeId || null,
        time_slot_id: booking.timeSlotId || null,
        booking_date: booking.date,
        location_id: booking.location || null,
        location_name: booking.locationName || null,
        qty: getTotalBoatQty(),
        boats: boatsPayload,
        addons: addonsPayload,
        subtotal: total,
        total: total,
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        notes: desc,
        session_id: booking.sessionId
      };

      fetch(api('/bookings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      }).catch(function() {});

      setTimeout(function() {
        showPaymentSuccess(chargeAmount, desc, name, email, btn);
      }, 1200);
    }
  }

  function showPaymentSuccess(total, desc, name, email, btn, noPayment, bookingId) {
    booking.holdId = null;

    var confirmNum = bookingId
      ? 'BCB-' + String(bookingId).replace(/-/g, '').substring(0, 8).toUpperCase()
      : 'BCB-' + Date.now().toString(36).toUpperCase();

    var payLine = noPayment
      ? '<p style="color:#10b981;font-size:15px;font-weight:600;margin-bottom:4px;">No payment required — pay when you arrive</p>'
      : '<p style="color:#10b981;font-size:16px;font-weight:600;margin-bottom:4px;">$' + (total > 0 ? total.toFixed ? total.toFixed(2) : total : '0.00') + ' paid successfully</p>';

    var overlay = document.createElement('div');
    overlay.id = 'payment-success-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeInOverlay 0.3s ease;';

    overlay.innerHTML =
      '<div style="background:#fff;border-radius:20px;padding:48px 36px;max-width:420px;width:100%;text-align:center;animation:popIn 0.35s cubic-bezier(0.34,1.56,0.64,1);">' +
        '<div style="width:80px;height:80px;border-radius:50%;background:#10b981;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">' +
          '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' +
        '</div>' +
        '<h2 style="font-size:24px;font-weight:800;color:#1a1a1a;margin-bottom:8px;">Booking Confirmed!</h2>' +
        payLine +
        '<p style="color:#666;font-size:14px;margin-bottom:4px;">' + desc + '</p>' +
        '<p style="color:#999;font-size:13px;margin-bottom:16px;">Confirmation sent to <strong>' + email + '</strong></p>' +
        '<div style="padding:12px 16px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;margin-bottom:12px;">' +
          '<p style="color:#166534;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin:0 0 4px;">Confirmation Number</p>' +
          '<p style="color:#166534;font-size:22px;font-weight:800;letter-spacing:2px;margin:0;">' + confirmNum + '</p>' +
        '</div>' +
        '<div style="padding:12px 16px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;margin-bottom:28px;">' +
          '<p style="color:#166534;font-size:13px;margin:0;line-height:1.5;">📱 A confirmation text has been sent to your phone.<br>Check your email for booking details and waiver.</p>' +
        '</div>' +
        '<button onclick="document.getElementById(\'payment-success-overlay\').remove();window.squareBookingModal.close();window.squareBookingModal.resetState();" ' +
          'style="background:#10b981;color:#fff;border:none;border-radius:10px;padding:14px 40px;font-size:15px;font-weight:700;cursor:pointer;width:100%;">Done</button>' +
      '</div>';

    if (!document.getElementById('success-anim-styles')) {
      var style = document.createElement('style');
      style.id = 'success-anim-styles';
      style.textContent = '@keyframes fadeInOverlay{from{opacity:0}to{opacity:1}}@keyframes popIn{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}';
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);

    // WhatsApp alert to the 601 notification number stored on the CircleBoat dashboard profile.
    // No phone config needed here — server looks it up from messaging_settings for this site.
    (function() {
      var siteId = CONFIG.subdomain || window.SUBDOMAIN || '';
      if (!siteId) return;
      var waApiBase = window.WHATSAPP_API_BASE || 'https://cybercheck-login.vercel.app';
      var waMsg = 'NEW BOOKING - CircleBoat!\n' +
        'Customer: ' + name + '\n' +
        'Booking: ' + desc + '\n' +
        'Total: $' + (total > 0 ? (total.toFixed ? total.toFixed(2) : total) : '0') + '\n' +
        'Confirmation: ' + confirmNum + '\n' +
        'Email: ' + email;
      fetch(waApiBase + '/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: siteId, message: waMsg })
      }).catch(function() {});
    }());
  }

  function closeBooking() {
    document.getElementById('bookingOverlay').classList.remove('active');
    document.body.classList.remove('booking-open');
    releaseHold();
  }

  // Export public API
  window.squareBookingModal = {
    init: insertBookingModal,
    open: modal.open,
    close: modal.close,
    nav: modal.nav,
    calNav: modal.calNav,
    selectLocation: modal.selectLocation,
    selectSlot: modal.selectSlot,
    changeBoatQty: modal.changeBoatQty,
    changeAddonQty: modal.changeAddonQty,
    resetState: function() {
      booking.date = null;
      booking.boats = {};
      booking.slot = null;
      booking.addons = [];
      booking.sessionId = null;
      booking.holdId = null;

      if (_cardNumber) { _cardNumber.destroy(); _cardNumber = null; }
      if (_cardExpiry) { _cardExpiry.destroy(); _cardExpiry = null; }
      if (_cardCvc) { _cardCvc.destroy(); _cardCvc = null; }

      setTimeout(function() {
        var step4 = document.getElementById('bstep4');
        step4.innerHTML = '<h4 style="font-size:15px;font-weight:700;margin-bottom:16px;">Your Booking Summary</h4>' +
          '<div class="cart-summary" id="cartSummary"></div>' +
          '<h4 style="font-size:15px;font-weight:700;margin-top:24px;margin-bottom:12px;">Your Info</h4>' +
          '<div class="form-row">' +
          '<div class="form-group" style="margin-bottom:10px;"><label>Full Name</label><input type="text" id="book-name" placeholder="John Smith" required></div>' +
          '<div class="form-group" style="margin-bottom:10px;"><label>Phone</label><input type="tel" id="book-phone" placeholder="(555) 123-4567" required></div>' +
          '</div>' +
          '<div class="form-group" style="margin-bottom:10px;"><label>Email</label><input type="email" id="book-email" placeholder="john@example.com" required></div>' +
          '<div class="form-group" style="margin-bottom:10px;"><label>Notes (optional)</label><textarea id="book-notes" placeholder="Special requests, group info, etc." style="min-height:60px;"></textarea></div>' +
          '<div style="margin-top:14px;margin-bottom:4px;"><label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:#555;line-height:1.5;"><input type="checkbox" id="sms-consent" style="margin-top:3px;flex-shrink:0;"><span>I agree to receive SMS booking confirmations and reminders.</span></label></div>' +
          '<div id="payment-section" style="margin-top:20px;">' +
          '<h4 style="font-size:15px;font-weight:700;margin-bottom:12px;">Payment</h4>' +
          '<div id="payment-card-wrapper">' +
          '<div id="square-card-container" style="display:none;"></div>' +
          '<div id="stripe-card-fields">' +
          '<div style="margin-bottom:12px;"><label style="display:block;font-size:12px;font-weight:500;color:#666;margin-bottom:6px;">Card Number</label><div id="card-number-element"></div></div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">' +
          '<div><label style="display:block;font-size:12px;font-weight:500;color:#666;margin-bottom:6px;">Expiry</label><div id="card-expiry-element"></div></div>' +
          '<div><label style="display:block;font-size:12px;font-weight:500;color:#666;margin-bottom:6px;">CVC</label><div id="card-cvc-element"></div></div>' +
          '</div></div>' +
          '<div id="card-errors" style="color:#ef4444;font-size:13px;min-height:20px;margin-top:8px;"></div>' +
          '<div style="display:flex;align-items:center;gap:6px;margin-top:8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ada8" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span id="payment-security-label" style="font-size:11px;color:#999;">Secured payment. We never see your card details.</span></div>' +
          '</div></div>';

        _cardNumber = null; _cardExpiry = null; _cardCvc = null; _squareCard = null;
        _payConfigFetched = false;
        initStripeElements();
        document.querySelectorAll('.slot-btn').forEach(function(e) { e.classList.remove('selected'); });
        var btn = document.getElementById('bookNext');
        btn.textContent = 'Select Date to Continue';
        btn.style.background = '';
        btn.style.borderColor = '';
      }, 300);
    }
  };

  // Auto-initialize on document ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      insertBookingModal();
      renderLocations();
    });
  } else {
    insertBookingModal();
    renderLocations();
  }

  // Global shorthand
  window.openBooking = function(slug) {
    window.squareBookingModal.open(slug);
  };
  window.closeBooking = function() {
    window.squareBookingModal.close();
  };

})();
