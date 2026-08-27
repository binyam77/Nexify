import { useCallback, useState } from "react";

const STORAGE_KEY = "videoSearchHistory";
const MAX_HISTORY = 10;

// Lazy initializer — localStorage 1 ጊዜ ብቻ በ first render ጊዜ ይነበባል፣
// useEffect አያስፈልግም (React's "no synchronous setState in effect" warning
// ን ከስሩ ያስቀራል፣ ተጨማሪ render cycle ም አይፈጠርም)።
function readHistory(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Local-device-only, per user's explicit choice (MVP simplicity — not
// account-tied, not synced to backend). Clearing app data/cache clears it.
export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(readHistory);

  const addTerm = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((h) => h !== trimmed)].slice(
        0,
        MAX_HISTORY,
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage full/unavailable — history just won't persist this session
      }
      return next;
    });
  }, []);

  const removeTerm = useCallback((term: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h !== term);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { history, addTerm, removeTerm };
}
