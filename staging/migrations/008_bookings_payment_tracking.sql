-- ============================================================================
-- 008_bookings_payment_tracking.sql
-- Fix Stripe/Square payments silently not marking bookings paid.
-- ============================================================================
-- APPLIED to project mkepugvdlktfsossumox on 2026-07-12.
--
-- FOUND: stripe.js/square.js/webhooks.js all wrote payment_status/payment_id/
-- payment_provider/receipt_number/receipt_url/site_id onto public.bookings --
-- none of these columns existed on the live 25-column table. Supabase does not
-- throw on an unknown-column error unless the caller checks for it, and none
-- of these call sites did, so every real Stripe/Square payment "succeeded"
-- from the customer's point of view while the booking row silently never
-- recorded it, and confirmation SMS/email were separately gated on
-- booking.customer_phone/customer_email (also nonexistent -- the real
-- columns the universal booking engine, routes/platform.js, writes are
-- phone/email), so notifications silently never fired either.
--
-- Fully additive -- no existing data or callers changed shape. Application
-- fixes (error logging on these writes, phone/email fallback, site_id-scoped
-- refund auth) landed in the same commit on gcr-api-clean.
-- ============================================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS site_id uuid,
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS payment_id text,
  ADD COLUMN IF NOT EXISTS payment_provider text,
  ADD COLUMN IF NOT EXISTS receipt_number text,
  ADD COLUMN IF NOT EXISTS receipt_url text;

CREATE INDEX IF NOT EXISTS idx_bookings_site_id ON public.bookings(site_id);
