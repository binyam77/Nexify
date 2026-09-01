import { apiClient } from "../lib/api-client";

// ============================================================================
// Backend's response shapes — mirrors src/community/*.ts on the backend.
// PaginatedResult<T> matches src/common/types/pagination.types.ts exactly
// (the same contract every cursor-paginated list endpoint in the backend
// returns — Chat and Notifications use this identical shape too).
// ============================================================================

export type CommunityType = "CHANNEL" | "GROUP";
export type CommunityVisibility = "PUBLIC" | "PRIVATE";
export type CommunityMembershipPolicy = "SELF_JOIN" | "INVITE_ONLY";
export type CommunityRole = "OWNER" | "ADMIN" | "MEMBER";
export type MessageMediaType = "IMAGE" | "VIDEO" | "AUDIO" | "PDF";

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CommunityMessageReaction {
  emoji: string;
  userId: string;
  user: { id: string; profile: { username: string } | null };
}

export interface CommunityMessageResponse {
  id: string;
  communityId: string;
  userId: string;
  user: {
    id: string;
    profile: { username: string; avatar: string | null } | null;
  };
  text: string | null;
  mediaUrl: string | null;
  mediaType: MessageMediaType | null;
  isPinned: boolean;
  isEdited: boolean;
  clientMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  reactions: CommunityMessageReaction[];
}

export interface CommunityResponse {
  id: string;
  type: CommunityType;
  visibility: CommunityVisibility;
  membershipPolicy: CommunityMembershipPolicy;
  name: string;
  description: string | null;
  avatar: string | null;
  cover: string | null;
  themeColor: string | null;
  userId: string; // owner's User.id
  createdAt: string;
  updatedAt: string;
  membersCount: number;
}

// GET /communities?scope=mine — CommunityService.listMine's extra fields
export interface CommunityListItem extends CommunityResponse {
  myRole: CommunityRole;
  unreadCount: number;
  lastMessage: CommunityMessageResponse | null;
}

// GET /communities/:id — CommunityService.findOne's extra fields
export interface CommunityDetailResponse extends CommunityResponse {
  isJoined: boolean;
  myRole: CommunityRole | null;
}

export interface CommunityMemberResponse {
  id: string;
  communityId: string;
  userId: string;
  role: CommunityRole;
  invitedByUserId: string | null;
  joinedAt: string;
  lastReadAt: string | null;
  user: {
    id: string;
    profile: { username: string; avatar: string | null } | null;
  };
}

// Shared cursor-pagination request params — same shape across every list
// endpoint in this file (mirrors PaginationQueryDto on the backend).
interface PaginationParams {
  cursor?: string;
  limit?: number;
}

// Every function below takes `accessToken` explicitly and sets the Bearer
// header itself — same convention already established by meRequest in
// auth.api.ts. apiClient itself never injects auth automatically.
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

// ================= CREATE =================
export function createCommunityRequest(
  accessToken: string,
  params: {
    type: CommunityType;
    name: string;
    description?: string;
    avatar?: string;
    cover?: string;
    themeColor?: string;
    visibility?: CommunityVisibility;
    membershipPolicy?: CommunityMembershipPolicy;
  },
): Promise<CommunityResponse> {
  return apiClient<CommunityResponse>("/communities", {
    method: "POST",
    body: params,
    headers: authHeader(accessToken),
  });
}

// ================= LIST — MINE =================
export function listMyCommunitiesRequest(
  accessToken: string,
  params: PaginationParams = {},
): Promise<PaginatedResult<CommunityListItem>> {
  const qs = toQueryString({ scope: "mine", ...params });
  return apiClient<PaginatedResult<CommunityListItem>>(`/communities${qs}`, {
    headers: authHeader(accessToken),
  });
}

// ================= LIST — SUGGESTED (discovery) =================
export function listSuggestedCommunitiesRequest(
  accessToken: string,
  params: PaginationParams & { type?: CommunityType } = {},
): Promise<PaginatedResult<CommunityResponse>> {
  const qs = toQueryString({ scope: "suggested", ...params });
  return apiClient<PaginatedResult<CommunityResponse>>(`/communities${qs}`, {
    headers: authHeader(accessToken),
  });
}

// ================= GET ONE =================
export function getCommunityRequest(
  accessToken: string,
  communityId: string,
): Promise<CommunityDetailResponse> {
  return apiClient<CommunityDetailResponse>(`/communities/${communityId}`, {
    headers: authHeader(accessToken),
  });
}

