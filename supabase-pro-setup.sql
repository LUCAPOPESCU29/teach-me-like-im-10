-- ============================================================
-- Run this in your Supabase SQL Editor (once).
-- ============================================================

-- 1. Add kofi_email column to profiles
--    Lets users link a different Ko-fi payment email to their account.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kofi_email TEXT;

-- 2. Index for fast look-up by kofi_email
CREATE INDEX IF NOT EXISTS idx_profiles_kofi_email
  ON public.profiles (kofi_email)
  WHERE kofi_email IS NOT NULL;

-- 3. View: see all Pro users at a glance in Supabase Studio
--    Go to Table Editor → Views → pro_users
CREATE OR REPLACE VIEW public.pro_users AS
SELECT
  k.email                                             AS payment_email,
  k.pro_expires_at,
  k.amount,
  k.days_granted,
  k.last_payment_at,
  CASE WHEN k.amount = 0 THEN 'promo' ELSE 'kofi' END AS source,
  CASE WHEN k.pro_expires_at > NOW() THEN true ELSE false END AS is_active,
  GREATEST(0, EXTRACT(EPOCH FROM (k.pro_expires_at - NOW())) / 86400)::int AS days_remaining,

  -- Join on auth email match
  u1.id   AS user_id_by_auth_email,
  u1.email AS auth_email,

  -- Join on linked kofi_email in profiles
  u2.id   AS user_id_by_kofi_link,
  u2.email AS kofi_link_auth_email

FROM public.kofi_payments k

-- Match users whose auth email == payment email
LEFT JOIN auth.users u1
  ON LOWER(u1.email) = k.email

-- Match users who linked this payment email via settings
LEFT JOIN public.profiles p
  ON p.kofi_email = k.email
LEFT JOIN auth.users u2
  ON u2.id = p.id

WHERE k.email NOT LIKE '%@internal'   -- exclude unlinked promo placeholders

ORDER BY k.pro_expires_at DESC;

-- Grant read access so the view is visible in Studio
GRANT SELECT ON public.pro_users TO authenticated;
GRANT SELECT ON public.pro_users TO service_role;
