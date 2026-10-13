import { useCallback, useState } from "react";

const MAX_HISTORY = 10;

// ቁልፉ በ user id ይለያያል — በአንድ መሳሪያ ላይ የተለያዩ account ታሪክ አይቀላቀልም።
const storageKey = (userId: string) => `videoSearchHistory:${userId}`;

// Lazy initializer — localStorage 1 ጊዜ ብቻ በ first render ይነበባል
function readHistory(userId: string): string[] {
  try {
    const saved = localStorage.getItem(storageKey(userId));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Local-device-only (MVP ውሳኔ) — backend ላይ አይላክም።
export function useSearchHistory(userId: string) {
  const [history, setHistory] = useState<string[]>(() => readHistory(userId));

  const addTerm = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      setHistory((prev) => {
        const next = [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY);
        try {
          localStorage.setItem(storageKey(userId), JSON.stringify(next));
        } catch {
          // storage ሙሉ/የለም — በዚህ session ብቻ ይቆያል
        }
        return next;
      });
    },
    [userId],
  );

  const removeTerm = useCallback(
    (term: string) => {
      setHistory((prev) => {
        const next = prev.filter((h) => h !== term);
        try {
          localStorage.setItem(storageKey(userId), JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [userId],
  );

  return { history, addTerm, removeTerm };
}