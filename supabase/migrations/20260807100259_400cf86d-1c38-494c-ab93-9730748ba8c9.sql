INSERT INTO public.nav_menus (label, path, icon, location, sort_order, visible, external, requires_auth)
VALUES ('Markets', '/markets', '📈', 'header', 2, true, false, false);
UPDATE public.nav_menus SET sort_order = sort_order + 1 WHERE location = 'header' AND path IN ('/news','/developers');