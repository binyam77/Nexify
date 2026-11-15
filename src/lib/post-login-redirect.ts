const STORAGE_KEY = "nexify.postLoginRedirect";
const TTL_MS = 10 * 60 * 1000; // ከ10 ደቂቃ በኋላ የቆየ ዋጋ ይረሳል
const MAX_LENGTH = 2048;
// login ገጾች ራሳቸው ተመልሰው እንዳይሄዱ (loop)። በትናንሽ ፊደል ነው የሚነጻጸረው፤
// React Router ፊደል መጠን አይለይም፣ ስለዚህ /Login ወይም /createaccount ይህን ማለፍ የለባቸውም
const BLOCKED_PREFIXES = ["/login", "/createaccount", "/auth"];

// ከውስጥ (same-origin) path ብቻ ይቀበላል። ያልተፈቀደ ሁሉ → fallback
export function safeRedirectPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  if (!path || path.length > MAX_LENGTH) return fallback;

  // በአንድ "/" ይጀምራል፤ "//" (protocol-relative)፣ backslash እና control characters አይፈቀዱም
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (/[\\\p{Cc}]/u.test(path)) return fallback;

  // ሁለተኛ መከላከያ፦ browser እንደሚተረጉመው ከተተነተነ በኋላ origin ተመሳሳይ መሆን አለበት
  let url: URL;
  try {
    url = new URL(path, window.location.origin);
  } catch {
    return fallback;
  }
  if (url.origin !== window.location.origin) return fallback;

  const pathLower = url.pathname.toLowerCase();
  if (
    BLOCKED_PREFIXES.some(
      (p) => pathLower === p || pathLower.startsWith(`${p}/`),
    )
  ) {
    return fallback;
  }
  return url.pathname + url.search + url.hash; // የተመጣጠነ (normalized) ቅጽ ይመለሳል
}

// Logout ላይ ProtectedRoute ወዲያው path እንዳያስቀምጥ (ሌላ ሰው ቀጥሎ ሲገባ ወደ ቀድሞው ሰው ገጽ እንዳይሄድ)
let suppressUntil = 0;
export function suppressRedirectSave(): void {
  suppressUntil = Date.now() + 2000;
}

export function clearPostLoginRedirect(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode ወዘተ */
  }
}

export function savePostLoginRedirect(path: string): void {
  if (Date.now() < suppressUntil) return;
  const safe = safeRedirectPath(path, "");
  if (!safe) return;
  if (safe === "/") {
    // Home ነባሪ ነው፤ የቆየ የተቀመጠ path ካለ ይወገድ
    clearPostLoginRedirect();
    return;
  }
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ path: safe, at: Date.now() }),
    );
  } catch {
    /* ችላ */
  }
}

// ንባብ ብቻ (side effect የለውም) — React StrictMode ሁለት ጊዜ ቢያስኬደው ተመሳሳይ ዋጋ ይሰጣል
export function peekPostLoginRedirect(fallback = "/"): string {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as { path?: unknown; at?: unknown };
    if (typeof parsed.at !== "number" || Date.now() - parsed.at > TTL_MS) {
      return fallback;
    }
    return safeRedirectPath(parsed.path, fallback); // ሲነበብም እንደገና ይጣራል
  } catch {
    return fallback;
  }
}