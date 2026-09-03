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
