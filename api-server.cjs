#!/usr/bin/env node

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Load master database
const dbPath = path.join(__dirname, "../tools/gcr-master-database.json");

let masterDatabase = [];

try {
  const data = fs.readFileSync(dbPath, "utf8");
  masterDatabase = JSON.parse(data);
  console.log(`✓ Loaded master database: ${masterDatabase.length} businesses`);
} catch (err) {
  console.error("❌ Error loading database:", err.message);
  process.exit(1);
}

// Helper functions
function searchBusinesses(query) {
  const q = query.toLowerCase();
  return masterDatabase.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q)
  );
}

function enrichBusinessData(business) {
  // Add computed fields for display
  return {
    ...business,
    displayRating: business.rating ? `${business.rating} ★` : "No rating",
    priceRange:
      business.priceLevel === 1
        ? "$"
        : business.priceLevel === 2
        ? "$$"
        : business.priceLevel === 3
        ? "$$$"
        : "$$$$",
    completenessPercentage: business.completenessScore,
    hasMenu: business.menu && business.menu.length > 0,
    hasHours: business.hours && business.hours.length > 0,
    hasImages: business.images && business.images.length > 0,
  };
}

// Routes

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", businessCount: masterDatabase.length });
});

// All businesses
app.get("/api/gcr/businesses", (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const sorted = masterDatabase
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(offset, offset + limit);

  res.json({
    total: masterDatabase.length,
    limit,
    offset,
    businesses: sorted.map(enrichBusinessData),
  });
});

// Restaurants - appears on restaurants.html, happy-hours.html, specials.html
app.get("/api/gcr/restaurants", (req, res) => {
  const restaurants = masterDatabase.filter(
    (b) => b.profileType === "restaurant" || b.category === "restaurants"
  );
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const sorted = restaurants
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(offset, offset + limit);

  res.json({
    total: restaurants.length,
    limit,
    offset,
    restaurants: sorted.map(enrichBusinessData),
  });
});

// Coffee & Sweets
app.get("/api/gcr/coffee-sweets", (req, res) => {
  const coffeeSweets = masterDatabase.filter(
    (b) =>
      b.category === "cafe" ||
      b.category === "bakery" ||
      b.category === "coffee" ||
      b.description.toLowerCase().includes("coffee") ||
      b.description.toLowerCase().includes("dessert")
  );
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const sorted = coffeeSweets
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(offset, offset + limit);

  res.json({
    total: coffeeSweets.length,
    limit,
    offset,
    businesses: sorted.map(enrichBusinessData),
  });
});

// Events
app.get("/api/gcr/events", (req, res) => {
  const events = masterDatabase.filter((b) => b.profileType === "event" || b.category === "events");
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const sorted = events.slice(offset, offset + limit);

  res.json({
    total: events.length,
    limit,
    offset,
    events: sorted.map(enrichBusinessData),
  });
});

// Things to do / Activities - can include restaurants, entertainment, attractions
app.get("/api/gcr/things-to-do", (req, res) => {
  const activities = masterDatabase.filter(
    (b) =>
      b.profileType === "activity" ||
      b.category === "things-to-do" ||
      (b.types && (b.types.includes("point_of_interest") || b.types.includes("amusement_park")))
  );
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const sorted = activities
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(offset, offset + limit);

  res.json({
    total: activities.length,
    limit,
    offset,
    activities: sorted.map(enrichBusinessData),
  });
});

// Shopping
app.get("/api/gcr/shopping", (req, res) => {
  const shopping = masterDatabase.filter(
    (b) =>
      b.category === "clothing_store" ||
      b.category === "shopping" ||
      b.types?.includes("shopping_mall") ||
      b.types?.includes("store")
  );
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const sorted = shopping
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(offset, offset + limit);

  res.json({
    total: shopping.length,
    limit,
    offset,
    businesses: sorted.map(enrichBusinessData),
  });
});

