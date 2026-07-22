
GRANT SELECT ON public.projects, public.categories, public.news, public.tickers, public.sidebar_menu, public.landing_sections, public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.projects, public.categories, public.news, public.tickers, public.sidebar_menu, public.landing_sections TO authenticated;
GRANT UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.projects, public.categories, public.news, public.tickers, public.sidebar_menu, public.landing_sections, public.site_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks, public.history, public.notifications, public.profiles, public.user_roles TO authenticated;
GRANT ALL ON public.bookmarks, public.history, public.notifications, public.profiles, public.user_roles TO service_role;
