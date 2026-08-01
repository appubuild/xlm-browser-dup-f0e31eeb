/** Admin-assignable visual badges shown on project cards and detail pages. */
export const PROJECT_BADGES = [
  { key: "verified", label: "Verified", icon: "✓", cls: "border-primary/40 bg-primary/10 text-primary" },
  { key: "trusted", label: "Trusted", icon: "🛡", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" },
  { key: "featured", label: "Featured", icon: "★", cls: "border-amber-500/40 bg-amber-500/10 text-amber-500" },
  { key: "audited", label: "Audited", icon: "🔍", cls: "border-violet-500/40 bg-violet-500/10 text-violet-500" },
  { key: "partner", label: "Partner", icon: "🤝", cls: "border-sky-500/40 bg-sky-500/10 text-sky-500" },
] as const;

export type ProjectBadgeKey = (typeof PROJECT_BADGES)[number]["key"];

export const badgeMeta = (key: string) => PROJECT_BADGES.find((b) => b.key === key);

export function ProjectBadges({
  badges, className = "", size = "sm",
}: { badges?: string[] | null; className?: string; size?: "sm" | "xs" }) {
  const list = (badges ?? []).map(badgeMeta).filter(Boolean);
  if (list.length === 0) return null;
  const pad = size === "xs" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs";
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {list.map((b) => (
        <span key={b!.key} className={`inline-flex items-center gap-1 rounded-full border font-medium ${pad} ${b!.cls}`}>
          <span aria-hidden>{b!.icon}</span> {b!.label}
        </span>
      ))}
    </span>
  );
}
