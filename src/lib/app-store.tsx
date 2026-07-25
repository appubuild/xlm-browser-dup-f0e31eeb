import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type Theme = "light" | "dark";
export type ProjectStatus = "pending" | "approved" | "rejected";
export type LiveStatusVal = "Live" | "Beta" | "Coming Soon";

export interface Project {
  id: string;
  slug: string;
  name: string;
  logo: string;
  category: string;
  tagline: string;
  description: string;
  url: string;
  screenshots: string[];
  socials: Record<string, string>;
  verified: boolean;
  status: ProjectStatus;
  featured: boolean;
  dateAdded: string;
  visits: number;
  liveStatus: LiveStatusVal;
  submitterName?: string;
  submitterEmail?: string;
  submitterId?: string | null;
  aiDoc?: string;
  supportEmail?: string;
  isPublic: boolean;
  paymentTx?: string | null;
  paymentAmount?: number | null;
}

export interface Category { id: string; slug: string; name: string; icon: string; description: string; visible: boolean; sortOrder: number; }
export interface NewsArticle { id: string; slug: string; title: string; category: string; author: string; coverImage: string; coverImageUrl?: string; excerpt: string; body: string; publishDate: string; status: "draft" | "published"; views: number; metaDescription?: string; seoKeywords?: string; tags?: string[]; gallery?: string[]; }
export interface BlogCategory { id: string; slug: string; name: string; description: string; sortOrder: number; visible: boolean; }
export interface MediaAsset { id: string; url: string; filename?: string | null; tags?: string[]; createdAt: string; uploadedBy?: string | null; }
export interface Ticker { id: string; label: string; linkedProjectSlug?: string | null; sortOrder: number; visible: boolean; }
export interface SidebarItem { id: string; label: string; icon: string; path: string; sortOrder: number; visible: boolean; requiresAuth: boolean; }
export interface LandingSection { id: string; sectionKey: string; title: string; subtitle: string; visible: boolean; sortOrder: number; config: Record<string, unknown>; }
export interface AppNotification { id: string; message: string; ts: number; read: boolean; userId?: string | null; }

interface AuthUser { id: string; name: string; email: string; avatar: string; walletAddress?: string }

interface SiteSettings {
  siteName: string;
  metaDescription: string;
  defaultTheme: Theme;
  allowUserOverride: boolean;
  enableSubmissions: boolean;
  enableIframe: boolean;
  maintenanceMode: boolean;
  contactEmail: string;
  contactCompany: string;
  contactLocation: string;
  autoApprove: boolean;
  listingFeeXrp: number;
  listingPaymentAddress: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
  aiDefaultInstruction: string;
}

interface AppState {
  loading: boolean;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;

  session: Session | null;
  user: AuthUser | null;
  signInEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpEmail: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  connectWallet: (name: string, address?: string) => Promise<void> | void;
  disconnectWallet: () => void;

  isAdmin: boolean;

  projects: Project[];
  addProject: (p: Partial<Project> & { name: string; url: string; category: string; tagline: string; description: string; supportEmail: string; aiDoc?: string }) => Promise<Project | null>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  markProjectPaid: (id: string, tx: string, amount: number) => Promise<void>;

  news: NewsArticle[];
  addNews: (a: Omit<NewsArticle, "id" | "views">) => Promise<void>;
  updateNews: (id: string, patch: Partial<NewsArticle>) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;

  blogCategories: BlogCategory[];
  addBlogCategory: (c: Partial<BlogCategory> & { name: string; slug: string }) => Promise<void>;
  updateBlogCategory: (id: string, patch: Partial<BlogCategory>) => Promise<void>;
  deleteBlogCategory: (id: string) => Promise<void>;

  mediaGallery: MediaAsset[];
  addMedia: (m: { url: string; filename?: string; tags?: string[] }) => Promise<MediaAsset | null>;
  deleteMedia: (id: string) => Promise<void>;
  refreshMedia: () => Promise<void>;

