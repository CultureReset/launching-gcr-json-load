/* ============================================
   GCR — Gulf Coast Radar
   Business Data (real + sample)
   ============================================ */

const GCR = {

  businesses: [

    /* ── RESTAURANTS ── */
    {
      id: "lunas-eat-drink",
      slug: "lunas-eat-drink",
      name: "Luna's Eat & Drink",
      emoji: "🦞",
      category: "restaurants",
      tags: ["seafood", "southern", "happy-hour", "bar", "waterfront", "live-music", "food-specials"],
      tagline: "Fresh seafood meets soulful, Southern goodness",
      description: "Gulf Coast seafood, Southern comfort classics, 32 craft taps, and daily happy hour 3–5pm. Waterfront dining in Orange Beach.",
      address: "25689 Canal Rd, Suite B · Orange Beach, AL",
      phone: "(251) 980-5862",
      website: "https://lunaseatadrink.com",
      hours: { Mon:"11am–9:30pm", Tue:"11am–9:30pm", Wed:"11am–9:30pm", Thu:"11am–9:30pm", Fri:"11am–10pm", Sat:"11am–10pm", Sun:"11am–9:30pm" },
      happyHour: "Daily 3–5pm",
      priceRange: "$$",
      rating: 4.5,
      reviewCount: 887,
      featured: true,
      location: null,
      links: { menu:"lunas-eat-drink.html", profile:"lunas-eat-drink.html" },
      specials: ["Meat & Three Lunch Specials", "Happy Hour Daily 3–5pm", "Live Music Nightly from 5:30pm"],
      menuHighlights: ["Seafood Gumbo","Crab Claws","Shrimp-n-Grits","Deviled Eggs","Whisker Nuggets","Bronzed Grouper"],
      kidsFriendly: true, petFriendly: false, liveMusic: true, outdoor: true,
      menu: {
        apps: [
          { name:"Seafood Gumbo", desc:"Rich Gulf seafood gumbo", price:"Cup $6 · Bowl $10" },
          { name:"Crab Claws", desc:"Gulf blue crab claws lightly floured and fried", price:"Market" },
          { name:"Crab & Artichoke Dip", desc:"Blue crab & artichoke hearts baked with Swiss and Parmesan. Served with grilled pita", price:"$14" },
          { name:"Creole BBQ Gulf Shrimp", desc:"Gulf shrimp sautéed in herb-scented Worcestershire butter. Shell-on with garlic bread", price:"$17" },
          { name:"Beer Cheese Dip", desc:"Swiss, cheddar & dark beer with soft pretzel bites", price:"$10" },
          { name:"Firecracker Shrimp", desc:"Lightly dusted bay shrimp fried & tossed in spicy remoulade", price:"$14" },
          { name:"Deviled Eggs", desc:"Southern-style with goat cheese & blueberry pepper jelly. With pickles, pork skins & pimento cheese", price:"$10" },
          { name:"Pimento Hushpuppies", desc:"Fried hushpuppies with house-made blueberry pepper jelly", price:"$9" },
          { name:"Tomato Pie", desc:"Vine-ripened tomatoes, sweet onion & fresh basil in a cheese & mayo blend baked in flaky crust", price:"$9" },
          { name:"Whisker Nuggets", desc:"Alabama farm-raised catfish strips, cornmeal dusted & fried. With comeback sauce", price:"$10" }
        ],
        lunch: [
          { name:"Shrimp Po' Boy", desc:"Dressed with lettuce & tomato on toasted French loaf. Served with fries", price:"$14" },
          { name:"Fish Po' Boy", desc:"Dressed with lettuce & tomato on toasted French loaf. Served with fries", price:"$17" },
          { name:"Nashville Hot Chicken Sandwich", desc:"Buttermilk brined, battered & fried, dipped in hot glaze. Lettuce, pickles & garlic Parmesan on bread. With fries", price:"$13" },
          { name:"The Beerger", desc:"Beer-basted burger with Luna's beer mustard, fried onions & beer cheese. With fries", price:"$16" },
          { name:"Shrimp-n-Grits", desc:"Grilled Gulf shrimp over smoked cheddar grits topped with crawfish étouffée. With garlic bread", price:"$16" },
          { name:"Surf-n-Turf", desc:"4 oz tenderloin medallion pan-seared with meunière sauce, mashed potatoes & fried Brussels sprouts", price:"w/Shrimp $25 · w/Crab Mkt" },
          { name:"Mac-n-Cheese", desc:"Cavatappi pasta baked with rich cheese sauce and seasoned breadcrumbs", price:"$12" }
        ],
        dinner: [
          { name:"Fresh Catch", desc:"Grilled, blackened, or fried fish with fried Brussels sprouts & smoked cheddar grits", price:"Market" },
          { name:"Cajun Mahi Mahi", desc:"Blackened mahi over grits & braised collards topped with crawfish étouffée", price:"$27" },
          { name:"Bronzed Grouper", desc:"With house rice & fried Brussels sprouts topped with crab artichoke cream sauce", price:"$32" },
          { name:"Shrimp-n-Grits", desc:"Large Gulf shrimp over smoked cheddar grits with crawfish étouffée", price:"$25" },
          { name:"Buttermilk Fried Chicken", desc:"Buttermilk brined fried chicken over mashed potatoes & braised collards. Served with cornbread", price:"$17" },
          { name:"Delmonico Ribeye (14 oz)", desc:"With mashed potatoes & fried Brussels sprouts", price:"$43" },
          { name:"Filet (8 oz)", desc:"With mashed potatoes & Brussels sprouts", price:"$41" },
          { name:"Jambalaya Mac-n-Cheese", desc:"Shrimp, Conecuh sausage, peppers, celery, onions, tomatoes & Creole spices", price:"$21" }
        ],
        drinks: [
          { name:"Luna's House Blonde", desc:"Blonde / Golden Ale · 5% ABV · Stone Brewing", price:"HH $2.50" },
          { name:"Paradise Light Lager", desc:"American Light · 4% ABV · Urban South Brewery", price:"HH $2.50" },
          { name:"Hoppy By Nature IPA", desc:"American IPA · 6% ABV · Braided River Brewing", price:"HH $5" },
          { name:"32 Craft Beers on Tap", desc:"Full rotating craft tap list — ask your server. Happy Hour 3–5pm daily", price:"$5–$9" },
          { name:"House Wine", desc:"Red or white", price:"HH $3" },
          { name:"Well Liquor", desc:"Well drinks & house cocktails", price:"HH $3.50" }
        ],
        kids: [
          { name:"Kids Shrimp Basket", desc:"Fried Gulf shrimp, fries, and a drink", price:"$9" },
          { name:"Kids Burger", desc:"Burger on a slider bun, with fries and a drink", price:"$8" },
          { name:"Mac & Cheese", desc:"House-made macaroni and cheese with a side of fruit", price:"$7" },
          { name:"Kids Fish & Chips", desc:"Fried flounder strips, fries, and tartar sauce", price:"$9" },
          { name:"Kids Chicken Tenders", desc:"Buttermilk chicken tenders with fries and a drink", price:"$8" }
        ],
        desserts: [
          { name:"Holy Smoke Bread Pudding", desc:"Warm bread pudding with bourbon caramel sauce and whipped cream", price:"$9" },
          { name:"Fried Pecan Pie", desc:"Southern pecan pie, fried & served warm with vanilla ice cream", price:"$8" },
          { name:"Key Lime Pie", desc:"Classic key lime pie, graham cracker crust, whipped cream", price:"$7" }
        ],
        specials: [
          { name:"Happy Hour", desc:"Every day 3–5pm. Draft beer $2.50–$5, house wine $3, well liquor $3.50, apps $5–$8", price:"Daily 3–5pm" },
          { name:"Meat & Three Lunch Specials", desc:"Choice of daily meat + 3 Southern sides. Changes daily. Ask your server", price:"$13" },
          { name:"Live Music", desc:"Covered patio nightly from 5:30pm. Fri & Sat through September", price:"Free" }
        ]
      }
    },
    {
      id: "bahama-bobs",
      slug: "bahama-bobs",
      name: "Bahama Bob's Beachside Bar & Grill",
      emoji: "🍹",
      category: "restaurants",
      tags: ["beach-bar", "burgers", "seafood", "waterfront", "bar", "happy-hour", "food-specials"],
      tagline: "Cold drinks, hot food, feet in the sand",
      description: "Beachfront bar and grill with the coldest drinks and the best burgers on the Gulf Coast.",
      address: "Gulf Shores, AL",
      phone: "(251) 555-0110",
      hours: { Mon:"10am–10pm", Tue:"10am–10pm", Wed:"10am–10pm", Thu:"10am–11pm", Fri:"10am–midnight", Sat:"9am–midnight", Sun:"9am–10pm" },
      happyHour: "Mon–Fri 2–6pm",
      priceRange: "$$",
      rating: 4.4,
      reviewCount: 208,
      featured: false,
      location: null,
      kidsFriendly: true, petFriendly: true, liveMusic: true, outdoor: true
    },
    {
      id: "big-mikes-steakhouse",
      slug: "big-mikes-steakhouse",
      name: "Big Mike's Steakhouse",
      emoji: "🥩",
      category: "restaurants",
      tags: ["steakhouse", "dinner", "upscale"],
      tagline: "Hand-cut steaks, Gulf Coast style",
      description: "Prime aged steaks, fresh Gulf seafood, and an award-winning wine list in a relaxed Gulf Coast setting.",
      address: "Orange Beach, AL",
      priceRange: "$$$",
      rating: 4.6, reviewCount: 189,
      hours: { Mon:"Closed", Tue:"5pm–10pm", Wed:"5pm–10pm", Thu:"5pm–10pm", Fri:"5pm–11pm", Sat:"4pm–11pm", Sun:"4pm–9pm" },
      kidsFriendly: false, petFriendly: false, liveMusic: false, outdoor: false
    },
    {
      id: "anchor-bar-grill",
      slug: "anchor-bar-grill",
      name: "Anchor Bar & Grill",
      emoji: "⚓",
      category: "restaurants",
      tags: ["bar-and-grill", "wings", "sports-bar", "happy-hour", "food-specials"],
      tagline: "Wings, cold beer, live sports",
      description: "Over 50 wing flavors, craft drafts, and every game on 30+ screens.",
      address: "Gulf Shores, AL",
      priceRange: "$$",
      rating: 4.3, reviewCount: 142,
      hours: { Mon:"11am–midnight", Tue:"11am–midnight", Wed:"11am–midnight", Thu:"11am–midnight", Fri:"11am–2am", Sat:"11am–2am", Sun:"11am–midnight" },
      happyHour: "Daily 3–6pm",
      kidsFriendly: true, petFriendly: false, liveMusic: false, outdoor: true
    },
    {
      id: "angry-crab-shack",
      slug: "angry-crab-shack",
      name: "Angry Crab Shack",
      emoji: "🦀",
      category: "restaurants",
      tags: ["seafood", "crab", "boil", "casual"],
      tagline: "Seafood boils done right",
      description: "Cajun-style seafood boils — crab, shrimp, crawfish, lobster. All you can eat options available.",
      address: "Orange Beach, AL",
      priceRange: "$$",
      rating: 4.5, reviewCount: 276,
      specials: ["All You Can Eat Snow Crab", "Daily Boil Specials"],
      kidsFriendly: true, petFriendly: false, liveMusic: false, outdoor: false
    },
    {
      id: "galley-restaurant",
      slug: "galley-restaurant",
      name: "The Galley Restaurant",
      emoji: "🚢",
      category: "restaurants",
      tags: ["seafood", "waterfront", "southern", "lunch", "dinner"],
      tagline: "Waterfront dining since 1986",
      description: "A Gulf Shores institution. Fresh local catch, Southern sides, and a view you won't forget.",
      address: "Gulf Shores, AL",
      priceRange: "$$",
      rating: 4.6, reviewCount: 401,
      hours: { Mon:"11am–9pm", Tue:"11am–9pm", Wed:"11am–9pm", Thu:"11am–9pm", Fri:"11am–10pm", Sat:"11am–10pm", Sun:"11am–9pm" },
      kidsFriendly: true, petFriendly: false, liveMusic: false, outdoor: true
    },

    /* ── COFFEE & SWEETS ── */
    {
      id: "sunrise-coffee-co",
      slug: "sunrise-coffee-co",
      name: "Sunrise Coffee Co.",
      emoji: "☕",
      category: "coffee-sweets",
      tags: ["coffee", "breakfast", "pastries", "wifi"],
      tagline: "Start your morning right",
      description: "Specialty coffee, house-made pastries, and açaí bowls steps from the beach.",
      address: "Gulf Shores, AL",
      priceRange: "$",
      rating: 4.8, reviewCount: 167,
      hours: { Mon:"6am–2pm", Tue:"6am–2pm", Wed:"6am–2pm", Thu:"6am–2pm", Fri:"6am–3pm", Sat:"6am–3pm", Sun:"7am–2pm" },
      kidsFriendly: true, petFriendly: true
    },
    {
      id: "sugar-sands-creamery",
      slug: "sugar-sands-creamery",
      name: "Sugar Sands Creamery",
      emoji: "🍦",
      category: "coffee-sweets",
      tags: ["ice-cream", "dessert", "kids-friendly"],
      tagline: "Handcrafted small-batch ice cream",
      description: "32 rotating flavors of locally-made ice cream, gelato, and sorbet. Waffle cones baked fresh daily.",
      address: "Orange Beach, AL",
      priceRange: "$",
      rating: 4.9, reviewCount: 223,
      hours: { Mon:"Noon–9pm", Tue:"Noon–9pm", Wed:"Noon–9pm", Thu:"Noon–9pm", Fri:"Noon–10pm", Sat:"Noon–10pm", Sun:"Noon–9pm" },
      kidsFriendly: true, petFriendly: true
    },
    {
      id: "gulf-brew",
      slug: "gulf-brew",
      name: "Gulf Brew Coffee House",
      emoji: "🫖",
      category: "coffee-sweets",
      tags: ["coffee", "tea", "bakery", "wifi", "work-friendly"],
      tagline: "Your home away from home on the Gulf",
      description: "Cozy coffee house with craft espresso drinks, loose-leaf tea, and fresh-baked goods.",
      address: "Gulf Shores, AL",
      priceRange: "$",
      rating: 4.6, reviewCount: 98,
      kidsFriendly: true, petFriendly: true
    },

    /* ── THINGS TO DO ── */
    {
      id: "circle-boats",
      slug: "circle-boats",
      name: "Circle Boats Orange Beach",
      emoji: "🚤",
      category: "things-to-do",
      profileType: "activity",
      tags: ["boat-rentals", "water-activities", "self-drive", "family"],
      tagline: "Self-drive fun on the water — no license needed",
      description: "Rent a Circle Boat — no experience, no license needed. Perfect for families, groups, birthday parties, and everyone in between. Explore the back bays and channels at your own pace. Dogs welcome!",
      address: "Orange Beach, AL",
      phone: "(251) 555-0201",
      priceRange: "$$",
      rating: 4.8, reviewCount: 344,
      featured: true,
      hours: { Mon:"9am–6pm", Tue:"9am–6pm", Wed:"9am–6pm", Thu:"9am–6pm", Fri:"9am–6pm", Sat:"9am–6pm", Sun:"9am–6pm" },
      packages: [
        { name:"1-Hour Rental", desc:"Perfect intro to the back bays. Single boat.", price:"$150–$175", perBoat:true, maxGuests:6 },
        { name:"2-Hour Rental", desc:"Explore more of the waterway. Most popular option.", price:"$200–$250", perBoat:true, maxGuests:6 },
        { name:"Half-Day Rental", desc:"4 hours on the water. Great for groups.", price:"$350+", perBoat:true, maxGuests:6 },
        { name:"Group Rate", desc:"Rent 3+ boats at the same time. Birthday parties, corporate groups.", price:"Call for pricing", perBoat:true }
      ],
      addons: [
        { name:"Doggie Dock Add-On", price:"$25–$50" },
        { name:"Cooler & Ice", price:"$25" },
        { name:"Fishing Gear", price:"$50" }
      ],
      included: ["Life jackets provided","Safety orientation","Fuel included","No boating license needed","Maps & route suggestions"],
      kidsFriendly: true, petFriendly: true, bookingRequired: true,
      bookingType: "rental",
      links: { profile:"../circleboats/circle-boats-website/links.html" }
    },
    {
      id: "kraken-reels",
      slug: "kraken-reels",
      name: "Kraken Reels Fishing Charters",
      emoji: "🎣",
      category: "things-to-do",
      profileType: "activity",
      tags: ["fishing", "charter", "deep-sea", "inshore", "family"],
      tagline: "Private charters — near shore to deep sea",
      description: "Private fishing charters for the whole family. Near shore, mid-shore, and full offshore trips. USCG licensed captains. Max 6 guests per trip. All gear included.",
      address: "Orange Beach Marina, AL",
      phone: "(251) 555-0202",
      priceRange: "$$$",
      rating: 4.9, reviewCount: 187,
      hours: { Mon:"5am–7pm", Tue:"5am–7pm", Wed:"5am–7pm", Thu:"5am–7pm", Fri:"5am–7pm", Sat:"5am–7pm", Sun:"5am–7pm" },
      packages: [
        { name:"Near Shore (4 Hours)", desc:"Calm waters close in. Target vermillion snapper, triggerfish, red grouper, Spanish & king mackerel. Perfect for families and beginners.", price:"$1,000/boat", maxGuests:6, note:"Price is per boat, not per person" },
        { name:"Mid Shore (6 Hours)", desc:"8–15 miles offshore. Target red snapper, grouper, amberjack, king mackerel, and blackfin tuna. The sweet spot trip.", price:"$1,350/boat", maxGuests:6, note:"Price is per boat, not per person" },
        { name:"Full Offshore (8 Hours)", desc:"40+ miles out. Target wahoo, tuna, red snapper, amberjack, and sharks. The full deep sea experience.", price:"$1,800/boat", maxGuests:6, note:"Price is per boat, not per person" },
        { name:"Sunset & Custom Trips", desc:"Special occasions, proposals, corporate charters. Call to arrange.", price:"Call for pricing", maxGuests:6 }
      ],
      included: ["All fishing gear & tackle","Ice & fish coolers","Fish cleaning at the dock","Life jackets & safety equipment","USCG licensed captain & mate","A/C cabin on larger vessels","Starlink WiFi (offshore trips)"],
      kidsFriendly: true, petFriendly: false, bookingRequired: true,
      bookingType: "charter",
      links: { profile:"../kraken-reels/links.html" }
    },
    {
      id: "tee-off-at-the-wharf",
      slug: "tee-off-at-the-wharf",
      name: "Tee Off at The Wharf",
      emoji: "⛳",
      category: "things-to-do",
      profileType: "activity",
      bookingType: "reservation",
      tags: ["golf", "sports-bar", "simulator", "entertainment", "dining", "the-wharf"],
      tagline: "Golf simulators, sports games & a killer bar",
      description: "Topgolf Swing Suites, sports simulators, dining and a full sports bar at The Wharf in Orange Beach.",
      address: "4619 Main Street Suite A102, Orange Beach, AL 36561",
      phone: "(251) 228-4899",
      website: "https://www.teeoffatthewharf.com",
      priceRange: "$$",
      rating: 4.6, reviewCount: 211,
      featured: true,
      location: "the-wharf",
      hours: { Mon:"2pm–10pm", Tue:"2pm–10pm", Wed:"2pm–10pm", Thu:"2pm–10pm", Fri:"Noon–midnight", Sat:"Noon–midnight", Sun:"Noon–10pm" },
      kidsFriendly: true, petFriendly: false
    },
    {
      id: "alabama-gulf-coast-zoo",
      slug: "alabama-gulf-coast-zoo",
      name: "Alabama Gulf Coast Zoo",
      emoji: "🦁",
      category: "things-to-do",
      profileType: "activity",
      bookingType: "tickets",
      tags: ["zoo", "family", "animals", "kids"],
      tagline: "The Little Zoo That Could",
      description: "Home to over 500 animals. Hands-on animal encounters, exotic species, and family-friendly attractions.",
      address: "Gulf Shores, AL",
      priceRange: "$$",
      rating: 4.5, reviewCount: 632,
      pricing: { adult: "$19", child: "$14", senior: "$16" },
      hours: { Mon:"9am–4pm", Tue:"9am–4pm", Wed:"9am–4pm", Thu:"9am–4pm", Fri:"9am–4pm", Sat:"9am–5pm", Sun:"9am–5pm" },
      kidsFriendly: true, petFriendly: false
    },
    {
      id: "amberjack-ebike-rentals",
      slug: "amberjack-ebike-rentals",
      name: "Amberjack E-Bike Rentals",
      emoji: "🚴",
      category: "things-to-do",
      profileType: "activity",
      bookingType: "rental",
      tags: ["bikes", "e-bikes", "beach", "rentals", "outdoor"],
      tagline: "Explore the coast on two wheels",
      description: "Electric bike rentals by the hour or day. Cruise the beach trail, Gulf State Park, and everything in between.",
      address: "Gulf Shores, AL",
      priceRange: "$",
      rating: 4.7, reviewCount: 89,
      pricing: { hourly: "$25/hr", halfDay: "$60", fullDay: "$90" },
      kidsFriendly: true, petFriendly: false
    },

    /* ── VENUES / COMPLEXES (page within a page) ── */
    {
      id: "the-wharf",
      slug: "the-wharf",
      name: "The Wharf — Orange Beach",
      emoji: "⚓",
      category: "things-to-do",
      profileType: "venue",
      tags: ["entertainment", "waterfront", "dining", "shopping", "concerts", "marina", "family", "the-wharf"],
      tagline: "Orange Beach's waterfront entertainment complex",
      description: "The Wharf is Orange Beach's premier waterfront destination — 20+ restaurants and bars, 20+ boutique shops, a 10,000-seat amphitheater, golf simulators, a full-service marina, boat tours, and more. All in one place on the Intracoastal Waterway.",
      address: "4750 Main Street, Orange Beach, AL 36561",
      phone: "(251) 224-1000",
      website: "https://alwharf.com",
      priceRange: "Free to visit",
      rating: 4.7, reviewCount: 3200,
      featured: true,
      hours: { Mon:"Open daily", Tue:"Open daily", Wed:"Open daily", Thu:"Open daily", Fri:"Open daily", Sat:"Open daily", Sun:"Open daily" },
      venueSubTag: "the-wharf",   // used to pull sub-businesses
      highlights: ["10,000-seat Amphitheater","Full-Service Marina","Free Parking","20+ Dining Options","Boat & Dolphin Tours","Live Entertainment Year-Round"],
      kidsFriendly: true, petFriendly: true
    },
    {
      id: "owa",
      slug: "owa",
      name: "OWA — Parks & Resort",
      emoji: "🎢",
      category: "things-to-do",
      profileType: "venue",
      tags: ["theme-park", "entertainment", "dining", "shopping", "family", "rides", "owa"],
      tagline: "Theme parks, dining & entertainment — minutes from the beach",
      description: "OWA is a world-class entertainment destination in Foley, AL. Tropic Falls theme park, indoor/outdoor rides, 15+ restaurants, shopping, and live entertainment — all in one sprawling complex just minutes from the Gulf.",
      address: "101 OWA Blvd, Foley, AL 36535",
      phone: "(251) 923-2692",
      website: "https://visitowa.com",
      priceRange: "$$",
      rating: 4.5, reviewCount: 1840,
      featured: false,
      hours: { Mon:"11am–9pm", Tue:"11am–9pm", Wed:"11am–9pm", Thu:"11am–9pm", Fri:"11am–10pm", Sat:"10am–10pm", Sun:"Noon–9pm" },
      venueSubTag: "owa",
      packages: [
        { name:"Tropic Falls (Indoor)", desc:"Indoor waterpark with rides, slides, and wave pool.", price:"$39.99/adult · $29.99/child", note:"Ages 2 & under free" },
        { name:"OWA Rides (Outdoor)", desc:"Traditional amusement rides for all ages. Roller coasters, family rides, and kiddie rides.", price:"$34.99/adult · $24.99/child" },
        { name:"Combo Pass", desc:"Indoor + outdoor access. Best value for a full day.", price:"$59.99/adult · $44.99/child" },
        { name:"Season Pass", desc:"Unlimited visits all season long.", price:"$99/person" }
      ],
      highlights: ["Tropic Falls Indoor Waterpark","Outdoor Amusement Rides","15+ Restaurants & Food","Live Entertainment","Free Parking","Minutes from the Beach"],
      kidsFriendly: true, petFriendly: false
    },

    /* ── EVENTS / LIVE MUSIC ── */
    {
      id: "tim-roberts",
      slug: "tim-roberts",
      name: "Tim Roberts",
      emoji: "🎸",
      category: "events",
      profileType: "musician",
      bookingType: "inquiry",
      tags: ["live-music", "country", "beach-music", "musician"],
      tagline: "Gulf Coast's favorite live act",
      description: "Award-winning singer-songwriter performing Gulf Coast originals, country, and rock. Regular venues across Orange Beach & Gulf Shores.",
      address: "Orange Beach, AL — multiple venues",
      rating: 4.9, reviewCount: 504,
      featured: true,
      upcomingShows: [
        { date: "2026-03-08", venue: "Luna's Eat & Drink", time: "7pm", cover: "No cover" },
        { date: "2026-03-14", venue: "Bahama Bob's", time: "6pm", cover: "No cover" },
        { date: "2026-03-21", venue: "Flora-Bama", time: "8pm", cover: "$5" }
      ]
    },
    {
      id: "wharf-amphitheater",
      slug: "wharf-amphitheater",
      name: "The Wharf Amphitheater",
      emoji: "🎤",
      category: "events",
      tags: ["concert-venue", "events", "outdoor", "the-wharf"],
      tagline: "Outdoor waterfront concert venue",
      description: "10,000 capacity outdoor amphitheater at The Wharf Marina. National touring acts all season long.",
      address: "4750 Main Street, Orange Beach, AL",
      location: "the-wharf",
      rating: 4.7, reviewCount: 1240,
      upcomingShows: [
        { date: "2026-03-15", artist: "Marcus King Band", time: "8pm", tickets: "$45–$85" },
        { date: "2026-03-22", artist: "Chase Rice", time: "7:30pm", tickets: "$35–$65" }
      ]
    },

    /* ── SHOPPING ── */
    {
      id: "souvenir-city",
      slug: "souvenir-city",
      name: "Souvenir City",
      emoji: "🛍️",
      category: "shopping",
      tags: ["souvenirs", "gifts", "beach-gear", "apparel"],
      tagline: "The Gulf Coast's biggest gift shop",
      description: "Shirts, hats, jewelry, home decor, beach gear, and everything Gulf Coast under one roof.",
      address: "Gulf Shores, AL",
      priceRange: "$$",
      rating: 4.3, reviewCount: 178
    },
    {
      id: "the-wharf-shops",
      slug: "the-wharf-shops",
      name: "The Wharf Shops & Boutiques",
      emoji: "🏪",
      category: "shopping",
      tags: ["boutique", "clothing", "gifts", "the-wharf"],
      tagline: "Waterfront shopping at The Wharf",
      description: "20+ shops and boutiques along the waterfront marina at The Wharf. Clothing, gifts, art, and specialty stores.",
      address: "4750 Main Street, Orange Beach, AL",
      location: "the-wharf",
      priceRange: "$$",
      rating: 4.4, reviewCount: 223
    },

    /* ── HAPPY HOURS ── */
    // (Businesses above with happyHour field show here too via filter)

    /* ── SERVICES (photographers, weddings, transportation, health) ── */
    {
      id: "gulf-coast-photography",
      slug: "gulf-coast-photography",
      name: "Gulf Coast Photography",
      emoji: "📸",
      category: "services",
      profileType: "service",
      tags: ["photography", "beach-photos", "family", "portraits", "weddings", "services"],
      tagline: "Golden-hour portraits on the Gulf",
      description: "Professional beach photography sessions for families, couples, engagements, and weddings. Golden hour and sunrise slots available. All sessions include edited digital gallery.",
      address: "Orange Beach, AL — On-location",
      phone: "(251) 555-0301",
      priceRange: "$$",
      rating: 4.9, reviewCount: 312,
      featured: true,
      bookingRequired: true,
      bookingType: "inquiry",
      packages: [
        { name:"Mini Session (30 min)", desc:"Up to 5 people, 20 edited photos. Perfect for quick family portraits.", price:"$175" },
        { name:"Standard Session (1 hr)", desc:"Up to 8 people, 40+ edited photos. Great for larger families.", price:"$275" },
        { name:"Sunset Couple Session", desc:"1-hour golden hour session for couples. 40+ edited photos. Engagement-friendly.", price:"$225" },
        { name:"Wedding Day Coverage", desc:"Full wedding day coverage, 8 hours, 500+ edited photos, online gallery.", price:"Call for pricing" }
      ],
      included: ["On-location beach session","Fully edited digital gallery","Private online download link","Print-ready high-res files","Sneak peek within 48 hours"],
      hours: { Mon:"By appt", Tue:"By appt", Wed:"By appt", Thu:"By appt", Fri:"By appt", Sat:"By appt", Sun:"By appt" }
    },
    {
      id: "shoreline-shoots",
      slug: "shoreline-shoots",
      name: "Shoreline Shoots",
      emoji: "🌅",
      category: "services",
      profileType: "service",
      tags: ["photography", "beach-photos", "drone", "aerial", "portraits", "services"],
      tagline: "Aerial & beach photography that tells your story",
      description: "Beach portraits, aerial drone photography, and vacation memories captured by a local Gulf Coast photographer. Specializing in sunrise sessions and drone footage.",
      address: "Gulf Shores, AL — On-location",
      phone: "(251) 555-0302",
      priceRange: "$$",
      rating: 4.8, reviewCount: 187,
      featured: false,
      bookingRequired: true,
      bookingType: "inquiry",
      packages: [
        { name:"Sunrise Beach Session (45 min)", desc:"Best light of the day. Up to 6 people, 30 edited photos.", price:"$195" },
        { name:"Drone Aerial Add-On", desc:"FAA-licensed drone footage of your session location. 5 edited aerial shots.", price:"+$95" },
        { name:"Vacation Day Package", desc:"2-hour session anywhere on the coast. 60+ edited photos.", price:"$350" }
      ],
      included: ["On-location session","30–60+ edited digital photos","Private download gallery","48-hr turnaround on sneak peeks"],
      hours: { Mon:"By appt", Tue:"By appt", Wed:"By appt", Thu:"By appt", Fri:"By appt", Sat:"By appt", Sun:"By appt" }
    },
    {
      id: "coast-to-coast-weddings",
      slug: "coast-to-coast-weddings",
      name: "Coast to Coast Weddings",
      emoji: "💍",
      category: "services",
      profileType: "service",
      tags: ["weddings", "planning", "coordination", "services"],
      tagline: "Gulf Coast beach weddings, beautifully done",
      description: "Full-service wedding planning and day-of coordination for Gulf Coast beach weddings. From intimate elopements to large receptions.",
      address: "Orange Beach, AL",
      phone: "(251) 555-0303",
      priceRange: "$$$",
      rating: 5.0, reviewCount: 84,
      featured: false,
      bookingRequired: true,
      bookingType: "inquiry",
      packages: [
        { name:"Elopement Package", desc:"Intimate ceremony for 2–10 guests. Officiant, florals, photography, and coordination.", price:"From $1,200" },
        { name:"Day-Of Coordination", desc:"You plan it, we execute it. Full day-of coordination from setup to send-off.", price:"From $1,800" },
        { name:"Full-Service Planning", desc:"We handle everything — venue, vendors, timeline, florals, and more.", price:"Call for pricing" }
      ],
      included: ["Initial consultation","Vendor coordination","Day-of timeline management","Emergency kit on site"],
      hours: { Mon:"By appt", Tue:"By appt", Wed:"By appt", Thu:"By appt", Fri:"By appt", Sat:"By appt", Sun:"By appt" }
    },
    {
      id: "gulf-ride-transportation",
      slug: "gulf-ride-transportation",
      name: "Gulf Ride Transportation",
      emoji: "🚐",
      category: "services",
      profileType: "service",
      tags: ["transportation", "shuttle", "airport", "group-transport", "services"],
      tagline: "Airport shuttles & private group transport",
      description: "Private airport transfers, group shuttles, and custom transportation for events, tours, and night-out groups across the Gulf Coast.",
      address: "Orange Beach, AL",
      phone: "(251) 555-0304",
      priceRange: "$$",
      rating: 4.7, reviewCount: 143,
      featured: false,
      bookingRequired: true,
      bookingType: "reservation",
      packages: [
        { name:"Airport Transfer", desc:"One-way from Pensacola or Mobile airport. Up to 4 passengers, luggage included.", price:"From $75" },
        { name:"Group Shuttle", desc:"Up to 14 passengers. Perfect for bachelor/bachelorette, reunions, and events.", price:"From $150" },
        { name:"Night-Out Package", desc:"3-hour evening transport around Orange Beach & Gulf Shores. Round trip.", price:"From $200" }
      ],
      hours: { Mon:"24/7", Tue:"24/7", Wed:"24/7", Thu:"24/7", Fri:"24/7", Sat:"24/7", Sun:"24/7" }
    },
    {
      id: "sand-dollar-massage",
      slug: "sand-dollar-massage",
      name: "Sand Dollar Massage & Wellness",
      emoji: "💆",
      category: "services",
      profileType: "service",
      tags: ["massage", "wellness", "spa", "beach-massage", "services"],
      tagline: "Beachside massage & wellness treatments",
      description: "Mobile massage and in-studio wellness treatments. Beach massages, couples packages, deep tissue, and hot stone therapy.",
      address: "Gulf Shores, AL",
      phone: "(251) 555-0305",
      priceRange: "$$",
      rating: 4.9, reviewCount: 221,
      featured: false,
      bookingRequired: true,
      bookingType: "reservation",
      packages: [
        { name:"60-Min Swedish Massage", desc:"Relaxing full-body massage. In-studio or mobile beach setup.", price:"$90" },
        { name:"90-Min Deep Tissue", desc:"Full-body deep tissue therapy. Perfect for post-vacation soreness.", price:"$130" },
        { name:"Couples Beach Massage", desc:"Side-by-side massage on the beach at sunrise or sunset.", price:"$220/couple" }
      ],
      included: ["Aromatherapy oils","Hot towel service","Post-session hydration"],
      hours: { Mon:"9am–7pm", Tue:"9am–7pm", Wed:"9am–7pm", Thu:"9am–7pm", Fri:"9am–8pm", Sat:"8am–8pm", Sun:"9am–6pm" }
    },

    /* ── OTHER / PUBLIC AMENITIES + SERVICES ── */
    {
      id: "gulf-state-park-beach-access",
      slug: "gulf-state-park-beach-access",
      name: "Gulf State Park — Beach Access",
      emoji: "🏖️",
      category: "other",
      profileType: "amenity",
      tags: ["public-beach", "beach-access", "free", "family", "outdoor", "park"],
      tagline: "2.5 miles of pristine public beach",
      description: "One of the best stretches of public beach on the Gulf Coast. Free beach access, pavilions, restrooms, and lifeguards in season. Great for families.",
      address: "Gulf Shores, AL 36542",
      priceRange: "Free",
      rating: 4.8, reviewCount: 2100,
      hours: { Mon:"Sunrise–Sunset", Tue:"Sunrise–Sunset", Wed:"Sunrise–Sunset", Thu:"Sunrise–Sunset", Fri:"Sunrise–Sunset", Sat:"Sunrise–Sunset", Sun:"Sunrise–Sunset" },
      packages: [
        { name:"Beach Access", desc:"Public beach access — free entry. Parking fee applies.", price:"Free" },
        { name:"Parking", desc:"Daily parking pass required", price:"$5/day" },
        { name:"Annual Pass", desc:"Unlimited access all year", price:"$45/year" }
      ],
      included: ["Restrooms & showers","Pavilion access","Lifeguards (in season)","Picnic areas","Free WiFi at pavilion"],
      kidsFriendly: true, petFriendly: false
    },
    {
      id: "perdido-pass-boat-launch",
      slug: "perdido-pass-boat-launch",
      name: "Perdido Pass Public Boat Launch",
      emoji: "⛵",
      category: "other",
      profileType: "amenity",
      tags: ["boat-launch", "public", "free", "fishing", "outdoor"],
      tagline: "Free public boat launch at Perdido Pass",
      description: "Free public boat ramp at Perdido Pass — access to both the Gulf and back bay. Popular with anglers and boaters. Parking available.",
      address: "Perdido Pass, Orange Beach, AL",
      priceRange: "Free",
      rating: 4.3, reviewCount: 89,
      hours: { Mon:"24/7", Tue:"24/7", Wed:"24/7", Thu:"24/7", Fri:"24/7", Sat:"24/7", Sun:"24/7" },
      included: ["Free ramp use","Parking area","Direct Gulf & bay access"],
      kidsFriendly: true, petFriendly: true
    },
    {
      id: "cotton-bayou-beach-access",
      slug: "cotton-bayou-beach-access",
      name: "Cotton Bayou Beach Access",
      emoji: "🏝️",
      category: "other",
      profileType: "amenity",
      tags: ["public-beach", "beach-access", "free", "family"],
      tagline: "Quiet public beach — locals' favorite",
      description: "A local favorite — less crowded public beach access point in Orange Beach. Perfect for a peaceful morning or afternoon on the water.",
      address: "Orange Beach, AL",
      priceRange: "Free",
      rating: 4.6, reviewCount: 143,
      kidsFriendly: true, petFriendly: true
    },
    {
      id: "gulf-coast-photography",
      slug: "gulf-coast-photography",
      name: "Gulf Coast Photography by Sarah",
      emoji: "📸",
      category: "other",
      profileType: "photographer",
      bookingType: "session",
      tags: ["photography", "family-photos", "beach-portraits", "weddings"],
      tagline: "Memories made on the Gulf Coast",
      description: "Professional beach photography — family portraits, proposals, weddings, and vacation memories. Natural light sessions at sunrise and golden hour.",
      address: "Orange Beach & Gulf Shores, AL",
      priceRange: "$$",
      rating: 5.0, reviewCount: 143,
      pricing: { session30: "$175", session60: "$275", fullDay: "$750" }
    }
  ],

  /* ══════════════════════════════════════════
     EVENTS
     Fields:
       id         — unique number
       date       — "YYYY-MM-DD"
       endDate    — "YYYY-MM-DD" optional (multi-day events)
       title      — display name
       emoji      — icon for the event
       venue      — venue display name
       bizId      — matches a business slug (links to business page)
       category   — "live-music" | "concert" | "festival" | "dining"
                    | "sports" | "holiday" | "bar-event" | "family"
                    | "outdoor" | "special"
       time       — display string e.g. "7pm" or "10am–2pm"
       cover      — price or "Free"
       description — optional short description
       tickets    — URL to buy tickets (optional)
       recurring  — "weekly" | "monthly" | null
       loyaltyPoints — bonus loyalty points for attending (optional)
     ══════════════════════════════════════════ */
  events: [
    {
      id: 1, date: "2026-03-08",
      title: "Tim Roberts Live", emoji: "🎸",
      venue: "Luna's Eat & Drink", bizId: "lunas-eat-drink",
      category: "live-music", time: "7pm", cover: "Free",
      description: "Gulf Coast's favorite live act plays the patio at Luna's. No cover, full bar open.",
      recurring: "weekly"
    },
    {
      id: 2, date: "2026-03-09",
      title: "Sunday Brunch on the Dock", emoji: "🍳",
      venue: "The Galley Restaurant", bizId: "galley-restaurant",
      category: "dining", time: "10am–2pm", cover: "Free",
      description: "Full brunch menu with bottomless mimosas on the waterfront."
    },
    {
      id: 3, date: "2026-03-14",
      title: "St. Patrick's Day Bar Crawl", emoji: "🍀",
      venue: "Gulf Shores Downtown", bizId: null,
      category: "bar-event", time: "2pm–close", cover: "$10 wristband",
      description: "Hit all the bars from Gulf Shores to Orange Beach. Wristband gets you specials at 10+ stops."
    },
    {
      id: 4, date: "2026-03-15",
      title: "Marcus King Band", emoji: "🎤",
      venue: "The Wharf Amphitheater", bizId: "wharf-amphitheater",
      category: "concert", time: "8pm", cover: "$45–$85",
      description: "National touring act live at The Wharf's 10,000-seat outdoor amphitheater.",
      tickets: "https://alwharf.com"
    },
    {
      id: 5, date: "2026-03-17",
      title: "St. Patrick's Day Party", emoji: "☘️",
      venue: "Bahama Bob's", bizId: "bahama-bobs",
      category: "holiday", time: "Noon–close", cover: "Free",
      description: "Green beer, live music, and all-day specials on the beach."
    },
    {
      id: 6, date: "2026-03-21",
      title: "Tim Roberts at Flora-Bama", emoji: "🎸",
      venue: "Flora-Bama Lounge", bizId: null,
      category: "live-music", time: "8pm", cover: "$5",
      description: "The legendary Flora-Bama on the state line. One of the most iconic music venues on the Gulf."
    },
    {
      id: 7, date: "2026-03-22",
      title: "Chase Rice Concert", emoji: "🎤",
      venue: "The Wharf Amphitheater", bizId: "wharf-amphitheater",
      category: "concert", time: "7:30pm", cover: "$35–$65",
      description: "Country music star Chase Rice performs live at The Wharf.",
      tickets: "https://alwharf.com"
    },
    {
      id: 8, date: "2026-03-28",
      title: "Spring Break Beach Volleyball", emoji: "🏐",
      venue: "Gulf State Park", bizId: "gulf-state-park-beach-access",
      category: "sports", time: "9am–5pm", cover: "Free",
      description: "Open beach volleyball tournament. Sign up as a team or join pickup games all day."
    },
    {
      id: 9, date: "2026-03-29", endDate: "2026-03-30",
      title: "Seafood Festival", emoji: "🦐",
      venue: "OWA Theme Park", bizId: "owa",
      category: "festival", time: "11am–8pm", cover: "$8",
      description: "Two-day Gulf Coast seafood celebration. 20+ vendors, live music, cook-off competitions.",
      loyaltyPoints: 200
    },
    {
      id: 10, date: "2026-04-04",
      title: "Happy Hour Kickoff — April", emoji: "🍻",
      venue: "Luna's Eat & Drink", bizId: "lunas-eat-drink",
      category: "bar-event", time: "3pm–5pm", cover: "Free",
      description: "Kick off April with Luna's famous happy hour. Draft beer $2.50, apps $5–$8.",
      loyaltyPoints: 50
    },
    {
      id: 11, date: "2026-04-11",
      title: "Gulf Coast Photography Pop-Up", emoji: "📸",
      venue: "Gulf State Park Beach", bizId: "gulf-coast-photography",
      category: "special", time: "6am–8am", cover: "$175+",
      description: "Golden hour family portrait sessions on the beach. Limited slots — book in advance."
    },
    {
      id: 12, date: "2026-04-18",
      title: "Fishing Tournament", emoji: "🎣",
      venue: "Orange Beach Marina", bizId: "kraken-reels",
      category: "sports", time: "6am–4pm", cover: "$50 entry",
      description: "Annual spring fishing tournament. Prizes for biggest red snapper, grouper, and flounder.",
      loyaltyPoints: 100
    }
  ],

  /* ══════════════════════════════════════════
     GULF COAST REWARDS CO-OP
     A cross-business loyalty program where
     independently-owned businesses pool together.
     Customers earn points at ANY participating
     business and redeem at ANY other.
     Businesses contribute 2% of each transaction
     to the shared rewards pool.
     ══════════════════════════════════════════ */
  loyalty: {
    programName: "Gulf Coast Rewards",
    tagline: "One membership. Every business on the Gulf.",
    description: "A co-op loyalty program connecting every participating Gulf Coast business under one shared rewards currency. Earn points dining, renting, fishing, shopping — anywhere in the network. Redeem anywhere you want.",
    coopModel: {
      businessContribution: "2% of each member transaction funds the shared rewards pool",
      earnRate: "1 point per $1 spent at any participating business",
      redemptionRate: "100 points = $1 in rewards",
      crossRedemption: true,
      noAppNeeded: true,
      signupMethod: "Phone number — get a text, no download required",
      bonusPoints: {
        referral: 100,
        eventAttendance: 50,
        firstVisit: 200,
        birthdayBonus: 500
      }
    },
    howItWorks: [
      { step: 1, emoji: "📲", title: "Join Free",        text: "Sign up with your phone number. No app, no credit card, no catch." },
      { step: 2, emoji: "🏪", title: "Visit Anywhere",   text: "Shop, dine, fish, rent — any participating Gulf Coast business counts." },
      { step: 3, emoji: "⭐", title: "Earn Together",    text: "1 point per $1 spent across the whole network. Points never expire." },
      { step: 4, emoji: "🎁", title: "Redeem Anywhere",  text: "Swap points for deals at any business in the co-op — not just where you earned them." }
    ],
    tiers: [
      {
        name: "Explorer",   minPoints: 0,    emoji: "🏖️", color: "#1a7a82",
        perks: ["Members-only happy hour deals", "10% off at select restaurants", "Early access to event tickets", "Free welcome drink at signup"]
      },
      {
        name: "Local",      minPoints: 500,  emoji: "🌊", color: "#c9831f",
        perks: ["15% off food & drinks network-wide", "Free dessert at any member restaurant", "Priority booking for charters & rentals", "VIP happy hour pricing"]
      },
      {
        name: "Gulf Elite", minPoints: 1500, emoji: "🦞", color: "#6c3483",
        perks: ["20% off everywhere in the co-op", "Free charter fishing trip upgrade", "Complimentary trip concierge", "Backstage passes to Wharf Amphitheater concerts"]
      }
    ],
    /* Businesses that have joined the co-op.
       When real businesses claim their listing,
       they opt into the co-op — this array grows.
       perk = what a member earns/gets at this biz  */
    participating: [
      { bizId: "lunas-eat-drink",         perk: "Free app after 500 pts",       contribution: "2%" },
      { bizId: "bahama-bobs",             perk: "Free drink after 300 pts",      contribution: "2%" },
      { bizId: "circle-boats",            perk: "1-hr upgrade at 750 pts",       contribution: "2%" },
      { bizId: "kraken-reels",            perk: "Free fish clean at 400 pts",    contribution: "2%" },
      { bizId: "tee-off-at-the-wharf",    perk: "Free bay rental at 600 pts",    contribution: "2%" },
      { bizId: "big-mikes-steakhouse",    perk: "Free dessert at 400 pts",       contribution: "2%" },
      { bizId: "sugar-sands-creamery",    perk: "Free scoop at 200 pts",         contribution: "2%" },
      { bizId: "amberjack-ebike-rentals", perk: "1-hr free ride at 500 pts",     contribution: "2%" }
    ],
    /* The shared rewards catalog — things members can
       redeem points for, funded by the co-op pool      */
    rewardsCatalog: [
      { id:"r1", title:"Free Appetizer",          points:300,  emoji:"🍤", desc:"At any member restaurant",      category:"food" },
      { id:"r2", title:"Free Dessert",             points:200,  emoji:"🍰", desc:"At any member restaurant",      category:"food" },
      { id:"r3", title:"$10 Off Any Purchase",     points:1000, emoji:"💵", desc:"Any participating business",    category:"cash" },
      { id:"r4", title:"$25 Off Any Purchase",     points:2500, emoji:"💵", desc:"Any participating business",    category:"cash" },
      { id:"r5", title:"Free Boat Rental Hour",    points:750,  emoji:"🚤", desc:"Circle Boats — 1-hr upgrade",  category:"activity" },
      { id:"r6", title:"Free Ice Cream Scoop",     points:150,  emoji:"🍦", desc:"Sugar Sands Creamery",          category:"food" },
      { id:"r7", title:"Free E-Bike Hour",         points:500,  emoji:"🚴", desc:"Amberjack E-Bike Rentals",      category:"activity" },
      { id:"r8", title:"Concert Ticket Discount",  points:800,  emoji:"🎤", desc:"Wharf Amphitheater — $20 off", category:"event" },
      { id:"r9", title:"VIP Happy Hour Access",    points:400,  emoji:"🍻", desc:"All member bars & restaurants", category:"drink" }
    ]
  },

  /* ── 9 CATEGORY DEFINITIONS ── */
  categories: [
    { id:"restaurants",    label:"Restaurants",      emoji:"🍽️", sub:["All","Seafood","Burgers","Steak","Pizza","Southern","Waterfront","Bar & Grill","Breakfast","Casual","Fine Dining"] },
    { id:"coffee-sweets",  label:"Coffee & Sweets",  emoji:"☕", sub:["All","Coffee Shops","Ice Cream","Bakery","Dessert","Smoothies","Breakfast"] },
    { id:"happy-hours",    label:"Happy Hours",      emoji:"🍻", sub:["All","Now Open","4pm–6pm","5pm–7pm","All Day","Food Specials","Drink Specials","Live Music"] },
    { id:"specials",       label:"Specials",         emoji:"🏷️", sub:["All","All You Can Eat","Daily Specials","Weekend Deals","Lunch Specials","Family Deals","Early Bird"] },
    { id:"events",         label:"Events",           emoji:"🎉", sub:["All","Live Music","Concerts","Festivals","Sports","Family","Happy Hour Events","Holiday"] },
    { id:"things-to-do",   label:"Things To Do",     emoji:"🎯", sub:["All","Water Sports","Fishing","Boat Rentals","Family","Outdoor","Nightlife","Attractions","Tours","Golf"] },
    { id:"shopping",       label:"Shopping",         emoji:"🛍️", sub:["All","Souvenirs","Clothing","Boutique","Art & Gifts","Beach Gear","Specialty"] },
    { id:"other",          label:"Other",            emoji:"✨", sub:["All","Photography","Weddings","Rentals","Services","Health & Wellness","Transportation"] },
    { id:"services",       label:"Services",         emoji:"🎯", sub:["All","Photography","Weddings","Transportation","Wellness","Hair & Beauty","Home Services"] },
    { id:"feed",           label:"Live Feed",        emoji:"📡", sub:["All","Photos","Reviews","Events","Deals","New Openings"] }
  ],

  /* ── LOCATIONS ── */
  locations: [
    {
      id: "the-wharf",
      name: "The Wharf",
      subtitle: "Orange Beach Marina District",
      address: "4750 Main Street, Orange Beach, AL 36561",
      description: "Orange Beach's premier waterfront entertainment complex. Dining, shopping, live events, boat tours, and the iconic amphitheater — all in one location.",
      emoji: "⚓"
    },
    {
      id: "owa",
      name: "OWA",
      subtitle: "Theme Parks & Entertainment",
      address: "101 OWA Blvd, Foley, AL 36535",
      description: "A world-class entertainment destination featuring a full theme park, shopping, restaurants, and live entertainment — just minutes from the beach.",
      emoji: "🎢"
    }
  ],

  /* ── HELPERS ── */
  getByCategory(cat) {
    return this.businesses.filter(b => b.category === cat);
  },
  getByLocation(loc) {
    return this.businesses.filter(b => b.location === loc);
  },
  getByTag(tag) {
    return this.businesses.filter(b => b.tags && b.tags.includes(tag));
  },
  getFeatured() {
    return this.businesses.filter(b => b.featured);
  },
  getHappyHours() {
    return this.businesses.filter(b => b.happyHour);
  },
  getSpecials() {
    return this.businesses.filter(b => b.specials && b.specials.length > 0);
  },
  getEventsByMonth(year, month) {
    // month is 1-based (1=Jan)
    const prefix = `${year}-${String(month).padStart(2,'0')}`;
    return this.events.filter(e => e.date.startsWith(prefix));
  },
  getEventsByDate(dateStr) {
    return this.events.filter(e => e.date === dateStr || (e.endDate && dateStr >= e.date && dateStr <= e.endDate));
  },
  getUpcomingEvents(limit) {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = this.events.filter(e => e.date >= today).sort((a,b) => a.date.localeCompare(b.date));
    return limit ? upcoming.slice(0, limit) : upcoming;
  },
  getLoyaltyBiz() {
    return this.loyalty.participating.map(p => {
      const biz = this.businesses.find(b => b.id === p.bizId || b.slug === p.bizId);
      return biz ? { ...biz, loyaltyPerk: p.perk } : null;
    }).filter(Boolean);
  },
  search(q) {
    const term = q.toLowerCase();
    return this.businesses.filter(b => {
      return (
        b.name.toLowerCase().includes(term) ||
        (b.description && b.description.toLowerCase().includes(term)) ||
        (b.tags && b.tags.some(t => t.includes(term))) ||
        (b.menuHighlights && b.menuHighlights.some(m => m.toLowerCase().includes(term))) ||
        (b.specials && b.specials.some(s => s.toLowerCase().includes(term)))
      );
    });
  }
};