// ================= UPDATE (OWNER/ADMIN only) =================
export function updateCommunityRequest(
  accessToken: string,
  communityId: string,
  params: {
    name?: string;
    description?: string;
    avatar?: string;
    cover?: string;
    themeColor?: string;
  },
): Promise<CommunityResponse> {
  return apiClient<CommunityResponse>(`/communities/${communityId}`, {
    method: "PATCH",
    body: params,
    headers: authHeader(accessToken),
  });
}

// ================= DELETE (OWNER only, soft delete) =================
export function deleteCommunityRequest(
  accessToken: string,
  communityId: string,
): Promise<void> {
  return apiClient<void>(`/communities/${communityId}`, {
    method: "DELETE",
    headers: authHeader(accessToken),
  });
}

// ================= JOIN / SUBSCRIBE =================
export function joinCommunityRequest(
  accessToken: string,
  communityId: string,
): Promise<CommunityMemberResponse> {
  return apiClient<CommunityMemberResponse>(
    `/communities/${communityId}/join`,
    {
      method: "POST",
      headers: authHeader(accessToken),
    },
  );
}

// ================= LEAVE =================
export function leaveCommunityRequest(
  accessToken: string,
  communityId: string,
): Promise<void> {
  return apiClient<void>(`/communities/${communityId}/leave`, {
    method: "DELETE",
    headers: authHeader(accessToken),
  });
}

// ================= INVITE MEMBERS (GROUP only, OWNER/ADMIN) =================
export function inviteMembersRequest(
  accessToken: string,
  communityId: string,
  userIds: string[],
): Promise<{ invitedCount: number }> {
  return apiClient<{ invitedCount: number }>(
    `/communities/${communityId}/members`,
    {
      method: "POST",
      body: { userIds },
      headers: authHeader(accessToken),
    },
  );
}

// ================= LIST MEMBERS =================
export function listMembersRequest(
  accessToken: string,
  communityId: string,
  params: PaginationParams = {},
): Promise<PaginatedResult<CommunityMemberResponse>> {
  const qs = toQueryString(params);
  return apiClient<PaginatedResult<CommunityMemberResponse>>(
    `/communities/${communityId}/members${qs}`,
    { headers: authHeader(accessToken) },
  );
}

// ================= MESSAGES: LIST =================
export function listMessagesRequest(
  accessToken: string,
  communityId: string,
  params: PaginationParams = {},
): Promise<PaginatedResult<CommunityMessageResponse>> {
  const qs = toQueryString(params);
  return apiClient<PaginatedResult<CommunityMessageResponse>>(
    `/communities/${communityId}/messages${qs}`,
    { headers: authHeader(accessToken) },
  );
}

// ================= MESSAGES: SEND =================
export function sendMessageRequest(
  accessToken: string,
  communityId: string,
  params: { text?: string; mediaUrl?: string; mediaType?: MessageMediaType },
): Promise<CommunityMessageResponse> {
  return apiClient<CommunityMessageResponse>(
    `/communities/${communityId}/messages`,
    {
      method: "POST",
      body: params,
      headers: authHeader(accessToken),
    },
  );
}

// ================= MESSAGES: EDIT (sender only) =================
export function editMessageRequest(
  accessToken: string,
  communityId: string,
  messageId: string,
  text: string,
): Promise<CommunityMessageResponse> {
  return apiClient<CommunityMessageResponse>(
    `/communities/${communityId}/messages/${messageId}`,
    { method: "PATCH", body: { text }, headers: authHeader(accessToken) },
  );
}

// ================= MESSAGES: DELETE (sender or OWNER/ADMIN) =================
export function deleteMessageRequest(
  accessToken: string,
  communityId: string,
  messageId: string,
): Promise<void> {
  return apiClient<void>(`/communities/${communityId}/messages/${messageId}`, {
    method: "DELETE",
    headers: authHeader(accessToken),
  });
}

// ================= MESSAGES: PIN/UNPIN (OWNER/ADMIN only) =================
export function togglePinMessageRequest(
  accessToken: string,
  communityId: string,
  messageId: string,
): Promise<CommunityMessageResponse> {
  return apiClient<CommunityMessageResponse>(
    `/communities/${communityId}/messages/${messageId}/pin`,
    { method: "PATCH", headers: authHeader(accessToken) },
  );
}

// ================= MESSAGES: REACT =================
export function reactToMessageRequest(
  accessToken: string,
  communityId: string,
  messageId: string,
  emoji: string,
): Promise<{ reacted: boolean; emoji?: string }> {
  return apiClient<{ reacted: boolean; emoji?: string }>(
    `/communities/${communityId}/messages/${messageId}/reactions`,
    { method: "POST", body: { emoji }, headers: authHeader(accessToken) },
  );
}
