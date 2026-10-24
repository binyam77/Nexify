// Messaging ክፍሎች የሚጋሩዋቸው ንጹህ (UI የሌላቸው) ተግባራት

/**
 * `mediaUrl` ወደ <img>/<video>/<a href> ከመግባቱ በፊት ይፈተሻል — `javascript:` እና SVG ይከለከላሉ።
 * (backend ቀድሞ ይፈትሻል፤ ይህ ሁለተኛ መከላከያ ነው)
 */
export function isSafeMediaUrl(url: string | undefined): url is string {
  if (!url) return false;
  return /^(?:https:\/\/|blob:|data:(?:image\/(?!svg)|video\/|audio\/|application\/pdf))/i.test(
    url,
  );
}

/** ወደ clipboard መቅዳት። https ያልሆነ አካባቢ (ለምሳሌ LAN IP) clipboard API ስለሌለ ተለዋጭ መንገድ አለው። */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* ወደ ተለዋጭ መንገድ ይሸጋገራል */
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Channel post ሰዓት — ቀን/ወር/ዓመት አይታይም፤ "now" ብሎ ጀምሮ እያደገ ይሄዳል።
 */
export function formatRelativeTime(
  iso: string | undefined,
  nowMs: number,
  fallback: string,
): string {
  if (!iso) return fallback;
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return fallback;
  const sec = Math.max(0, Math.floor((nowMs - created) / 1000));
  if (sec < 60) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  if (day < 30) return `${Math.floor(day / 7)}w`;
  if (day < 365) return `${Math.floor(day / 30)}mo`;
  return `${Math.floor(day / 365)}y`;
}
