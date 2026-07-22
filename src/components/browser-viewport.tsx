import { useEffect, useRef, useState, type ReactNode, createContext, useContext } from "react";
import { X, ArrowLeft, ArrowRight, RotateCw, Home, Star, ExternalLink, Plus, Search } from "lucide-react";
import { useApp } from "@/lib/app-store";
import type { Project } from "@/lib/app-store";

interface Tab {
  id: string;
  project: Project | null;   // null = new-tab picker
  history: string[];         // URL stack
  cursor: number;            // index in history
  loading: boolean;
  blocked: boolean;
  key: number;               // bump to force iframe reload
}

interface Props {
  open: boolean;
  onClose: () => void;
  initialProject: Project | null;
}

function newTab(project: Project | null): Tab {
  return {
    id: Math.random().toString(36).slice(2),
    project,
    history: project ? [project.url] : [],
    cursor: project ? 0 : -1,
    loading: !!project,
    blocked: false,
    key: 0,
  };
}

export function BrowserViewport({ open, onClose, initialProject }: Props) {
  const { theme, bookmarks, toggleBookmark, pushHistory, projects, siteSettings } = useApp();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [addressInput, setAddressInput] = useState("");

  useEffect(() => {
    if (open && initialProject) {
      setTabs((ts) => {
        const exists = ts.find((t) => t.project?.slug === initialProject.slug);
        if (exists) { setActiveId(exists.id); return ts; }
        const t = newTab(initialProject);
        setActiveId(t.id);
        pushHistory(initialProject.slug);
        return [...ts, t];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialProject]);

  const active = tabs.find((t) => t.id === activeId);

  useEffect(() => {
    setAddressInput(active?.history[active.cursor] ?? "");
  }, [active?.id, active?.cursor, active?.history]);

  // Loading timeout - if iframe doesn't onLoad in 4s, treat as blocked
  useEffect(() => {
    if (!active?.loading || !active.project) return;
    const t = setTimeout(() => {
      setTabs((ts) => ts.map((x) => (x.id === active.id ? { ...x, loading: false, blocked: true } : x)));
    }, 4500);
    return () => clearTimeout(t);
  }, [active?.loading, active?.id, active?.project]);

  if (!open) return null;

  const updateTab = (id: string, patch: Partial<Tab>) =>
    setTabs((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const closeTab = (id: string) => {
    setTabs((ts) => {
      const next = ts.filter((t) => t.id !== id);
      if (next.length === 0) { onClose(); return next; }
      if (id === activeId) setActiveId(next[next.length - 1].id);
      return next;
    });
  };

  const openNewTab = () => {
    const t = newTab(null);
    setTabs((ts) => [...ts, t]);
    setActiveId(t.id);
  };

  const pickProjectForTab = (tabId: string, project: Project) => {
    setTabs((ts) => ts.map((t) => (t.id === tabId ? { ...t, project, history: [project.url], cursor: 0, loading: true, blocked: false, key: t.key + 1 } : t)));
    pushHistory(project.slug);
  };

  const navigateTo = (tabId: string, rawUrl: string) => {
    if (!rawUrl.trim()) return;
    let url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    setTabs((ts) => ts.map((t) => {
      if (t.id !== tabId) return t;
      const nextHistory = [...t.history.slice(0, t.cursor + 1), url];
      const proj: Project = t.project ?? { ...(projects[0] ?? {} as Project), url, name: new URL(url).hostname, logo: "🌐", slug: url };
      return { ...t, project: proj, history: nextHistory, cursor: nextHistory.length - 1, loading: true, blocked: false, key: t.key + 1 };
    }));
  };

  const goBack = () => active && active.cursor > 0 && updateTab(active.id, { cursor: active.cursor - 1, loading: true, blocked: false, key: active.key + 1 });
  const goFwd = () => active && active.cursor < active.history.length - 1 && updateTab(active.id, { cursor: active.cursor + 1, loading: true, blocked: false, key: active.key + 1 });
  const refresh = () => active && updateTab(active.id, { loading: true, blocked: false, key: active.key + 1 });

  const isRetro = theme === "dark";
  const currentUrl = active?.history[active.cursor];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-sm">
      {/* window chrome */}
      <div className={isRetro ? "flex items-center gap-2 border-b-2 border-primary bg-secondary px-2 py-1" : "flex items-center gap-2 border-b bg-card px-3 py-2"}>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-red-400" />
          <span className="inline-block h-3 w-3 rounded-full bg-yellow-400" />
          <span className="inline-block h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="ml-2 text-xs font-medium">XRPBrowser {isRetro ? "— Navigator 4.0" : "Viewport"}</div>
        <button onClick={onClose} className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-muted">
          <X className="h-3.5 w-3.5" /> Close
        </button>
      </div>

      {/* tab strip */}
      <div className={isRetro ? "flex items-end gap-1 border-b border-primary bg-background px-2 pt-1 overflow-x-auto" : "flex items-end gap-1 border-b bg-card px-2 pt-1 overflow-x-auto"}>
        {tabs.map((t) => (
          <div key={t.id} onClick={() => setActiveId(t.id)} className={`flex cursor-pointer items-center gap-2 border border-b-0 px-3 py-1.5 text-xs ${t.id === activeId ? "bg-background" : "bg-muted text-muted-foreground"} ${isRetro ? "rounded-none" : "rounded-t-md"}`}>
            <span>{t.project?.logo ?? "🆕"}</span>
            <span className="max-w-[140px] truncate">{t.project?.name ?? "New Tab"}</span>
            <button onClick={(e) => { e.stopPropagation(); closeTab(t.id); }} className="opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>
          </div>
        ))}
        <button onClick={openNewTab} className={`ml-1 rounded px-2 py-1 text-xs hover:bg-muted`} title="New tab"><Plus className="h-3.5 w-3.5" /></button>
      </div>

      {/* address bar */}
      <div className={isRetro ? "flex items-center gap-2 border-b border-primary bg-secondary px-2 py-1 text-xs" : "flex items-center gap-2 border-b bg-card px-3 py-2 text-sm"}>
        <button onClick={goBack} disabled={!active || active.cursor <= 0} className="rounded p-1 hover:bg-muted disabled:opacity-40" title="Back"><ArrowLeft className="h-4 w-4" /></button>
        <button onClick={goFwd} disabled={!active || active.cursor >= (active?.history.length ?? 0) - 1} className="rounded p-1 hover:bg-muted disabled:opacity-40" title="Forward"><ArrowRight className="h-4 w-4" /></button>
        <button onClick={refresh} className="rounded p-1 hover:bg-muted" title="Refresh"><RotateCw className="h-4 w-4" /></button>
        <button onClick={onClose} className="rounded p-1 hover:bg-muted" title="Home"><Home className="h-4 w-4" /></button>
        <form
          onSubmit={(e) => { e.preventDefault(); if (active) navigateTo(active.id, addressInput); }}
          className={isRetro ? "flex flex-1 items-center gap-1 border border-primary bg-background px-2 py-0.5" : "flex flex-1 items-center gap-2 rounded-full border bg-background px-3 py-1"}
        >
          <span className="text-xs opacity-60">🔒</span>
          <input
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="Enter URL or search…"
            className="flex-1 bg-transparent outline-none"
          />
        </form>
        {active?.project && (
          <button onClick={() => toggleBookmark(active.project!.slug)} className="rounded p-1 hover:bg-muted" title="Bookmark">
            <Star className={`h-4 w-4 ${bookmarks.includes(active.project.slug) ? "fill-current text-yellow-500" : ""}`} />
          </button>
        )}
        {currentUrl && (
          <a href={currentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:opacity-90">
            <ExternalLink className="h-3 w-3" /> Open
          </a>
        )}
      </div>

      {active?.loading && (
        <div className="h-0.5 w-full overflow-hidden bg-muted"><div className="h-full w-1/2 animate-pulse bg-primary" /></div>
      )}

      {/* content */}
      <div className="relative flex-1 overflow-hidden bg-background">
        {!active ? null : !active.project ? (
          <NewTabPage projects={projects} onPick={(p) => pickProjectForTab(active.id, p)} onGo={(url) => navigateTo(active.id, url)} />
        ) : active.blocked || !siteSettings.enableIframe ? (
          <BlockedFallback project={active.project} url={currentUrl!} />
        ) : (
          <IframeView
            key={active.key}
            url={currentUrl!}
            onLoad={() => updateTab(active.id, { loading: false })}
            onError={() => updateTab(active.id, { loading: false, blocked: true })}
          />
        )}
      </div>
    </div>
  );
}

function IframeView({ url, onLoad, onError }: { url: string; onLoad: () => void; onError: () => void }) {
  const ref = useRef<HTMLIFrameElement>(null);
  return (
    <iframe
      ref={ref}
      src={url}
      title={url}
      onLoad={onLoad}
      onError={onError}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      className="h-full w-full border-0 bg-white"
    />
  );
}

function NewTabPage({ projects, onPick, onGo }: { projects: Project[]; onPick: (p: Project) => void; onGo: (url: string) => void }) {
  const [q, setQ] = useState("");
  const featured = projects.filter((p) => p.status === "approved").slice(0, 12);
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h2 className="text-center text-2xl font-bold">New Tab</h2>
      <form onSubmit={(e) => { e.preventDefault(); onGo(q); }} className="mt-6 flex items-center gap-2 rounded-full border bg-background px-4 py-2 shadow-sm">
        <Search className="h-4 w-4 opacity-60" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Enter URL or search XRPL ecosystem…" className="flex-1 bg-transparent outline-none text-sm" />
        <button className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">Go</button>
      </form>
      <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {featured.map((p) => (
          <button key={p.id} onClick={() => onPick(p)} className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center hover:border-primary">
            <div className="text-3xl">{p.logo}</div>
            <div className="text-xs font-medium truncate w-full">{p.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function BlockedFallback({ project, url }: { project: Project; url: string }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 p-10 text-center">
      <div className="text-6xl">{project.logo}</div>
      <h2 className="text-2xl font-bold">{project.name}</h2>
      <p className="text-muted-foreground">{project.tagline}</p>
      <p className="max-w-xl text-sm">{project.description}</p>
      <div className="soft-card w-full max-w-xl p-6">
        <div className="text-sm text-muted-foreground">This site blocks embedded browsing (X-Frame-Options / CSP). Open it in a new browser tab to continue.</div>
        <a href={url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <ExternalLink className="h-4 w-4" /> Open in new tab
        </a>
      </div>
    </div>
  );
}

// Global controller
interface Ctl { open: (p: Project) => void }
const ViewportCtx = createContext<Ctl | null>(null);
export function ViewportProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [proj, setProj] = useState<Project | null>(null);
  return (
    <ViewportCtx.Provider value={{ open: (p) => { setProj(p); setOpen(true); } }}>
      {children}
      <BrowserViewport open={open} onClose={() => setOpen(false)} initialProject={proj} />
    </ViewportCtx.Provider>
  );
}
export function useViewport() {
  const v = useContext(ViewportCtx);
  if (!v) throw new Error("ViewportProvider missing");
  return v;
}