  tickers: Ticker[];
  addTicker: (t: Partial<Ticker> & { label: string }) => Promise<void>;
  updateTicker: (id: string, patch: Partial<Ticker>) => Promise<void>;
  deleteTicker: (id: string) => Promise<void>;

  categories: Category[];
  addCategory: (c: Partial<Category> & { name: string; slug: string }) => Promise<void>;
  updateCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  sidebarItems: SidebarItem[];
  addSidebarItem: (s: Partial<SidebarItem> & { label: string; path: string }) => Promise<void>;
  updateSidebarItem: (id: string, patch: Partial<SidebarItem>) => Promise<void>;
  deleteSidebarItem: (id: string) => Promise<void>;
  reorderSidebar: (ids: string[]) => Promise<void>;

  landingSections: LandingSection[];
  updateLandingSection: (id: string, patch: Partial<LandingSection>) => Promise<void>;

  bookmarks: string[];
  toggleBookmark: (slug: string) => Promise<void>;

  history: { slug: string; ts: number }[];
  pushHistory: (slug: string) => Promise<void>;
  clearHistory: () => Promise<void>;

  notifications: AppNotification[];
  pushNotification: (message: string, global?: boolean) => Promise<void>;
  markAllRead: () => Promise<void>;

  siteSettings: SiteSettings;
  updateSiteSettings: (patch: Partial<SiteSettings>) => Promise<void>;

  walletConfig: { network: "Mainnet" | "Testnet"; rpcUrl: string; xamanApiKey: string; xamanApiSecret: string; treasuryAddress: string };
  updateWalletConfig: (patch: Partial<AppState["walletConfig"]>) => void;

  xrpPrice: { price: number; change: number };
  ledgerIndex: number;

  refresh: () => Promise<void>;

  // ---- Legacy compatibility (existing UI code) ----
  users: { id: string; name: string; email: string; avatar: string; role: "user" | "admin"; status: "active" | "suspended"; joinDate: string; submissionsCount: number }[];
  updateUser: (id: string, patch: Partial<{ name: string; email: string; avatar: string; role: "user" | "admin"; status: "active" | "suspended" }>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  login: (email: string) => void;
  adminLogin: () => void;
  adminLogout: () => Promise<void>;
  autoApprove: boolean;
  setAutoApprove: (v: boolean) => void;
  setCategories: (c: Category[]) => void;
  setTickers: (t: Ticker[]) => void;
}

const AppCtx = createContext<AppState | null>(null);

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "XRPBrowser", metaDescription: "The search engine and browser for the XRP Ledger.",
  defaultTheme: "light", allowUserOverride: true, enableSubmissions: true, enableIframe: true, maintenanceMode: false,
  contactEmail: "partner@skipads.ai", contactCompany: "SkipAds AI LLC", contactLocation: "Detroit, MI · USA", autoApprove: false,
  listingFeeXrp: 0, listingPaymentAddress: "",
  cloudinaryCloudName: "", cloudinaryUploadPreset: "",
  aiDefaultInstruction: "You are a helpful writer for XRPBrowser, an XRP Ledger discovery portal. Write clear, accurate, upbeat posts.",
};

type ProjectRow = {
  id: string; slug: string; name: string; logo: string | null; category: string; tagline: string | null;
  description: string | null; url: string; screenshots: string[] | null; socials: unknown;
  verified: boolean; status: ProjectStatus; featured: boolean; date_added: string; visits: number;
  live_status: LiveStatusVal; submitter_name: string | null; submitter_email: string | null; submitter_id: string | null;
  ai_doc?: string | null; support_email?: string | null; is_public?: boolean;
  payment_tx?: string | null; payment_amount?: number | null;
};

