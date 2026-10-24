import { useEffect, useState } from "react";

function formatRelative(iso: string, now: number): string {
  const diffMs = now - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

// በራሱ የሚቆጥር ጊዜ ("5m", "3h", ...)። `now` በ interval ብቻ ይዘምናል፣ ጽሁፉ ደግሞ
// በ render ጊዜ ይሰላል — effect ውስጥ synchronous setState የለም።
export function useRelativeTime(iso: string): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  return formatRelative(iso, now);
}