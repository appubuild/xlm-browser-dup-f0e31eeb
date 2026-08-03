/**
 * Animated Stellar Network ecosystem / galaxy background for the hero.
 * Pure SVG + CSS animations, no external deps.
 */
export function GalaxyBg() {
  // Deterministic starfield
  const stars = Array.from({ length: 60 }, (_, i) => {
    const x = ((i * 97) % 1000) / 10;
    const y = ((i * 53) % 600) / 10;
    const r = 0.6 + ((i * 7) % 10) / 12;
    const d = (i % 5) * 0.6;
    return { x, y, r, d };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.72 0.16 250)" stopOpacity="0.9" />
            <stop offset="60%" stopColor="oklch(0.72 0.16 250)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="oklch(0.72 0.16 250)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nebula" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.72 0.15 220)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="oklch(0.72 0.15 220)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Nebula clouds */}
        <ellipse cx="200" cy="150" rx="360" ry="220" fill="url(#nebula)" className="xrpb-float" />
        <ellipse cx="820" cy="450" rx="380" ry="240" fill="url(#nebula)" className="xrpb-float" style={{ animationDelay: "2s" }} />

        {/* Starfield */}
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x * 10}
            cy={s.y * 10}
            r={s.r}
            fill="currentColor"
            className="xrpb-star text-primary"
            style={{ animationDelay: `${s.d}s`, opacity: 0.5 }}
          />
        ))}

        {/* Orbit system — centered near right */}
        <g transform="translate(500 300)">
          {/* Central Stellar core */}
          <circle r="42" fill="url(#core)" />
          <circle r="10" fill="oklch(0.72 0.16 250)" />
          <circle r="18" fill="none" stroke="oklch(0.72 0.16 250)" strokeOpacity="0.5" strokeWidth="1" className="xrpb-pulse-ring" />

          {/* Orbit ring 1 */}
          <g className="xrpb-galaxy-orbit-slow">
            <ellipse rx="120" ry="42" fill="none" stroke="oklch(0.72 0.15 220 / 0.35)" strokeWidth="1" />
            <circle cx="120" cy="0" r="5" fill="oklch(0.72 0.15 220)" />
            <circle cx="-120" cy="0" r="3" fill="oklch(0.72 0.15 220)" />
          </g>

          {/* Orbit ring 2 (tilted) */}
          <g className="xrpb-galaxy-orbit" transform="rotate(35)">
            <ellipse rx="200" ry="68" fill="none" stroke="oklch(0.5 0.18 250 / 0.4)" strokeWidth="1" />
            <circle cx="200" cy="0" r="4" fill="oklch(0.5 0.18 250)" />
            <circle cx="-160" cy="0" r="6" fill="oklch(0.72 0.16 250)" />
          </g>

          {/* Orbit ring 3 */}
          <g className="xrpb-galaxy-orbit-r" transform="rotate(-15)">
            <ellipse rx="290" ry="100" fill="none" stroke="oklch(0.72 0.16 250 / 0.25)" strokeWidth="1" />
            <circle cx="290" cy="0" r="3" fill="oklch(0.82 0.18 75)" />
            <circle cx="-270" cy="0" r="4" fill="oklch(0.65 0.18 150)" />
          </g>
        </g>
      </svg>
    </div>
  );
}
