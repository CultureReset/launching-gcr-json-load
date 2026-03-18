# GCR — Gulf Coast Radar
# Full Build Todo List

---

## 🗄️ DATA LAYER

- [ ] Rewrite `consolidate-master-database.js`
  - Add `categories[]` array per business (multi-page display)
  - Add `tags[]` array matching exact filter chip values per page
  - Add `happyHour` string field (e.g. "Mon–Fri 3–6pm")
  - Parse `hours` array → `{ mon, tue, wed, thu, fri, sat, sun }` object
  - Convert `priceLevel` (1–4) → `price_range` ("$"–"$$$$")
  - Set `kids_friendly` / `outdoor` booleans from description keywords
  - Generate `tagline` from description (first sentence)
  - Wire `generateTags()` into processing pipeline
  - Map Google Places types → correct GCR page categories

- [ ] Output `gcr-specials.json`
  - Fields: `site_id, name, description, discount, active`

- [ ] Output `gcr-events.json`
  - Fields: `title, date, time, venue, category, cover, site_id`
  - Artist fields: `artist, artist_genre, artist_bio, artist_image, artist_website, artist_social`
  - Extra fields: `doors_open, age_restriction, ticket_link`
  - Support recurring events (weekly auto-generate)

- [ ] Run `node consolidate-master-database.js` to regenerate all 3 data files

---

## ⚙️ API LAYER

- [ ] Run `npm install` in `/tools/` (express + cors)

- [ ] Update `gcr-api.js`
  - Change URL from dead Vercel → `http://localhost:3000/api/gcr`
  - Fix `getByCategory()` to check `b.categories?.includes(cat)`
  - Load and expose `gcr-specials.json` as `GCR.specials`
  - Load and expose `gcr-events.json` as `GCR.events`

- [ ] Update `api-server.js`
  - Serve `gcr-master-database.json`, `gcr-specials.json`, `gcr-events.json`
  - All endpoints return correct data

---

## 🧾 BUSINESS PROFILE PAGE (`business.html`)

- [ ] Make tabs fully dynamic based on `categories[]`
  - Menu tab → only if `restaurants` or `coffee-sweets`
  - Happy Hours tab → only if `happy-hours`
  - Pricing tab → only if `things-to-do`
  - Products tab → only if `shopping`
  - Services & Pricing tab → only if `other` or `services`
  - Always show: Overview, Specials, Photos, Reviews, Events

- [ ] Add Happy Hours schedule tab (times per day, drink deals)
- [ ] Add Products tab for shopping businesses
- [ ] Add Services & Pricing tab for other/services businesses

- [ ] Artist info on Events tab
  - Artist name, genre, bio, image, website, social links
  - Door time, age restriction, ticket link, cover charge

- [ ] Replace map placeholder with real Google Maps embed
- [ ] Add share button — "Send to my group" copies/shares profile link
- [ ] Show verified/claimed badge on claimed profiles

---

## 📄 CATEGORY PAGES (all 8)

- [ ] Verify all 8 pages load correct businesses from API
  - restaurants, coffee-sweets, happy-hours, specials, events, things-to-do, shopping, other

- [ ] Verify all filter chips work — tags must exactly match `data-filter` values

- [ ] Add **Open Now** filter chip to all category pages (requires parsed hours)

- [ ] Add **Happy Hour Countdown** on business cards — "Happy hour ends in 2h 14min"

- [ ] Add **Pet Friendly** filter chip (restaurants, things-to-do, hotels)

---

## 🏠 HOMEPAGE (`index3.html`)

- [ ] Wire live counts on all 8 category tiles
  - `countRestaurants`, `countCoffee`, `countHappy`, `countSpecials`
  - `eventsCount`, `countThingsToDo`, `countShopping`, `countOther`

- [ ] Make `index3.html` the default homepage — update all back-links

- [ ] Add **"Live Music Tonight"** section — auto-pulls tonight's performers across all venues

- [ ] Add **Beach Conditions widget** — water temp, wave height, UV index, rip current flag color

- [ ] Add **Tide Chart** — per-day on homepage and events page

---

## 📅 EVENTS

- [ ] Recurring events support — auto-generate weekly (e.g. every Friday night live music)

- [ ] Submit an Event form — venues add their own events free, appear on calendar same day

- [ ] Festival landing pages
  - Shrimp Festival
  - Mullet Toss
  - Hangout Fest
  - Each: full lineup, vendor list, parking info, schedule

---

## 🎵 ARTISTS

- [ ] Build `artists.html` — local musician profiles
  - Bio, photo, genre, upcoming shows across ALL venues
  - Booking contact, social links
  - Links back from every event they're playing

---

## 🗺️ TOURIST TOOLS

- [ ] Build **"What's Happening This Weekend"** page — auto Fri/Sat/Sun events + specials

- [ ] Build **Neighborhood Guide**
  - Orange Beach vs Gulf Shores vs Fort Morgan vs Perdido Key vs Gulf Shores Island
  - Each area: vibe, top spots, parking, beach access

- [ ] Build **First Timer Guide** — "Never been? Start here"
  - Top 10 things to do, top 10 places to eat, what to know before you go

- [ ] Build **Parking Map** — visual map of public lots, beach access, trailer-friendly ramps

- [ ] Build **Boat Launch Directory** — ramps, fees, hours, trailer capacity

---

## 📱 PWA / TECH

- [ ] Implement PWA install — make Install App button fully functional
  - `manifest.json`, service worker, icons

- [ ] Add offline mode — cache listings so site works on beach with bad signal

---

## 💰 REVENUE FEATURES

- [ ] Featured listings — paid spots at top of each category page, Featured badge

- [ ] Claimed listings — verified badge, owner updates hours/photos/menu, responds to reviews

- [ ] Weekly specials email — tourists subscribe, get Sunday email with all specials + events

- [ ] QR code per business — printable QR linking to their GCR profile page

---

## ✅ TESTING

- [ ] Start local server — `node gcr/api-server.js`
- [ ] Test all 8 category pages populate data
- [ ] Test all filter chips on each page
- [ ] Test business profile for each type (restaurant, things-to-do, shopping, other)
- [ ] Test homepage counts update correctly
- [ ] Test events calendar shows correct dates
- [ ] Test search page returns results

---

*Last updated: 2026-03-15*
