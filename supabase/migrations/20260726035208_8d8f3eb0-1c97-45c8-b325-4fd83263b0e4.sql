CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  meta_description text,
  published boolean NOT NULL DEFAULT true,
  show_in_footer boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pages_public_read" ON public.pages FOR SELECT USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "pages_admin_write" ON public.pages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.contact_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contact_reasons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_reasons TO authenticated;
GRANT ALL ON public.contact_reasons TO service_role;
ALTER TABLE public.contact_reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reasons_public_read" ON public.contact_reasons FOR SELECT USING (true);
CREATE POLICY "reasons_admin_write" ON public.contact_reasons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER contact_reasons_updated_at BEFORE UPDATE ON public.contact_reasons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  reason text NOT NULL DEFAULT 'General',
  subject text NOT NULL DEFAULT '',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_anyone_insert" ON public.contact_messages FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "messages_owner_read" ON public.contact_messages FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "messages_admin_update" ON public.contact_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "messages_admin_delete" ON public.contact_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER contact_messages_updated_at BEFORE UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.contact_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  author_id uuid,
  author_role text NOT NULL DEFAULT 'admin',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.contact_replies TO authenticated;
GRANT ALL ON public.contact_replies TO service_role;
ALTER TABLE public.contact_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "replies_read" ON public.contact_replies FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.contact_messages m WHERE m.id = message_id AND m.user_id = auth.uid())
);
CREATE POLICY "replies_insert" ON public.contact_replies FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid() AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.contact_messages m WHERE m.id = message_id AND m.user_id = auth.uid())
  )
);
CREATE POLICY "replies_admin_delete" ON public.contact_replies FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.contact_reasons (label, sort_order) VALUES
  ('General inquiry', 1),
  ('Project listing support', 2),
  ('Report a problem', 3),
  ('Partnership', 4),
  ('Billing / payment', 5);

INSERT INTO public.pages (slug, title, body, meta_description, published, show_in_footer, sort_order) VALUES
  ('contact', 'Contact', '<p>Have a question about XRPBrowser or your project listing? Send us a message and our team will get back to you.</p>', 'Contact the XRPBrowser team for listing support, partnerships and general questions.', true, true, 1);