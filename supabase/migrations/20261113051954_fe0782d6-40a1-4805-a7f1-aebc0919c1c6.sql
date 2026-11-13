CREATE TABLE public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_path text NOT NULL UNIQUE,
  content_type text NOT NULL DEFAULT 'image/png',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_images TO authenticated;
GRANT ALL ON public.gallery_images TO service_role;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view gallery" ON public.gallery_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage gallery" ON public.gallery_images FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins upload gallery files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='gallery' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete gallery files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='gallery' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read gallery files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='gallery' AND public.has_role(auth.uid(),'admin'));