import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PROJECTS, NEWS, USERS, TICKERS, CATEGORIES, type Project, type NewsArticle, type User, type Ticker, type Category } from "./mock-data";

export type Theme = "light" | "dark";

interface AuthUser { name: string; email: string; avatar: string; walletAddress?: string }

interface AppState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;

  user: AuthUser | null;
  login: (email: string) => void;
  logout: () => void;
  connectWallet: (name: string) => void;
  disconnectWallet: () => void;

  isAdmin: boolean;
  adminLogin: () => void;
  adminLogout: () => void;

  projects: Project[];
  addProject: (p: Omit<Project, "id" | "visits" | "verified" | "status" | "featured" | "dateAdded"> & Partial<Project>) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  news: NewsArticle[];
  addNews: (a: Omit<NewsArticle, "id" | "views">) => void;
  updateNews: (id: string, patch: Partial<NewsArticle>) => void;
  deleteNews: (id: string) => void;

  users: User[];
  updateUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;

  tickers: Ticker[];
  setTickers: (t: Ticker[]) => void;

  categories: Category[];
  setCategories: (c: Category[]) => void;

  bookmarks: string[];
  toggleBookmark: (slug: string) => void;

  history: { slug: string; ts: number }[];
  pushHistory: (slug: string) => void;
  clearHistory: () => void;

  notifications: { id: string; message: string; ts: number; read: boolean }[];
  pushNotification: (message: string) => void;
  markAllRead: () => void;

  autoApprove: boolean;
  setAutoApprove: (v: boolean) => void;

  siteSettings: { siteName: string; metaDescription: string; defaultTheme: Theme; allowUserOverride: boolean; enableSubmissions: boolean; enableIframe: boolean; maintenanceMode: boolean; contactEmail: string; contactCompany: string; contactLocation: string };
  updateSiteSettings: (patch: Partial<AppState["siteSettings"]>) => void;

  walletConfig: { enabled: string[]; network: "Mainnet" | "Testnet"; rpcUrl: string };
  updateWalletConfig: (patch: Partial<AppState["walletConfig"]>) => void;

  xrpPrice: { price: number; change: number };
  ledgerIndex: number;
}

