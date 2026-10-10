import { useEffect, useState } from "react";

function readOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/**
 * - browserOnline: የ browser online/offline (ለ REST ድርጊቶች)
 * - isUsable: browser online AND Socket.IO ተገናኝቷል (ለ መልዕክት መላክ — መልዕክቶች በ socket ይሄዳሉ)
 *
 * "ደካማ" ግንኙነት የ browser ግምት (effectiveType) አይጠቀምም — ያ ጥሩ ግንኙነት ላይም
 * "2g" ሊል ይችላል። ደካማነት የሚታወቀው በእውነተኛ ፍተሻ (connection-check.ts) ነው።
 */
export function useConnectionGate(isServerConnected: boolean) {
  const [browserOnline, setBrowserOnline] = useState(readOnline);

  useEffect(() => {
    const update = () => setBrowserOnline(readOnline());
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return {
    browserOnline,
    isUsable: browserOnline && isServerConnected,
  };
}