function mapProject(r: ProjectRow): Project {
  return {
    id: r.id, slug: r.slug, name: r.name, logo: r.logo ?? "🔗", category: r.category,
    tagline: r.tagline ?? "", description: r.description ?? "", url: r.url,
    screenshots: r.screenshots ?? [], socials: (r.socials as Project["socials"]) ?? {},
    verified: r.verified, status: r.status, featured: r.featured, dateAdded: r.date_added,
    visits: r.visits, liveStatus: r.live_status,
    submitterName: r.submitter_name ?? undefined, submitterEmail: r.submitter_email ?? undefined, submitterId: r.submitter_id,
    aiDoc: r.ai_doc ?? "", supportEmail: r.support_email ?? undefined,
    isPublic: !!r.is_public, paymentTx: r.payment_tx ?? null, paymentAmount: r.payment_amount ?? null,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [landingSections, setLandingSections] = useState<LandingSection[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [history, setHistory] = useState<{ slug: string; ts: number }[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [walletConfig, setWalletConfig] = useState<AppState["walletConfig"]>({
    network: "Mainnet", rpcUrl: "wss://s1.ripple.com",
    xamanApiKey: "", xamanApiSecret: "", treasuryAddress: "",
  });
  const [xrpPrice, setXrpPrice] = useState({ price: 0.52, change: 3.12 });
  const [ledgerIndex, setLedgerIndex] = useState(89234501);
  const [loading, setLoading] = useState(true);

  // --- Theme persistence
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("xrpb-theme") : null;
    if (saved === "light" || saved === "dark") setThemeState(saved);
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("xrpb-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("retro", theme === "dark");
  }, [theme, hydrated]);

  // --- Simulated live price/ledger
  useEffect(() => {
    const t = setInterval(() => {
      setXrpPrice((p) => ({ price: +(p.price + (Math.random() - 0.5) * 0.005).toFixed(4), change: +(p.change + (Math.random() - 0.5) * 0.4).toFixed(2) }));
      setLedgerIndex((n) => n + 1);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const loadPublicData = useCallback(async () => {
    const [pj, nw, tk, ct, sb, ls, ss, bc, mg] = await Promise.all([
      supabase.from("projects").select("*").order("date_added", { ascending: false }),
      supabase.from("news").select("*").order("publish_date", { ascending: false }),
      supabase.from("tickers").select("*").order("sort_order"),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("sidebar_menu").select("*").order("sort_order"),
      supabase.from("landing_sections").select("*").order("sort_order"),
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("blog_categories" as never).select("*").order("sort_order"),
      supabase.from("media_gallery" as never).select("*").order("created_at", { ascending: false }).limit(300),
    ]);
    if (pj.data) setProjects(pj.data.map((r) => mapProject(r as ProjectRow)));
    if (nw.data) setNews((nw.data as never[]).map((r) => mapNews(r)));
    if (tk.data) setTickers(tk.data.map((r) => ({ id: r.id, label: r.label, linkedProjectSlug: r.linked_project_slug, sortOrder: r.sort_order, visible: r.visible })));
    if (ct.data) setCategories(ct.data.map((r) => ({ id: r.id, slug: r.slug, name: r.name, icon: r.icon, description: r.description ?? "", visible: r.visible, sortOrder: r.sort_order })));
    if (sb.data) setSidebarItems(sb.data.map((r) => ({ id: r.id, label: r.label, icon: r.icon ?? "📄", path: r.path, sortOrder: r.sort_order, visible: r.visible, requiresAuth: r.requires_auth })));
    if (ls.data) setLandingSections(ls.data.map((r) => ({ id: r.id, sectionKey: r.section_key, title: r.title, subtitle: r.subtitle ?? "", visible: r.visible, sortOrder: r.sort_order, config: (r.config as Record<string, unknown>) ?? {} })));
    if (bc.data) setBlogCategories((bc.data as never[]).map((r: any) => ({ id: r.id, slug: r.slug, name: r.name, description: r.description ?? "", sortOrder: r.sort_order, visible: r.visible })));
    if (mg.data) setMediaGallery((mg.data as never[]).map((r: any) => ({ id: r.id, url: r.url, filename: r.filename, tags: r.tags ?? [], createdAt: r.created_at, uploadedBy: r.uploaded_by })));
    if (ss.data) {
      const s = ss.data as Record<string, unknown>;
      setSiteSettings({
        siteName: ss.data.site_name, metaDescription: ss.data.meta_description,
        defaultTheme: (ss.data.default_theme as Theme) ?? "light",
        allowUserOverride: ss.data.allow_user_override, enableSubmissions: ss.data.enable_submissions,
        enableIframe: ss.data.enable_iframe, maintenanceMode: ss.data.maintenance_mode,
        contactEmail: ss.data.contact_email ?? "", contactCompany: ss.data.contact_company ?? "",
        contactLocation: ss.data.contact_location ?? "", autoApprove: ss.data.auto_approve,
        listingFeeXrp: Number((s.listing_fee_xrp as number | string | null) ?? 0),
        listingPaymentAddress: (s.listing_payment_address as string | null) ?? "",
        cloudinaryCloudName: (s.cloudinary_cloud_name as string | null) ?? "",
        cloudinaryUploadPreset: (s.cloudinary_upload_preset as string | null) ?? "",
        aiDefaultInstruction: (s.ai_default_instruction as string | null) ?? DEFAULT_SETTINGS.aiDefaultInstruction,
      });
    }
  }, []);

  const loadUserData = useCallback(async (uid: string) => {
    const [bm, hs, nt, rl, pf] = await Promise.all([
      supabase.from("bookmarks").select("project_slug").eq("user_id", uid),
      supabase.from("history").select("project_slug,visited_at").eq("user_id", uid).order("visited_at", { ascending: false }).limit(100),
      supabase.from("notifications").select("*").or(`user_id.eq.${uid},user_id.is.null`).order("created_at", { ascending: false }).limit(50),
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    ]);
    if (bm.data) setBookmarks(bm.data.map((r) => r.project_slug));
    if (hs.data) setHistory(hs.data.map((r) => ({ slug: r.project_slug, ts: new Date(r.visited_at).getTime() })));
    if (nt.data) setNotifications(nt.data.map((r) => ({ id: r.id, message: r.message, ts: new Date(r.created_at).getTime(), read: r.read, userId: r.user_id })));
    setIsAdmin(!!rl.data?.some((r) => r.role === "admin"));
    if (pf.data) {
      setUser({ id: uid, name: pf.data.name || "User", email: pf.data.email ?? "", avatar: pf.data.avatar ?? "🧑", walletAddress: pf.data.wallet_address ?? undefined });
    }
  }, []);

  // Initial load + auth listener
  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadPublicData();
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(s);
      if (s?.user) await loadUserData(s.user.id);
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_OUT") {
        setUser(null); setIsAdmin(false); setBookmarks([]); setHistory([]); setNotifications([]);
      } else if (s?.user) {
        setTimeout(() => { loadUserData(s.user!.id); }, 0);
      }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [loadPublicData, loadUserData]);

  // ---- Auth
  const signInEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };
  const signUpEmail = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { name: name || email.split("@")[0] } },
    });
    return { error: error?.message };
  };
  const signInGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/` } });
  };
  const logout = async () => { await supabase.auth.signOut(); };

  const connectWallet = async (name: string, address?: string) => {
    const addr = address ?? `r${name.slice(0, 3).toUpperCase()}${Math.random().toString(36).slice(2, 10)}`;
    setUser((u) => (u ? { ...u, walletAddress: addr } : u));
    if (user?.id) await supabase.from("profiles").update({ wallet_address: addr }).eq("id", user.id);
  };
  const disconnectWallet = () => {
    setUser((u) => (u ? { ...u, walletAddress: undefined } : u));
    if (user?.id) supabase.from("profiles").update({ wallet_address: null }).eq("id", user.id).then(() => {});
  };

  // ---- Projects
  const addProject: AppState["addProject"] = async (p) => {
    if (!user) { return null; }
    const slug = (p.slug || p.name.toLowerCase().replace(/\s+/g, "-")).replace(/[^a-z0-9-]/g, "");
    const feeIsZero = !siteSettings.listingFeeXrp || siteSettings.listingFeeXrp <= 0;
    const { data, error } = await supabase.from("projects").insert({
      slug, name: p.name, logo: p.logo ?? "🔗", category: p.category, tagline: p.tagline,
      description: p.description, url: p.url, screenshots: p.screenshots ?? [],
      socials: p.socials ?? {}, live_status: p.liveStatus ?? "Live",
      submitter_id: user.id, submitter_name: user.name, submitter_email: user.email, status: "pending",
      ai_doc: p.aiDoc ?? "", support_email: p.supportEmail, is_public: false,
    } as never).select().single();
    if (error || !data) return null;
    const proj = mapProject(data as ProjectRow);
    setProjects((ps) => [proj, ...ps]);
    if (siteSettings.autoApprove) {
      setTimeout(async () => {
        const upd: Record<string, unknown> = { status: "approved" };
        if (feeIsZero) upd.is_public = true;
        await supabase.from("projects").update(upd as never).eq("id", proj.id);
        setProjects((ps) => ps.map((x) => (x.id === proj.id ? { ...x, status: "approved", isPublic: feeIsZero ? true : x.isPublic } : x)));
      }, 3000);
    }
    return proj;
  };
  const updateProject = async (id: string, patch: Partial<Project>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.slug !== undefined) dbPatch.slug = patch.slug;
    if (patch.logo !== undefined) dbPatch.logo = patch.logo;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.tagline !== undefined) dbPatch.tagline = patch.tagline;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.url !== undefined) dbPatch.url = patch.url;
    if (patch.screenshots !== undefined) dbPatch.screenshots = patch.screenshots;
    if (patch.socials !== undefined) dbPatch.socials = patch.socials;
    if (patch.verified !== undefined) dbPatch.verified = patch.verified;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.featured !== undefined) dbPatch.featured = patch.featured;
    if (patch.liveStatus !== undefined) dbPatch.live_status = patch.liveStatus;
    if (patch.visits !== undefined) dbPatch.visits = patch.visits;
    if (patch.aiDoc !== undefined) dbPatch.ai_doc = patch.aiDoc;
    if (patch.supportEmail !== undefined) dbPatch.support_email = patch.supportEmail;
    if (patch.isPublic !== undefined) dbPatch.is_public = patch.isPublic;

    // Auto-publish on approval when listing fee is zero (free listings).
    const feeIsZero = !siteSettings.listingFeeXrp || siteSettings.listingFeeXrp <= 0;
    const autoPub = patch.status === "approved" && feeIsZero && patch.isPublic === undefined;
    if (autoPub) dbPatch.is_public = true;

    const { error } = await supabase.from("projects").update(dbPatch as never).eq("id", id);
    if (!error) setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch, ...(autoPub ? { isPublic: true } : {}) } : p)));
  };
  const markProjectPaid = async (id: string, tx: string, amount: number) => {
    const dbPatch = { payment_tx: tx, payment_amount: amount, payment_at: new Date().toISOString(), is_public: true };
    const { error } = await supabase.from("projects").update(dbPatch as never).eq("id", id);
    if (!error) setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, paymentTx: tx, paymentAmount: amount, isPublic: true } : p)));
  };
  const deleteProject = async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    setProjects((ps) => ps.filter((p) => p.id !== id));
  };

  // ---- News
  const addNews: AppState["addNews"] = async (a) => {
    const { data } = await supabase.from("news").insert({
      slug: a.slug, title: a.title, category: a.category, author: a.author, cover_image: a.coverImage,
      excerpt: a.excerpt, body: a.body, publish_date: a.publishDate, status: a.status,
    }).select().single();
    if (data) setNews((n) => [{ id: data.id, slug: data.slug, title: data.title, category: data.category, author: data.author, coverImage: data.cover_image ?? "📰", excerpt: data.excerpt ?? "", body: data.body ?? "", publishDate: data.publish_date, status: data.status, views: data.views }, ...n]);
  };
  const updateNews = async (id: string, patch: Partial<NewsArticle>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.slug !== undefined) dbPatch.slug = patch.slug;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.author !== undefined) dbPatch.author = patch.author;
    if (patch.coverImage !== undefined) dbPatch.cover_image = patch.coverImage;
    if (patch.excerpt !== undefined) dbPatch.excerpt = patch.excerpt;
    if (patch.body !== undefined) dbPatch.body = patch.body;
    if (patch.publishDate !== undefined) dbPatch.publish_date = patch.publishDate;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    await supabase.from("news").update(dbPatch as never).eq("id", id);
    setNews((n) => n.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };
  const deleteNews = async (id: string) => {
    await supabase.from("news").delete().eq("id", id);
    setNews((n) => n.filter((x) => x.id !== id));
  };

  // ---- Tickers
  const addTicker: AppState["addTicker"] = async (t) => {
    const { data } = await supabase.from("tickers").insert({
      label: t.label, linked_project_slug: t.linkedProjectSlug ?? null,
      sort_order: t.sortOrder ?? (tickers.length + 1), visible: t.visible ?? true,
    }).select().single();
    if (data) setTickers((xs) => [...xs, { id: data.id, label: data.label, linkedProjectSlug: data.linked_project_slug, sortOrder: data.sort_order, visible: data.visible }]);
  };
  const updateTicker = async (id: string, patch: Partial<Ticker>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.label !== undefined) dbPatch.label = patch.label;
    if (patch.linkedProjectSlug !== undefined) dbPatch.linked_project_slug = patch.linkedProjectSlug;
    if (patch.sortOrder !== undefined) dbPatch.sort_order = patch.sortOrder;
    if (patch.visible !== undefined) dbPatch.visible = patch.visible;
    await supabase.from("tickers").update(dbPatch as never).eq("id", id);
    setTickers((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };
  const deleteTicker = async (id: string) => {
    await supabase.from("tickers").delete().eq("id", id);
    setTickers((xs) => xs.filter((x) => x.id !== id));
  };

  // ---- Categories
  const addCategory: AppState["addCategory"] = async (c) => {
    const { data } = await supabase.from("categories").insert({
      slug: c.slug, name: c.name, icon: c.icon ?? "📁", description: c.description ?? "",
      visible: c.visible ?? true, sort_order: c.sortOrder ?? (categories.length + 1),
    }).select().single();
    if (data) setCategories((xs) => [...xs, { id: data.id, slug: data.slug, name: data.name, icon: data.icon, description: data.description ?? "", visible: data.visible, sortOrder: data.sort_order }]);
  };
  const updateCategory = async (id: string, patch: Partial<Category>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.slug !== undefined) dbPatch.slug = patch.slug;
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.icon !== undefined) dbPatch.icon = patch.icon;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.visible !== undefined) dbPatch.visible = patch.visible;
    if (patch.sortOrder !== undefined) dbPatch.sort_order = patch.sortOrder;
    await supabase.from("categories").update(dbPatch as never).eq("id", id);
    setCategories((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };
  const deleteCategory = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    setCategories((xs) => xs.filter((x) => x.id !== id));
  };

  // ---- Sidebar
  const addSidebarItem: AppState["addSidebarItem"] = async (s) => {
    const { data } = await supabase.from("sidebar_menu").insert({
      label: s.label, icon: s.icon ?? "📄", path: s.path,
      sort_order: s.sortOrder ?? (sidebarItems.length + 1),
      visible: s.visible ?? true, requires_auth: s.requiresAuth ?? false,
    }).select().single();
    if (data) setSidebarItems((xs) => [...xs, { id: data.id, label: data.label, icon: data.icon ?? "📄", path: data.path, sortOrder: data.sort_order, visible: data.visible, requiresAuth: data.requires_auth }]);
  };
  const updateSidebarItem = async (id: string, patch: Partial<SidebarItem>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.label !== undefined) dbPatch.label = patch.label;
    if (patch.icon !== undefined) dbPatch.icon = patch.icon;
    if (patch.path !== undefined) dbPatch.path = patch.path;
    if (patch.sortOrder !== undefined) dbPatch.sort_order = patch.sortOrder;
    if (patch.visible !== undefined) dbPatch.visible = patch.visible;
    if (patch.requiresAuth !== undefined) dbPatch.requires_auth = patch.requiresAuth;
    await supabase.from("sidebar_menu").update(dbPatch as never).eq("id", id);
    setSidebarItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };
  const deleteSidebarItem = async (id: string) => {
    await supabase.from("sidebar_menu").delete().eq("id", id);
    setSidebarItems((xs) => xs.filter((x) => x.id !== id));
  };
  const reorderSidebar = async (ids: string[]) => {
    await Promise.all(ids.map((id, i) => supabase.from("sidebar_menu").update({ sort_order: i + 1 }).eq("id", id)));
    setSidebarItems((xs) => [...xs].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)).map((x, i) => ({ ...x, sortOrder: i + 1 })));
  };

  // ---- Landing sections
  const updateLandingSection = async (id: string, patch: Partial<LandingSection>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.subtitle !== undefined) dbPatch.subtitle = patch.subtitle;
    if (patch.visible !== undefined) dbPatch.visible = patch.visible;
    if (patch.sortOrder !== undefined) dbPatch.sort_order = patch.sortOrder;
    if (patch.config !== undefined) dbPatch.config = patch.config;
    await supabase.from("landing_sections").update(dbPatch as never).eq("id", id);
    setLandingSections((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  // ---- Bookmarks
  const toggleBookmark = async (slug: string) => {
    if (!user) return;
    if (bookmarks.includes(slug)) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("project_slug", slug);
      setBookmarks((b) => b.filter((s) => s !== slug));
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, project_slug: slug });
      setBookmarks((b) => [...b, slug]);
    }
  };

  // ---- History
  const pushHistory = async (slug: string) => {
    setHistory((h) => [{ slug, ts: Date.now() }, ...h.filter((x) => x.slug !== slug)].slice(0, 100));
    if (user) await supabase.from("history").insert({ user_id: user.id, project_slug: slug });
  };
  const clearHistory = async () => {
    setHistory([]);
    if (user) await supabase.from("history").delete().eq("user_id", user.id);
  };

  // ---- Notifications
  const pushNotification = async (message: string, global = false) => {
    if (isAdmin && global) {
      const { data } = await supabase.from("notifications").insert({ message, user_id: null }).select().single();
      if (data) setNotifications((n) => [{ id: data.id, message: data.message, ts: new Date(data.created_at).getTime(), read: false, userId: null }, ...n]);
    } else if (user) {
      const { data } = await supabase.from("notifications").insert({ message, user_id: user.id }).select().single();
      if (data) setNotifications((n) => [{ id: data.id, message: data.message, ts: new Date(data.created_at).getTime(), read: false, userId: user.id }, ...n]);
    }
  };
  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  };

  // ---- Site settings
  const updateSiteSettings = async (patch: Partial<SiteSettings>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.siteName !== undefined) dbPatch.site_name = patch.siteName;
    if (patch.metaDescription !== undefined) dbPatch.meta_description = patch.metaDescription;
    if (patch.defaultTheme !== undefined) dbPatch.default_theme = patch.defaultTheme;
    if (patch.allowUserOverride !== undefined) dbPatch.allow_user_override = patch.allowUserOverride;
    if (patch.enableSubmissions !== undefined) dbPatch.enable_submissions = patch.enableSubmissions;
    if (patch.enableIframe !== undefined) dbPatch.enable_iframe = patch.enableIframe;
    if (patch.maintenanceMode !== undefined) dbPatch.maintenance_mode = patch.maintenanceMode;
    if (patch.contactEmail !== undefined) dbPatch.contact_email = patch.contactEmail;
    if (patch.contactCompany !== undefined) dbPatch.contact_company = patch.contactCompany;
    if (patch.contactLocation !== undefined) dbPatch.contact_location = patch.contactLocation;
    if (patch.autoApprove !== undefined) dbPatch.auto_approve = patch.autoApprove;
    if (patch.listingFeeXrp !== undefined) dbPatch.listing_fee_xrp = patch.listingFeeXrp;
    if (patch.listingPaymentAddress !== undefined) dbPatch.listing_payment_address = patch.listingPaymentAddress;
    if (patch.cloudinaryCloudName !== undefined) dbPatch.cloudinary_cloud_name = patch.cloudinaryCloudName;
    if (patch.cloudinaryUploadPreset !== undefined) dbPatch.cloudinary_upload_preset = patch.cloudinaryUploadPreset;
    await supabase.from("site_settings").update(dbPatch as never).eq("id", 1);
    setSiteSettings((s) => ({ ...s, ...patch }));
  };

  const updateWalletConfig = (patch: Partial<AppState["walletConfig"]>) => setWalletConfig((s) => ({ ...s, ...patch }));

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState((t) => (t === "light" ? "dark" : "light"));

  const refresh = useCallback(async () => {
    await loadPublicData();
    if (user) await loadUserData(user.id);
  }, [loadPublicData, loadUserData, user]);

  // ---- Legacy compat (admin/users list from profiles + user_roles)
  const [usersList, setUsersList] = useState<AppState["users"]>([]);
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [pf, rl] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      const roleMap = new Map<string, "admin" | "user">();
      rl.data?.forEach((r) => { if (r.role === "admin") roleMap.set(r.user_id, "admin"); });
      setUsersList((pf.data ?? []).map((p) => ({
        id: p.id, name: p.name || "User", email: p.email ?? "", avatar: p.avatar ?? "🧑",
        role: (roleMap.get(p.id) === "admin" ? "admin" : "user"), status: "active",
        joinDate: (p.created_at ?? "").slice(0, 10), submissionsCount: 0,
      })));
    })();
  }, [isAdmin]);
  const updateUser: AppState["updateUser"] = async (id, patch) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.avatar !== undefined) dbPatch.avatar = patch.avatar;
    if (Object.keys(dbPatch).length) await supabase.from("profiles").update(dbPatch as never).eq("id", id);
    setUsersList((xs) => xs.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };
  const deleteUser: AppState["deleteUser"] = async (id) => {
    // Only removes profile row (auth.users cascade requires service role); mark suspended locally.
    setUsersList((xs) => xs.filter((u) => u.id !== id));
  };
  const legacyLogin = (_email: string) => { /* legacy no-op — use signInEmail */ };
  const adminLogin = () => { /* legacy no-op — role is set via user_roles */ };
  const adminLogout = async () => { await logout(); };
  const setCategoriesLegacy = (_c: Category[]) => { /* legacy no-op */ };
  const setTickersLegacy = (_t: Ticker[]) => { /* legacy no-op */ };


  const value: AppState = useMemo(() => ({
    loading, theme, setTheme, toggleTheme,
    session, user, signInEmail, signUpEmail, signInGoogle, logout, connectWallet, disconnectWallet,
    isAdmin,
    projects, addProject, updateProject, deleteProject, markProjectPaid,
    news, addNews, updateNews, deleteNews,
    tickers, addTicker, updateTicker, deleteTicker,
    categories, addCategory, updateCategory, deleteCategory,
    sidebarItems, addSidebarItem, updateSidebarItem, deleteSidebarItem, reorderSidebar,
    landingSections, updateLandingSection,
    bookmarks, toggleBookmark,
    history, pushHistory, clearHistory,
    notifications, pushNotification, markAllRead,
    siteSettings, updateSiteSettings,
    walletConfig, updateWalletConfig,
    xrpPrice, ledgerIndex,
    refresh,
    users: usersList, updateUser, deleteUser,
    login: legacyLogin, adminLogin, adminLogout,
    autoApprove: siteSettings.autoApprove,
    setAutoApprove: (v: boolean) => { void updateSiteSettings({ autoApprove: v }); },
    setCategories: setCategoriesLegacy, setTickers: setTickersLegacy,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [loading, theme, session, user, isAdmin, projects, news, tickers, categories, sidebarItems, landingSections, bookmarks, history, notifications, siteSettings, walletConfig, xrpPrice, ledgerIndex, usersList]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const v = useContext(AppCtx);
  if (!v) throw new Error("useApp must be inside AppProvider");
  return v;
}
