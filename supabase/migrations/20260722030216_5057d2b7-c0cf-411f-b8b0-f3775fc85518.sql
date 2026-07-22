
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.project_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.live_status AS ENUM ('Live', 'Beta', 'Coming Soon');
CREATE TYPE public.news_status AS ENUM ('draft', 'published');

-- =========================================================
-- Shared updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text,
  avatar text DEFAULT '🧑',
  wallet_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1), 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '🧑')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

-- =========================================================
-- USER ROLES
-- =========================================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Trigger for auth.users after has_role exists
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- CATEGORIES
-- =========================================================
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '📁',
  description text DEFAULT '',
  visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (visible = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- PROJECTS
-- =========================================================
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  logo text DEFAULT '🔗',
  category text NOT NULL,
  tagline text DEFAULT '',
  description text DEFAULT '',
  url text NOT NULL,
  screenshots text[] NOT NULL DEFAULT '{}',
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified boolean NOT NULL DEFAULT false,
  status project_status NOT NULL DEFAULT 'pending',
  featured boolean NOT NULL DEFAULT false,
  date_added date NOT NULL DEFAULT CURRENT_DATE,
  visits int NOT NULL DEFAULT 0,
  live_status live_status NOT NULL DEFAULT 'Live',
  submitter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitter_name text,
  submitter_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects public read approved" ON public.projects FOR SELECT USING (status = 'approved' OR submitter_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "auth users submit projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (submitter_id = auth.uid() AND status = 'pending');
CREATE POLICY "submitters update own pending" ON public.projects FOR UPDATE TO authenticated USING (submitter_id = auth.uid() AND status = 'pending') WITH CHECK (submitter_id = auth.uid());
CREATE POLICY "admins manage projects" ON public.projects FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- NEWS
-- =========================================================
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Announcements',
  author text NOT NULL DEFAULT 'Editorial',
  cover_image text DEFAULT '📰',
  excerpt text DEFAULT '',
  body text DEFAULT '',
  publish_date date NOT NULL DEFAULT CURRENT_DATE,
  status news_status NOT NULL DEFAULT 'draft',
  views int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news TO anon, authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news public read published" ON public.news FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage news" ON public.news FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_news_updated BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- TICKERS
-- =========================================================
CREATE TABLE public.tickers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  linked_project_slug text,
  sort_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tickers TO anon, authenticated;
GRANT ALL ON public.tickers TO service_role;
ALTER TABLE public.tickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickers public read" ON public.tickers FOR SELECT USING (visible = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage tickers" ON public.tickers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_tickers_updated BEFORE UPDATE ON public.tickers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- SIDEBAR MENU
-- =========================================================
CREATE TABLE public.sidebar_menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  icon text DEFAULT '📄',
  path text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  requires_auth boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sidebar_menu TO anon, authenticated;
GRANT ALL ON public.sidebar_menu TO service_role;
ALTER TABLE public.sidebar_menu ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sidebar public read" ON public.sidebar_menu FOR SELECT USING (visible = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage sidebar" ON public.sidebar_menu FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_sidebar_updated BEFORE UPDATE ON public.sidebar_menu FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- SITE SETTINGS (single row)
-- =========================================================
CREATE TABLE public.site_settings (
  id int PRIMARY KEY DEFAULT 1,
  site_name text NOT NULL DEFAULT 'XRPBrowser',
  meta_description text NOT NULL DEFAULT 'The search engine and browser for the XRP Ledger.',
  default_theme text NOT NULL DEFAULT 'light',
  allow_user_override boolean NOT NULL DEFAULT true,
  enable_submissions boolean NOT NULL DEFAULT true,
  enable_iframe boolean NOT NULL DEFAULT true,
  maintenance_mode boolean NOT NULL DEFAULT false,
  contact_email text DEFAULT 'partner@skipads.ai',
  contact_company text DEFAULT 'SkipAds AI LLC',
  contact_location text DEFAULT 'Detroit, MI · USA',
  auto_approve boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "admins update site_settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- LANDING SECTIONS
-- =========================================================
CREATE TABLE public.landing_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.landing_sections TO anon, authenticated;
GRANT ALL ON public.landing_sections TO service_role;
ALTER TABLE public.landing_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "landing public read" ON public.landing_sections FOR SELECT USING (visible = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage landing" ON public.landing_sections FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_landing_updated BEFORE UPDATE ON public.landing_sections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- BOOKMARKS
-- =========================================================
CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_slug)
);
GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own bookmarks" ON public.bookmarks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =========================================================
-- HISTORY
-- =========================================================
CREATE TABLE public.history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_slug text NOT NULL,
  visited_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.history TO authenticated;
GRANT ALL ON public.history TO service_role;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own history" ON public.history FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- null = global
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications TO anon;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications read" ON public.notifications FOR SELECT USING (user_id IS NULL OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users mark own read" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins manage notifications" ON public.notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- SEED DATA
-- =========================================================
INSERT INTO public.categories (slug, name, icon, description, sort_order) VALUES
('wallets','Wallets','👛','XRPL wallets and key managers',1),
('defi','DeFi','💱','DEXs, aggregators, lending',2),
('gaming','Gaming','🎮','On-ledger games and play-to-earn',3),
('infrastructure','Infrastructure','🛠️','Nodes, explorers, bridges',4),
('nfts','NFTs','🖼️','NFT marketplaces and collections',5),
('tools','Tools','🧰','Developer and analytics tools',6),
('dapps','dApps','📱','Decentralized applications',7),
('tokens','Tokens','🪙','Issued tokens on XRPL',8);

INSERT INTO public.projects (slug,name,logo,category,tagline,description,url,socials,verified,status,featured,date_added,visits,live_status) VALUES
('xaman','Xaman','👛','wallets','The self-custodial XRPL wallet','Xaman (formerly Xumm) is the most trusted self-custodial wallet for the XRP Ledger.','https://xaman.app','{"twitter":"https://twitter.com/xamanapp"}',true,'approved',true,'2024-01-10',12043,'Live'),
('sologenic','Sologenic','💱','defi','DEX & tokenized assets on XRPL','Sologenic offers a DEX, tokenization platform, and NFT marketplace built on the XRP Ledger.','https://sologenic.org','{"twitter":"https://twitter.com/realsologenic"}',true,'approved',true,'2024-02-01',9821,'Live'),
('xrpscan','XRPScan','🔎','infrastructure','The XRP Ledger explorer','Explore accounts, ledgers, transactions and validators on the XRPL mainnet.','https://xrpscan.com','{}',true,'approved',true,'2023-11-15',22188,'Live'),
('bithomp','Bithomp','🌐','infrastructure','XRPL explorer & services','Bithomp provides ledger exploration, NFT tools and services for the XRPL ecosystem.','https://bithomp.com','{}',true,'approved',false,'2023-12-01',8321,'Live'),
('xrp-chess','XRP Chess','♞','gaming','On-ledger chess with XRP wagers','Play chess with XRP wagers settled directly on the XRP Ledger.','https://xrpchess.com','{"twitter":"https://twitter.com/xrpchess"}',true,'approved',true,'2024-05-20',3421,'Live'),
('gatehub','GateHub','🏦','wallets','Web wallet & gateway','GateHub is a web wallet and gateway for XRP and IOUs.','https://gatehub.net','{}',true,'approved',false,'2023-10-10',5522,'Live'),
('crossmark','Crossmark','✳️','wallets','Browser extension wallet for XRPL','A modern browser extension wallet for signing XRPL transactions.','https://crossmark.io','{}',true,'approved',false,'2024-03-15',4110,'Live'),
('onthedex','OnTheDEX','📈','defi','XRPL DEX market data','Market data, charts and analytics for the XRPL native DEX.','https://onthedex.live','{}',true,'approved',false,'2024-01-22',2891,'Live'),
('xrpl-labs','XRPL Labs','🔬','tools','Tools & products for XRPL','Makers of Xaman and other XRPL developer tools.','https://xrpl-labs.com','{}',true,'approved',false,'2023-09-01',3299,'Live'),
('onxrp','onXRP','🎨','nfts','NFT marketplace on XRPL','Mint, buy and sell NFTs on the XRP Ledger.','https://onxrp.com','{}',true,'approved',true,'2024-02-18',6110,'Live'),
('xrpcafe','xrp.cafe','☕','nfts','Community NFT marketplace','A community-driven NFT marketplace built for XRPL creators.','https://xrp.cafe','{}',true,'approved',false,'2024-04-01',4821,'Live'),
('csc','CasinoCoin','🎰','tokens','Gaming-focused XRPL token','A regulated gaming token on the XRP Ledger.','https://casinocoin.org','{}',false,'approved',false,'2023-08-14',1211,'Live'),
('flr-bridge','Flare Bridge','🌉','infrastructure','Bridge XRPL to Flare Network','A bridge connecting XRPL assets to the Flare Network.','https://flare.network','{}',false,'approved',false,'2024-03-05',1822,'Beta'),
('xrptoolkit','XRP Toolkit','🧰','tools','Manage XRPL accounts','Web tool to manage XRPL accounts, sign and trade on the DEX.','https://www.xrptoolkit.com','{}',true,'approved',false,'2023-07-19',3901,'Live'),
('orchestra-finance','Orchestra Finance','🎼','defi','Bond issuance on XRPL','Tokenized bonds and fixed income on the XRP Ledger.','https://orchestra.finance','{}',false,'approved',false,'2024-05-01',942,'Beta'),
('xrpl-services','XRPL Services','🛰️','tools','NFT & trustline tools','Utility site for XRPL NFT minting, trustlines and account setup.','https://xrpl.services','{}',true,'approved',false,'2023-06-01',2711,'Live'),
('ledger-live-xrp','Ledger Live XRP','🔐','wallets','Hardware wallet support for XRP','Manage XRP using Ledger hardware wallets.','https://ledger.com','{}',true,'approved',false,'2023-05-01',6612,'Live'),
('sonar-muse','Sonar Muse','🎧','dapps','Web3 music streaming on XRPL','Decentralized music streaming powered by the XRP Ledger.','https://sonarmuse.org','{}',false,'approved',false,'2024-04-22',812,'Live');

INSERT INTO public.news (slug,title,category,author,cover_image,excerpt,body,publish_date,status,views) VALUES
('xrpl-amm-launch','XRPL AMM amendment activates on Mainnet','Announcements','XRPL Foundation','📰','The long-anticipated AMM amendment has activated across the XRPL Mainnet.','The XRPL AMM amendment officially activated today, bringing native on-ledger automated market making to the XRP Ledger.','2024-05-30','published',5210),
('ripple-partnership-bank','Ripple announces new banking partnership in APAC','Partnerships','Editorial','🤝','Ripple expands ODL corridors with a new banking partner in Southeast Asia.','Ripple continues to expand its On-Demand Liquidity network...','2024-05-24','published',3410),
('xahau-sidechain','Xahau sidechain gains new hooks','Updates','Dev Team','🪝','The Xahau sidechain adds new hook functionality for developers.','Xahau devs deployed new hooks this week...','2024-05-18','published',1988),
('xrp-market-analysis-q2','XRP market analysis: Q2 recap','Market','Analyst Desk','📊','A look at XRPs Q2 performance and on-ledger metrics.','Q2 saw XRP trade in a defined range while on-ledger activity climbed...','2024-05-12','published',4102),
('xrpchess-launch','XRP Chess launches wagered play','Announcements','XRP Chess Team','♞','Play chess with XRP wagers settled instantly on the ledger.','XRP Chess opens its wagered play mode to the public...','2024-05-05','published',2801),
('nft-standard-update','XLS-20 NFT standard sees rapid growth','Updates','Editorial','🖼️','NFT mint volume on XRPL climbs to new highs.','Ledger activity for NFTs continues to accelerate...','2024-04-28','published',1502);

INSERT INTO public.tickers (label, linked_project_slug, sort_order) VALUES
('XRP $0.52 (+3.12%)', NULL, 1),
('LEDGER #89234501 CLOSED', NULL, 2),
('NEW: XRPCHESS.COM ADDED','xrp-chess', 3),
('XAMAN v2.6 RELEASED','xaman', 4),
('SOLOGENIC DEX 24H VOL +12%','sologenic', 5);

INSERT INTO public.sidebar_menu (label,icon,path,sort_order,requires_auth) VALUES
('Home','🏠','/',1,false),
('Search','🔍','/search',2,false),
('Ecosystem','🌐','/ecosystem',3,false),
('News','📰','/news',4,false),
('Developers','⌨️','/developers',5,false),
('Submit Project','➕','/submit',6,false),
('Bookmarks','⭐','/panel/bookmarks',7,true),
('History','🕘','/panel/history',8,true),
('Settings','⚙️','/panel/settings',9,true),
('Help','❔','/help',10,false);

INSERT INTO public.landing_sections (section_key, title, subtitle, sort_order, config) VALUES
('hero','Discover the XRP Ledger.','Search, preview and explore XRPL projects — without leaving the browser.',1,'{"searchPlaceholder":"Search XRPL projects, tokens, wallets..."}'),
('trending','Trending on XRPL','Hot right now in the ecosystem.',2,'{"limit":6}'),
('featured','Featured Projects','Hand-picked by the XRPBrowser team.',3,'{"limit":6}'),
('categories','Browse by Category','Eight curated corners of the XRP Ledger universe.',4,'{}'),
('news','Latest News','Fresh from the XRPL ecosystem.',5,'{"limit":4}');

INSERT INTO public.site_settings (id) VALUES (1);
