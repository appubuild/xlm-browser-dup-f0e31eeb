CREATE TABLE IF NOT EXISTS public.wallet_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  xaman_api_key text NOT NULL DEFAULT '',
  xaman_api_secret text NOT NULL DEFAULT '',
  treasury_address text NOT NULL DEFAULT '',
  network text NOT NULL DEFAULT 'Mainnet',
  rpc_url text NOT NULL DEFAULT 'https://xrplcluster.com',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.wallet_config TO authenticated;
GRANT ALL ON public.wallet_config TO service_role;

ALTER TABLE public.wallet_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage wallet config" ON public.wallet_config;
CREATE POLICY "Admins manage wallet config" ON public.wallet_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.wallet_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;