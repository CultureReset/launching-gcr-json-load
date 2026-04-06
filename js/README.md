# Square Booking Modal System

Complete, production-ready booking modal extracted from Circle Boats. Self-contained, modular, zero external dependencies (except Stripe/Square payment SDKs).

## Files

| File | Size | Purpose |
|------|------|---------|
| **square-booking-modal.js** | 68 KB | Main module — all CSS + JS + HTML injection |
| **square-booking-modal-minimal.html** | 1 KB | Simplest possible integration example |
| **square-booking-modal-example.html** | 5 KB | Full-featured example with all options |
| **SQUARE_BOOKING_MODAL_USAGE.md** | 12 KB | Complete API reference & docs |
| **EXTRACTION_SUMMARY.md** | 8 KB | What was extracted and how |

## Quick Start (30 seconds)

### 1. Add Script
```html
<script src="js/square-booking-modal.js"></script>
```

### 2. Configure (optional)
```javascript
window.API_BASE = 'https://your-api.com';
window.SUBDOMAIN = 'your-business';
```

### 3. Open Modal
```javascript
openBooking();
```

That's it! The modal auto-initializes and injects itself into the page.

## Features

✅ **4-Step Booking Flow** — Location → Boats → Extras → Checkout  
✅ **Live Availability** — Real-time inventory from API  
✅ **Group Pricing** — $200/ea for 5+ single boats all-day  
✅ **Payment Methods** — Square, Stripe, or pay-at-location  
✅ **Responsive Design** — Mobile-first, full-screen on phones  
✅ **SMS Consent** — TCPA-compliant booking confirmations  
✅ **Booking Holds** — Session-based overbooking prevention  
✅ **Tax & Fees** — Automatic calculation (10% tax, 1% service, 2.9%+$0.30 processing)  
✅ **Error Recovery** — Graceful fallbacks for API failures  

## Configuration

Set these **before** loading the script:

```javascript
// API base URL (default: https://cybercheck-api-database.vercel.app)
window.API_BASE = 'https://your-api.com';

// Subdomain for multi-tenant routing
window.SUBDOMAIN = 'your-business-slug';

// Payment policy (optional)
window.BOOKING_POLICY = {
  paymentMode: 'full',      // 'full' | 'deposit' | 'at_location'
  depositPct: 25,           // For deposit mode
  buttonLabel: 'Pay & Book' // Custom button text
};

// Site data (optional, will be loaded from API if not set)
window.SITE_DATA = {
  products: [...],
  locations: [...],
  docks: [...],
  addons: [...]
};
```

## API Endpoints

The modal expects these endpoints:

- `GET /api/site-data` — Products, pricing, locations
- `GET /api/public/availability?date=YYYY-MM-DD` — Stock levels
- `GET /api/public/payment-config` — Square/Stripe config
- `POST /api/public/bookings` — Create booking
- `POST/DELETE /api/public/hold` — Inventory holds

See `SQUARE_BOOKING_MODAL_USAGE.md` for full endpoint specs.

## Public API

```javascript
openBooking()                 // Open modal
openBooking('single')         // Pre-select boat type
closeBooking()                // Close modal

// Advanced:
window.squareBookingModal.open(slug)
window.squareBookingModal.close()
window.squareBookingModal.nav(direction)        // 1 = next, -1 = back
window.squareBookingModal.calNav(direction)     // Calendar navigation
window.squareBookingModal.selectLocation(el)
window.squareBookingModal.selectSlot(el)
window.squareBookingModal.changeBoatQty(key, delta)
window.squareBookingModal.changeAddonQty(id, name, price, delta)
window.squareBookingModal.resetState()
window.squareBookingModal.init()                // Manual initialization
```

## Customization

### Colors
Override CSS variables:
```css
:root {
  --teal: #00ada8;
  --teal-dark: #008b84;
  --teal-light: #e8f7f5;
  --dark: #1a1a1a;
  --gray: #666666;
}
```

### Disable Auto-Init
```javascript
window.DISABLE_AUTO_INIT = true;
// Later...
window.squareBookingModal.init();
```

### Custom Success Screen
Hook into `showPaymentSuccess()` or replace the overlay after booking.

## Examples

### Basic Integration
```html
<button onclick="openBooking()">Book Now</button>
<script src="js/square-booking-modal.js"></script>
```

### Pre-Selected Boat
```html
<button onclick="openBooking('double')">Book Double Seater</button>
```

### Deposit Mode
```javascript
window.BOOKING_POLICY = { paymentMode: 'deposit', depositPct: 25 };
```

### Pay at Location
```javascript
window.BOOKING_POLICY = { paymentMode: 'at_location' };
```

## Testing

1. Open `square-booking-modal-minimal.html` in browser
2. Click "Open Booking Modal"
3. Step through 4 booking screens
4. Use test card: `4242 4242 4242 4242` (any future expiry, any CVC)

## Browser Support

- Chrome, Safari, Firefox, Edge (latest)
- iOS 12+, Android 6+
- **Not** IE11 (Promise, template literals required)

## Performance

- **Total Size:** 68 KB (unminified, all CSS + JS)
- **Load Time:** <100ms (auto-init)
- **Dependencies:** Zero (except Stripe.js or Square.js for payments)
- **Mobile:** Full-screen modal, optimized touch targets

## Security

✅ Card data never touches your server  
✅ Stripe/Square handles PCI compliance  
✅ API keys loaded from backend (never in HTML)  
✅ CSRF protection via session IDs  
✅ TCPA-compliant SMS consent checkbox  

## Support

- **Detailed Docs:** See `SQUARE_BOOKING_MODAL_USAGE.md`
- **Examples:** See `square-booking-modal-example.html`
- **Integration:** See `square-booking-modal-minimal.html`
- **Technical:** See `EXTRACTION_SUMMARY.md`

## What's Included

- ✅ All CSS (945 lines) — embedded
- ✅ All JavaScript (982 lines) — embedded
- ✅ HTML structure — auto-injected
- ✅ Payment integration — Stripe + Square
- ✅ Mobile responsive — 320px to 4K
- ✅ Animations — smooth transitions
- ✅ Error handling — graceful fallbacks
- ✅ SMS consent — TCPA-compliant

## What You Need to Build

1. **Backend API** — Booking, availability, payment config endpoints
2. **Email/SMS** — Confirmation notifications (Twilio, SendGrid, etc.)
3. **Database** — Store bookings, holds, customers
4. **Payment Processor** — Stripe or Square account + API keys
5. **Legal** — Privacy policy, terms, waiver forms

## Deployment

1. Copy `square-booking-modal.js` to your site
2. Load it: `<script src="js/square-booking-modal.js"></script>`
3. Implement backend endpoints
4. Configure payment processor
5. Test thoroughly
6. Go live!

## License

Extracted from Circle Boats booking system. Refactored into modular component.

---

**Status:** Production Ready ✅  
**Version:** 1.0  
**Last Updated:** April 2025