// Other - boat launches, public beach access, overflow parking, services, etc.
app.get("/api/gcr/other", (req, res) => {
  const other = masterDatabase.filter((b) => {
    const isBoatLaunch =
      b.category === "boat_launch" ||
      b.types?.includes("boat_launch") ||
      b.description.toLowerCase().includes("boat launch");

    const isPublicAccess =
      b.category === "public_beach" ||
      b.types?.includes("beach") ||
      b.description.toLowerCase().includes("public beach") ||
      b.description.toLowerCase().includes("public access");

    const isParking =
      b.category === "parking" ||
      b.types?.includes("parking") ||
      b.description.toLowerCase().includes("parking");

    const isService =
      b.category === "beauty_salon" ||
      b.category === "gas_station" ||
      b.category === "pharmacy" ||
      b.category === "bank" ||
      b.category === "atm" ||
      b.types?.includes("convenience_store") ||
      b.types?.includes("campground");

    const isMisc =
      (b.types && b.types.length > 0 && !b.profileType.match(/restaurant|activity|event/)) ||
      b.category === "establishment";

    return isBoatLaunch || isPublicAccess || isParking || isService || isMisc;
  });

  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const sorted = other
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(offset, offset + limit);

  res.json({
    total: other.length,
    limit,
    offset,
    businesses: sorted.map(enrichBusinessData),
  });
});

// Happy hours & Specials - displays on both happy-hours.html and specials.html
app.get("/api/gcr/happy-hours", (req, res) => {
  const withHours = masterDatabase.filter(
    (b) =>
      (b.hours && b.hours.length > 0) ||
      b.description.toLowerCase().includes("happy hour")
  );
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const sorted = withHours
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(offset, offset + limit);

  res.json({
    total: withHours.length,
    limit,
    offset,
    specials: sorted.map(enrichBusinessData),
  });
});

// Specials/Deals
app.get("/api/gcr/specials", (req, res) => {
  const specials = masterDatabase.filter(
    (b) =>
      b.description.toLowerCase().includes("special") ||
      b.description.toLowerCase().includes("deal") ||
      b.description.toLowerCase().includes("discount") ||
      b.description.toLowerCase().includes("happy hour")
  );
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const sorted = specials
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(offset, offset + limit);

  res.json({
    total: specials.length,
    limit,
    offset,
    specials: sorted.map(enrichBusinessData),
  });
});

// Single entity detail (for profile pages)
app.get("/api/gcr/entity/:slug", async (req, res) => {
  const slug = req.params.slug;

  // Special handling for Circle Boats — pull from CyberCheck website content
  if (slug === "beachside-circle-boats") {
    try {
      const [siteRes, addonsRes] = await Promise.all([
        fetch("https://cybercheck-api-database.vercel.app/api/site-data"),
        fetch("https://cybercheck-api-database.vercel.app/api/dashboard/addons")
      ]);

      const siteData = await siteRes.json();
      const addons = await addonsRes.json();

      // Map to activity-profile expected format
      const response = {
        entity: {
          name: siteData.business?.name || "Beachside Circle Boats",
          slug: "beachside-circle-boats",
          subtitle: siteData.hero?.subtitle || "Portable Electric Circle Boat Rentals",
          description: siteData.about?.text || "",
          icon: "🚤",
          rating: siteData.business?.rating || 4.9,
          review_count: siteData.reviews?.length || 0,
          phone: siteData.business?.phone || "(601) 325-1205",
          address_line_1: siteData.business?.address || "25856 Canal Road, Unit A",
          city: siteData.business?.city || "Orange Beach",
          state: siteData.business?.state || "AL",
          zip: siteData.business?.zip || "36561",
          website_url: siteData.business?.website || "https://beachsidecircleboats.com",
          directions_url: siteData.business?.googleMaps || "",
          hero_image_url: siteData.gallery?.[0]?.image || "",
          booking_url: siteData.business?.bookingUrl || null,
          social_instagram: siteData.business?.socialInstagram || null,
          social_facebook: siteData.business?.socialFacebook || null,
          is_active: true
        },
        sections: [],
        features: (siteData.features || []).map(f => ({ label: f.title || f })),
        perfect_for: [],
        tags: [],
        about_bullets: [],
        photos: (siteData.gallery || []).map(g => ({ image_url: g.image, caption: g.caption })),
        hours: (siteData.business?.hours || []).map(day => {
          const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          const hours = siteData.business?.hours || {};
          const h = hours[day] || { open: null, close: null, closed: false };
          return {
            day_of_week: day,
            open_time: h.open || null,
            close_time: h.close || null,
            is_closed: h.closed || false
          };
        }),
        pricing: (siteData.products || []).map(p => ({
          package_name: p.name,
          description: p.desc,
          price: p.price,
          price_text: p.price,
          time_slot_start: p.start,
          time_slot_end: p.end,
          price_unit: p.unit
        })),
        activities: [],
        fleet: (siteData.docks || []).map(d => ({
          item_name: d.name,
          description: d.description,
          capacity: d.capacity,
          weight: d.weight,
          dimensions: d.dimensions
        })),
        addons: (addons || []).map(a => ({
          addon_name: a.name,
          description: a.description,
          price: a.price,
          price_type: a.category
        })),
        whats_included: (siteData.whats_included || []).map(w => ({
          item_name: w.name || w,
          description: w.description || ""
        })),
        requirements: (siteData.requirements || []).map(r => ({
          requirement_text: r.name || r
        })),
        policies: (siteData.policies || []).map(p => ({
          policy_type: p.type || "Policy",
          policy_text: p.text || p
        })),
        meeting_points: (siteData.locations || []).map(l => ({
          location_name: l.name,
          address: l.address,
          parking_info: l.parking,
          checkin_instructions: l.checkin,
          what_to_bring: l.bring
        })),
        qna: (siteData.qna || []).map(q => ({
          question: q.question,
          answer: q.answer,
          section_label: q.section || "FAQ"
        })),
        reviews: (siteData.reviews || []).map(r => ({
          author_name: r.author,
          rating: r.rating,
          review_text: r.text,
          review_date: r.date
        }))
      };

      return res.json(response);
    } catch (err) {
      console.error("Error fetching Circle Boats data:", err);
      return res.status(500).json({ error: "Failed to load Circle Boats data" });
    }
  }

  // For other entities, return not found
  return res.status(404).json({ error: "Entity not found" });
});

