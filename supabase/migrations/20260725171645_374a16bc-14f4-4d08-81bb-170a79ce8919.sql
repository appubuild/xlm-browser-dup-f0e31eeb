CREATE TABLE public.project_events (
  id uuid primary key default gen_random_uuid(),
  project_slug text not null,
  event_type text not null default 'view',
  user_id uuid,
  session_id text,
  referrer text,
  created_at timestamptz not null default now()
);
CREATE INDEX project_events_slug_idx ON public.project_events(project_slug);
CREATE INDEX project_events_created_idx ON public.project_events(created_at desc);
CREATE INDEX project_events_user_idx ON public.project_events(user_id);

GRANT SELECT, INSERT ON public.project_events TO anon;
GRANT SELECT, INSERT ON public.project_events TO authenticated;
GRANT ALL ON public.project_events TO service_role;
ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can log project events" ON public.project_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read project events" ON public.project_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owners read own project events" ON public.project_events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.slug = project_events.project_slug AND p.submitter_id = auth.uid())
);
CREATE POLICY "users read own events" ON public.project_events FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.search_events (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  project_slug text,
  position integer,
  clicked boolean not null default false,
  user_id uuid,
  session_id text,
  created_at timestamptz not null default now()
);
CREATE INDEX search_events_query_idx ON public.search_events(lower(query));
CREATE INDEX search_events_slug_idx ON public.search_events(project_slug);
CREATE INDEX search_events_created_idx ON public.search_events(created_at desc);

GRANT SELECT, INSERT ON public.search_events TO anon;
GRANT SELECT, INSERT ON public.search_events TO authenticated;
GRANT ALL ON public.search_events TO service_role;
ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can log search events" ON public.search_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anyone can read search events" ON public.search_events FOR SELECT TO anon, authenticated USING (true);