const AppCtx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [news, setNews] = useState<NewsArticle[]>(NEWS);
  const [users, setUsers] = useState<User[]>(USERS);
  const [tickers, setTickers] = useState<Ticker[]>(TICKERS);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [history, setHistory] = useState<{ slug: string; ts: number }[]>([]);
  const [notifications, setNotifications] = useState<AppState["notifications"]>([
    { id: "n1", message: "Welcome to XRPBrowser 👋", ts: Date.now() - 60000, read: false },
  ]);
  const [autoApprove, setAutoApprove] = useState(false);
  const [siteSettings, setSiteSettings] = useState<AppState["siteSettings"]>({
    siteName: "XRPBrowser",
    metaDescription: "The search engine and browser for the XRP Ledger.",
    defaultTheme: "light",
    allowUserOverride: true,
    enableSubmissions: true,
    enableIframe: true,
    maintenanceMode: false,
    contactEmail: "partner@skipads.ai",
    contactCompany: "SkipAds AI LLC",
    contactLocation: "Detroit, MI · USA",
  });
  const [walletConfig, setWalletConfig] = useState<AppState["walletConfig"]>({
    enabled: ["Xaman (Xumm)", "GateHub", "Trust Wallet", "Ledger", "Crossmark"],
    network: "Mainnet",
    rpcUrl: "wss://s1.ripple.com",
  });
  const [xrpPrice, setXrpPrice] = useState({ price: 0.52, change: 3.12 });
  const [ledgerIndex, setLedgerIndex] = useState(89234501);

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

  useEffect(() => {
    const t = setInterval(() => {
      setXrpPrice((p) => ({ price: +(p.price + (Math.random() - 0.5) * 0.005).toFixed(4), change: +(p.change + (Math.random() - 0.5) * 0.4).toFixed(2) }));
      setLedgerIndex((n) => n + 1);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState((t) => (t === "light" ? "dark" : "light"));

  const login = (email: string) => setUser({ name: email.split("@")[0] || "User", email, avatar: "🧑" });
  const logout = () => setUser(null);
  const connectWallet = (name: string) => setUser((u) => ({ ...(u ?? { name: "Guest", email: "", avatar: "🧑" }), walletAddress: `r${name.slice(0, 3).toUpperCase()}${Math.random().toString(36).slice(2, 10)}` }));
  const disconnectWallet = () => setUser((u) => (u ? { ...u, walletAddress: undefined } : u));

  const adminLogin = () => setIsAdmin(true);
  const adminLogout = () => setIsAdmin(false);

  const pushNotification = (message: string) => setNotifications((n) => [{ id: Math.random().toString(36).slice(2), message, ts: Date.now(), read: false }, ...n]);

  const addProject: AppState["addProject"] = (p) => {
    const project: Project = {
      id: Math.random().toString(36).slice(2),
      slug: (p.slug || p.name.toLowerCase().replace(/\s+/g, "-")).replace(/[^a-z0-9-]/g, ""),
      name: p.name,
      logo: p.logo || "🔗",
      category: p.category,
      tagline: p.tagline,
      description: p.description,
      url: p.url,
      screenshots: p.screenshots || [],
      socials: p.socials || {},
      verified: p.verified ?? false,
      status: p.status ?? "pending",
      featured: p.featured ?? false,
      dateAdded: new Date().toISOString().slice(0, 10),
      visits: 0,
      submitterName: p.submitterName,
      submitterEmail: p.submitterEmail,
      liveStatus: p.liveStatus || "Live",
    };
    setProjects((ps) => [project, ...ps]);
    if (autoApprove && project.status === "pending") {
      setTimeout(() => {
        setProjects((ps) => ps.map((x) => (x.id === project.id ? { ...x, status: "approved" } : x)));
        pushNotification(`🎉 New project auto-approved: ${project.name}`);
      }, 5000);
    }
    return project;
  };
  const updateProject = (id: string, patch: Partial<Project>) => setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const deleteProject = (id: string) => setProjects((ps) => ps.filter((p) => p.id !== id));

  const addNews: AppState["addNews"] = (a) => setNews((n) => [{ ...a, id: Math.random().toString(36).slice(2), views: 0 }, ...n]);
  const updateNews = (id: string, patch: Partial<NewsArticle>) => setNews((n) => n.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const deleteNews = (id: string) => setNews((n) => n.filter((x) => x.id !== id));

  const updateUser = (id: string, patch: Partial<User>) => setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  const deleteUser = (id: string) => setUsers((us) => us.filter((u) => u.id !== id));

  const toggleBookmark = (slug: string) => {
    setBookmarks((b) => (b.includes(slug) ? b.filter((s) => s !== slug) : [...b, slug]));
  };
  const pushHistory = (slug: string) => setHistory((h) => [{ slug, ts: Date.now() }, ...h.filter((x) => x.slug !== slug)].slice(0, 100));
  const clearHistory = () => setHistory([]);

  const markAllRead = () => setNotifications((n) => n.map((x) => ({ ...x, read: true })));

  const updateSiteSettings = (patch: Partial<AppState["siteSettings"]>) => setSiteSettings((s) => ({ ...s, ...patch }));
  const updateWalletConfig = (patch: Partial<AppState["walletConfig"]>) => setWalletConfig((s) => ({ ...s, ...patch }));

  const value: AppState = useMemo(() => ({
    theme, setTheme, toggleTheme,
    user, login, logout, connectWallet, disconnectWallet,
    isAdmin, adminLogin, adminLogout,
    projects, addProject, updateProject, deleteProject,
    news, addNews, updateNews, deleteNews,
    users, updateUser, deleteUser,
    tickers, setTickers,
    categories, setCategories,
    bookmarks, toggleBookmark,
    history, pushHistory, clearHistory,
    notifications, pushNotification, markAllRead,
    autoApprove, setAutoApprove,
    siteSettings, updateSiteSettings,
    walletConfig, updateWalletConfig,
    xrpPrice, ledgerIndex,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [theme, user, isAdmin, projects, news, users, tickers, categories, bookmarks, history, notifications, autoApprove, siteSettings, walletConfig, xrpPrice, ledgerIndex]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const v = useContext(AppCtx);
  if (!v) throw new Error("useApp must be inside AppProvider");
  return v;
}
