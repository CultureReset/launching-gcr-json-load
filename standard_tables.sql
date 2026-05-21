-- ============================================================================
-- STANDARD BUSINESS TABLES - RUN THIS FOR ALL BUSINESSES
-- ============================================================================

-- 1. HOURS TABLE
CREATE TABLE IF NOT EXISTS entity_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_hours_entity_id ON entity_hours(entity_id);

-- 2. HAPPY HOURS TABLE
CREATE TABLE IF NOT EXISTS entity_happy_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  hh_days VARCHAR(255),
  hh_start TIME,
  hh_end TIME,
  hh_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_happy_hours_entity_id ON entity_happy_hours(entity_id);

-- 3. HAPPY HOUR ITEMS TABLE
CREATE TABLE IF NOT EXISTS entity_happy_hour_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  item_name VARCHAR(255),
  item_description TEXT,
  hh_price DECIMAL(10, 2),
  item_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_happy_hour_items_entity_id ON entity_happy_hour_items(entity_id);

-- 4. EVENTS TABLE
CREATE TABLE IF NOT EXISTS entity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  event_name VARCHAR(255),
  event_type VARCHAR(100),
  event_date DATE,
  start_time TIME,
  end_time TIME,
  day_of_week VARCHAR(20),
  recurring BOOLEAN DEFAULT FALSE,
  recurring_start_date DATE,
  recurring_end_date DATE,
  description TEXT,
  artist_name VARCHAR(255),
  venue_location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_events_entity_id ON entity_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_events_event_date ON entity_events(event_date);

-- 5. SPECIALS TABLE
CREATE TABLE IF NOT EXISTS entity_specials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  special_name VARCHAR(255),
  description TEXT,
  discount_text VARCHAR(255),
  start_date DATE,
  end_date DATE,
  days VARCHAR(255),
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_specials_entity_id ON entity_specials(entity_id);

-- 6. MENU SECTIONS TABLE
CREATE TABLE IF NOT EXISTS entity_menu_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  section_name VARCHAR(255),
  section_note TEXT,
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_menu_sections_entity_id ON entity_menu_sections(entity_id);

-- 7. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS entity_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  menu_section_id UUID REFERENCES entity_menu_sections(id) ON DELETE CASCADE,
  item_name VARCHAR(255),
  description TEXT,
  price DECIMAL(10, 2),
  price_text VARCHAR(100),
  image_url TEXT,
  allergens VARCHAR(255),
  tags VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_menu_items_entity_id ON entity_menu_items(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_menu_items_section_id ON entity_menu_items(menu_section_id);

-- 8. DRINK SECTIONS TABLE
CREATE TABLE IF NOT EXISTS entity_drink_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  section_name VARCHAR(255),
  section_note TEXT,
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_drink_sections_entity_id ON entity_drink_sections(entity_id);

-- 9. DRINK ITEMS TABLE
CREATE TABLE IF NOT EXISTS entity_drink_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  drink_section_id UUID REFERENCES entity_drink_sections(id) ON DELETE CASCADE,
  item_name VARCHAR(255),
  item_style VARCHAR(100),
  abv DECIMAL(5, 2),
  ibu INT,
  brewery VARCHAR(255),
  description TEXT,
  price DECIMAL(10, 2),
  price_text VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_drink_items_entity_id ON entity_drink_items(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_drink_items_section_id ON entity_drink_items(drink_section_id);

-- 10. SECTIONS (CMS) TABLE
CREATE TABLE IF NOT EXISTS entity_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  section_type VARCHAR(100),
  section_key VARCHAR(100),
  section_label VARCHAR(255),
  section_name VARCHAR(255),
  section_note TEXT,
  content JSONB,
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_sections_entity_id ON entity_sections(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_sections_type ON entity_sections(section_type);

-- 11. SECTION ITEMS TABLE
CREATE TABLE IF NOT EXISTS entity_section_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  section_id UUID REFERENCES entity_sections(id) ON DELETE CASCADE,
  item_name VARCHAR(255),
  item_description TEXT,
  image_url TEXT,
  price_text VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_section_items_entity_id ON entity_section_items(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_section_items_section_id ON entity_section_items(section_id);

-- 12. SECTION BULLETS TABLE
CREATE TABLE IF NOT EXISTS entity_section_bullets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  section_id UUID REFERENCES entity_sections(id) ON DELETE CASCADE,
  bullet_text TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_section_bullets_entity_id ON entity_section_bullets(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_section_bullets_section_id ON entity_section_bullets(section_id);

-- 13. PHOTOS TABLE
CREATE TABLE IF NOT EXISTS entity_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_cover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_photos_entity_id ON entity_photos(entity_id);

-- 14. TAGS TABLE
CREATE TABLE IF NOT EXISTS entity_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  tag VARCHAR(255),
  tag_category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_tags_entity_id ON entity_tags(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_category ON entity_tags(tag_category);

-- 15. FEATURES TABLE
CREATE TABLE IF NOT EXISTS entity_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  feature_label VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_features_entity_id ON entity_features(entity_id);

-- 16. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS entity_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  activity_name VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_activities_entity_id ON entity_activities(entity_id);

-- 17. PRICING TABLE
CREATE TABLE IF NOT EXISTS entity_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  package_name VARCHAR(255),
  description TEXT,
  price DECIMAL(10, 2),
  price_text VARCHAR(100),
  time_slot_start TIME,
  time_slot_end TIME,
  price_unit VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_pricing_entity_id ON entity_pricing(entity_id);

-- 18. BOOKING SLOTS TABLE
CREATE TABLE IF NOT EXISTS entity_booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  slot_date DATE,
  slot_time TIME,
  capacity INT,
  booked INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_booking_slots_entity_id ON entity_booking_slots(entity_id);

-- OPTIONAL TABLES
CREATE TABLE IF NOT EXISTS entity_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  policy_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_policies_entity_id ON entity_policies(entity_id);

CREATE TABLE IF NOT EXISTS entity_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  requirement_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_requirements_entity_id ON entity_requirements(entity_id);

CREATE TABLE IF NOT EXISTS entity_qna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entity(id) ON DELETE CASCADE,
  question TEXT,
  answer TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entity_qna_entity_id ON entity_qna(entity_id);
