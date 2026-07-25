
CREATE TABLE public.footer_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.footer_groups TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.footer_groups TO authenticated;
GRANT ALL ON public.footer_groups TO service_role;
ALTER TABLE public.footer_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "footer_groups read all" ON public.footer_groups FOR SELECT USING (true);
CREATE POLICY "footer_groups admin write" ON public.footer_groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.footer_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.footer_groups(id) ON DELETE CASCADE,
  label text NOT NULL,
  href text NOT NULL,
  external boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.footer_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.footer_links TO authenticated;
GRANT ALL ON public.footer_links TO service_role;
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "footer_links read all" ON public.footer_links FOR SELECT USING (true);
CREATE POLICY "footer_links admin write" ON public.footer_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at_footer()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_footer_groups_updated BEFORE UPDATE ON public.footer_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_footer();
CREATE TRIGGER trg_footer_links_updated BEFORE UPDATE ON public.footer_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_footer();

-- Seed defaults
WITH g AS (
  INSERT INTO public.footer_groups (label, sort_order) VALUES
    ('Company', 1), ('Legal', 2), ('Developers', 3), ('Social', 4)
  RETURNING id, label
)
INSERT INTO public.footer_links (group_id, label, href, external, sort_order)
SELECT g.id, v.label, v.href, v.external, v.sort_order
FROM g JOIN (VALUES
  ('Company','About','/about',false,1),
  ('Company','Contact','/help',false,2),
  ('Legal','Privacy Policy','/privacy',false,1),
  ('Legal','Terms of Service','/terms',false,2),
  ('Developers','Developer Hub','/developers',false,1),
  ('Developers','Developer API','/developers/api',false,2),
  ('Social','Twitter','https://twitter.com',true,1),
  ('Social','Discord','https://discord.com',true,2),
  ('Social','Telegram','https://telegram.org',true,3),
  ('Social','GitHub','https://github.com',true,4)
) AS v(group_label,label,href,external,sort_order)
ON g.label = v.group_label;
