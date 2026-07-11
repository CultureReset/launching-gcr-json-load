-- ============================================================================
-- 005_group_trips_fix.sql
-- GROUP TRIPS — schema fixes backing the tourist-groups.js rewrite
-- ============================================================================
-- APPLIED to project mkepugvdlktfsossumox on 2026-07-11.
-- Record of what was actually run against the live DB (all additive,
-- nothing dropped, nothing existing data touched -- every affected table
-- had zero real rows at the time this ran).
--
-- WHY: Group Trips has never worked. Confirmed live: tourist_groups,
-- tourist_group_members, and tourist_group_invites all had zero rows despite
-- real signed-up tourists existing. routes/tourist-groups.js had always
-- assumed columns that don't exist on the real tables (invite_code/
-- owner_user_id/sharing_mode/arrival/departure on tourist_groups;
-- display_name on tourist_group_members; token/invited_by on
-- tourist_group_invites) -- every write silently failed.
--
-- A second, previously-invisible blocker sat underneath that: even a
-- correct group-create call would fail, because tourist_groups.creator_id
-- has a hard foreign key to tourist_users(id), and tourist_users has been
-- completely empty since the table was created -- nothing has ever
-- inserted a row into it.
-- ============================================================================

-- 005.1  tourist_groups never had a slug column, despite slug-generation
-- helpers (slugify()/uniqueSlug()) already being written in the API code
-- for it. Added rather than ripping out the URL scheme the frontend
-- (/group/:slug routing in gcr-unified) already depends on.
ALTER TABLE tourist_groups ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tourist_groups_slug ON tourist_groups(slug);

-- 005.2  invite_email was NOT NULL, which blocked the generic "share a
-- link with anyone" flow (Group.jsx/Invite.jsx in gcr-unified) that never
-- collects a recipient's email up front. Relaxed to nullable -- a future
-- "invite this specific address" flow can still supply one.
ALTER TABLE tourist_group_invites ALTER COLUMN invite_email DROP NOT NULL;

-- 005.3 (code fix, not a schema change, noted here for the record): the
-- tourist_users self-heal now happens in gcr-api-clean's touristAuth /
-- touristAuthOptional middleware (routes/tourist.js) -- every authenticated
-- request upserts {id, email, name} into tourist_users if missing, so this
-- FK can never silently block a feature again.
--
-- Design note also captured here: tourist_saves has no group_id column --
-- a "like" belongs to the person, not the trip. Group "overlap" (what do
-- we have in common) is computed at read time by joining the group's
-- member list against each member's personal tourist_saves rows, not by
-- filtering saves on a group_id that was never real.
--
-- Verified end-to-end in a rolled-back transaction against real
-- tourist_profiles rows before this went live: group create -> invite ->
-- join -> both members save the same place -> overlap query correctly
-- surfaces it. No test data was left in the database.
-- ============================================================================
