-- Extend news table
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';

-- Blog categories
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_categories public read" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "blog_categories admin write" ON public.blog_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER blog_categories_updated BEFORE UPDATE ON public.blog_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Media gallery
CREATE TABLE IF NOT EXISTS public.media_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  filename TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  width INT,
  height INT,
  bytes INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media_gallery TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_gallery TO authenticated;
GRANT ALL ON public.media_gallery TO service_role;
ALTER TABLE public.media_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_gallery public read" ON public.media_gallery FOR SELECT USING (true);
CREATE POLICY "media_gallery insert authed" ON public.media_gallery FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "media_gallery admin write" ON public.media_gallery FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Default AI instruction for site
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS ai_default_instruction TEXT DEFAULT 'You are a helpful writer for XRPBrowser, an XRP Ledger discovery portal. Write clear, accurate, upbeat posts.';

-- Seed a few default blog categories
INSERT INTO public.blog_categories (name, slug, sort_order) VALUES
  ('Announcements','announcements',1),
  ('Partnerships','partnerships',2),
  ('Updates','updates',3),
  ('Market','market',4),
  ('Guides','guides',5)
ON CONFLICT (slug) DO NOTHING;