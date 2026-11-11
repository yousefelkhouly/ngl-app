const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const shortDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const clock = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// "just now", "5 minutes ago", "yesterday", then a date
export function timeAgo(iso: string, now = Date.now()): string {
  const elapsed = now - new Date(iso).getTime();
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return relative.format(-Math.floor(elapsed / MINUTE), "minute");
  if (elapsed < DAY) return relative.format(-Math.floor(elapsed / HOUR), "hour");
  if (elapsed < 7 * DAY) return relative.format(-Math.floor(elapsed / DAY), "day");
  return shortDate.format(new Date(iso));
}

export function clockTime(iso: string): string {
  return clock.format(new Date(iso));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.trim().slice(0, 2);
  return letters.toUpperCase();
}

// only same-site paths, so ?next= can't send someone to another website after login
export function safeNextPath(next: string | null | undefined, fallback = "/inbox"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}

// 1234567 → "1.2 MB"
export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
