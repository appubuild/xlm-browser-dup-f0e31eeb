-- 1. founder role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'founder';

-- 2. pricing tiers
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  price_xrp numeric NOT NULL DEFAULT 0,
  billing_period text NOT NULL DEFAULT 'one_time',
  duration_days integer,
  features text[] NOT NULL DEFAULT '{}',
  highlight boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_tiers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_tiers TO authenticated;
GRANT ALL ON public.pricing_tiers TO service_role;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing_tiers_public_read" ON public.pricing_tiers FOR SELECT USING (true);
CREATE POLICY "pricing_tiers_admin_write" ON public.pricing_tiers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER pricing_tiers_updated BEFORE UPDATE ON public.pricing_tiers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.pricing_tiers (key,name,tagline,price_xrp,billing_period,duration_days,features,highlight,sort_order) VALUES
 ('founder','Founder Membership','One-time permanent account upgrade',2,'one_time',NULL,
  ARRAY['Permanent Founder account status','Founder Badge on your profile and listings','Project submission dashboard access','Basic project analytics'],true,1),
 ('verified_company','Verified Company Badge','High-trust company verification',10,'one_time',NULL,
  ARRAY['High-trust verified badge','Priority in search over unverified listings','Eligible for the verified search filter','Company profile page'],false,2),
 ('boost','Boost Listing','7 days of category firepower',20,'duration',7,
  ARRAY['Featured in your project category','Search ranking boost','Trending section eligibility','Boost performance analytics'],false,3),
 ('spotlight','Homepage Spotlight','30 days on the homepage hero',50,'duration',30,
  ARRAY['Homepage hero / featured spot','Priority AI recommendation','Maximum impressions','Full impression reporting'],false,4),
 ('pro','Pro Membership','For active builders',100,'monthly',30,
  ARRAY['Unlimited project edits','Advanced analytics','SEO tools','Priority approval','Multi-project ownership'],false,5),
 ('enterprise','Enterprise Tier','For teams and protocols',500,'monthly',30,
  ARRAY['Unlimited team accounts','Direct API access','Custom integrations','Premium support'],false,6)
ON CONFLICT (key) DO NOTHING;

-- 3. promotional settings
CREATE TABLE IF NOT EXISTS public.promotional_settings (
  id integer PRIMARY KEY DEFAULT 1,
  free_founder_claim boolean NOT NULL DEFAULT false,
  claim_starts_at timestamptz,
  claim_ends_at timestamptz,
  claim_headline text NOT NULL DEFAULT 'Early-bird offer: claim your Founder Membership free',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promotional_settings_single CHECK (id = 1)
);
GRANT SELECT ON public.promotional_settings TO anon;
GRANT SELECT, UPDATE, INSERT ON public.promotional_settings TO authenticated;
GRANT ALL ON public.promotional_settings TO service_role;
ALTER TABLE public.promotional_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promo_public_read" ON public.promotional_settings FOR SELECT USING (true);
CREATE POLICY "promo_admin_write" ON public.promotional_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.promotional_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 4. founder memberships
CREATE TABLE IF NOT EXISTS public.founder_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'paid',
  tx_hash text,
  account text,
  amount_xrp numeric NOT NULL DEFAULT 0,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.founder_memberships TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.founder_memberships TO authenticated;
GRANT ALL ON public.founder_memberships TO service_role;
ALTER TABLE public.founder_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "founder_public_read" ON public.founder_memberships FOR SELECT USING (true);
CREATE POLICY "founder_admin_write" ON public.founder_memberships FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER founder_memberships_updated BEFORE UPDATE ON public.founder_memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. helper functions
CREATE OR REPLACE FUNCTION public.is_founder(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.founder_memberships WHERE user_id = _user_id AND revoked = false)
      OR public.has_role(_user_id,'admin');
$$;

CREATE OR REPLACE FUNCTION public.free_founder_claim_open()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT p.free_founder_claim
       AND (p.claim_starts_at IS NULL OR p.claim_starts_at <= now())
       AND (p.claim_ends_at IS NULL OR p.claim_ends_at > now())
    FROM public.promotional_settings p WHERE p.id = 1), false);
$$;

CREATE OR REPLACE FUNCTION public.claim_free_founder()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF NOT public.free_founder_claim_open() THEN RAISE EXCEPTION 'The free Founder claim is not active'; END IF;
  INSERT INTO public.founder_memberships (user_id, source, amount_xrp)
  VALUES (uid, 'claim', 0)
  ON CONFLICT (user_id) DO UPDATE SET revoked = false, source = 'claim', updated_at = now();
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'founder') ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.register_founder_payment(_tx_hash text, _amount numeric, _account text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _tx_hash IS NULL OR length(_tx_hash) < 10 THEN RAISE EXCEPTION 'A valid transaction hash is required'; END IF;
  INSERT INTO public.founder_memberships (user_id, source, tx_hash, account, amount_xrp)
  VALUES (uid, 'paid', _tx_hash, _account, COALESCE(_amount,0))
  ON CONFLICT (user_id) DO UPDATE SET revoked = false, source = 'paid',
    tx_hash = EXCLUDED.tx_hash, account = EXCLUDED.account, amount_xrp = EXCLUDED.amount_xrp, updated_at = now();
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'founder') ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_founder(_user_id uuid, _enabled boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

CREATE OR REPLACE FUNCTION public.admin_set_company_badge(_user_id uuid, _tier text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.author_profiles
     SET badge_tier = _tier,
         badge_since = CASE WHEN _tier IS NULL THEN NULL ELSE now() END,
         verified = _tier IS NOT NULL,
         updated_at = now()
   WHERE user_id = _user_id;
  RETURN true;
END; $$;

REVOKE ALL ON FUNCTION public.admin_set_founder(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_company_badge(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_founder(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_company_badge(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_free_founder() TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_founder_payment(text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_founder(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.free_founder_claim_open() TO authenticated, anon;