// Search - query any business
app.get("/api/gcr/search", (req, res) => {
  const { q, category, minRating } = req.query;

  let results = masterDatabase;

  if (q) {
    results = searchBusinesses(q);
  }

  if (category) {
    results = results.filter(
      (b) =>
        b.category === category ||
        b.profileType === category ||
        b.types?.includes(category)
    );
  }

  if (minRating) {
    const rating = parseFloat(minRating);
    results = results.filter((b) => b.rating >= rating);
  }

  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const sorted = results
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(offset, offset + limit);

  res.json({
    total: results.length,
    limit,
    offset,
    query: q || category || `minRating:${minRating}`,
    results: sorted.map(enrichBusinessData),
  });
});

// Single business detail
app.get("/api/gcr/business/:id", async (req, res) => {
  const id = req.params.id;

  // Special handling for Circle Boats — pull from CyberCheck website content
  if (id === "beachside-circle-boats") {
    try {
      const [siteRes, addonsRes] = await Promise.all([
        fetch("https://cybercheck-api-database.vercel.app/api/site-data"),
        fetch("https://cybercheck-api-database.vercel.app/api/dashboard/addons")
      ]);

      const siteData = await siteRes.json();
      const addons = await addonsRes.json();

      // Build Circle Boats profile from website content
      const circleBoats = {
        id: "beachside-circle-boats",
        name: siteData.business?.name || "Beachside Circle Boats",
        tagline: siteData.hero?.subtitle || "Portable Electric Circle Boat Rentals",
        description: siteData.about?.text || "",
        rating: siteData.business?.rating || 4.9,
        reviewCount: siteData.reviews?.length || 0,
        phone: siteData.business?.phone || "(601) 325-1205",
        phoneDisplay: siteData.business?.phone || "(601) 325-1205",
        website: siteData.business?.website || "https://beachsidecircleboats.com",
        email: siteData.business?.email || "",
        address: siteData.business?.address || "25856 Canal Road, Unit A",
        city: siteData.business?.city || "Orange Beach",
        state: siteData.business?.state || "AL",
        zip: siteData.business?.zip || "36561",
        emoji: "🚤",
        coverImages: siteData.gallery?.map(g => g.image) || [],
        gallery: siteData.gallery || [],
        reviews: siteData.reviews || [],
        about: { description: siteData.about?.text || "", features: siteData.features?.map(f => f.title) || [] },
        packages: siteData.products || [],
        sections: [
          { id: "about", label: "About", icon: "ℹ️" },
          ...(siteData.products?.length ? [{ id: "packages", label: "Boats & Pricing", icon: "🚤" }] : []),
          ...(siteData.gallery?.length ? [{ id: "gallery", label: "Photos", icon: "📸" }] : []),
          { id: "hours", label: "Hours", icon: "🕐" },
          ...(siteData.docks?.length ? [{ id: "fleet", label: "Docks", icon: "🛟" }] : []),
          ...(addons?.length ? [{ id: "addons", label: "Add-ons", icon: "➕" }] : []),
          { id: "location", label: "Location", icon: "📍" },
          ...(siteData.qna?.length ? [{ id: "qna", label: "FAQ", icon: "❓" }] : [])
        ],
        hours: siteData.business?.hours || [],
        _fleet: siteData.docks || [],
        _addons: addons || [],
        _qna: siteData.qna || [],
        googleMaps: siteData.business?.googleMaps || "",
        socialInstagram: siteData.business?.socialInstagram || "",
        socialFacebook: siteData.business?.socialFacebook || ""
      };

      return res.json(circleBoats);
    } catch (err) {
      console.error("Error fetching Circle Boats data:", err);
      return res.status(500).json({ error: "Failed to load Circle Boats data" });
    }
  }

  const business = masterDatabase.find((b) => b.id === id);

  if (!business) {
    return res.status(404).json({ error: "Business not found" });
  }

  res.json(enrichBusinessData(business));
});

