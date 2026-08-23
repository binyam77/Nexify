import { apiClient } from "../lib/api-client";
import type { FeedPost, CommentItem, CommentReply } from "../types";

// ============================================================================
// BACKEND RESPONSE SHAPES
// Mirrors src/modules/posts/dto/post-response.dto.ts exactly. Nested
// (author/media objects, likedByMe/savedByMe) — NOT the same shape as
// frontend's FeedPost. Adapters below do the one-time translation.
// ============================================================================

interface BackendPostMedia {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  order: number;
}

interface BackendPostAuthor {
  userId: string;
  username: string;
  avatar: string | null;
}

interface BackendPostResponse {
  id: string;
  author: BackendPostAuthor;
  caption: string | null;
  hashtags: string[];
  media: BackendPostMedia[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  viewsCount: number;
  createdAt: string;
  likedByMe: boolean;
  savedByMe: boolean;
}

interface BackendCommentAuthor {
  userId: string;
  username: string;
  avatar: string | null;
}

interface BackendCommentResponse {
  id: string;
  postId: string;
  parentCommentId: string | null;
  author: BackendCommentAuthor;
  text: string;
  createdAt: string;
  replyCount?: number;
  replies?: BackendCommentResponse[];
}

// Mirrors common/types/pagination.types.ts's PaginatedResult<T>.
export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ============================================================================
// ADAPTERS — the only place backend shape ↔ frontend shape translation happens
// ============================================================================

function toFeedPost(dto: BackendPostResponse): FeedPost {
  const firstMedia = dto.media[0];
  return {
    id: dto.id,
    userId: dto.author.userId,
    username: dto.author.username,
    userAvatar: dto.author.avatar ?? "",
    type: firstMedia?.type === "VIDEO" ? "video" : "photo",
    mediaUrls: dto.media.map((m) => m.url),
    caption: dto.caption ?? "",
    hashtags: dto.hashtags,
    likesCount: dto.likesCount,
    commentsCount: dto.commentsCount,
    sharesCount: dto.sharesCount,
    savesCount: dto.savesCount,
    viewsCount: dto.viewsCount,
    createdAt: dto.createdAt,
    liked: dto.likedByMe,
    saved: dto.savedByMe,
  };
}

function toCommentReply(dto: BackendCommentResponse): CommentReply {
  return {
    id: dto.id,
    text: dto.text,
    username: dto.author.username,
    avatar: dto.author.avatar,
    timestamp: dto.createdAt,
  };
}

function toCommentItem(dto: BackendCommentResponse): CommentItem {
  return {
    id: dto.id,
    text: dto.text,
    username: dto.author.username,
    avatar: dto.author.avatar,
    timestamp: dto.createdAt,
    replies: (dto.replies ?? []).map(toCommentReply),
  };
}

// ============================================================================
// HOME FEED
// ============================================================================

export async function fetchFeed(
  cursor?: string,
  limit = 10,
): Promise<PaginatedResult<FeedPost>> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));

  const result = await apiClient<PaginatedResult<BackendPostResponse>>(
    `/home/feed?${params.toString()}`,
  );
  return { ...result, items: result.items.map(toFeedPost) };
}

// ============================================================================
// POST INTERACTIONS
// (Real backend endpoints are explicit like/unlike & save/unsave pairs, NOT
// a single PATCH toggle — the caller decides direction from current state,
// same as the UI already does.)
// ============================================================================

export function viewPost(postId: string): Promise<null> {
  return apiClient<null>(`/posts/${postId}/view`, { method: "POST" });
}

export function likePost(postId: string): Promise<{ liked: boolean }> {
  return apiClient<{ liked: boolean }>(`/posts/${postId}/like`, {
    method: "POST",
  });
}

export function unlikePost(postId: string): Promise<{ liked: boolean }> {
  return apiClient<{ liked: boolean }>(`/posts/${postId}/like`, {
    method: "DELETE",
  });
}

export function savePost(postId: string): Promise<{ saved: boolean }> {
  return apiClient<{ saved: boolean }>(`/posts/${postId}/save`, {
    method: "POST",
  });
}

export function unsavePost(postId: string): Promise<{ saved: boolean }> {
  return apiClient<{ saved: boolean }>(`/posts/${postId}/save`, {
    method: "DELETE",
  });
}

export function sharePost(postId: string): Promise<{ sharesCount: number }> {
  return apiClient<{ sharesCount: number }>(`/posts/${postId}/share`, {
    method: "POST",
  });
}

// ============================================================================
// COMMENTS
// ============================================================================

export async function fetchComments(
  postId: string,
  cursor?: string,
  limit = 20,
): Promise<PaginatedResult<CommentItem>> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));

  const result = await apiClient<PaginatedResult<BackendCommentResponse>>(
    `/posts/${postId}/comments?${params.toString()}`,
  );
  return { ...result, items: result.items.map(toCommentItem) };
}

// username/avatar are no longer sent from the client — the server derives
// the author from the authenticated JWT actor, never from client input
// (architecture-contract.md Section 8: never trust client-supplied identity).
export async function addComment(
  postId: string,
  text: string,
): Promise<CommentItem> {
  const dto = await apiClient<BackendCommentResponse>(
    `/posts/${postId}/comments`,
    {
      method: "POST",
      body: { text },
    },
  );
  return toCommentItem(dto);
}

export async function addReply(
  postId: string,
  parentCommentId: string,
  text: string,
): Promise<CommentReply> {
  const dto = await apiClient<BackendCommentResponse>(
    `/posts/${postId}/comments`,
    {
      method: "POST",
      body: { text, parentCommentId },
    },
  );
  return toCommentReply(dto);
}

// Works for both a top-level comment and a reply (both are just Comment
// rows on the backend) — the caller doesn't need to know which one it is.
export async function editComment(
  commentId: string,
  text: string,
): Promise<{ id: string; text: string; timestamp: string }> {
  const dto = await apiClient<BackendCommentResponse>(
    `/comments/${commentId}`,
    {
      method: "PATCH",
      body: { text },
    },
  );
  return { id: dto.id, text: dto.text, timestamp: dto.createdAt };
}

// Deletion is by the comment's own id, whether it's a top-level comment or
// a reply — matches the backend's single DELETE /comments/:id route.
export function deleteCommentOrReply(commentId: string): Promise<null> {
  return apiClient<null>(`/comments/${commentId}`, { method: "DELETE" });
}
