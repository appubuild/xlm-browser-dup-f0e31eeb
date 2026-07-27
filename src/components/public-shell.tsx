import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { xamanSignIn, xamanStatus, xamanBalance } from "@/lib/xaman.functions";
import { Sun, Moon, Terminal, Wallet, Rocket, Menu, User as UserIcon, Bell, Search, ChevronLeft, Shield } from "lucide-react";
import { useApp } from "@/lib/app-store";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useViewport } from "@/components/browser-viewport";
import { CryptoTicker } from "@/components/crypto-ticker";
import { listPages, type SitePage } from "@/lib/cms";
import { callXamanProxy, formatXamanConnectError, shouldUseXamanProxy, type XamanSignInPayload, type XamanStatusPayload } from "@/lib/xaman-client";


function useWalletBalance(account: string | undefined, network: "Mainnet" | "Testnet") {
  const getBalance = useServerFn(xamanBalance);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!account) { setBalance(null); return; }
    let stop = false;
    const load = async () => {
      try {
        const res = await getBalance({ data: { account, network } });
        if (stop) return;
        if (res.ok) { setBalance(res.data.balance); setError(null); }
        else setError(res.error);
      } catch (e) {
        if (!stop) setError(e instanceof Error ? e.message : "Could not read balance");
      }
    };
    void load();
    const t = setInterval(() => void load(), 30_000);
    return () => { stop = true; clearInterval(t); };
  }, [account, network, getBalance]);
  return { balance, error };
}

