/**
 * Renders a user avatar that may be either an emoji/initial string or a remote
 * photo URL (Google / Apple OAuth `avatar_url` / `picture`). Falls back to the
 * first letter of the name when the image cannot be loaded.
 */
import { useState } from "react";

const isUrl = (v?: string | null) => !!v && /^(https?:\/\/|data:image\/)/i.test(v.trim());

export function UserAvatar({
  avatar, name, size = 32, className = "",
}: { avatar?: string | null; name?: string | null; size?: number; className?: string }) {
  const [broken, setBroken] = useState(false);
  const dim = { width: size, height: size };
  const fallback = (name?.trim()?.[0] ?? "🧑").toUpperCase();

  if (isUrl(avatar) && !broken) {
    return (
      <img
        src={avatar as string}
        alt={name ? `${name} avatar` : "User avatar"}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setBroken(true)}
        style={dim}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      style={{ ...dim, fontSize: Math.round(size * 0.55) }}
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-muted leading-none ${className}`}
      aria-hidden={!name}
    >
      {avatar && !isUrl(avatar) ? avatar : fallback}
    </span>
  );
}
