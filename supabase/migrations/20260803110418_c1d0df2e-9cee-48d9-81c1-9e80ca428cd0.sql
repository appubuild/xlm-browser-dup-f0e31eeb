ALTER TABLE public.wallet_config
  ADD COLUMN IF NOT EXISTS enabled_wallets text[] NOT NULL DEFAULT ARRAY['freighter','xbull','albedo','rabet','lobstr','hana']::text[],
  ADD COLUMN IF NOT EXISTS walletconnect_project_id text NOT NULL DEFAULT '';

ALTER TABLE public.wallet_config DROP COLUMN IF EXISTS xaman_api_key;
ALTER TABLE public.wallet_config DROP COLUMN IF EXISTS xaman_api_secret;

CREATE OR REPLACE FUNCTION public.stellar_public_config()
RETURNS TABLE (network text, rpc_url text, treasury_address text, enabled_wallets text[], walletconnect_project_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.network, w.rpc_url, w.treasury_address, w.enabled_wallets, w.walletconnect_project_id
  FROM public.wallet_config w
  WHERE w.id = 1
$$;

GRANT EXECUTE ON FUNCTION public.stellar_public_config() TO anon, authenticated;

DROP FUNCTION IF EXISTS public.xaman_public_config();