// Categories
app.get("/api/gcr/categories", (req, res) => {
  const categories = {};
  masterDatabase.forEach((b) => {
    if (b.category) {
      categories[b.category] = (categories[b.category] || 0) + 1;
    }
  });

  res.json({
    categories: Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count })),
  });
});

// Statistics
app.get("/api/gcr/stats", (req, res) => {
  const stats = {
    total: masterDatabase.length,
    byCategory: {},
    byProfileType: {},
    averageRating: 0,
    highestRated: null,
  };

  let totalRating = 0;
  let ratedCount = 0;

  masterDatabase.forEach((b) => {
    if (b.category) {
      stats.byCategory[b.category] = (stats.byCategory[b.category] || 0) + 1;
    }
    if (b.profileType) {
      stats.byProfileType[b.profileType] = (stats.byProfileType[b.profileType] || 0) + 1;
    }
    if (b.rating) {
      totalRating += b.rating;
      ratedCount++;
    }
  });

  if (ratedCount > 0) {
    stats.averageRating = (totalRating / ratedCount).toFixed(2);
  }

  stats.highestRated = masterDatabase.reduce((max, b) =>
    b.rating > (max?.rating || 0) ? b : max
  );

  res.json(stats);
});

// Root
app.get("/", (req, res) => {
  res.json({
    message: "GCR API Server",
    version: "1.0.0",
    endpoints: {
      restaurants: "/api/gcr/restaurants",
      coffeeSweets: "/api/gcr/coffee-sweets",
      happyHours: "/api/gcr/happy-hours",
      specials: "/api/gcr/specials",
      events: "/api/gcr/events",
      thingsToDo: "/api/gcr/things-to-do",
      shopping: "/api/gcr/shopping",
      other: "/api/gcr/other",
      search: "/api/gcr/search?q=query",
      business: "/api/gcr/business/:id",
      categories: "/api/gcr/categories",
      stats: "/api/gcr/stats",
    },
  });
});

// Error handling
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 GCR API Server running on http://localhost:${PORT}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\n📊 Database: ${masterDatabase.length} businesses loaded`);
  console.log(`\n📡 Available endpoints for GCR pages:`);
  console.log(`  GET  /api/gcr/restaurants        → 🍽️ Restaurants`);
  console.log(`  GET  /api/gcr/coffee-sweets      → ☕ Coffee & Sweets`);
  console.log(`  GET  /api/gcr/happy-hours        → 🍻 Happy Hours`);
  console.log(`  GET  /api/gcr/specials           → 🏷️ Specials`);
  console.log(`  GET  /api/gcr/events             → 🎉 Events`);
  console.log(`  GET  /api/gcr/things-to-do       → 🎯 Things To Do`);
  console.log(`  GET  /api/gcr/shopping           → 🛍️ Shopping`);
  console.log(`  GET  /api/gcr/other              → ✨ Other`);
  console.log(`  GET  /api/gcr/search?q=query     → Search`);
  console.log(`  GET  /api/gcr/business/:id       → Single business`);
  console.log(`\n✓ Server ready! Update GCR pages to use http://localhost:${PORT}/api/gcr`);
  console.log(`${"=".repeat(60)}\n`);
});

module.exports = app;
