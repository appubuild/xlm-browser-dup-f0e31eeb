import { useEffect, useState, type ReactNode } from "react";
import { X, ArrowLeft, ArrowRight, RotateCw, Home, Star, ExternalLink, Plus } from "lucide-react";
import { useApp } from "@/lib/app-store";
import type { Project } from "@/lib/app-store";

interface Tab { id: string; project: Project; loading: boolean; blocked: boolean }

interface Props {
  open: boolean;
  onClose: () => void;
  initialProject: Project | null;
}

export function BrowserViewport({ open, onClose, initialProject }: Props) {
  const { theme, bookmarks, toggleBookmark, pushHistory } = useApp();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open && initialProject) {
      const exists = tabs.find((t) => t.project.slug === initialProject.slug);
      if (exists) setActiveId(exists.id);
      else {
        const id = Math.random().toString(36).slice(2);
        setTabs((ts) => [...ts, { id, project: initialProject, loading: true, blocked: false }]);
        setActiveId(id);
        pushHistory(initialProject.slug);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialProject]);

  const active = tabs.find((t) => t.id === activeId);

  useEffect(() => {
    if (!active?.loading) { setProgress(0); return; }
    setProgress(10);
    const i = setInterval(() => setProgress((p) => Math.min(p + Math.random() * 25, 92)), 220);
    const done = setTimeout(() => {
      setProgress(100);
      setTabs((ts) => ts.map((t) => (t.id === active.id ? { ...t, loading: false } : t)));
    }, 1400);
    return () => { clearInterval(i); clearTimeout(done); };
  }, [active?.loading, active?.id]);

  if (!open) return null;

  const closeTab = (id: string) => {
    setTabs((ts) => {
      const next = ts.filter((t) => t.id !== id);
      if (next.length === 0) { onClose(); return next; }
      if (id === activeId) setActiveId(next[next.length - 1].id);
      return next;
    });
  };

  const refresh = () => active && setTabs((ts) => ts.map((t) => (t.id === active.id ? { ...t, loading: true, blocked: false } : t)));

  const isRetro = theme === "dark";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-sm">
      {/* window chrome */}
      <div className={isRetro ? "flex items-center gap-2 border-b-2 border-primary bg-secondary px-2 py-1" : "flex items-center gap-2 border-b bg-card px-3 py-2"}>
        {isRetro ? (
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 border border-primary bg-secondary" />
            <span className="inline-block h-3 w-3 border border-primary bg-secondary" />
            <span className="inline-block h-3 w-3 border border-primary bg-secondary" />
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-red-400" />
            <span className="inline-block h-3 w-3 rounded-full bg-yellow-400" />
            <span className="inline-block h-3 w-3 rounded-full bg-green-400" />
          </div>
        )}
        <div className="ml-2 text-xs font-medium">XRPBrowser {isRetro ? "— Navigator 4.0" : "Viewport"}</div>
        <button onClick={onClose} className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-muted">
          <X className="h-3.5 w-3.5" /> Close
        </button>
      </div>

      {/* tab strip */}
      <div className={isRetro ? "flex items-end gap-1 border-b border-primary bg-background px-2 pt-1" : "flex items-end gap-1 border-b bg-card px-2 pt-1"}>
        {tabs.map((t) => (
          <div key={t.id} onClick={() => setActiveId(t.id)} className={`flex cursor-pointer items-center gap-2 border border-b-0 px-3 py-1.5 text-xs ${t.id === activeId ? "bg-background" : "bg-muted text-muted-foreground"} ${isRetro ? "rounded-none" : "rounded-t-md"}`}>
            <span>{t.project.logo}</span>
            <span className="max-w-[140px] truncate">{t.project.name}</span>
            <button onClick={(e) => { e.stopPropagation(); closeTab(t.id); }} className="opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>
          </div>
        ))}
        <button className={`ml-1 px-2 py-1 text-xs hover:bg-muted ${isRetro ? "" : "rounded"}`} title="New tab"><Plus className="h-3 w-3" /></button>
      </div>

      {/* address bar */}
      <div className={isRetro ? "flex items-center gap-2 border-b border-primary bg-secondary px-2 py-1 text-xs" : "flex items-center gap-2 border-b bg-card px-3 py-2 text-sm"}>
        <button className={isRetro ? "retro-btn" : "rounded p-1 hover:bg-muted"} title="Back"><ArrowLeft className="h-4 w-4" /></button>
        <button className={isRetro ? "retro-btn" : "rounded p-1 hover:bg-muted"} title="Forward"><ArrowRight className="h-4 w-4" /></button>
        <button onClick={refresh} className={isRetro ? "retro-btn" : "rounded p-1 hover:bg-muted"} title="Refresh"><RotateCw className="h-4 w-4" /></button>
        <button onClick={onClose} className={isRetro ? "retro-btn" : "rounded p-1 hover:bg-muted"} title="Home"><Home className="h-4 w-4" /></button>
        <div className={isRetro ? "flex flex-1 items-center gap-1 border border-primary bg-background px-2 py-0.5" : "flex flex-1 items-center gap-2 rounded-full border bg-background px-3 py-1"}>
          <span className="text-xs opacity-60">🔒</span>
          <span className="truncate">{active?.project.url}</span>
          {isRetro && <span className="blink">_</span>}
        </div>
        {active && (
          <button onClick={() => toggleBookmark(active.project.slug)} className={isRetro ? "retro-btn" : "rounded p-1 hover:bg-muted"} title="Bookmark">
            <Star className={`h-4 w-4 ${bookmarks.includes(active.project.slug) ? "fill-current text-yellow-500" : ""}`} />
          </button>
        )}
        {active && (
          <a href={active.project.url} target="_blank" rel="noreferrer" className={isRetro ? "retro-btn" : "inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:opacity-90"}>
            <ExternalLink className="h-3 w-3" /> Open external
          </a>
        )}
      </div>

      {/* progress */}
      {active?.loading && (
        <div className="border-b bg-background px-3 py-2">
          {isRetro ? (
            <div className="font-mono text-xs">
              LOADING {active.project.url.replace("https://", "").toUpperCase()}...{" "}
              <span>[{"█".repeat(Math.floor(progress / 10))}{"░".repeat(10 - Math.floor(progress / 10))}] {Math.floor(progress)}%</span>
            </div>
          ) : (
            <div className="h-1 w-full overflow-hidden rounded bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* content */}
      <div className="relative flex-1 overflow-auto bg-background">
        {active && !active.loading && (
          <ViewportContent tab={active} onBlocked={() => setTabs((ts) => ts.map((t) => (t.id === active.id ? { ...t, blocked: true } : t)))} />
        )}
      </div>
    </div>
  );
}

function ViewportContent({ tab, onBlocked }: { tab: Tab; onBlocked: () => void }) {
  // Since most sites block embedding, always show mock preview after brief attempt
  return <BlockedFallback project={tab.project} />;
}

function BlockedFallback({ project }: { project: Project }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 p-10 text-center">
      <div className="text-6xl">{project.logo}</div>
      <h2 className="text-2xl font-bold">{project.name}</h2>
      <p className="text-muted-foreground">{project.tagline}</p>
      <p className="max-w-xl text-sm">{project.description}</p>
      <div className="soft-card w-full max-w-xl p-6">
        <div className="text-sm text-muted-foreground">Live preview unavailable — this site blocks embedded browsing.</div>
        <a href={project.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <ExternalLink className="h-4 w-4" /> Visit official site
        </a>
      </div>
    </div>
  );
}

// Global controller
import { createContext, useContext } from "react";
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
