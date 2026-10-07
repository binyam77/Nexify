import { useEffect, useState } from "react";

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
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

// Self-updating relative time ("5h", "3d", ...) — re-computes on an
// interval so it counts up on its own without a page refresh.
export function useRelativeTime(iso: string): string {
  const [label, setLabel] = useState(() => formatRelative(iso));

  useEffect(() => {
    setLabel(formatRelative(iso));
    const id = setInterval(() => setLabel(formatRelative(iso)), 30_000);
    return () => clearInterval(id);
  }, [iso]);

  return label;
}
