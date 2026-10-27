import { setStoredToken } from "./token-store";

const API_URL = import.meta.env.VITE_API_URL as string;
const REFRESH_TIMEOUT_MS = 15_000;

// status 0 = network/timeout። 401/403 ብቻ "session በእርግጥ አብቅቷል" ማለት ነው፤
// ሌላ (5xx፣ 429፣ network) ጊዜያዊ ችግር ነው — ተጠቃሚውን ማስወጣት የለበትም
export class RefreshError extends Error {
  readonly status: number;
  constructor(status: number) {
    super("refresh failed");
    this.name = "RefreshError";
    this.status = status;
  }
  get sessionInvalid(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

async function rawRefresh(): Promise<string> {
  // Timeout ያስፈልጋል፦ ይህ በ Web Lock ውስጥ ይሮጣል፣ የተሰቀለ ጥሪ ሌሎች tabs ን ሁሉ ያግዳል
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: controller.signal,
    });
    if (!response.ok) throw new RefreshError(response.status);
    const data = (await response.json()) as { accessToken: string };
    return data.accessToken;
  } catch (err) {
    if (err instanceof RefreshError) throw err;
    throw new RefreshError(0);
  } finally {
    clearTimeout(timer);
  }
}

// ብዙ tabs በአንድ ጊዜ refresh ቢጠሩ ሁሉም ተመሳሳይ cookie ይዘው ይሄዳሉ፣ rotating token
// ደግሞ አንዱን ብቻ ያሳልፋል። Web Lock tabs ን በተራ ያደርጋል፤ ተራው ሲደርስ browser
// አዲሱን cookie ይልካል። Web Locks ከሌለ (ያረጀ browser/insecure context) ወደ ቀጥታ ይመለሳል።
function refreshAcrossTabs(): Promise<string> {
  if (typeof navigator !== "undefined" && "locks" in navigator) {
    return navigator.locks.request("nexify-auth-refresh", () => rawRefresh());
  }
  return rawRefresh();
}

// ጊዜያዊ ችግር (network፣ 5xx) ሲሆን እስከ 3 ጊዜ ይሞክራል። Retry ከ lock ውጭ ነው፣
// ስለዚህ በመጠባበቂያ ጊዜ lock ሌሎች tabs ን አያግድም
async function refreshWithRetry(): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await refreshAcrossTabs();
    } catch (err) {
      lastError = err;
      if (err instanceof RefreshError && err.sessionInvalid) throw err;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

// አዲስ token ሲገኝ AuthContext ን ያሳውቃል (state ከ store ጋር እንዳይለያይ)
const tokenListeners = new Set<(token: string) => void>();

export function subscribeToTokenRefreshed(
  listener: (token: string) => void,
): () => void {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
}

// ወደ /auth/refresh የሚደረገው ብቸኛው እውነተኛ network ጥሪ እዚህ ብቻ ነው።
// AuthContext (ሲጫን) እና api-client (401 ሲያገኝ) ሁለቱም ይህን ይጠራሉ፤ refresh_token
// single-use ስለሆነ ሁለት ትይዩ ጥሪዎች እርስ በርስ ይጋጫሉ
let inFlight: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!inFlight) {
    inFlight = refreshWithRetry()
      .then((token) => {
        setStoredToken(token);
        tokenListeners.forEach((listener) => listener(token));
        return token;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}