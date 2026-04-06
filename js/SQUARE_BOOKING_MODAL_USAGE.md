# Square Booking Modal System

A complete, self-contained booking modal system extracted from Circle Boats. This is a production-ready, modular JavaScript file that can be embedded in any website.

## Files

- **square-booking-modal.js** — Complete booking modal system (68KB, 1,927 lines)

## Features

### Multi-Step Booking Workflow
1. **Step 1: Location & Date** — Choose launch location and rental date
2. **Step 2: Boat & Time Slot** — Select boats and time period (AM/PM/All Day)
3. **Step 3: Extras** — Add docks and optional add-ons
4. **Step 4: Checkout** — Review summary, enter customer info, and pay

### Advanced Capabilities

✓ **Dynamic Availability Tracking** — Real-time boat availability with sold-out indicators  
✓ **Group Pricing** — Automatic group rate (5+ single boats all day)  
✓ **Multiple Payment Methods** — Square Web Payments SDK + Stripe fallback  
✓ **Flexible Payment Modes** — Full payment, deposit, or pay-at-location  
✓ **SMS Consent** — TCPA-compliant SMS booking confirmation opt-in  
✓ **Responsive Design** — Mobile-first, full-screen on phones, modal on desktop  
✓ **Live API Integration** — Loads products, pricing, docks, add-ons from API  
✓ **Session Management** — Booking holds prevent overbooking via session IDs  
✓ **Tax & Fees** — Automatic calculation (10% tax, 1% service fee, 2.9%+$0.30 processing)  
✓ **Confirmation Emails** — Sends booking details + waiver to customer  

## Quick Start

### 1. Load the Script

```html
<script src="js/square-booking-modal.js"></script>
```

The script auto-initializes on page load and injects the modal HTML + CSS.

### 2. Open the Modal

```javascript
// Open with no pre-selection
openBooking();

// Or pre-select a boat type
openBooking('single');
```

### 3. Close the Modal

```javascript
closeBooking();
```

The modal is controlled by:
- Close button (×)
- Clicking overlay (except on checkout step)
- The `closeBooking()` function

## Configuration

Set these **before** loading the script:

```javascript
// Set API base (default: https://cybercheck-api-database.vercel.app)
window.API_BASE = 'https://your-api.com';

// Set subdomain for multi-tenant routing
window.SUBDOMAIN = 'your-business-slug';

// Set payment policy (optional)
window.BOOKING_POLICY = {
  paymentMode: 'full',      // 'full' | 'deposit' | 'at_location'
  depositPct: 25,           // Percentage for deposit mode
  buttonLabel: 'Book Now'   // Custom button text
};

// Load site data (products, docks, add-ons, locations)
// This is typically loaded from your API
window.SITE_DATA = {
  products: [
    { key: 'single', name: 'Single Seater', description: '1 person max', image: 'url' },
    { key: 'double', name: 'Double Seater', description: '2 person max', image: 'url' }
  ],
  locations: [
    { id: 'loc1', name: 'Main Dock', address: '123 Main St' }
  ],
  docks: [
    { id: 'premium', name: 'Premium Dock', halfDay: 25, allDay: 50, capacity: '2 boats' }
  ],
  addons: [
    { id: 'cooler', name: 'Cooler Pack', description: 'Ice + cups', price: 15, icon: '🧊' }
  ]
};
```

## API Endpoints

The modal expects these endpoints from your backend:

### `/api/site-data`
Returns product catalog, pricing, docks, add-ons, and locations.

**Response:**
```json
{
  "products": [...],
  "docks": [...],
  "addons": [...],
  "locations": [...],
  "promotions": { "items": [...] }
}
```

### `/api/public/availability?date=2025-04-15`
Returns available boats for the selected date.

**Response:**
```json
{
  "availability": [
    {
      "fleet_type_name": "Single Seater",
      "time_slot_name": "Half Day AM",
      "available": 5,
      "blocked": false
    }
  ]
}
```

### `/api/public/payment-config`
Returns payment processor configuration.

**Response:**
```json
{
  "processor": "square",
  "squareAppId": "sq_...",
  "squareLocationId": "...",
  "squareMode": "production",
  "stripePublicKey": "pk_live_..."
}
```

### `/api/stripe/publishable-key`
Fallback endpoint for Stripe public key.

**Response:**
```json
{
  "publishableKey": "pk_live_..."
}
```

### `/api/public/bookings` (POST)
Create a booking.

**Request:**
```json
{
  "booking_date": "2025-04-15",
  "location_id": "loc1",
  "location_name": "Main Dock",
  "time_slot_id": null,
  "fleet_type_id": null,
  "qty": 2,
  "boats": [
    { "type": "single", "qty": 1, "price": 150 }
  ],
  "addons": [
    { "name": "Cooler Pack", "price": 15 }
  ],
  "subtotal": 165,
  "tax": 16.50,
  "total": 181.50,
  "amount_paid": 181.50,
  "payment_mode": "full",
  "customer_name": "John Smith",
  "customer_phone": "(555) 123-4567",
  "customer_email": "john@example.com",
  "notes": "Group trip",
  "session_id": "sess_1234567890"
}
```

### `/api/public/hold` (POST/DELETE)
Create and manage booking holds (reservation locks).

## Styling & Customization

### CSS Variables

The modal uses CSS variables for theming. Override these in your page:

```css
:root {
  --teal: #00ada8;           /* Primary accent */
  --teal-dark: #008b84;      /* Hover state */
  --teal-light: #e8f7f5;     /* Light backgrounds */
  --dark: #1a1a1a;           /* Text color */
  --gray: #666666;           /* Secondary text */
  --border: #e5e5e5;         /* Borders */
  --radius: 8px;             /* Border radius */
  --radius-lg: 16px;         /* Large radius */
}
```

