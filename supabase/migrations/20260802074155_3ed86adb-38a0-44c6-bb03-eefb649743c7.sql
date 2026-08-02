ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS enable_google_login boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_apple_login boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id uuid, _role app_role, _enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  IF _user_id = auth.uid() AND _role = 'admin' THEN
    RAISE EXCEPTION 'You cannot change your own admin role';
  END IF;
  IF _enabled THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;
  END IF;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_founder(_user_id uuid, _enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  IF _enabled THEN
    INSERT INTO public.founder_memberships (user_id, source, amount_xrp)
    VALUES (_user_id, 'admin', 0)
    ON CONFLICT (user_id) DO UPDATE SET revoked = false, source = 'admin', updated_at = now();
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'founder') ON CONFLICT DO NOTHING;
  ELSE
    UPDATE public.founder_memberships SET revoked = true, updated_at = now() WHERE user_id = _user_id;
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'founder';
  END IF;
  RETURN true;
END; $$;