import { apiClient } from "../lib/api-client";

// Profile domain's endpoints — kept in their own file rather than
// posts.api.ts, since Follow is not a Posts concept (same domain
// separation the backend enforces, mirrored on the frontend).
export function followUser(userId: string): Promise<{ isFollowing: boolean }> {
  return apiClient<{ isFollowing: boolean }>(`/profile/${userId}/follow`, {
    method: "POST",
  });
}

export function unfollowUser(
  userId: string,
): Promise<{ isFollowing: boolean }> {
  return apiClient<{ isFollowing: boolean }>(`/profile/${userId}/follow`, {
    method: "DELETE",
  });
}
export interface FollowListItem {
  userId: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function fetchFollowers(
  userId: string,
  cursor?: string,
  limit = 20,
): Promise<PaginatedResult<FollowListItem>> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));
  return apiClient<PaginatedResult<FollowListItem>>(
    `/profile/${userId}/followers?${params.toString()}`,
  );
}

export function fetchFollowing(
  userId: string,
  cursor?: string,
  limit = 20,
): Promise<PaginatedResult<FollowListItem>> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));
  return apiClient<PaginatedResult<FollowListItem>>(
    `/profile/${userId}/following?${params.toString()}`,
  );
}