import { UserAvatar } from "@/components/user-avatar";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Sun, Moon, Terminal, Wallet, Rocket, Menu, User as UserIcon, Bell, Search, ChevronLeft, Shield } from "lucide-react";
import { useApp } from "@/lib/app-store";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useViewport } from "@/components/browser-viewport";
import { CryptoTicker } from "@/components/crypto-ticker";
import { listPages, type SitePage } from "@/lib/cms";
import { buildMenuTree, listMenus, type MenuItem } from "@/lib/menus";
import { connectFreighter, getStellarBalance, EXPLORER } from "@/lib/stellar-wallet";


function useWalletBalance(account: string | undefined, network: "Mainnet" | "Testnet") {
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!account) { setBalance(null); return; }
    let stop = false;
    const load = async () => {
      try {
        const res = await getStellarBalance(account, network);
        if (stop) return;
        setBalance(res.balance);
        setError(null);
      } catch (e) {
        if (!stop) setError(e instanceof Error ? e.message : "Could not read balance");
      }
    };
    void load();
    const t = setInterval(() => void load(), 30_000);
    return () => { stop = true; clearInterval(t); };
  }, [account, network]);
  return { balance, error };
}


export function PublicShell({ children }: { children: ReactNode }) {
  const { theme, setTheme, toggleTheme, user, logout, connectWallet, disconnectWallet, projects, xlmPrice, ledgerIndex, siteSettings, sidebarItems, isAdmin, walletConfig } = useApp();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [walletOpen, setWalletOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const isRetro = theme === "retro";
  const themeIcon = theme === "light" ? <Moon className="h-4 w-4" /> : theme === "dark" ? <Terminal className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  const themeTitle = theme === "light" ? "Switch to Dark" : theme === "dark" ? "Switch to 1999" : "Switch to Light";
  const viewport = useViewport();
  const { balance: headerBalance } = useWalletBalance(user?.walletAddress, walletConfig.network);
  const hideSidebar = path.startsWith("/panel") || path.startsWith("/admin");
  const isHome = path === "/";
  const hideFooter = path.startsWith("/panel") || path.startsWith("/admin");
  const headerMenu = useHeaderMenu(!!user);
  const featured = projects.filter((p) => p.featured && p.status === "approved" && p.isPublic).slice(0, 5);
  const nav = [...sidebarItems]
    .filter((s) => s.visible && (!s.requiresAuth || user))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Retro loading bar on route change
  const [routeLoading, setRouteLoading] = useState(false);
  useEffect(() => {
    setRouteLoading(true);
    const t = setTimeout(() => setRouteLoading(false), 500);
    return () => clearTimeout(t);
  }, [path]);

  return (
    <div className="scanlines flex min-h-screen flex-col bg-background text-foreground">
      {isRetro && <RetroChrome path={path} loading={routeLoading} />}

      {/* Top Nav */}
      <header className={isRetro ? "sticky top-0 z-40 border-b-2 border-primary bg-background" : "sticky top-0 z-40 border-b bg-background/80 backdrop-blur"}>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <button onClick={() => setMobileNav((v) => !v)} className="rounded p-1.5 hover:bg-muted md:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className={isRetro ? "grid h-7 w-7 place-items-center border-2 border-primary font-mono text-primary" : "grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground"}>X</div>
            <span className="text-lg font-bold tracking-tight">{siteSettings.siteName}</span>
          </Link>

          {/* Dynamic header menu (admin-managed, supports drop-downs) */}
          {headerMenu.length > 0 && (
            <nav className="ml-4 hidden items-center gap-1 lg:flex">
              {headerMenu.map((m) =>
                m.children.length > 0 ? (
                  <DropdownMenu key={m.id}>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                        {m.icon && <span className="mr-1.5">{m.icon}</span>}{m.label} ▾
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {m.children.map((c) => (
                        <DropdownMenuItem key={c.id} asChild>
                          <MenuLink item={c} />
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <MenuLink key={m.id} item={m} className="rounded-md px-3 py-2 text-sm hover:bg-muted" />
                ),
              )}
            </nav>
          )}

          {/* Right-aligned actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* Desktop actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`hidden sm:inline-flex ${isRetro ? "retro-btn" : "rounded-md border p-2 hover:bg-muted"}`} title="Change theme" aria-label="Change theme">
                  {themeIcon}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" /> Light {theme === "light" && <span className="ml-auto text-xs opacity-60">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" /> Dark {theme === "dark" && <span className="ml-auto text-xs opacity-60">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("retro")}>
                  <Terminal className="mr-2 h-4 w-4" /> 1999 {theme === "retro" && <span className="ml-auto text-xs opacity-60">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button onClick={() => setWalletOpen(true)} className={`hidden sm:inline-flex ${isRetro ? "retro-btn" : "items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-muted"}`}>
              <Wallet className="h-4 w-4" />
              {user?.walletAddress ? (
                <span className="flex items-center gap-1.5">
                  <span className="font-mono font-semibold">{headerBalance === null ? "…" : `${headerBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} XLM`}</span>
                  <span className="text-xs text-muted-foreground">{user.walletAddress.slice(0, 4)}…{user.walletAddress.slice(-4)}</span>
                </span>
              ) : "Connect Wallet"}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`hidden sm:inline-flex ${isRetro ? "retro-btn" : "items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"}`}>
                  <Rocket className="h-4 w-4" /> Launch dApp
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {featured.map((p) => (
                  <DropdownMenuItem key={p.id} onClick={() => viewport.open(p)}>
                    <span className="mr-2">{p.logo}</span> {p.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={isRetro ? "retro-btn" : "grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-muted hover:bg-accent hover:text-accent-foreground"}>
                    <UserAvatar avatar={user.avatar} name={user.name} size={isRetro ? 20 : 36} />
                  </button>

                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground sm:hidden">{user.name}</div>
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                        <Shield className="mr-2 h-4 w-4" /> Admin Panel
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild><Link to="/panel">My Panel</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/panel/submit">Submit project</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/panel/submissions">My submissions</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/panel/bookmarks">Bookmarks</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/panel/settings">Settings</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="sm:hidden" onClick={() => setWalletOpen(true)}>
                    <Wallet className="mr-2 h-4 w-4" /> {user?.walletAddress ? "Wallet" : "Connect wallet"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="sm:hidden" onClick={toggleTheme}>
                    {themeIcon}<span className="ml-2">{themeTitle}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { logout(); toast("Logged out"); }}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className={isRetro ? "retro-btn" : "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-muted"}>
                <UserIcon className="h-4 w-4" /> Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="relative flex flex-1">
        {/* Mobile overlay backdrop */}
        {!hideSidebar && mobileNav && (
          <button
            aria-label="Close menu"
            onClick={() => setMobileNav(false)}
            className="fixed inset-0 top-14 z-30 bg-black/40 md:hidden"
          />
        )}

        {/* Sidebar */}
        {!hideSidebar && (
        <aside className={`${collapsed ? "md:w-14" : "md:w-60"} ${mobileNav ? "fixed inset-y-0 left-0 top-14 z-40 w-64 shadow-xl" : "hidden"} shrink-0 border-r bg-sidebar text-sidebar-foreground transition-all md:static md:z-auto md:block md:shadow-none`}>
          <nav className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col">
            <div className="hidden justify-end p-2 md:flex">
              <button onClick={() => setCollapsed((v) => !v)} className="rounded p-1 hover:bg-sidebar-accent" title="Collapse"><ChevronLeft className={`h-4 w-4 transition ${collapsed ? "rotate-180" : ""}`} /></button>
            </div>
            <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4 pt-2 md:pt-0">
              {nav.map((n) => {
                const active = path === n.path || (n.path !== "/" && path.startsWith(n.path));
                return (
                  <Link key={n.id} to={n.path} onClick={() => setMobileNav(false)} className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm ${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent"}`}>
                    <span className="text-base">{n.icon}</span>
                    {!collapsed && <span>{n.label}</span>}
                  </Link>
                );
              })}
            </div>
            {!collapsed && (
              <div className={isRetro ? "m-2 border border-primary p-2 text-xs" : "soft-card m-2 p-3 text-xs"}>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">XLM</span>
                  <span className="font-mono font-semibold">${xlmPrice.price.toFixed(4)}</span>
                </div>
                <div className={`text-right font-mono ${xlmPrice.change >= 0 ? "text-success" : "text-destructive"}`}>{xlmPrice.change >= 0 ? "+" : ""}{xlmPrice.change.toFixed(2)}%</div>
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-success" /> Mainnet
                </div>
                <div className="text-muted-foreground">Ledger #{ledgerIndex.toLocaleString()}</div>
                <div className="text-muted-foreground">Close: ~3-5s</div>
              </div>
            )}
          </nav>
        </aside>
        )}

        <main className="min-w-0 flex-1">
          {isHome && <CryptoTicker />}
          {children}
        </main>
      </div>


      {!hideFooter && <Footer />}

      {/* Wallet modal — Xaman only */}
      <Dialog open={walletOpen} onOpenChange={setWalletOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user?.walletAddress ? "Xaman wallet connected" : "Connect with Xaman"}</DialogTitle>
          </DialogHeader>
          {user?.walletAddress ? (
            <XamanConnected onClose={() => setWalletOpen(false)} />
          ) : (
            <XamanConnect onDone={() => { setWalletOpen(false); toast.success("Connected via Xaman ✅"); }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function useHeaderMenu(signedIn: boolean) {
  const [items, setItems] = useState<MenuItem[]>([]);
  useEffect(() => {
    let stop = false;
    void listMenus("header")
      .then((all) => { if (!stop) setItems(all); })
      .catch(() => {});
    return () => { stop = true; };
  }, []);
  const visible = items.filter((i) => i.visible && (!i.requiresAuth || signedIn));
  return buildMenuTree(visible);
}

function MenuLink({ item, className }: { item: MenuItem; className?: string }) {
  if (item.external || /^https?:\/\//.test(item.path)) {
    return (
      <a href={item.path} target="_blank" rel="noreferrer" className={className}>
        {item.icon && <span className="mr-1.5">{item.icon}</span>}{item.label}
      </a>
    );
  }
  return (
    <Link to={item.path} className={className}>
      {item.icon && <span className="mr-1.5">{item.icon}</span>}{item.label}
    </Link>
  );
}

function RetroChrome({ path, loading }: { path: string; loading: boolean }) {
  return (
    <div className="border-b-2 border-primary bg-secondary text-primary">
      <div className="flex items-center gap-2 px-3 py-1 text-xs">
        <div className="flex gap-1">
          <span className="inline-block h-3 w-3 border border-primary bg-secondary" />
          <span className="inline-block h-3 w-3 border border-primary bg-secondary" />
          <span className="inline-block h-3 w-3 border border-primary bg-secondary" />
        </div>
        <span className="ml-2 font-mono">XLM BROWSER.COM — Netscape Navigator 4.0</span>
      </div>
      <div className="flex items-center gap-1 border-t border-primary px-2 py-1">
        <button className="retro-btn text-xs">◀ Back</button>
        <button className="retro-btn text-xs">▶ Fwd</button>
        <button className="retro-btn text-xs">⟳ Reload</button>
        <button className="retro-btn text-xs">⌂ Home</button>
        <div className="ml-1 flex flex-1 items-center gap-1 border border-primary bg-background px-2 py-0.5 font-mono text-xs">
          <span>xlmbrowser.com{path}</span>
          <span className="blink">_</span>
        </div>
      </div>
      {loading && (
        <div className="border-t border-primary bg-background px-2 py-0.5 font-mono text-[11px]">
          LOADING... [{"█".repeat(6)}{"░".repeat(4)}] 60%
        </div>
      )}
    </div>
  );
}

function Footer() {
  const { theme, siteSettings, footerGroups, footerLinks } = useApp();
  const isRetro = theme === "retro";
  const [footerPages, setFooterPages] = useState<SitePage[]>([]);
  useEffect(() => {
    let stop = false;
    void listPages(false)
      .then((ps) => { if (!stop) setFooterPages(ps.filter((p) => p.showInFooter)); })
      .catch(() => {});
    return () => { stop = true; };
  }, []);
  const groups = [...footerGroups].filter((g) => g.visible).sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <footer className={isRetro ? "border-t-2 border-primary bg-background px-4 py-6 font-mono text-sm" : "border-t bg-card px-6 py-10"}>
      {isRetro && <div className="mb-3 text-center font-mono">========================================================</div>}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
        {groups.map((g) => {
          const links = footerLinks.filter((l) => l.groupId === g.id && l.visible).sort((a, b) => a.sortOrder - b.sortOrder);
          const pages = footerPages.filter((p) => p.footerGroupId === g.id).sort((a, b) => a.sortOrder - b.sortOrder);
          return (
            <div key={g.id}>
              <div className="mb-2 font-semibold">{g.label}</div>
              <ul className="space-y-1 text-sm">
                {links.map((l) => (
                  <li key={l.id}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noreferrer" className="hover:underline">{l.label}</a>
                    ) : (
                      <a href={l.href} className="hover:underline">{l.label}</a>
                    )}
                  </li>
                ))}
                {pages.map((p) => (
                  <li key={p.id}>
                    <Link to="/p/$slug" params={{ slug: p.slug }} className="hover:underline">{p.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {groups.length === 0 && (
          <div className="col-span-full text-center text-sm text-muted-foreground">
            Footer is empty. Admin → Footer to add link groups.
          </div>
        )}
      </div>
      {isRetro && (
        <div className="mx-auto mt-6 max-w-6xl border border-primary p-2 text-center text-xs">
          [ Best viewed in Netscape Navigator 4.0 — 800x600 ]
        </div>
      )}
      {!isRetro && <div className="mx-auto mt-6 max-w-6xl border-t pt-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {siteSettings.siteName} · Powered by {siteSettings.contactCompany}</div>}
    </footer>
  );
}

function FreighterConnect({ onDone }: { onDone: () => void }) {
  const { connectWallet } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const start = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const address = await connectFreighter();
      await connectWallet("Freighter", address);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect to Freighter");
    } finally {
      setBusy(false);
    }
  }, [connectWallet, onDone]);

  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground">
        Connect your Stellar account with the Freighter browser extension. Nothing is signed — we only read your public address.
      </p>
      {error && <div className="whitespace-pre-wrap rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
      <button onClick={() => void start()} disabled={busy}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">
        {busy ? "Waiting for Freighter…" : "Connect Freighter"}
      </button>
      <p className="text-xs text-muted-foreground">
        Don't have it yet? Install{" "}
        <a href="https://freighter.app" target="_blank" rel="noreferrer" className="underline">Freighter</a> and reload this page.
      </p>
    </div>
  );
}


function XamanConnected({ onClose }: { onClose: () => void }) {
  const { user, disconnectWallet, walletConfig, xlmPrice } = useApp();
  const getBalance = useServerFn(xamanBalance);
  const [balance, setBalance] = useState<number | null>(null);
  const [balErr, setBalErr] = useState<string | null>(null);

  useEffect(() => {
    const account = user?.walletAddress;
    if (!account) return;
    let stop = false;
    void (async () => {
      try {
        const res = await getBalance({ data: { account, network: walletConfig.network } });
        if (stop) return;
        if (res.ok) setBalance(res.data.balance);
        else setBalErr(res.error);
      } catch (e) {
        if (!stop) setBalErr(e instanceof Error ? e.message : "Could not read balance");
      }
    })();
    return () => { stop = true; };
  }, [user?.walletAddress, walletConfig.network, getBalance]);

  const usd = balance !== null ? (balance * xlmPrice.price).toFixed(2) : null;
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-md border bg-muted/40 p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Address</div>
          <button
            onClick={() => { void navigator.clipboard.writeText(user?.walletAddress ?? ""); toast("Address copied"); }}
            className="text-[11px] underline hover:no-underline"
          >Copy</button>
        </div>
        <div className="mt-0.5 break-all font-mono text-xs">{user?.walletAddress}</div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Balance</div>
            <div className="text-lg font-semibold">{balance === null ? (balErr ? "—" : "Loading…") : `${balance.toLocaleString()} XLM`}</div>
            <div className="text-xs text-muted-foreground">{usd ? `≈ $${usd}` : balErr ?? ""}</div>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <div>Network</div>
            <div className="font-medium text-foreground">{walletConfig.network}</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-md border p-3 text-xs">
        <div>
          <div className="text-muted-foreground">XLM price</div>
          <div className="font-mono font-medium text-foreground">${xlmPrice.price.toFixed(4)}</div>
        </div>
        <div className="text-right">
          <div className="text-muted-foreground">24h</div>
          <div className={`font-mono font-medium ${xlmPrice.change >= 0 ? "text-success" : "text-destructive"}`}>
            {xlmPrice.change >= 0 ? "+" : ""}{xlmPrice.change.toFixed(2)}%
          </div>
        </div>
        <div className="col-span-2">
          <a
            href={`https://livenet.stellar.org/accounts/${user?.walletAddress ?? ""}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline hover:no-underline"
          >View on Stellar explorer ↗</a>
        </div>
      </div>
      <button onClick={() => { disconnectWallet(); onClose(); toast("Xaman disconnected"); }} className="w-full rounded-md border px-3 py-2 hover:bg-muted">
        Disconnect
      </button>
    </div>
  );
}

