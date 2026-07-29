-- ============ Project comments ============
CREATE TABLE public.project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_slug text NOT NULL,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.project_comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  mentions text[] NOT NULL DEFAULT '{}',
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_project_comments_slug ON public.project_comments(project_slug, created_at DESC);
CREATE INDEX idx_project_comments_parent ON public.project_comments(parent_id);

GRANT SELECT ON public.project_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_comments TO authenticated;
GRANT ALL ON public.project_comments TO service_role;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are publicly readable" ON public.project_comments FOR SELECT USING (true);
CREATE POLICY "Users can post comments" ON public.project_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit own comments" ON public.project_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users can delete own comments" ON public.project_comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_project_comments_updated BEFORE UPDATE ON public.project_comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Comment votes ============
CREATE TABLE public.comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.project_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  value smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);
CREATE INDEX idx_comment_votes_comment ON public.comment_votes(comment_id);

GRANT SELECT ON public.comment_votes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comment_votes TO authenticated;
GRANT ALL ON public.comment_votes TO service_role;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are publicly readable" ON public.comment_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.comment_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND value IN (-1,1));
CREATE POLICY "Users can change own vote" ON public.comment_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND value IN (-1,1));
CREATE POLICY "Users can remove own vote" ON public.comment_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ Dynamic navigation menus (header / panel sidebar) ============
CREATE TABLE public.nav_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL DEFAULT 'header',
  parent_id uuid REFERENCES public.nav_menus(id) ON DELETE CASCADE,
  label text NOT NULL,
  icon text,
  path text NOT NULL DEFAULT '#',
  external boolean NOT NULL DEFAULT false,
  requires_auth boolean NOT NULL DEFAULT false,
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_nav_menus_location ON public.nav_menus(location, sort_order);

GRANT SELECT ON public.nav_menus TO anon;
GRANT SELECT ON public.nav_menus TO authenticated;
GRANT ALL ON public.nav_menus TO service_role;
ALTER TABLE public.nav_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Menus are publicly readable" ON public.nav_menus FOR SELECT USING (true);
CREATE POLICY "Admins manage menus" ON public.nav_menus FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT INSERT, UPDATE, DELETE ON public.nav_menus TO authenticated;

CREATE TRIGGER trg_nav_menus_updated BEFORE UPDATE ON public.nav_menus FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.nav_menus (location, label, icon, path, sort_order) VALUES
  ('header','Ecosystem','🌐','/ecosystem',1),
  ('header','News','📰','/news',2),
  ('header','Developers','⚙️','/developers',3);

INSERT INTO public.nav_menus (location, label, icon, path, sort_order, requires_auth) VALUES
  ('panel','Dashboard','📊','/panel',1,true),
  ('panel','Analytics','📈','/panel/analytics',2,true),
  ('panel','Bookmarks','🔖','/panel/bookmarks',3,true),
  ('panel','History','🕐','/panel/history',4,true),
  ('panel','My Projects','📤','/panel/submissions',5,true),
  ('panel','Company Profile','🏢','/panel/company',6,true),
  ('panel','Transactions','💳','/panel/transactions',7,true),
  ('panel','Notifications','🔔','/panel/notifications',8,true),
  ('panel','Settings','⚙️','/panel/settings',9,true);