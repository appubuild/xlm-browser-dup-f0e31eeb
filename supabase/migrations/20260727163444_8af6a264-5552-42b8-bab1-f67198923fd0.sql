-- 1. AUTHOR PROFILES ---------------------------------------------------------
CREATE TABLE public.author_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  company_name text NOT NULL,
  slug text UNIQUE,
  logo text,
  bio text,
  official_email text,
  website text,
  socials jsonb NOT NULL DEFAULT '[]'::jsonb,
  badge_tier text,
  badge_since timestamptz,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.author_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.author_profiles TO authenticated;
GRANT ALL ON public.author_profiles TO service_role;
ALTER TABLE public.author_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "author_profiles public read" ON public.author_profiles FOR SELECT USING (true);
CREATE POLICY "author_profiles owner insert" ON public.author_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "author_profiles owner update" ON public.author_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "author_profiles admin delete" ON public.author_profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER author_profiles_updated_at BEFORE UPDATE ON public.author_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. BADGE TIERS --------------------------------------------------------------
CREATE TABLE public.badge_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  price_xrp numeric NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT 'sky',
  benefits text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badge_tiers TO anon;
GRANT SELECT ON public.badge_tiers TO authenticated;
GRANT ALL ON public.badge_tiers TO service_role;
ALTER TABLE public.badge_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badge_tiers public read" ON public.badge_tiers FOR SELECT USING (true);
CREATE POLICY "badge_tiers admin write" ON public.badge_tiers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER badge_tiers_updated_at BEFORE UPDATE ON public.badge_tiers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT INSERT, UPDATE, DELETE ON public.badge_tiers TO authenticated;

-- 3. PROMOTION PACKAGES -------------------------------------------------------
CREATE TABLE public.promotion_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot text NOT NULL,
  duration_days integer NOT NULL,
  price_xrp numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slot, duration_days)
);
GRANT SELECT ON public.promotion_packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotion_packages TO authenticated;
GRANT ALL ON public.promotion_packages TO service_role;
ALTER TABLE public.promotion_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promotion_packages public read" ON public.promotion_packages FOR SELECT USING (true);
CREATE POLICY "promotion_packages admin write" ON public.promotion_packages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER promotion_packages_updated_at BEFORE UPDATE ON public.promotion_packages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. BADGE PURCHASES ----------------------------------------------------------
CREATE TABLE public.badge_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier_key text NOT NULL,
  amount_xrp numeric NOT NULL DEFAULT 0,
  tx_hash text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.badge_purchases TO authenticated;
GRANT ALL ON public.badge_purchases TO service_role;
ALTER TABLE public.badge_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badge_purchases own read" ON public.badge_purchases FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "badge_purchases own insert" ON public.badge_purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "badge_purchases admin update" ON public.badge_purchases FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR auth.uid() = user_id) WITH CHECK (public.has_role(auth.uid(),'admin') OR auth.uid() = user_id);
CREATE TRIGGER badge_purchases_updated_at BEFORE UPDATE ON public.badge_purchases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. PROJECT PROMOTIONS -------------------------------------------------------
CREATE TABLE public.project_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_slug text NOT NULL,
  user_id uuid NOT NULL,
  slot text NOT NULL,
  duration_days integer NOT NULL,
  amount_xrp numeric NOT NULL DEFAULT 0,
  tx_hash text,
  status text NOT NULL DEFAULT 'pending',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.project_promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_promotions TO authenticated;
GRANT ALL ON public.project_promotions TO service_role;
ALTER TABLE public.project_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_promotions active public read" ON public.project_promotions FOR SELECT USING (status = 'active' AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "project_promotions own read" ON public.project_promotions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "project_promotions own insert" ON public.project_promotions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "project_promotions update" ON public.project_promotions FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "project_promotions admin delete" ON public.project_promotions FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER project_promotions_updated_at BEFORE UPDATE ON public.project_promotions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. TRANSACTIONS -------------------------------------------------------------
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  description text,
  reference_id text,
  amount_xrp numeric NOT NULL DEFAULT 0,
  tx_hash text,
  account text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions own read" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "transactions own insert" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions update" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. SEED DEFAULTS ------------------------------------------------------------
INSERT INTO public.badge_tiers (key, name, price_xrp, color, benefits, sort_order) VALUES
  ('verified', 'Verified', 25, 'sky', ARRAY['Verified checkmark on every listed project','Priority moderation review','Author profile page with company details'], 1),
  ('pro', 'Pro', 75, 'violet', ARRAY['Everything in Verified','Boosted search ranking','Random homepage spotlight rotation','Pro badge on all projects'], 2),
  ('enterprise', 'Enterprise', 200, 'amber', ARRAY['Everything in Pro','Top-tier search ranking boost','Permanent homepage spotlight eligibility','Enterprise badge + featured author profile','Direct support channel'], 3);

INSERT INTO public.promotion_packages (slot, duration_days, price_xrp, sort_order) VALUES
  ('home', 7, 15, 1), ('home', 30, 45, 2),
  ('trending', 7, 10, 3), ('trending', 30, 30, 4),
  ('popular', 7, 8, 5), ('popular', 30, 24, 6);