### Disable Auto-Init

If you want to manually control initialization:

```html
<script>
  window.DISABLE_AUTO_INIT = true;
</script>
<script src="js/square-booking-modal.js"></script>
<script>
  // Later, when you're ready
  window.squareBookingModal.init();
</script>
```

## Payment Processing

### Square Integration

The modal loads the appropriate Square SDK (sandbox or production) based on `payment-config`:

```javascript
window.squareBookingModal.open();
// → Loads Square Web Payments SDK
// → Renders card form
// → On submit: tokenizes card → sends to backend → backend charges via Square API
```

### Stripe Integration

Falls back to Stripe if Square is not configured:

```javascript
// Backend creates PaymentIntent
// → Client-side confirmCardPayment() for 3D Secure
// → Money to connected account with platform fee
```

### Pay-at-Location

Skip payment entirely if configured:

```javascript
window.BOOKING_POLICY = { paymentMode: 'at_location' };
// → Button changes to "Confirm Booking"
// → No card form shown
// → Booking created with amount_paid: 0
```

## Public API

### Methods

```javascript
openBooking()                          // Open modal
openBooking('single')                  // Open with boat pre-selected
closeBooking()                         // Close modal

window.squareBookingModal.open(slug)
window.squareBookingModal.close()
window.squareBookingModal.nav(dir)     // 1 = next, -1 = back
window.squareBookingModal.calNav(dir)  // Calendar navigation
window.squareBookingModal.selectLocation(el)
window.squareBookingModal.selectSlot(el)
window.squareBookingModal.changeBoatQty(key, delta)
window.squareBookingModal.changeAddonQty(id, name, price, delta)
window.squareBookingModal.resetState() // Clear booking
window.squareBookingModal.init()       // Manual initialization
```

### Events

The modal uses native JavaScript. Monitor state via callbacks:

```javascript
// Listen for booking submission
fetch(api('/bookings'))
  .then(r => r.json())
  .then(data => {
    console.log('Booking created:', data);
  });
```

## State Management

The modal stores booking state in memory:

```javascript
// Access via window (for debugging only)
window.squareBookingModal.booking = {
  date: '2025-04-15',
  location: 'loc1',
  locationName: 'Main Dock',
  boats: { single: 2, double: 1 },
  slot: 'am',
  addons: [
    { id: 'addon-cooler', name: 'Cooler Pack', price: 15, qty: 1 }
  ],
  step: 4,
  sessionId: 'sess_...',
  holdId: 'hold_...',
  totalBoatQty: 3
}
```

## Pricing Calculation

The modal automatically calculates:

1. **Boat charges** — `qty × price_per_boat`
2. **Group rate** — $200/ea for 5+ singles all-day
3. **Add-on charges** — `qty × addon_price`
4. **Subtotal** — boats + add-ons
5. **Tax** — 10% of subtotal
6. **Service fee** — 1% of (subtotal + tax)
7. **Processing fee** — 2.9% + $0.30 of (subtotal + tax + service)
8. **Total** — subtotal + tax + service + processing

### Deposit Mode

If `window.BOOKING_POLICY.paymentMode === 'deposit'`:
- Calculate full total (as above)
- Charge: `total × depositPct`
- Show: "Pay $X.XX Deposit & Book"

### Pay-at-Location Mode

If `window.BOOKING_POLICY.paymentMode === 'at_location'`:
- Don't show payment form
- Create booking with `amount_paid: 0`
- Show: "Confirm Booking"

## Responsive Design

The modal is fully responsive:

- **Desktop** — 720px wide modal, centered on page
- **Tablet (768px)** — Full-width with mobile padding
- **Mobile (480px)** — Full-screen from bottom, overlays navigation

Touch targets (buttons, inputs) are 40-44px minimum height.

## Browser Support

- Chrome, Safari, Firefox, Edge (latest versions)
- iOS 12+, Android 6+
- IE11 not supported (no Promise, template literals)

## Troubleshooting

### Modal doesn't appear
- Check browser console for JS errors
- Verify `#bookingOverlay` is being created
- Check z-index isn't being blocked by other elements

### Payment form doesn't load
- Verify payment-config endpoint is accessible
- Check browser console for CORS errors
- Ensure Stripe.js or Square.js library loads

### Availability shows "Checking availability..."
- Verify `/api/public/availability` endpoint
- Check network tab for API response time
- Increase availability timeout in config if needed

### Bookings not being created
- Verify `/api/public/bookings` endpoint
- Check request/response in network tab
- Log booking payload in browser console

## Implementation Checklist

- [ ] Load `square-booking-modal.js` in HTML
- [ ] Set `window.API_BASE` to your backend URL
- [ ] Set `window.SUBDOMAIN` for multi-tenant routing
- [ ] Implement `/api/site-data` endpoint
- [ ] Implement `/api/public/availability` endpoint
- [ ] Implement `/api/public/payment-config` endpoint
- [ ] Implement `/api/public/bookings` POST endpoint
- [ ] Implement `/api/public/hold` POST/DELETE endpoints
- [ ] Configure Square or Stripe (or both)
- [ ] Test full booking flow on desktop and mobile
- [ ] Set up SMS notifications (Twilio, etc.)
- [ ] Add email confirmations and waivers

## Files Included

```
launching-GCR/js/
├── square-booking-modal.js          (68KB, production-ready)
└── SQUARE_BOOKING_MODAL_USAGE.md    (this file)
```

## License & Attribution

Extracted from Circle Boats booking system. Refactored into modular, self-contained component.

---

**Version:** 1.0  
**Last Updated:** April 2025  
**Status:** Production Ready
