CREATE OR REPLACE FUNCTION public.xaman_public_config()
RETURNS TABLE (network text, rpc_url text, treasury_address text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.network, w.rpc_url, w.treasury_address
  FROM public.wallet_config w
  WHERE w.id = 1
$$;

REVOKE ALL ON FUNCTION public.xaman_public_config() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.xaman_public_config() TO anon, authenticated, service_role;