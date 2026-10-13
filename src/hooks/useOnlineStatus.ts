import { useEffect, useRef, useState } from "react";

// ኢንተርኔት ሲጠፋ/ሲመለስ ያውቃል። onReconnect ሲመለስ የወደቀ ነገር እንደገና ለመሞከር ይጠቅማል
export function useOnlineStatus(onReconnect?: () => void): boolean {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const callbackRef = useRef(onReconnect);

  useEffect(() => {
    callbackRef.current = onReconnect;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      callbackRef.current?.();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
