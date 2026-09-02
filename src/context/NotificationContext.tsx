import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useRealtime } from "./RealtimeContext";
import {
  listNotificationsRequest,
  unreadNotificationCountRequest,
  markNotificationReadRequest,
} from "../api/notifications.api";
import type {
  NotificationResponse,
  NotificationType as BackendNotificationType,
} from "../api/notifications.api";

// ============================================================================
// Frontend-facing notification shape — unchanged from the original UI
// contract (Notifications.tsx already renders this shape; not touched
// here). Backend's uppercase NotificationType is mapped down to this
// lowercase set at the boundary (mapBackendType below) — this is the ONLY
// place that mapping happens, so the UI component never has to know the
// backend's vocabulary.
// ============================================================================
export type NotificationType = "like" | "comment" | "follow";

export interface AppNotification {
  id: string;
  type: NotificationType;
  actorUsername: string;
  actorAvatar: string;
  message: string;
  postId?: string;
  commentId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Notifications page scope is Post/Profile-domain only (Like/Comment/
// Follow). Backend's flat Notification table can also carry Community/
// Chat-domain types (MENTION, COMMUNITY_INVITE, COMMUNITY_NEW_SUBSCRIBER,
// DIRECT_MESSAGE) — those are deliberately filtered out here, at the
// frontend boundary, rather than in the backend query, so a future
// Community/Chat notifications view can reuse the same endpoint by
// filtering differently, without any backend change.
function mapBackendType(
  type: BackendNotificationType,
): NotificationType | null {
  switch (type) {
    case "POST_LIKE":
      return "like";
    case "POST_COMMENT":
      return "comment";
    case "NEW_FOLLOWER":
      return "follow";
    default:
      return null;
  }
}

function toAppNotification(n: NotificationResponse): AppNotification | null {
  const type = mapBackendType(n.type);
  if (!type) return null;

  return {
    id: n.id,
    type,
    actorUsername: n.actorUser?.profile?.username ?? "Someone",
    actorAvatar: n.actorUser?.profile?.avatar ?? "",
    message: n.message,
    postId: n.postId ?? undefined,
    commentId: n.commentId ?? undefined,
    isRead: n.isRead,
    createdAt: n.createdAt,
  };
}

// Narrows an array of possibly-null mapped notifications down to
// AppNotification[], dropping anything out of this page's scope.
function toAppNotifications(items: NotificationResponse[]): AppNotification[] {
  return items
    .map(toAppNotification)
    .filter((n): n is AppNotification => n !== null);
}

const PAGE_LIMIT = 20;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { accessToken, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { socket } = useRealtime();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | undefined>(undefined);

  // --- Initial load: waits for silent-refresh to finish (AuthContext's
  // own isLoading) so this never fires with a stale/null token. ---
  /* eslint-disable react-hooks/set-state-in-effect -- bailing out early when auth isn't ready/logged-out is syncing to an external system's state, same justified pattern already used in RealTimeContext.tsx */
  useEffect(() => {
    if (isAuthLoading) return;

    if (!isLoggedIn || !accessToken) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [page, unread] = await Promise.all([
          listNotificationsRequest(accessToken!, { limit: PAGE_LIMIT }),
          unreadNotificationCountRequest(accessToken!),
        ]);
        if (cancelled) return;
        setNotifications(toAppNotifications(page.items));
        cursorRef.current = page.nextCursor ?? undefined;
        setHasMore(page.hasMore);
        setUnreadCount(unread.count);
      } catch {
        // Network/API failure on initial load — leave the list empty
        // rather than crash; the bell/badge simply shows nothing until
        // the next successful fetch.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, accessToken, isAuthLoading]);
  /* eslint-enable react-hooks/set-state-in-effect */
  // --- Real-time delivery: RealtimeGateway pushes 'notification:new' to
  // this user's own socket(s) (see backend's PresenceService-based
  // targeting) — purely additive to whatever REST already loaded, never a
  // replacement for it (Section 17: this is a delivery hint, not the
  // source of truth). ---
  useEffect(() => {
    if (!socket) return;

    function handleNew(payload: NotificationResponse) {
      const mapped = toAppNotification(payload);
      if (!mapped) return; // out of this page's scope (e.g. a Community/Chat notification)
      setNotifications((prev) => [mapped, ...prev]);
      setUnreadCount((prev) => prev + 1);
    }
    socket.on("notification:new", handleNew);
    return () => {
      socket.off("notification:new", handleNew);
    };
  }, [socket]);

  const loadMore = useCallback(async () => {
    if (!accessToken || !hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const page = await listNotificationsRequest(accessToken, {
        cursor: cursorRef.current,
        limit: PAGE_LIMIT,
      });
      setNotifications((prev) => [...prev, ...toAppNotifications(page.items)]);
      cursorRef.current = page.nextCursor ?? undefined;
      setHasMore(page.hasMore);
    } catch {
      // Leave existing page as-is on failure — user can retry by scrolling again.
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, hasMore, isLoading]);

  const markAsRead = useCallback(
    (id: string) => {
      if (!accessToken) return;
      const target = notifications.find((n) => n.id === id);
      if (!target || target.isRead) return; // idempotent, matches backend

      // Optimistic UI update — reverted only implicitly (next full load)
      // if the request fails; a single failed mark-read is low stakes.
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      void markNotificationReadRequest(accessToken, id).catch(() => {
        // Silently ignored — see comment above.
      });
    },
    [accessToken, notifications],
  );

  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        hasMore,
        loadMore,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return ctx;
}
