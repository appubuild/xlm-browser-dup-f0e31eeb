
CREATE TABLE IF NOT EXISTS public.ai_config (
  id INT PRIMARY KEY DEFAULT 1,
  provider TEXT NOT NULL DEFAULT 'openai',
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  openai_key TEXT DEFAULT '',
  anthropic_key TEXT DEFAULT '',
  google_key TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_config_singleton CHECK (id = 1)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_config TO authenticated;
GRANT ALL ON public.ai_config TO service_role;

ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read ai_config" ON public.ai_config
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update ai_config" ON public.ai_config
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins insert ai_config" ON public.ai_config
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.ai_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
