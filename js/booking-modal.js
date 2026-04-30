/**
 * MODULAR BOOKING MODAL
 * For any business - pulls live data from API
 * Usage: openBooking('business-slug')
 */

(function() {
  // Inject CSS
  var style = document.createElement('style');
  style.textContent = `
    .booking-overlay {
      display: none;
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.55); z-index: 2000;
      align-items: center; justify-content: center; padding: 20px;
    }
    .booking-overlay.active { display: flex; }
    .booking-modal {
      --teal: #00ada8; --teal-dark: #009590; --teal-light: rgba(0,173,168,0.08);
      --teal-border: rgba(0,173,168,0.2); --dark: #333333; --gray: #666666;
      --gray-light: #999999; --border: #e8e8e8; --bg: #fafafa; --white: #ffffff;
      --radius: 8px; --radius-lg: 16px;
      background: #ffffff; color: #333333;
      border-radius: 16px; width: 100%; max-width: 720px;
      max-height: 90vh; overflow: hidden; position: relative;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      display: flex; flex-direction: column;
    }
    .booking-close {
      position: absolute; top: 16px; right: 16px; width: 36px; height: 36px;
      border-radius: 50%; background: #fafafa; border: none; font-size: 20px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: #333; z-index: 5;
    }
    .booking-header { padding: 28px 32px 0; flex-shrink: 0; }
    .booking-header h2 { font-size: 24px; font-weight: 700; margin-bottom: 4px; color: #333; }
    .booking-header p { font-size: 14px; color: #666; }
    .booking-steps-nav { display: flex; padding: 20px 32px 0; flex-shrink: 0; }
    .bstep-tab {
      flex: 1; text-align: center; padding: 10px 8px; font-size: 12px; font-weight: 600;
      color: #999; border-bottom: 2px solid #e8e8e8; cursor: pointer; transition: all 0.2s;
    }
    .bstep-tab.active { color: #00ada8; border-color: #00ada8; }
    .bstep-tab.done { color: #009590; border-color: #00ada8; }
    .booking-body { padding: 24px 32px 28px; flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; }
    .bstep { display: none; } .bstep.active { display: block; }
    .loc-section-label { font-size: 13px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
    .loc-option {
      display: flex; align-items: center; gap: 12px; padding: 14px 16px;
      border: 2px solid #e8e8e8; border-radius: 10px; cursor: pointer;
      margin-bottom: 8px; transition: all 0.2s;
    }
    .loc-option:hover, .loc-option.selected { border-color: #00ada8; background: rgba(0,173,168,0.08); }
    .loc-option-icon { font-size: 20px; }
    .loc-option-info strong { display: block; font-size: 14px; font-weight: 700; color: #333; }
    .loc-option-info span { font-size: 12px; color: #666; }
    .cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .cal-header h3 { font-size: 16px; font-weight: 700; color: #333; }
    .cal-nav {
      background: #fafafa; border: 1px solid #e8e8e8; border-radius: 8px;
      width: 32px; height: 32px; cursor: pointer; font-size: 16px;
      display: flex; align-items: center; justify-content: center; color: #333;
    }
    .cal-nav:hover { background: #e8e8e8; }
    .cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 4px; text-align: center; }
    .cal-day-label { font-size: 11px; font-weight: 600; color: #999; padding: 6px 0; text-transform: uppercase; }
    .cal-day {
      padding: 10px 4px; border-radius: 8px; font-size: 14px; cursor: pointer;
      transition: all 0.15s; border: none; background: none; color: #333;
    }
    .cal-day:hover { background: rgba(0,173,168,0.08); }
    .cal-day.selected { background: #00ada8; color: #fff; font-weight: 600; }
    .cal-day.disabled { color: #e8e8e8; pointer-events: none; }
    .cal-day.empty { pointer-events: none; }
    .boat-option {
      border: 2px solid #e8e8e8; border-radius: 12px; padding: 16px;
      margin-bottom: 12px; cursor: pointer; display: flex; align-items: center;
      gap: 16px; transition: all 0.2s;
    }
    .boat-option:hover { border-color: rgba(0,173,168,0.3); }
    .boat-option.selected { border-color: #00ada8; background: rgba(0,173,168,0.08); }
    .boat-option-info { flex: 1; }
    .boat-option-info h4 { font-size: 16px; font-weight: 700; margin-bottom: 2px; color: #333; }
    .boat-option-info p { font-size: 12px; color: #666; }
    .boat-option-price { font-size: 18px; font-weight: 700; color: #00ada8; white-space: nowrap; }
    .slot-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-top: 16px; }
    .slot-btn {
      padding: 14px 12px; border: 2px solid #e8e8e8; border-radius: 8px;
      background: #fff; cursor: pointer; text-align: center; transition: all 0.2s;
    }
    .slot-btn:hover { border-color: rgba(0,173,168,0.3); }
    .slot-btn.selected { border-color: #00ada8; background: rgba(0,173,168,0.08); }
    .slot-btn strong { display: block; font-size: 14px; font-weight: 700; margin-bottom: 2px; color: #333; }
    .slot-btn span { font-size: 12px; color: #666; }
    .slot-price { display: block; font-size: 16px; font-weight: 700; color: #00ada8; margin-top: 4px; }
    .bk-extra-row { display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid #e8e8e8;border-radius:10px;margin-bottom:8px;transition:border-color .15s; }
    .bk-extra-row.active { border-color:#00ada8;background:rgba(0,173,168,0.06); }
    .bk-extra-row-info { flex:1; }
    .bk-extra-row-info strong { display:block;font-size:13px;color:#333; }
    .bk-extra-row-info span { font-size:11px;color:#666; }
    .bk-extra-price { font-weight:700;color:#00ada8;font-size:13px;white-space:nowrap;margin-right:6px; }
    .bk-qty-ctrl { display:flex;align-items:center;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden; }
    .bk-qty-ctrl button { width:32px;height:32px;border:none;background:#fafafa;font-size:17px;cursor:pointer;color:#333;display:flex;align-items:center;justify-content:center; }
    .bk-qty-ctrl button:hover { background:#e8e8e8; }
    .bk-qty-ctrl span { width:34px;text-align:center;font-weight:700;font-size:15px;color:#333; }
    .cart-summary { background: #fafafa; border-radius: 8px; padding: 20px; margin-top: 16px; }
    .cart-line { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .cart-line.total { border-top: 2px solid #e8e8e8; margin-top: 8px; padding-top: 12px; font-weight: 700; font-size: 18px; }
    .cart-line.total .cart-amount { color: #00ada8; }
    .cart-label { color: #666; } .cart-amount { font-weight: 600; color: #333; }
    .booking-footer { padding: 0 32px 28px; display: flex; justify-content: space-between; gap: 12px; flex-shrink: 0; }
    .booking-footer .b-btn { flex: 1; justify-content: center; }
    .b-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 14px 32px; border-radius: 100px; font-weight: 600; font-size: 15px;
      cursor: pointer; border: 2px solid transparent; transition: all 0.2s; width: 100%;
    }
    .b-btn-primary { background: #00ada8; color: #fff; border-color: #00ada8; }
    .b-btn-primary:hover { background: #009590; border-color: #009590; }
    .b-btn-outline { background: transparent; color: #333; border-color: #e8e8e8; }
    .b-btn-outline:hover { border-color: #333; }
    .b-form-group { margin-bottom: 14px; }
    .b-form-group label { display: block; font-size: 13px; font-weight: 600; color: #666; margin-bottom: 6px; }
    .b-form-group input, .b-form-group textarea, .b-form-group select {
      width: 100%; padding: 11px 14px; border: 1px solid #e8e8e8; border-radius: 8px;
      font-family: inherit; font-size: 14px; color: #333; background: #fff;
      transition: border-color 0.2s;
    }
    .b-form-group input:focus, .b-form-group textarea:focus { outline: none; border-color: #00ada8; }
    .b-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
    @media (max-width: 480px) {
      .booking-overlay { padding: 0; align-items: flex-end; }
      .booking-modal { max-width: 100%; border-radius: 20px 20px 0 0; max-height: 95vh; overflow: hidden; }
      .booking-header { padding: 20px 16px 0; }
      .booking-steps-nav { padding: 12px 16px 0; }
      .booking-body { padding: 16px 16px 20px; min-height: 0; }
      .booking-footer { padding: 0 16px 20px; }
      .slot-grid { grid-template-columns: 1fr 1fr; }
      .b-form-row { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);

  // Global state
  var _bookingState = {
    slug: null,
    selectedDate: null,
    selectedLocation: 'loc1',
    boats: [],
    selectedBoats: {},
    selectedSlot: null,
    extras: [],
    selectedExtras: {},
    step: 1,
    funnelRef: Math.random().toString(36).slice(2) + Date.now().toString(36)
  };

  var _TRACK_API = 'https://cybercheck-api-database.vercel.app';
  var _stepNames = { 1: 'date_selected', 2: 'boat_time_selected', 3: 'extras_viewed', 4: 'checkout_opened' };
  function _trackFunnel(step, stepName, meta) {
    var sess = sessionStorage.getItem('gcr_sess_id') || _bookingState.funnelRef;
    fetch(_TRACK_API + '/api/public/funnel?subdomain=' + encodeURIComponent(_bookingState.slug || ''), {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sess, booking_ref: _bookingState.funnelRef, step: step, step_name: stepName || _stepNames[step] || 'step_' + step, metadata: meta || null, device_type: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop' })
    }).catch(function(){});
  }

  // Create modal HTML
  var modal = document.createElement('div');
  modal.id = 'bookingOverlay';
  modal.className = 'booking-overlay';
  modal.innerHTML = `
    <div class="booking-modal">
      <button class="booking-close" onclick="closeBooking()">&times;</button>
      <div class="booking-header">
        <h2>📅 Book Your Rental</h2>
        <p>Select a date, choose your boats, and add extras.</p>
      </div>
      <div class="booking-steps-nav">
        <div class="bstep-tab" data-step="1">1. Date</div>
        <div class="bstep-tab" data-step="2">2. Boats & Time</div>
        <div class="bstep-tab" data-step="3">3. Extras</div>
        <div class="bstep-tab" data-step="4">4. Checkout</div>
      </div>
      <div class="booking-body">
        <div class="bstep active" id="bstep1">
          <div class="loc-section-label">📍 Choose Launch Location</div>
          <div id="booking-locations"></div>
          <div style="height:20px;"></div>
          <div class="loc-section-label">📅 Choose Your Date</div>
          <div class="cal-header">
            <button class="cal-nav" onclick="calNav(-1)">‹</button>
            <h3 id="calMonthLabel"></h3>
            <button class="cal-nav" onclick="calNav(1)">›</button>
          </div>
          <div class="cal-grid" id="calGrid"></div>
        </div>
        <div class="bstep" id="bstep2">
          <h4 style="font-size:15px;font-weight:700;margin-bottom:4px;color:#333;">Choose Your Boats</h4>
          <p style="font-size:13px;color:#666;margin-bottom:14px;">Add as many as you like — mix & match.</p>
          <div id="bk-boat-list"></div>
          <h4 style="font-size:15px;font-weight:700;margin-top:20px;margin-bottom:4px;color:#333;">Time Slot</h4>
          <div class="slot-grid">
            <div class="slot-btn" data-slot="am" onclick="selectSlot(this)"><strong>Half Day AM</strong><span>9:00 – 1:00</span><div class="slot-price" id="slotAM">$150</div></div>
            <div class="slot-btn" data-slot="pm" onclick="selectSlot(this)"><strong>Half Day PM</strong><span>2:00 – 6:00</span><div class="slot-price" id="slotPM">$150</div></div>
            <div class="slot-btn" data-slot="all" onclick="selectSlot(this)"><strong>All Day</strong><span>9:00 – 6:00</span><div class="slot-price" id="slotAll">$225</div></div>
          </div>
        </div>
        <div class="bstep" id="bstep3">
          <h4 style="font-size:15px;font-weight:700;margin-bottom:14px;color:#333;">Add Extras & Docks</h4>
          <div id="bk-extras-list"></div>
        </div>
        <div class="bstep" id="bstep4">
          <h4 style="font-size:15px;font-weight:700;margin-bottom:16px;color:#333;">Your Booking Summary</h4>
          <div class="cart-summary" id="cartSummary"></div>
          <h4 style="font-size:15px;font-weight:700;margin-top:24px;margin-bottom:12px;color:#333;">Your Info</h4>
          <div class="b-form-row">
            <div class="b-form-group"><label>Full Name *</label><input type="text" id="book-name" placeholder="John Smith"></div>
            <div class="b-form-group"><label>Phone *</label><input type="tel" id="book-phone" placeholder="(555) 123-4567"></div>
          </div>
          <div class="b-form-group"><label>Email *</label><input type="email" id="book-email" placeholder="john@example.com"></div>
          <div class="b-form-group"><label>Notes (optional)</label><textarea id="book-notes" placeholder="Special requests, group info, etc." style="min-height:60px;resize:vertical;"></textarea></div>
        </div>
      </div>
      <div class="booking-footer">
        <button class="b-btn b-btn-outline" id="prevBtn" onclick="prevStep()" style="display:none;">← Back</button>
        <button class="b-btn b-btn-primary" id="nextBtn" onclick="nextStep()">Next →</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Calendar state
  var _calMonth = new Date();
  var _monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var _dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Render calendar
  function renderCalendar() {
    var grid = document.getElementById('calGrid');
    var monthLabel = document.getElementById('calMonthLabel');
    if (!grid) return;

    monthLabel.textContent = _monthNames[_calMonth.getMonth()] + ' ' + _calMonth.getFullYear();
    grid.innerHTML = '';

    var firstDay = new Date(_calMonth.getFullYear(), _calMonth.getMonth(), 1).getDay();
    var daysInMonth = new Date(_calMonth.getFullYear(), _calMonth.getMonth() + 1, 0).getDate();

    for (var i = 0; i < firstDay; i++) {
      var empty = document.createElement('div');
      empty.className = 'cal-day empty';
      grid.appendChild(empty);
    }

    for (var i = 1; i <= daysInMonth; i++) {
      var day = document.createElement('button');
      var d = new Date(_calMonth.getFullYear(), _calMonth.getMonth(), i);
      var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      day.className = 'cal-day';
      if (d < new Date()) day.classList.add('disabled');
      day.textContent = i;
      day.onclick = function() {
        _bookingState.selectedDate = dateStr;
        goToStep(2);
      };
      grid.appendChild(day);
    }
  }

  // Load booking data from API
  function loadBookingData() {
    var API = 'https://cybercheck-api-database.vercel.app/api/site-data?subdomain=' + _bookingState.slug;
    fetch(API)
      .then(r => r.json())
      .then(data => {
        _bookingState.boats = data.products || [];
        _bookingState.extras = data.addons || [];
        renderBoatOptions();
        renderExtrasOptions();
      })
      .catch(err => console.error('Booking data error:', err));
  }

  function renderBoatOptions() {
    var list = document.getElementById('bk-boat-list');
    list.innerHTML = _bookingState.boats.map((boat, i) => `
      <div class="boat-option" onclick="selectBoat(${i})">
        <div class="boat-option-info">
          <h4>${boat.name || 'Boat'}</h4>
          <p>${boat.description || ''}</p>
        </div>
        <div class="boat-option-price">${boat.price ? '$' + boat.price : 'Call'}</div>
      </div>
    `).join('');
  }

  function renderExtrasOptions() {
    var list = document.getElementById('bk-extras-list');
    list.innerHTML = _bookingState.extras.map((extra, i) => `
      <div class="bk-extra-row" onclick="toggleExtra(${i})">
        <div class="bk-extra-row-info">
          <strong>${extra.name}</strong>
          <span>${extra.description || ''}</span>
        </div>
        <div class="bk-extra-price">${extra.price ? '+$' + extra.price : 'Free'}</div>
      </div>
    `).join('');
  }

  // Step navigation
  function goToStep(n) {
    _bookingState.step = n;
    document.querySelectorAll('.bstep').forEach(s => s.classList.remove('active'));
    document.getElementById('bstep' + n).classList.add('active');
    document.querySelectorAll('.bstep-tab').forEach((t, i) => {
      t.classList.remove('active', 'done');
      if (i + 1 === n) t.classList.add('active');
      else if (i + 1 < n) t.classList.add('done');
    });
    updateButtons();
    _trackFunnel(n);
  }

  function nextStep() {
    if (_bookingState.step < 4) goToStep(_bookingState.step + 1);
    else submitBooking();
  }

  function prevStep() {
    if (_bookingState.step > 1) goToStep(_bookingState.step - 1);
  }

  function updateButtons() {
    var prevBtn = document.getElementById('prevBtn');
    var nextBtn = document.getElementById('nextBtn');
    prevBtn.style.display = _bookingState.step > 1 ? 'block' : 'none';
    nextBtn.textContent = _bookingState.step === 4 ? '✓ Complete Booking' : 'Next →';
  }

  function submitBooking() {
    var name = document.getElementById('book-name').value;
    var phone = document.getElementById('book-phone').value;
    var email = document.getElementById('book-email').value;
    if (!name || !phone || !email) {
      alert('Please fill in all required fields');
      return;
    }
    _trackFunnel(5, 'booking_completed', { date: _bookingState.selectedDate, name: name });
    alert('Booking submitted! We will call you to confirm.\n\nDate: ' + _bookingState.selectedDate + '\nName: ' + name + '\nPhone: ' + phone);
    closeBooking();
  }

  // Global functions
  window.openBooking = function(slug) {
    _bookingState.slug = slug;
    _bookingState.funnelRef = Math.random().toString(36).slice(2) + Date.now().toString(36);
    document.getElementById('bookingOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    renderCalendar();
    loadBookingData();
    goToStep(1);
    _trackFunnel(0, 'booking_opened');
  };

  window.closeBooking = function() {
    document.getElementById('bookingOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
  };

  window.calNav = function(dir) {
    _calMonth.setMonth(_calMonth.getMonth() + dir);
    renderCalendar();
  };

  window.selectBoat = function(i) {
    _bookingState.selectedBoats[i] = !_bookingState.selectedBoats[i];
    document.querySelectorAll('.boat-option')[i].classList.toggle('selected');
  };

  window.toggleExtra = function(i) {
    _bookingState.selectedExtras[i] = !_bookingState.selectedExtras[i];
    document.querySelectorAll('.bk-extra-row')[i].classList.toggle('active');
  };

  window.selectSlot = function(el) {
    document.querySelectorAll('.slot-btn').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');
    _bookingState.selectedSlot = el.dataset.slot;
  };

  window.nextStep = nextStep;
  window.prevStep = prevStep;
  window.goToStep = goToStep;

})();
