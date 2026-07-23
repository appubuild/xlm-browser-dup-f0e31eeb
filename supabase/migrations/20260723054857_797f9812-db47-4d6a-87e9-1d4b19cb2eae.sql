
-- Extend projects for AI doc, support email, publish/payment lifecycle
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS ai_doc text DEFAULT '',
  ADD COLUMN IF NOT EXISTS support_email text,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_tx text,
  ADD COLUMN IF NOT EXISTS payment_amount numeric,
  ADD COLUMN IF NOT EXISTS payment_at timestamptz;

-- Extend site_settings for listing fee configuration
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS listing_fee_xrp numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS listing_payment_address text DEFAULT '';

-- Backfill: existing approved projects should remain visible
UPDATE public.projects SET is_public = true WHERE status = 'approved' AND is_public = false;
