import { apiClient } from "../lib/api-client";
import type { PaginatedResult } from "./community.api";

// ============================================================================
// Backend's response shapes — mirrors src/notifications/*.ts on the backend.
// NotificationType is intentionally open-ended: MVP scope covers Community/
// Chat triggers only, but the same endpoint and shape will carry future
// Posts-domain types (e.g. POST_LIKE, POST_COMMENT) without any change
// here — only new string values appear in `type`.
// ============================================================================

export type NotificationType =
  | "MENTION"
  | "COMMUNITY_INVITE"
  | "COMMUNITY_NEW_SUBSCRIBER"
  | "DIRECT_MESSAGE"
  | "POST_LIKE"
  | "POST_COMMENT"
  | "NEW_FOLLOWER";

export interface NotificationActor {
  id: string;
  profile: { username: string; avatar: string | null } | null;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  actorUserId: string | null;
  actorUser: NotificationActor | null;
  type: NotificationType;
  // At most one of the five below is set, matching `type` — same
  // nullable-reference design as the backend's Notification model.
  communityId: string | null;
  communityMessageId: string | null;
  messageId: string | null;
  postId: string | null;
  commentId: string | null;
  // Composed server-side at read time (never stored) — see backend's
  // NotificationsService.composeMessage. Always a ready-to-render string.
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface PaginationParams {
  cursor?: string;
  limit?: number;
}

function authHeader(accessToken: string): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}` };
}

function toQueryString<T extends object>(params: T): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [
    string,
    string,
  ][];
  if (entries.length === 0) return "";
  const search = new URLSearchParams(entries);
  return `?${search.toString()}`;
}

// ================= LIST =================
export function listNotificationsRequest(
  accessToken: string,
  params: PaginationParams = {},
): Promise<PaginatedResult<NotificationResponse>> {
  const qs = toQueryString(params);
  return apiClient<PaginatedResult<NotificationResponse>>(
    `/notifications${qs}`,
    {
      headers: authHeader(accessToken),
    },
  );
}

// ================= UNREAD COUNT (for the bell badge) =================
export function unreadNotificationCountRequest(
  accessToken: string,
): Promise<{ count: number }> {
  return apiClient<{ count: number }>("/notifications/unread-count", {
    headers: authHeader(accessToken),
  });
}

// ================= MARK ONE READ =================
export function markNotificationReadRequest(
  accessToken: string,
  notificationId: string,
): Promise<NotificationResponse> {
  return apiClient<NotificationResponse>(
    `/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: authHeader(accessToken),
    },
  );
}
