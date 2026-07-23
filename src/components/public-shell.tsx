import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Sun, Moon, Wallet, Rocket, Menu, User as UserIcon, Bell, Search, ChevronLeft, Shield } from "lucide-react";
import { useApp } from "@/lib/app-store";
import { WALLETS } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useViewport } from "@/components/browser-viewport";
import { CryptoTicker } from "@/components/crypto-ticker";


export function PublicShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme, user, logout, connectWallet, disconnectWallet, projects, xrpPrice, ledgerIndex, siteSettings, sidebarItems, isAdmin } = useApp();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [walletOpen, setWalletOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const isRetro = theme === "dark";
  const viewport = useViewport();
  const hideSidebar = path.startsWith("/panel") || path.startsWith("/admin");
  const featured = projects.filter((p) => p.featured && p.status === "approved").slice(0, 5);
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
          <button onClick={() => setMobileNav((v) => !v)} className="rounded p-1.5 hover:bg-muted md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className={isRetro ? "grid h-7 w-7 place-items-center border-2 border-primary font-mono text-primary" : "grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground"}>X</div>
            <span className="text-lg font-bold tracking-tight">{siteSettings.siteName}</span>
          </Link>



          <button onClick={toggleTheme} className={isRetro ? "retro-btn" : "rounded-md border p-2 hover:bg-muted"} title="Toggle theme">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <button onClick={() => setWalletOpen(true)} className={isRetro ? "retro-btn" : "hidden items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-muted sm:inline-flex"}>
            <Wallet className="h-4 w-4" /> {user?.walletAddress ? `${user.walletAddress.slice(0, 6)}…` : "Connect Wallet"}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={isRetro ? "retro-btn" : "inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"}>
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
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                      <Shield className="mr-2 h-4 w-4" /> Admin Panel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild><Link to="/panel">My Panel</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/panel/bookmarks">Bookmarks</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/panel/submissions">Submitted Projects</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/panel/settings">Settings</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); toast("Logged out"); }}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className={isRetro ? "retro-btn" : "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-muted"}>
              <UserIcon className="h-4 w-4" /> Sign in
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        {!hideSidebar && (
        <aside className={`${collapsed ? "w-14" : "w-60"} ${mobileNav ? "block" : "hidden"} shrink-0 border-r bg-sidebar text-sidebar-foreground transition-all md:block`}>
          <nav className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col">
            <div className="flex justify-end p-2">
              <button onClick={() => setCollapsed((v) => !v)} className="rounded p-1 hover:bg-sidebar-accent" title="Collapse"><ChevronLeft className={`h-4 w-4 transition ${collapsed ? "rotate-180" : ""}`} /></button>
            </div>
            <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
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

      {/* Wallet modal */}
      <Dialog open={walletOpen} onOpenChange={setWalletOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user?.walletAddress ? "Wallet connected" : "Connect a wallet"}</DialogTitle>
          </DialogHeader>
          {user?.walletAddress ? (
            <div className="space-y-3">
              <p className="text-sm">Address: <span className="font-mono">{user.walletAddress}</span></p>
              <button onClick={() => { disconnectWallet(); setWalletOpen(false); toast("Wallet disconnected"); }} className="w-full rounded-md border px-3 py-2 text-sm hover:bg-muted">Disconnect</button>
            </div>
          ) : (
            <div className="grid gap-2">
              {WALLETS.map((w) => (
                <button key={w} onClick={() => { connectWallet(w); setWalletOpen(false); toast.success(`Connected via ${w} ✅`); }} className="flex items-center justify-between rounded-md border px-3 py-2.5 text-left text-sm hover:bg-muted">
                  <span>{w}</span>
                  <span className="text-xs text-muted-foreground">Connect</span>
                </button>
              ))}
            </div>
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
  const { theme, siteSettings } = useApp();
  const isRetro = theme === "dark";
  return (
    <footer className={isRetro ? "border-t-2 border-primary bg-background px-4 py-6 font-mono text-sm" : "border-t bg-card px-6 py-10"}>
      {isRetro && <div className="mb-3 text-center font-mono">========================================================</div>}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
        <div>
          <div className="mb-2 font-semibold">Company</div>
          <ul className="space-y-1 text-sm">
            <li><Link to="/about" className="hover:underline">About</Link></li>
            <li><Link to="/help" className="hover:underline">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold">Legal</div>
          <ul className="space-y-1 text-sm">
            <li><Link to="/privacy" className="hover:underline">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:underline">Terms of Service</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold">Developers</div>
          <ul className="space-y-1 text-sm">
            <li><Link to="/developers" className="hover:underline">Developer Hub</Link></li>
            <li><Link to="/developers/api" className="hover:underline">Developer API</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold">Contact</div>
          <div className="text-sm">
            <div>{siteSettings.contactEmail}</div>
            <div>{siteSettings.contactCompany}</div>
            <div>{siteSettings.contactLocation}</div>
          </div>
          <div className="mt-2 flex gap-3 text-sm">
            <a href="#" className="hover:underline">Twitter</a>
            <a href="#" className="hover:underline">Discord</a>
            <a href="#" className="hover:underline">Telegram</a>
            <a href="#" className="hover:underline">GitHub</a>
          </div>
        </div>
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
