-- ============================================================================
-- 006_staff_editor_and_audit_log.sql
-- Foundation for the "any business" menu-editor generalization: per-person
-- staff identity (phone-based) + a universal edit audit log.
-- ============================================================================
-- APPLIED to project mkepugvdlktfsossumox on 2026-07-12.
-- Both tables are brand new, fully additive -- nothing existing touched.
--
-- WHY: The menu-editor's only access control today is a single PIN shared by
-- an entire business (entity.menu_pin) -- there is no way to know WHO made an
-- edit, and no way to give one staff member full access while another gets
-- toggle-only access. Separately, no table anywhere logs "who changed what,
-- when" across the menu-editor, the dashboard, or SMS -- that has to exist
-- before role-scoped permissions mean anything (a toggle-only permission is
-- only enforceable/auditable if there's a durable record of who did what).
-- ============================================================================

-- 006.1  business_staff -- links a phone number to a specific business with a
-- role. This is the identity the SMS side will recognize a text FROM (whoever
-- is texting in "SOLD OUT snapper" gets looked up here), and eventually the
-- same identity a dashboard-linked login can share. role is a plain string,
-- not an enum, so new roles can be added without a migration.
CREATE TABLE IF NOT EXISTS business_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_slug text NOT NULL,
  phone text NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'staff',  -- 'owner' | 'manager' | 'staff'
  is_active boolean NOT NULL DEFAULT true,
  invited_by_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_slug, phone)
);
CREATE INDEX IF NOT EXISTS idx_business_staff_phone ON business_staff(phone) WHERE is_active;

-- 006.2  entity_edit_log -- one row per write, from any channel. Deliberately
-- generic (table_name/record_id/field_name/old_value/new_value as jsonb)
-- rather than one log table per feature, since every write path (menu-editor,
-- dashboard, future SMS toggles) can call the same logEdit() helper without
-- needing its own table.
CREATE TABLE IF NOT EXISTS entity_edit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_slug text NOT NULL,
  channel text NOT NULL,          -- 'menu_editor' | 'dashboard' | 'sms' | 'admin'
  actor_phone text,
  actor_name text,
  actor_role text,                -- 'owner' | 'manager' | 'staff' | 'admin'
  action text NOT NULL,           -- 'create' | 'update' | 'delete' | 'toggle'
  table_name text NOT NULL,
  record_id text,
  field_name text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_entity_edit_log_slug ON entity_edit_log(entity_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entity_edit_log_phone ON entity_edit_log(actor_phone);

-- Design notes for the next phase (code, not schema):
-- - The menu-editor's /:slug/data and write routes (gcr-api-clean/routes/
--   menu-editor.js) currently always query the restaurant table set
--   regardless of entity.entity_type. That endpoint needs to branch on
--   entity_type/entity_subtype and return a "tabs" manifest so the frontend
--   knows which tabs apply (verified live: entity already has fuel_options
--   jsonb, daily_capacity/capacity_per_slot/capacity_min/max -- a marina/
--   charter tab set can be built on existing columns, no new ones needed).
-- - "Spots remaining" already has a real table: business_availability
--   (total_capacity/booked_count/remaining_spots/status) -- it just has no
--   self-serve write path today (100% admin-only). The new work is a write
--   endpoint, not new columns.
-- - Toggle-style SMS commands ("SOLD OUT snapper", "beer on tap") map
--   directly onto existing menu_items boolean columns: is_available,
--   is_featured, is_catch_of_day, is_on_tap. No schema change needed there
--   either -- business_staff + entity_edit_log were the only missing pieces.
-- ============================================================================