export function PublicShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme, user, logout, connectWallet, disconnectWallet, projects, xrpPrice, ledgerIndex, siteSettings, sidebarItems, isAdmin, walletConfig } = useApp();
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

          {/* Right-aligned actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* Desktop actions */}
            <button onClick={toggleTheme} className={`hidden sm:inline-flex ${isRetro ? "retro-btn" : "rounded-md border p-2 hover:bg-muted"}`} title={themeTitle}>
              {themeIcon}
            </button>
            <button onClick={() => setWalletOpen(true)} className={`hidden sm:inline-flex ${isRetro ? "retro-btn" : "items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-muted"}`}>
              <Wallet className="h-4 w-4" />
              {user?.walletAddress ? (
                <span className="flex items-center gap-1.5">
                  <span className="font-mono font-semibold">{headerBalance === null ? "…" : `${headerBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} XRP`}</span>
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
                  <button className={isRetro ? "retro-btn" : "grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-accent hover:text-accent-foreground"}>
                    <span>{user.avatar}</span>
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
                  <span className="text-muted-foreground">XRP</span>
                  <span className="font-mono font-semibold">${xrpPrice.price.toFixed(4)}</span>
                </div>
                <div className={`text-right font-mono ${xrpPrice.change >= 0 ? "text-success" : "text-destructive"}`}>{xrpPrice.change >= 0 ? "+" : ""}{xrpPrice.change.toFixed(2)}%</div>
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
          {!hideSidebar && <CryptoTicker />}
          {children}
        </main>
      </div>


      <Footer />

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

function RetroChrome({ path, loading }: { path: string; loading: boolean }) {
  return (
    <div className="border-b-2 border-primary bg-secondary text-primary">
      <div className="flex items-center gap-2 px-3 py-1 text-xs">
        <div className="flex gap-1">
          <span className="inline-block h-3 w-3 border border-primary bg-secondary" />
          <span className="inline-block h-3 w-3 border border-primary bg-secondary" />
          <span className="inline-block h-3 w-3 border border-primary bg-secondary" />
        </div>
        <span className="ml-2 font-mono">XRPBROWSER.COM — Netscape Navigator 4.0</span>
      </div>
      <div className="flex items-center gap-1 border-t border-primary px-2 py-1">
        <button className="retro-btn text-xs">◀ Back</button>
        <button className="retro-btn text-xs">▶ Fwd</button>
        <button className="retro-btn text-xs">⟳ Reload</button>
        <button className="retro-btn text-xs">⌂ Home</button>
        <div className="ml-1 flex flex-1 items-center gap-1 border border-primary bg-background px-2 py-0.5 font-mono text-xs">
          <span>xrpbrowser.com{path}</span>
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

function XamanConnect({ onDone }: { onDone: () => void }) {
  const { connectWallet } = useApp();
  const signIn = useServerFn(xamanSignIn);
  const status = useServerFn(xamanStatus);
  const [payload, setPayload] = useState<{ uuid: string; qrPng: string; deeplink: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"creating" | "waiting" | "done">("creating");

  const start = useCallback(async () => {
    setError(null);
    setState("creating");
    setPayload(null);
    try {
      const res = await signIn({ data: {} });
      let next: XamanSignInPayload | null = null;
      if (res.ok) next = res.data;
      else if (shouldUseXamanProxy(res.error)) {
        const fallback = await callXamanProxy<XamanSignInPayload>({ action: "signin" });
        if (fallback.ok) next = fallback.data;
        else { setError(formatXamanConnectError(res.error, fallback.error)); setState("done"); return; }
      } else { setError(res.error); setState("done"); return; }
      setPayload({ uuid: next.uuid, qrPng: next.qrPng, deeplink: next.deeplink });
      setState("waiting");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start Xaman sign-in");
      setState("done");
    }
  }, [signIn]);

  useEffect(() => { void start(); }, [start]);

  // Poll the payload until the user approves / rejects / it expires.
  useEffect(() => {
    if (!payload || state !== "waiting") return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await status({ data: { uuid: payload.uuid } });
        let s: XamanStatusPayload | null = res.ok ? res.data : null;
        if (!s && !res.ok && shouldUseXamanProxy(res.error)) {
          const fallback = await callXamanProxy<XamanStatusPayload>({ action: "status", uuid: payload.uuid });
          if (fallback.ok) s = fallback.data;
        }
        if (stop || !s) return;
        if (s.signed && s.account) {
          setState("done");
          await connectWallet("Xaman (Xumm)", s.account);
          onDone();
          return;
        }
        if (s.cancelled || (s.resolved && !s.signed)) { setError("Sign-in request was rejected in Xaman."); setState("done"); return; }
        if (s.expired) { setError("The sign-in request expired. Please try again."); setState("done"); return; }
      } catch {
        /* transient — keep polling */
      }
    };
    const t = setInterval(() => { void tick(); }, 2500);
    return () => { stop = true; clearInterval(t); };
  }, [payload, state, status, connectWallet, onDone]);

  if (error) {
    return (
      <div className="space-y-3 text-sm">
        <div className="whitespace-pre-wrap rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>
        <button onClick={() => void start()} className="w-full rounded-md border px-3 py-2 text-xs hover:bg-muted">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[220px_1fr] sm:items-center">
        <div className="mx-auto grid h-[236px] w-[236px] place-items-center rounded-lg border bg-white p-2">
          {payload ? (
            <img src={payload.qrPng} alt="Xaman sign-in QR" className="h-[220px] w-[220px]" />
          ) : (
            <span className="text-xs text-slate-500">Creating sign-in request…</span>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="font-medium">Scan with Xaman</div>
          <ol className="ml-4 list-decimal space-y-1 text-xs text-muted-foreground">
            <li>Open the Xaman app on your phone</li>
            <li>Tap the scan icon</li>
            <li>Point at the QR code</li>
            <li>Approve the sign-in request</li>
          </ol>
          {payload && (
            <a
              href={payload.deeplink}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
            >
              Open in Xaman
            </a>
          )}
          <div className="text-[11px] text-muted-foreground">
            {state === "waiting" ? "Waiting for approval in Xaman…" : "Preparing…"}
          </div>
        </div>
      </div>
    </div>
  );
}

function XamanConnected({ onClose }: { onClose: () => void }) {
  const { user, disconnectWallet, walletConfig, xrpPrice } = useApp();
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

  const usd = balance !== null ? (balance * xrpPrice.price).toFixed(2) : null;
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
            <div className="text-lg font-semibold">{balance === null ? (balErr ? "—" : "Loading…") : `${balance.toLocaleString()} XRP`}</div>
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
          <div className="text-muted-foreground">XRP price</div>
          <div className="font-mono font-medium text-foreground">${xrpPrice.price.toFixed(4)}</div>
        </div>
        <div className="text-right">
          <div className="text-muted-foreground">24h</div>
          <div className={`font-mono font-medium ${xrpPrice.change >= 0 ? "text-success" : "text-destructive"}`}>
            {xrpPrice.change >= 0 ? "+" : ""}{xrpPrice.change.toFixed(2)}%
          </div>
        </div>
        <div className="col-span-2">
          <a
            href={`https://livenet.xrpl.org/accounts/${user?.walletAddress ?? ""}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline hover:no-underline"
          >View on XRPL explorer ↗</a>
        </div>
      </div>
      <button onClick={() => { disconnectWallet(); onClose(); toast("Xaman disconnected"); }} className="w-full rounded-md border px-3 py-2 hover:bg-muted">
        Disconnect
      </button>
    </div>
  );
}

