/* ============================================================
   gcr-listings.js — Gulf Coast Radar
   Card rendering for: restaurants, coffee-sweets, shopping
   (things-to-do, nightlife, events, happy-hours handled separately)

   Add <script src="js/gcr-listings.js"></script> to each page.
   Each page needs: <div id="listingsGrid" data-category="X">
   ============================================================ */

/* Signal to app.js that this module handles grid rendering — prevents double-render flash */
window._gcrListingsActive = true;

/* ── Inject styles ── */
(function injectStyles() {
  const s = document.createElement('style');
  s.textContent = `
    .layout { padding-top:0 !important; }
    .results-title { margin-top:14px; }
    .toolbar {
      position:sticky !important;
      top:var(--gcr-header-h, 165px) !important;
      z-index:900 !important;
      border-radius:0 !important;
      margin:0 !important;
      border-left:none !important;
      border-right:none !important;
      box-shadow:0 2px 8px rgba(15,34,51,.08) !important;
    }
    .tag-row, .filter-row, .chips-row {
      position:static;
      background:transparent;
      padding:10px 0;
      margin:0 !important;
    }
    .toolbar-top { display:none !important; }
    .toolbar { padding:6px 12px !important; }
    .list > a, .cards > a, #listingsGrid > a {
      display:block;
      text-decoration:none;
      color:inherit;
      width:100%;
    }
    .gcr-card-hidden { display:none !important; }

    /* ── Card ── */
    .gcr-card {
      background:#fff;border-radius:16px;overflow:hidden;
      box-shadow:0 2px 16px rgba(0,0,0,.1);
      width:100%;max-width:100%;box-sizing:border-box;cursor:pointer;
      transition:transform .14s ease,box-shadow .14s ease;
    }
    .gcr-card:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.15);}
    #listingsGrid,#listingsGrid > *,.list,.list > *{max-width:100%;min-width:0;box-sizing:border-box;}

    /* ── Image — fixed height, never aspect-ratio (prevents huge squares on mobile) ── */
    .gcr-card-img{
      width:100%;
      aspect-ratio:1/1;
      flex-shrink:0;
      background-size:cover;background-position:center;
      background-color:#f0f4f8;position:relative;
      overflow:hidden;
    }
    .gcr-ev-card-img{
      width:100%;aspect-ratio:1/1;flex-shrink:0;
      background-size:cover;background-position:center;
      background-color:#f0f4f8;position:relative;overflow:hidden;
    }
    @media(min-width:600px){
      .gcr-card-img{aspect-ratio:1/1;}
      .gcr-ev-card-img{aspect-ratio:1/1;}
    }
    @media(min-width:900px){
      .gcr-card-img{aspect-ratio:1/1;}
      .gcr-ev-card-img{aspect-ratio:1/1;}
    }
    .gcr-card-badge{
      position:absolute;top:12px;left:12px;
      background:rgba(11,122,117,.88);color:#fff;
      padding:5px 12px;border-radius:999px;font-size:12px;font-weight:700;
    }
    .gcr-status{position:absolute;top:12px;right:12px;padding:5px 12px;border-radius:999px;font-size:12px;font-weight:700;}
    .gcr-status.open{background:rgba(22,163,74,.88);color:#fff;}
    .gcr-status.closing{background:rgba(234,179,8,.88);color:#fff;}
    .gcr-status.opening{background:rgba(59,130,246,.88);color:#fff;}
    .gcr-status.closed{background:rgba(220,38,38,.78);color:#fff;}
    .gcr-status.music{background:rgba(109,40,217,.78);color:#fff;}
    .gcr-img-badges{position:absolute;bottom:12px;left:12px;display:flex;gap:6px;flex-wrap:wrap;}
    .gcr-img-badge{background:rgba(0,0,0,.52);color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;backdrop-filter:blur(4px);}
    .gcr-img-badge.music{background:rgba(109,40,217,.78);}
    .gcr-img-badge.water{background:rgba(14,165,233,.78);}
    .gcr-img-badge.outdoor{background:rgba(22,163,74,.72);}
    .gcr-price-badge{position:absolute;bottom:12px;right:12px;background:rgba(46,155,85,.92);color:#fff;padding:6px 12px;border-radius:999px;font-weight:800;font-size:13px;}

    /* ── Body ── */
    .gcr-card-body{padding:14px 16px 0;}
    .gcr-card-name{font-size:17px;font-weight:800;color:#1a2b3c;word-break:break-word;}
    .gcr-card-sub{font-size:13px;color:#5c6b81;margin-top:2px;}
    .gcr-card-desc{margin-top:8px;font-size:13px;color:#5c6b81;line-height:1.65;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
    .gcr-card-rating{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:14px;font-weight:700;color:#1a2b3c;}
    .gcr-stars{color:#f59e0b;}

    /* ── Tag sections ── */
    .gcr-tag-sections{margin-top:10px;display:flex;flex-direction:column;gap:8px;}
    .gcr-tag-row{display:flex;flex-direction:column;gap:4px;}
    .gcr-tag-row-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#8fa3b1;}
    .gcr-tag-scroll{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;}
    .gcr-tag-scroll::-webkit-scrollbar{display:none;}
    .gcr-chip{background:#f0f4f8;color:#42596c;padding:5px 11px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap;flex-shrink:0;text-decoration:none;}
    .gcr-chip.food{background:#fff7ed;color:#c2410c;}
    .gcr-chip.drink{background:#fdf4ff;color:#7e22ce;}
    .gcr-chip.vibe{background:#f0fdf4;color:#15803d;}
    .gcr-chip.service{background:#f0f9ff;color:#0369a1;}
    a.gcr-chip:hover{filter:brightness(.95);}

    /* ── Info rows ── */
    .gcr-info-rows{padding:8px 16px 0;display:flex;flex-direction:column;gap:5px;}
    .gcr-info-row{font-size:13px;font-weight:600;}
    .gcr-info-row.gcr-hours{color:#42596c;}
    .gcr-info-row.gcr-hh{color:#d97706;}
    .gcr-info-row.gcr-music{color:#7c3aed;}

    /* ── Buttons ── */
    .gcr-card-bottom{padding:10px 16px 14px;}
    .gcr-card-addr{font-size:12px;color:#8fa3b1;margin-bottom:8px;word-break:break-word;}
    .gcr-card-actions{display:flex;flex-wrap:wrap;gap:6px;}
    .gcr-btn{
      padding:8px 13px;border-radius:8px;border:1px solid #d1dbe6;
      background:#fff;color:#1a2b3c;
      font-size:12px;font-weight:700;
      text-decoration:none;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;
      min-height:36px;box-sizing:border-box;
    }
    .gcr-btn:hover{background:#f0f4f8;}
    .gcr-btn.primary{background:#0b7a75;color:#fff;border-color:#0b7a75;}
    .gcr-btn.hh{background:#d97706;color:#fff;border-color:#d97706;}

    /* ── HH panel ── */
    .gcr-hh-panel{display:none;border-top:1px solid #fde68a;background:#fffbeb;padding:14px 16px;}
    .gcr-hh-header{font-weight:800;font-size:14px;color:#92400e;margin-bottom:4px;}
    .gcr-hh-time{font-size:13px;color:#78350f;font-weight:600;margin-bottom:10px;}
    .gcr-hh-desc{font-size:13px;color:#92400e;margin-bottom:12px;line-height:1.5;}

    /* ── Empty state ── */
    .gcr-empty{padding:52px 24px;text-align:center;color:#66788a;}
    .gcr-empty-icon{font-size:54px;margin-bottom:12px;}
    .gcr-empty h3{font-size:22px;font-weight:800;margin:0 0 8px;}
    .gcr-empty p{font-size:15px;line-height:1.6;margin:0;}
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
  // Restaurants — all DB subtypes mapped
  restaurant:'restaurants', restaurants:'restaurants',
  american_restaurant:'restaurants', seafood_restaurant:'restaurants', seafood:'restaurants',
  pizza_restaurant:'restaurants', pizza:'restaurants', pizza_delivery:'restaurants',
  italian_restaurant:'restaurants', mexican_restaurant:'restaurants', mexican:'restaurants',
  chinese_restaurant:'restaurants', japanese_restaurant:'restaurants', sushi_restaurant:'restaurants',
  tex_mex_restaurant:'restaurants', taco_restaurant:'restaurants', barbecue_restaurant:'restaurants',
  hamburger_restaurant:'restaurants', chicken_restaurant:'restaurants', hot_dog_restaurant:'restaurants',
  sandwich_shop:'restaurants', deli:'restaurants', diner:'restaurants',
  brunch_restaurant:'restaurants', breakfast_restaurant:'restaurants', breakfast_spot:'restaurants',
  steak_house:'restaurants', steakhouse:'restaurants',
  bar:'restaurants', bar_grill:'restaurants', bar_and_grill:'restaurants',
  beach_bar:'restaurants', irish_pub:'restaurants', pub:'restaurants',
  hybrid_venue:'restaurants', casual_dining:'restaurants',
  southern:'restaurants', food:'restaurants', dining:'restaurants',
  meal_takeaway:'restaurants', catering:'restaurants',

  // Coffee & Sweets — all DB subtypes mapped
  coffee_shop:'coffee-sweets', coffee_sweets:'coffee-sweets',
  cafe:'coffee-sweets', bakery:'coffee-sweets',
  ice_cream:'coffee-sweets', ice_cream_shop:'coffee-sweets',
  donut_shop:'coffee-sweets', dessert_shop:'coffee-sweets',
  dessert_bar:'coffee-sweets', smoothie:'coffee-sweets',

  // Shopping — all DB subtypes mapped
  boutique:'shopping', souvenir:'shopping', retail:'shopping', shopping:'shopping',
  surf_shop:'shopping', gift_shop:'shopping', clothing:'shopping', clothing_store:'shopping',
  art_gallery:'shopping', gallery_shop:'shopping', shopping_mall:'shopping',
  furniture_store:'shopping', convenience_store:'shopping', food_store:'shopping',
  sporting_goods_store:'shopping', florist:'shopping', grocery_store:'shopping',
  liquor_store:'shopping', retail_liquor_store:'shopping',

  // Things To Do — all DB subtypes mapped
  parasailing:'things-to-do', dolphin_cruise:'things-to-do', dolphin_cruises_tours:'things-to-do',
  snorkeling:'things-to-do', kayak_rental:'things-to-do',
  canoe_kayak_paddleboard:'things-to-do', canoe_kayak_paddleboard_rentals:'things-to-do',
  boat_rental:'things-to-do', boat_rentals:'things-to-do', boat_tours:'things-to-do',
  fishing_charter:'things-to-do', charter_fishing:'things-to-do',
  tour:'things-to-do', attraction:'things-to-do', attractions:'things-to-do',
  jet_ski:'things-to-do', jet_ski_rentals_tours:'things-to-do',
  paddleboard:'things-to-do', watersports:'things-to-do',
  banana_boat_rides:'things-to-do', banana_boat:'things-to-do',
  helicopter_airplane_tours:'things-to-do', sunset_cruises_tours:'things-to-do',
  things_to_do:'things-to-do', rentals:'things-to-do',
  entertainment:'things-to-do', marina:'things-to-do',
  golf_course:'things-to-do', golf_club:'things-to-do',
  amusement_park:'things-to-do', amusement_center:'things-to-do',
  tour_agency:'things-to-do', tour_operator:'things-to-do',
  event_venue:'things-to-do', tourist_attraction:'things-to-do',
  sports_complex:'things-to-do', pier:'things-to-do',

  // Nightlife
  nightlife:'nightlife',
  bar_club:'nightlife', nightclub:'nightlife', sports_bar:'nightlife',
  rooftop_bar:'nightlife', lounge:'nightlife', cocktail_bar:'nightlife',

  // Services — all DB subtypes mapped
  services:'services', service:'services',
  salon:'services', spa:'services', photographer:'services', photography:'services',
  wellness:'services', transportation:'services',
  concierge:'services', chair_rental:'services', grocery_delivery:'services',
  cleaning:'services', lawn_care:'services', pest_control:'services',
  massage:'services', salon_spa:'services', beauty_salon:'services',
  car_wash:'services', laundromat:'services', laundry_service:'services',
  cleaning_services:'services', restoration_services:'services',
  travel_agency:'services', agency:'services',
  real_estate_agency:'services', real_estate:'services', real_estate_agent:'services',
  medical_practice:'services', medical_spa:'services', healthcare:'services',
  financial_services:'services', bank:'services',
  influencer:'services', artist:'services',

  // Hotels / Staying
  hotel:'staying', hotels:'staying', lodging:'staying',
  resort:'staying', resort_hotel:'staying',
  condo:'staying', condominium_complex:'staying', condominium_association:'staying',
  vacation_rental:'staying', vacation_rentals:'staying', vacation_rental_resort:'staying',
  bed_and_breakfast:'staying', rv_park:'staying', campground:'staying',
  apartment_community:'staying',

  // Other
  other:'other',
  boat_launch:'other', parking:'other', parking_lot:'other',
  beach_access:'other', park:'other',
  government:'other', municipal_government:'other', government_services:'other',
  postal_service:'other',
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
  // API sends combined range in open_time e.g. "11:00 AM – 9:00 PM" with close_time null
  if (todayRow.open_time && !todayRow.close_time) {
    const clean = todayRow.open_time.replace(/ | /g, ' ').replace(/–/g, '–').trim();
    return `Today ${clean}`;
  }
  return '';
}

/* ── Tag categorization for card sections ── */
const TAG_CAT = {
  seafood:'food',pizza:'food',bbq:'food',barbecue:'food',mexican:'food',breakfast:'food',
  brunch:'food',burger:'food',burgers:'food',hamburger:'food',steakhouse:'food',southern:'food',
  sushi:'food',italian:'food',desserts:'food',ice_cream:'food',coffee:'food',bakery:'food',
  catering:'food',sandwich:'food',deli:'food',wings:'food',tacos:'food',seafood_restaurant:'food',
  breakfast_spot:'food',bar_grill:'food',bar_and_grill:'food',casual_dining:'food',
  beer:'drink',wine:'drink',cocktails:'drink',full_bar:'drink',craft_beer:'drink',
  happy_hour:'drink',serves_beer:'drink',serves_wine:'drink',serves_cocktails:'drink',bar:'drink',
  waterfront:'vibe',live_music:'vibe',outdoor_seating:'vibe',family_friendly:'vibe',
  good_for_groups:'vibe',pet_friendly:'vibe',waterfront_dining:'vibe',rooftop:'vibe',
  karaoke:'vibe',trivia:'vibe',bingo:'vibe',sports:'vibe',live_entertainment:'vibe',
  dine_in:'service',takeout:'service',delivery:'service',wheelchair_accessible:'service',
  reservations:'service',good_for_children:'service',drive_through:'service',curbside_pickup:'service',
};
const TAG_EMOJI = {
  seafood:'🦀',pizza:'🍕',bbq:'🔥',barbecue:'🔥',mexican:'🌮',breakfast:'🍳',brunch:'🥂',
  burger:'🍔',burgers:'🍔',hamburger:'🍔',steakhouse:'🥩',southern:'🍗',sushi:'🍱',
  italian:'🍝',desserts:'🍰',ice_cream:'🍦',coffee:'☕',bakery:'🥐',wings:'🍗',tacos:'🌮',
  beer:'🍺',wine:'🍷',cocktails:'🍹',full_bar:'🥃',craft_beer:'🍻',happy_hour:'🍺',
  serves_beer:'🍺',serves_wine:'🍷',serves_cocktails:'🍹',bar:'🍸',
  waterfront:'🌊',live_music:'🎸',outdoor_seating:'🌿',family_friendly:'👨‍👩‍👧',
  good_for_groups:'👥',pet_friendly:'🐾',waterfront_dining:'🌊',rooftop:'🏙️',
  karaoke:'🎤',trivia:'🎯',bingo:'🎱',
  dine_in:'🍽️',takeout:'🥡',delivery:'🛵',wheelchair_accessible:'♿',
  reservations:'📅',good_for_children:'👶',bar_grill:'🍺',bar_and_grill:'🍺',
};

/* ── Build one card ── */
function buildCard(entity) {
  const slug    = entity.slug || entity.subdomain || entity.id || '';
  const name    = entity.name || 'Business';
  const icon    = entity.icon || entity.emoji || '📍';
  const sub     = entity.subtitle || entity.tagline || '';
  const subtype = (entity.entity_subtype || entity.type || '').replace(/_/g, ' ');
  const city    = entity.city || '';
  const state   = entity.state || '';
  const fallback = getFallbackImg(entity.entity_subtype || entity.type);
  let hero = (entity.photos && entity.photos[0] && entity.photos[0].image_url) || entity.hero_image_url || entity.cover_url || fallback;
  if (hero && hero.startsWith('//')) hero = 'https:' + hero;
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

  // Normalize tags
  const rawTags = (entity.tags || []).map(t => (typeof t === 'string' ? t : (t.tag || '')).toLowerCase().replace(/[\s\-]+/g, '_')).filter(Boolean);
  const rawSubtype = (entity.entity_subtype || entity.type || '').toLowerCase();
  const subtypeKey = rawSubtype.replace(/-/g,'_');
  const allTagKeys = subtypeKey && !rawTags.includes(subtypeKey) ? [subtypeKey, ...rawTags] : rawTags;

  const statusBadge = computeStatus(entity.hours || [], rawTags);
  const fullAddr    = [addr, city, state].filter(Boolean).join(', ');

  // Categorize tags into sections
  const sections = { food:[], drink:[], vibe:[], service:[] };
  allTagKeys.forEach(tag => {
    const cat = TAG_CAT[tag];
    if (cat && sections[cat] && sections[cat].length < 6) {
      const emoji = TAG_EMOJI[tag] || '';
      const label = tag.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase());
      sections[cat].push(`<span class="gcr-chip ${cat}">${emoji ? emoji+' ':''  }${label}</span>`);
    }
  });
  // Boolean fields → extra chips
  if (entity.waterfront     && !sections.vibe.some(c=>c.includes('Waterfront')))    sections.vibe.push('<span class="gcr-chip vibe">🌊 Waterfront</span>');
  if (entity.live_music      && !sections.vibe.some(c=>c.includes('Live Music')))    sections.vibe.push('<span class="gcr-chip vibe">🎸 Live Music</span>');
  if (entity.outdoor_seating && !sections.vibe.some(c=>c.includes('Outdoor')))      sections.vibe.push('<span class="gcr-chip vibe">🌿 Outdoor Seating</span>');
  if (entity.delivery        && !sections.service.some(c=>c.includes('Delivery')))  sections.service.push('<span class="gcr-chip service">🛵 Delivery</span>');
  if (entity.takeout         && !sections.service.some(c=>c.includes('Takeout')))   sections.service.push('<span class="gcr-chip service">🥡 Takeout</span>');
  if (entity.dine_in         && !sections.service.some(c=>c.includes('Dine')))      sections.service.push('<span class="gcr-chip service">🍽️ Dine-in</span>');
  if (entity.wheelchair_accessible && !sections.service.some(c=>c.includes('Accessible'))) sections.service.push('<span class="gcr-chip service">♿ Accessible</span>');
  if (entity.good_for_children && !sections.service.some(c=>c.includes('Children'))) sections.service.push('<span class="gcr-chip service">👶 Kid Friendly</span>');

  const SECTION_LABELS = { food:'Food', drink:'Drinks', vibe:'Vibe & Amenities', service:'Service' };
  const hasAnySections = Object.values(sections).some(a => a.length > 0);
  const tagSectionsHtml = hasAnySections
    ? `<div class="gcr-tag-sections">${Object.entries(sections).filter(([,chips])=>chips.length>0).map(([cat,chips])=>`
        <div class="gcr-tag-row">
          <div class="gcr-tag-row-label">${SECTION_LABELS[cat]}</div>
          <div class="gcr-tag-scroll">${chips.join('')}</div>
        </div>`).join('')}</div>`
    : (allTagKeys.length ? `<div class="gcr-tag-sections"><div class="gcr-tag-row"><div class="gcr-tag-scroll">${allTagKeys.slice(0,6).map(t=>`<span class="gcr-chip">${tagLabel(t)}</span>`).join('')}</div></div></div>` : '');

  const ratingBlock = rating ? `
    <div class="gcr-card-rating">
      <span class="gcr-stars">${starsHtml(rating)}</span>
      <span>${Number(rating).toFixed(1)}</span>
      ${reviews ? `<span style="color:#8fa3b1">(${reviews})</span>` : ''}
    </div>` : '';

  // Activity detection
  const ACTIVITY_SUBTYPES = new Set([
    'parasailing','boat-rentals','boat_rental','boat_rentals','charter-fishing','fishing_charter',
    'dolphin-cruises-tours','dolphin_cruise','dolphin_cruises_tours','jet-ski-rentals-tours',
    'jet_ski','jet_ski_rentals_tours','canoe-kayak-paddleboard-rentals','canoe_kayak_paddleboard',
    'banana-boat-rides','banana_boat','helicopter-airplane-tours','sunset-cruises-tours',
    'boat-tours','boat_tours','watersports','snorkeling','paddleboard','kayak_rental','fishing-charters'
  ]);
  const isActivity = ACTIVITY_SUBTYPES.has(rawSubtype) || ACTIVITY_SUBTYPES.has(subtypeKey);

  // Buttons
  const profileUrl = isActivity
    ? `activity-profile.html?id=${encodeURIComponent(slug)}`
    : `profile.html?id=${encodeURIComponent(slug)}`;
  const usedUrls = new Set();
  const dedupeBtn = (url, cls, label) => {
    if (!url) return '';
    const key = url.replace(/https?:\/\//,'').replace(/\/$/,'').split('?')[0];
    if (usedUrls.has(key)) return '';
    usedUrls.add(key);
    return `<a href="${url}" target="_blank" rel="noopener" class="gcr-btn ${cls}" onclick="event.stopPropagation()">${label}</a>`;
  };
  const viewBtn    = `<a href="${profileUrl}" class="gcr-btn primary" onclick="event.stopPropagation()">View Profile</a>`;
  const menuBtn    = `<a href="${profileUrl}" class="gcr-btn" onclick="event.stopPropagation()">🍽️ Menu</a>`;
  const callBtn    = phone ? `<a href="tel:${phone.replace(/\D/g,'')}" class="gcr-btn" onclick="event.stopPropagation()">📞 Call</a>` : '';
  const dirBtn     = dedupeBtn(dir, '', '📍 Directions');
  const bookBtn    = dedupeBtn(bookingUrl, '', '📅 Book Now');
  const reserveBtn = dedupeBtn(reservationUrl, '', '🍽️ Reserve');
  const orderBtn   = dedupeBtn(orderUrl, '', '🛵 Order');

  // HH panel
  const hhPanelId = `hh-items-${slug.replace(/[^a-z0-9]/g,'_')}`;
  const hhBtn = hhDays
    ? `<button class="gcr-btn hh" onclick="event.stopPropagation();event.preventDefault();toggleHHItems('${hhPanelId}')">🍺 Happy Hour</button>`
    : '';
  const hhPanel = hhDays ? `
    <div id="${hhPanelId}" class="gcr-hh-panel">
      <div class="gcr-hh-header">🍺 Happy Hour</div>
      <div class="gcr-hh-time">${esc(hhDays)}${hhStart ? ' · '+esc(hhStart) : ''}${hhEnd ? '–'+esc(hhEnd) : ''}</div>
      ${entity.hh_description ? `<div class="gcr-hh-desc">${esc(entity.hh_description)}</div>` : ''}
      <div id="${hhPanelId}-items">Loading items...</div>
    </div>` : '';

  // Activity info
  const pFrom = entity.price_from;
  const pUnit = entity.price_unit || '';
  const activityInfo = isActivity ? [
    entity.duration_text ? `<div style="margin-top:6px;font-size:13px;color:#0b6475;font-weight:700;">⏱ ${esc(entity.duration_text)}</div>` : '',
    entity.capacity_max  ? `<div style="margin-top:4px;font-size:13px;color:#42596c;font-weight:600;">👥 Up to ${entity.capacity_max} people</div>` : '',
    pFrom != null        ? `<div style="margin-top:4px;font-size:13px;color:#2e9b55;font-weight:800;">${pFrom===0||pFrom==='0'?'✓ Free':'From $'+pFrom+(pUnit?'/'+pUnit:'')}</div>` : '',
  ].join('') : '';

  // Live music
  const todayStr2  = new Date().toISOString().split('T')[0];
  const todayName2 = new Date().toLocaleDateString('en-US',{weekday:'long'}).toLowerCase();
  const todayMusic = (window.GCR && GCR.events || []).filter(e => {
    if ((e.entity_slug||e.slug||e.entity_id) !== (slug||entity.id)) return false;
    if (e.event_date !== todayStr2 && !(e.recurring && (e.day_of_week||'').toLowerCase()===todayName2)) return false;
    const t=(e.event_type||'').toLowerCase(), n=(e.event_name||'').toLowerCase();
    return t.includes('live')||t.includes('music')||t.includes('dj')||n.includes('live')||n.includes('dj');
  });
  const hasLiveMusic = rawTags.some(t=>t.includes('live_music')||t.includes('live music')) || entity.live_music || todayMusic.length>0;

  // Info rows
  const hoursInfo = computeHoursLine(entity.hours || []);
  const infoRows = [
    hoursInfo ? `<div class="gcr-info-row gcr-hours">🕐 ${hoursInfo}</div>` : '',
    hhDays    ? `<div class="gcr-info-row gcr-hh">🍺 Happy Hour ${esc(hhDays)}${hhStart?' · '+esc(hhStart):''}${hhEnd?'–'+esc(hhEnd):''}</div>` : '',
    todayMusic.length ? `<div class="gcr-info-row gcr-music">🎸 Live Music Tonight: ${todayMusic.map(e=>e.event_name||'Live Music').join(', ')}</div>`
      : hasLiveMusic ? `<div class="gcr-info-row gcr-music">🎸 Live Music</div>` : '',
  ].filter(Boolean).join('');

  // Image badges
  const imgBadges = [
    hasLiveMusic ? '<span class="gcr-img-badge music">🎸 Live Music</span>' : '',
    (entity.waterfront||rawTags.includes('waterfront')) ? '<span class="gcr-img-badge water">🌊 Waterfront</span>' : '',
    (entity.outdoor_seating||rawTags.includes('outdoor_seating')) ? '<span class="gcr-img-badge outdoor">🌿 Outdoor</span>' : '',
  ].filter(Boolean).join('');

  const priceRange = entity.priceRange || entity.price_range || '';

  if (window.GCRSaves) window.GCRSaves.cacheEntity(entity);
  const saveBtn = window.GCRSaves ? window.GCRSaves.saveBtnHtml(slug) : '';

  return `
    <a href="${profileUrl}"
       style="text-decoration:none;color:inherit;"
       data-slug="${slug}"
       data-tags="${rawTags.join(',').toLowerCase()}"
       data-subtype="${rawSubtype}"
       data-hh="${hhDays ? '1' : '0'}"
       data-live="${hasLiveMusic ? '1' : '0'}">
      <div class="gcr-card">
        <div class="gcr-card-img" style="background-image:url('${hero}')">
          <img src="${hero}" alt="" loading="lazy" style="display:none;position:absolute;width:0;height:0;"
               onerror="var p=this.parentElement;p.style.backgroundImage='url(${fallback})';this.remove();">
          <div class="gcr-card-badge">${icon} ${subtype}</div>
          ${statusBadge}
          ${saveBtn}
          ${imgBadges ? `<div class="gcr-img-badges">${imgBadges}</div>` : ''}
          ${priceRange ? `<div class="gcr-price-badge">${priceRange}</div>` : ''}
        </div>
        <div class="gcr-card-body">
          <div class="gcr-card-name">${esc(name)}</div>
          <div class="gcr-card-sub">${esc([sub, location].filter(Boolean).join(' · '))}</div>
          ${desc ? `<div class="gcr-card-desc">${esc(desc)}</div>` : ''}
          ${ratingBlock}
          ${tagSectionsHtml}
          ${isActivity ? activityInfo : ''}
        </div>
        ${!isActivity && infoRows ? `<div class="gcr-info-rows">${infoRows}</div>` : ''}
        <div class="gcr-card-bottom">
          <div class="gcr-card-addr">${fullAddr||location ? '📍 '+esc(fullAddr||location) : ''}</div>
          <div class="gcr-card-actions">${isActivity ? (bookBtn||viewBtn)+dirBtn+callBtn : viewBtn+menuBtn+hhBtn+bookBtn+reserveBtn+orderBtn+dirBtn+callBtn}</div>
        </div>
        ${hhPanel}
      </div>
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
  const fallback = getFallbackImg(entity.entity_subtype || entity.type);
  let hero = (entity.photos && entity.photos[0] && entity.photos[0].image_url) || entity.hero_image_url || entity.cover_url || fallback;
  if (hero && hero.startsWith('//')) hero = 'https:' + hero;
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

  const subtypeKey2 = (entity.entity_subtype || entity.type || '').toLowerCase().replace(/[\s\-]+/g, '_');
  const tagsWithSubtype = subtypeKey2 && !rawTags.includes(subtypeKey2)
    ? [subtypeKey2, ...rawTags]
    : rawTags;
  const displayTags = tagsWithSubtype.slice(0, 5);
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

  // Happy Hour Items popup — always show on HH page (entity is from /happy-hours endpoint)
  const hhItemsPopupId = `hh-items-${slug.replace(/[^a-z0-9]/g,'_')}`;
  const hhItemsBtn = `<button class="gcr-btn" style="background:#d97706;color:#fff;border-color:#d97706;flex:1;font-size:14px;font-weight:900;padding:12px 16px;" onclick="event.stopPropagation();event.preventDefault();toggleHHItems('${hhItemsPopupId}')">🍺 View Happy Hour Items</button>`;
  const hhItemsPopup = `
    <div id="${hhItemsPopupId}" style="display:none;margin-top:14px;border:1px solid #fde68a;border-radius:14px;background:#fffbeb;padding:18px;max-height:500px;overflow-y:auto;">
      <div style="font-weight:900;font-size:16px;color:#92400e;margin-bottom:12px;">🍺 Happy Hour</div>
      ${hhDays ? `<div style="font-size:13px;color:#78350f;font-weight:600;margin-bottom:14px;">${esc(hhDays)}${hhStart ? ' · '+esc(hhStart) : ''}${hhEnd ? '–'+esc(hhEnd) : ''}</div>` : ''}
      ${hhDesc ? `<div style="margin-bottom:14px;font-size:13px;color:#92400e;line-height:1.5;">${esc(hhDesc)}</div>` : ''}
      <div id="${hhItemsPopupId}-items" style="font-size:13px;color:#78350f;">Loading items...</div>
    </div>`;

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
          <img src="${hero}" alt="" loading="lazy" style="display:none;position:absolute;width:0;height:0;"
               onerror="var p=this.parentElement;p.style.backgroundImage='url(${fallback})';this.remove();">
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
  // Reverse the slug: non-alphanumeric chars were replaced with _ when building the ID
  // Since slugs use hyphens, underscores map back to hyphens
  const slug = popupId.replace('hh-items-', '').replace(/_/g, '-');

  // Fetch happy hour items for this entity
  fetch(`https://cybercheck-api-database.vercel.app/api/gcr/entity/${encodeURIComponent(slug)}`)
    .then(res => res.json())
    .then(data => {
      const hhItems = (data.happy_hour && data.happy_hour.items) || [];
      const entity  = data.entity || {};
      const hhDesc  = entity.hh_description || '';

      if (hhItems.length === 0) {
        itemsContainer.innerHTML = hhDesc
          ? `<div style="color:#92400e;line-height:1.6;">${esc(hhDesc)}</div>`
          : '<div style="color:#92400e;">No items listed yet</div>';
        return;
      }

      // Group by section if sections exist
      const sections = (data.happy_hour && data.happy_hour.sections) || [];
      let html = '';
      if (sections.length) {
        sections.forEach(sec => {
          const secItems = hhItems.filter(i => i.hh_section_id === sec.id);
          if (!secItems.length) return;
          html += `<div style="font-weight:800;color:#92400e;font-size:14px;margin:14px 0 6px;">${esc(sec.section_name)}</div>`;
          html += secItems.map(item => hhItemRow(item)).join('');
        });
        // Items without a section
        const unsectioned = hhItems.filter(i => !i.hh_section_id);
        html += unsectioned.map(item => hhItemRow(item)).join('');
      } else {
        html = hhItems.map(item => hhItemRow(item)).join('');
      }

      itemsContainer.innerHTML = html || '<div style="color:#92400e;">No items listed yet</div>';
    })
    .catch(() => {
      itemsContainer.innerHTML = '<div style="color:#92400e;">Error loading items</div>';
    });
}

function hhItemRow(item) {
  return `
    <div style="border-bottom:1px solid #fcd34d;padding:10px 0;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
      <div style="flex:1;">
        <div style="font-weight:700;color:#78350f;">${esc(item.item_name || '')}</div>
        ${item.description ? `<div style="font-size:12px;color:#92400e;margin-top:3px;line-height:1.4;">${esc(item.description)}</div>` : ''}
      </div>
      ${(item.price_text || item.hh_price) ? `<div style="font-weight:800;color:#d97706;white-space:nowrap;">${esc(item.price_text || item.hh_price)}</div>` : ''}
    </div>`;
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
  const fallback = getFallbackImg(entity.entity_subtype || entity.type);
  let hero = (entity.photos && entity.photos[0] && entity.photos[0].image_url) || entity.hero_image_url || entity.cover_url || fallback;
  if (hero && hero.startsWith('//')) hero = 'https:' + hero;
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
          <img src="${hero}" alt="" loading="lazy" style="display:none;position:absolute;width:0;height:0;"
               onerror="var p=this.parentElement;p.style.backgroundImage='url(${fallback})';this.remove();">
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
  const fallback = getFallbackImg(entity.entity_subtype || entity.type);
  let hero = (entity.photos && entity.photos[0] && entity.photos[0].image_url) || entity.hero_image_url || entity.cover_url || fallback;
  if (hero && hero.startsWith('//')) hero = 'https:' + hero;
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
          <img src="${hero}" alt="" loading="lazy" style="display:none;position:absolute;width:0;height:0;"
               onerror="var p=this.parentElement;p.style.backgroundImage='url(${fallback})';this.remove();">
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
  const SIDEBAR_HEADINGS = ['Popular Nearby', 'Popular Deals'];
  const heading = [...document.querySelectorAll('.panel h3')].find(h => SIDEBAR_HEADINGS.includes(h.textContent.trim()));
  if (!heading) return;
  const panel = heading.closest('.panel');
  if (!panel) return;
  const panelTitle = heading.textContent.trim();

  const top = [...entities]
    .filter(e => (e.photos && e.photos[0]) || e.hero_image_url || e.cover_url)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);

  if (!top.length) return;

  panel.innerHTML = `<h3>${panelTitle}</h3>` + top.map(e => {
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

/* ── Filter entities by tag — pure data, no DOM manipulation ── */
function filterEntities(entities, filter) {
  if (!filter || filter === 'all') return entities;
  const norm = filter.toLowerCase().replace(/-/g, '_');
  const grid = document.getElementById('listingsGrid');
  const category = grid ? grid.dataset.category : '';

  // Day-of-week filter for specials page
  const isDayFilter = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday','daily'].includes(norm);
  if (isDayFilter && category === 'specials') {
    return entities.filter(b => {
      const slug = b.slug || b.id || '';
      const cardSpecials = (window.GCR && GCR.specials || []).filter(s =>
        (s.entity_slug === slug || s.entity_id === b.id) && s.is_active !== false
      );
      return cardSpecials.some(s => {
        let d = s.days || [];
        if (typeof d === 'string') { try { d = JSON.parse(d); } catch(e) { d = [d]; } }
        const days = (Array.isArray(d) ? d : []).map(x => (x||'').toLowerCase());
        if (norm === 'daily') return days.includes('daily') || days.length === 0;
        return days.includes(norm) || days.includes('daily') || days.includes('everyday');
      });
    });
  }

  return entities.filter(b => {
    const tags = (b.tags || []).map(t => (typeof t === 'string' ? t : t.tag || '').toLowerCase().replace(/[\s\-]+/g, '_'));
    const subtype = (b.entity_subtype || b.type || '').toLowerCase();
    if (tags.some(t => t === norm || t.includes(norm))) return true;
    if (subtype.includes(norm)) return true;
    if (norm === 'happy_hour' && b.hh_days) return true;
    if (norm === 'live_music') {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayName = new Date().toLocaleDateString('en-US',{weekday:'long'}).toLowerCase();
      return (window.GCR && GCR.events || []).some(e => {
        const matchEntity = (e.entity_slug||e.slug||e.entity_id) === (b.slug||b.id);
        if (!matchEntity) return false;
        const isToday = e.event_date === todayStr;
        const isRec = e.recurring && (e.day_of_week||'').toLowerCase() === todayName;
        if (!isToday && !isRec) return false;
        return (e.event_type||'').toLowerCase().includes('live') || (e.event_name||'').toLowerCase().includes('live');
      });
    }
    return false;
  });
}

/* ── Re-render grid with filtered entities ── */
function renderWithFilter(filter) {
  const grid = document.getElementById('listingsGrid');
  if (!grid) return;
  const category = grid.dataset.category || '';

  // Get the full entity list for this page
  const base = window._gcrAllEntities || [];
  const filtered = filterEntities(base, filter);

  const cardFn = category === 'happy-hours' ? buildHHCard
               : category === 'specials'    ? buildSpecialsCard
               : category === 'deals'       ? buildHHSpecialsCard
               : buildCard;

  grid.innerHTML = filtered.map(cardFn).join('');

  const meta = document.getElementById('resultCount') || document.querySelector('.toolbar-meta');
  if (meta) meta.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;

  // Restaurants: dedup + enrich after filtering
  if (category === 'restaurants' && typeof processMCRestaurants === 'function') {
    setTimeout(() => processMCRestaurants(filtered), 0);
  }
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
    // Also count entity_subtype so filter chips reflect actual entity types on page
    const sk = (e.entity_subtype || e.type || '').toLowerCase().replace(/[\s\-]+/g, '_');
    if (sk && !tagNorms.includes(sk)) {
      tagCounts[sk] = (tagCounts[sk] || 0) + 1;
    }
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
function wireFilterChips(_grid) {
  const container = document.querySelector('.tag-row, .filter-row, .chips-row');
  if (!container || container._wired) return;
  container._wired = true;
  container.addEventListener('click', e => {
    const btn = e.target.closest('.tag-btn, .filter-chip');
    if (!btn) return;
    document.querySelectorAll('.tag-btn, .filter-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter || 'all';
    renderWithFilter(filter);
    const url = new URL(window.location);
    filter !== 'all' ? url.searchParams.set('tag', filter) : url.searchParams.delete('tag');
    window.history.replaceState({}, '', url);
  });
}

/* ── Explicit duplicate map from CSV — maps any variant name → canonical key ── */
// Keys and values are produced by _dupeKey (lowercase, no punctuation, spaces kept, articles stripped)
const _DUPE_CANONICAL = {
  // DUP-001 Bahama Bob's
  'bahama bobs': 'bahama bobs beach side cafe',
  'bahama bobs beach side cafe': 'bahama bobs beach side cafe',
  // DUP-002 Bleus Burger
  'bleus burger': 'bleus burger',
  'bleus burger restaurant bar': 'bleus burger',
  // DUP-003 Carmelo Italian
  'carmelo': 'carmelo italian',
  'carmelo italian': 'carmelo italian',
  // DUP-004 Coast Restaurant
  'coast restaurant': 'coast restaurant beach club',
  'coast restaurant beach club': 'coast restaurant beach club',
  // DUP-005 Doc's Seafood Shack
  'docs seafood shack oyster bar': 'docs seafood shack oyster bar',
  // DUP-006 Doc's Seafood and Steaks (slug-style card has no address)
  'docs seafood steaks': 'docs seafood steaks',
  'docs seafood steak': 'docs seafood steaks',
  // DUP-007 Flora-Bama (note: _dupeKey strips hyphen but keeps space → "flora bama", not "florabama")
  'flora bama lounge package oyster bar': 'flora bama lounge package oyster bar',
  'flora bama lounge oyster bar': 'flora bama lounge package oyster bar',
  'flora bama oyster bar': 'flora bama lounge package oyster bar',
  'flora bama': 'flora bama lounge package oyster bar',
  // DUP-009 Icehouse Tap Room
  'ice house taproom': 'icehouse tap room gulf shores',
  'icehouse tap room gulf shores': 'icehouse tap room gulf shores',
  'icehouse tap room': 'icehouse tap room gulf shores',
  // DUP-010 LuLu's
  'lulus': 'lulus fun food music',
  'lulus fun food music': 'lulus fun food music',
  'lulus gulf shores': 'lulus fun food music',
  // DUP-011 Marco's Pizza
  'marcos pizza': 'marcos pizza cotton creek drive gulf shores',
  'marcos pizza cotton creek drive gulf shores': 'marcos pizza cotton creek drive gulf shores',
  // DUP-012 Mile Marker 158 (Dockside variant has no address)
  'mile marker 158': 'mile marker 158 dockside',
  'mile marker 158 dockside': 'mile marker 158 dockside',
  // Mikato Japanese
  'mikato japanese restaurant': 'mikato japanese restaurant',
  'mikato japanese steakhouse': 'mikato japanese restaurant',
  // Moe's BBQ
  'moes original bbq': 'moes original bbq orange beach',
  'moes original bbq orange beach': 'moes original bbq orange beach',
  // Avenue Pub / Brick Spoon
  'avenue pub': 'avenue pub orange beach',
  'avenue pub orange beach': 'avenue pub orange beach',
  'brick spoon': 'brick spoon orange beach',
  'brick spoon orange beach': 'brick spoon orange beach',
};

// Normalize name: lowercase, strip punctuation, strip articles, collapse spaces
function _dupeKey(name) {
  return (name || '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(the|a|an|and|at)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ── Merge duplicate entity records (same business, multiple DB rows) into one ── */
function mergeEntityDupes(group) {
  // Pick the record with the best slug (no numeric suffix) as base
  const base = group.reduce((best, b) => {
    const s = b.slug || '';
    const bs = best.slug || '';
    // Prefer slugs without trailing -1 -2 etc, and with more data
    const bScore = (b.hero_image_url ? 4 : 0) + (b.description ? 2 : 0) + (b.phone ? 1 : 0) - (s.match(/-\d+$/) ? 2 : 0);
    const bestScore = (best.hero_image_url ? 4 : 0) + (best.description ? 2 : 0) + (best.phone ? 1 : 0) - (bs.match(/-\d+$/) ? 2 : 0);
    return bScore >= bestScore ? b : best;
  });

  const merged = { ...base };

  // Best image — first non-null photo or hero_image_url across all dupes
  const allPhotos = group.flatMap(b => b.photos || []).filter(p => p && p.image_url);
  const seenUrls = new Set();
  merged.photos = allPhotos.filter(p => { if (seenUrls.has(p.image_url)) return false; seenUrls.add(p.image_url); return true; });
  if (!merged.hero_image_url) {
    const src = group.find(b => b.hero_image_url);
    if (src) merged.hero_image_url = src.hero_image_url;
  }

  // Longest description
  const bestDesc = group.reduce((best, b) => (b.description || '').length > (best.description || '').length ? b : best);
  if (bestDesc.description) merged.description = bestDesc.description;

  // Phone, address, website — first non-null
  if (!merged.phone) { const s = group.find(b => b.phone); if (s) merged.phone = s.phone; }
  if (!merged.address_line_1) { const s = group.find(b => b.address_line_1); if (s) { merged.address_line_1 = s.address_line_1; merged.city = s.city || merged.city; merged.state = s.state || merged.state; } }
  if (!merged.website_url) { const s = group.find(b => b.website_url); if (s) merged.website_url = s.website_url; }
  if (!merged.directions_url) { const s = group.find(b => b.directions_url); if (s) merged.directions_url = s.directions_url; }

  // Happy hour — first non-null hh_days
  if (!merged.hh_days) { const s = group.find(b => b.hh_days); if (s) { merged.hh_days = s.hh_days; merged.hh_start = s.hh_start; merged.hh_end = s.hh_end; merged.hh_description = s.hh_description; } }

  // Rating — highest review count wins
  const bestRating = group.reduce((best, b) => (b.review_count || 0) > (best.review_count || 0) ? b : best);
  if (bestRating.review_count) { merged.rating = bestRating.rating; merged.review_count = bestRating.review_count; }

  // Tags — union of all unique tags across dupes
  const tagSet = new Map();
  group.forEach(b => (b.tags || []).forEach(t => {
    const key = (typeof t === 'string' ? t : t.tag || '').toLowerCase().trim();
    if (key && !tagSet.has(key)) tagSet.set(key, t);
  }));
  merged.tags = [...tagSet.values()];

  // Hours — first non-empty hours array
  if (!(merged.hours || []).length) { const s = group.find(b => (b.hours || []).length); if (s) merged.hours = s.hours; }

  // Booking/reservation/order URLs
  if (!merged.booking_url) { const s = group.find(b => b.booking_url); if (s) merged.booking_url = s.booking_url; }
  if (!merged.reservation_url) { const s = group.find(b => b.reservation_url); if (s) merged.reservation_url = s.reservation_url; }
  if (!merged.order_url) { const s = group.find(b => b.order_url); if (s) merged.order_url = s.order_url; }

  // Subtitle/tagline
  if (!merged.subtitle) { const s = group.find(b => b.subtitle); if (s) merged.subtitle = s.subtitle; }

  // Boolean amenity flags — true wins
  const bools = ['live_music','outdoor_seating','delivery','dine_in','takeout','waterfront','serves_beer','serves_wine','serves_cocktails','good_for_children','good_for_groups','wheelchair_accessible'];
  bools.forEach(f => { if (group.some(b => b[f] === true)) merged[f] = true; });

  return merged;
}

/* ── Get entities for this page's category ── */
function getEntitiesForCategory(businesses, category) {
  const seenSlugs = new Set();

  // Step 1: filter by category first (dedupe slugs, check subtype, completeness)
  const catEntities = businesses.filter(b => {
    const slug = b.slug || b.id || b.site_id;
    if (slug && seenSlugs.has(slug)) return false;
    if (slug) seenSlugs.add(slug);
    if (b.hidden) return false;

    if (category === 'happy-hours') return true;

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
    const secTypes = (b.secondary_types || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const secMatch = secTypes.some(s => s === category || s.replace(/_/g, '-') === category || s.replace(/-/g, '_') === category.replace(/-/g, '_'));
    if (!catMatch && !secMatch) return false;

    const hasTags  = (b.tags || []).length > 0;
    const hasImage = !!(b.hero_image_url || b.cover_url || (b.photos && b.photos.length > 0));
    const hasDesc  = !!(b.description || b.subtitle || b.tagline);
    const hasPhone = !!b.phone;
    return hasTags || hasImage || hasDesc || hasPhone;
  });

  // Step 2: group by normalized name (explicit CSV map first, then core name)
  const nameGroups = new Map();
  const coreKey = name => (name || '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(the|a|an)\b/g, '')
    .replace(/\b(restaurant|bar|grill|cafe|shack|kitchen|house|pub|grille|diner|eatery|lounge|bistro|steakhouse|seafood|pizza|brewing|brewery|company|co|inc|llc|gulf shores|orange beach|alabama|al|beach club|at the)\b/g, '')
    .replace(/\s+/g, '')
    .trim();
  catEntities.forEach(b => {
    const dk = _dupeKey(b.name);
    const mapped = _DUPE_CANONICAL[dk];
    const finalKey = mapped || (coreKey(b.name).length > 3 ? coreKey(b.name) : (b.slug || b.id || dk + Math.random()));
    if (!nameGroups.has(finalKey)) nameGroups.set(finalKey, []);
    nameGroups.get(finalKey).push(b);
  });

  // Step 3: second-pass address dedup — same street address + overlapping name words = same business
  const normAddr = addr => (addr || '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(suite|ste|unit|apt|floor|bldg|building|#)\b/g, '')
    .replace(/\s+/g, ' ').trim();
  const shareWords = (a, b) => {
    const stop = new Set(['the','and','for','with','grill','bar','restaurant','cafe','house','shack','inn','at']);
    const wa = new Set((a||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>3&&!stop.has(w)));
    return (b||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).some(w=>w.length>3&&wa.has(w));
  };
  const addrIndex = new Map(); // addr → nameGroups key
  const mergedKeys = new Set();
  for (const [key, group] of nameGroups) {
    const addr = normAddr(group[0] && (group[0].address_line_1 || group[0].address || ''));
    if (!addr || addr.length < 8) continue;
    if (addrIndex.has(addr)) {
      const existKey = addrIndex.get(addr);
      const existGroup = nameGroups.get(existKey);
      if (existGroup && shareWords(group[0] && group[0].name, existGroup[0] && existGroup[0].name)) {
        existGroup.push(...group);
        mergedKeys.add(key);
      }
    } else {
      addrIndex.set(addr, key);
    }
  }

  return [...nameGroups.entries()]
    .filter(([key]) => !mergedKeys.has(key))
    .map(([, group]) => group.length === 1 ? group[0] : mergeEntityDupes(group));
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
      renderWithFilter(currentFilter);
    }
  }

  function render(businesses) {
    _allEntities = getEntitiesForCategory(businesses, category);
    window._gcrAllEntities = _allEntities;
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

  function getSource(detail) {
    if (category === 'happy-hours') {
      const hh = (detail || window.GCR || {}).happyHours;
      // HH endpoint returns pre-filtered list — use it directly
      return hh && hh.length ? hh : (detail || window.GCR || {}).businesses || [];
    }
    return (detail || window.GCR || {}).businesses || [];
  }

  if (window.GCR && GCR.loaded) {
    render(getSource());
  } else {
    document.addEventListener('gcr:loaded', e => render(getSource(e.detail)));
  }
  // When fresh data arrives (stale-while-revalidate), silently re-render
  document.addEventListener('gcr:refreshed', e => render(getSource(e.detail)));

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
      .gcr-ev-card-img{aspect-ratio:4/3;min-height:180px;max-height:320px;background-size:cover;background-position:center;position:relative}
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
  if (!header) return;
  const h = header.offsetHeight;
  if (h > 0) document.documentElement.style.setProperty('--gcr-header-h', h + 'px');
}

/* ── Boot ── */
setHeaderHeight(); // synchronous — .gcr-header is already in DOM, CSS is applied

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setHeaderHeight();
    initStandardPage();
  });
} else {
  initStandardPage();
}
window.addEventListener('load', setHeaderHeight);
window.addEventListener('resize', setHeaderHeight);
