import { useState, useEffect } from 'react';

/**
 * Like useState, but the value also persists to localStorage.
 * Replaces the "read once on load, write on every click" pattern
 * that home.js wrote by hand for likes and comments.
 */
export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(( ) => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can fail (private browsing, quota) — not worth crashing over.
    }
  }, [key, value]);

  return [value, setValue] as const;
}