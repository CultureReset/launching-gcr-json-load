-- ============================================================
--  EMERGENCY RESTORE + GCR SETUP
--  Run this in: Supabase Dashboard → SQL Editor → New Query
--
--  Step 1: Restores the ORIGINAL platform menu_items table
--          (UUID site_id — required by Circle Boats & dashboard)
--  Step 2: Creates gcr_menu_items for GCR directory menus
--          (text subdomain — for directory-only businesses)
-- ============================================================

-- ── STEP 1: Restore platform menu_items (original schema) ──
drop table if exists menu_items cascade;

create table menu_items (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references businesses(site_id) on delete cascade,
  name         varchar(255) not null,
  description  text,
  price        decimal(10,2),
  category     varchar(100),
  subcategory  varchar(100),
  image_url    text,
  tags         jsonb default '[]',
  allergens    jsonb default '[]',
  ingredients  text,
  available    boolean default true,
  sort_order   int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── STEP 2: Create gcr_menu_items (GCR directory menus) ────
drop table if exists gcr_menu_items cascade;

create table gcr_menu_items (
  id               uuid        primary key default gen_random_uuid(),
  subdomain        text        not null,
  menu_type        text        not null,
  section          text        not null,
  section_order    int         not null default 0,
  name             text        not null,
  description      text        not null default '',
  price            text        not null default '',
  price_variants   jsonb       not null default '[]',
  available_days   text[]      not null default '{}',
  available_start  time,
  available_end    time,
  tags             text[]      not null default '{}',
  sort_order       int         not null default 0,
  active           boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index gcr_menu_items_subdomain_idx on gcr_menu_items(subdomain);
create index gcr_menu_items_sub_type_idx  on gcr_menu_items(subdomain, menu_type);

alter table gcr_menu_items enable row level security;
create policy "gcr_menu_public_read" on gcr_menu_items for select using (active = true);
create policy "gcr_menu_service_all" on gcr_menu_items for all using (true);
grant select on gcr_menu_items to anon;
grant select on gcr_menu_items to authenticated;

-- ── Verify both tables exist ────────────────────────────────
select table_name, column_name, data_type
from information_schema.columns
where table_name in ('menu_items', 'gcr_menu_items')
order by table_name, ordinal_position;
