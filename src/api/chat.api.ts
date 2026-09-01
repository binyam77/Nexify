import { apiClient } from "../lib/api-client";
// Reused rather than redefined — same underlying backend contracts
// (PaginatedResult from common/types/pagination.types.ts, MessageMediaType
// from the shared MessageMediaType enum both domains' schemas use).
import type { PaginatedResult, MessageMediaType } from "./community.api";

// ============================================================================
// Backend's response shapes — mirrors src/chat/*.ts on the backend.
// ============================================================================

export type ConversationType = "DIRECT" | "GROUP";
export type ConversationRole = "ADMIN" | "MEMBER";

export interface ChatMessageResponse {
  id: string;
  conversationId: string;
  userId: string;
  user: {
    id: string;
    profile: { username: string; avatar: string | null } | null;
  };
  text: string | null;
  mediaUrl: string | null;
  mediaType: MessageMediaType | null;
  clientMessageId: string | null;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  profile: { username: string; avatar: string | null } | null;
}

export interface ConversationResponse {
  id: string;
  type: ConversationType;
  // Only ever set for type = GROUP — a DIRECT conversation has no name or
  // avatar of its own; the client renders the other participant's profile
  // instead (see otherParticipants below).
  name: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /conversations — ConversationsService.listMine's extra fields
export interface ConversationListItem extends ConversationResponse {
  myRole: ConversationRole;
  unreadCount: number;
  lastMessage: ChatMessageResponse | null;
  otherParticipants: ConversationParticipant[];
}

// GET /conversations/:id — ConversationsService.findOne's extra fields
export interface ConversationDetailResponse extends ConversationResponse {
  myRole: ConversationRole;
  members: Array<{ role: ConversationRole; user: ConversationParticipant }>;
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

// ================= CREATE =================
// DIRECT: participantUserIds must contain exactly ONE other user.
// GROUP: participantUserIds has one or more, and `name` is required.
// Starting a DIRECT conversation that already exists between these two
// users returns the EXISTING one rather than creating a duplicate —
// handled server-side (ConversationsService.create), nothing to branch on
// here.
export function createConversationRequest(
  accessToken: string,
  params: {
    type: ConversationType;
    participantUserIds: string[];
    name?: string;
    avatar?: string;
  },
): Promise<ConversationResponse> {
  return apiClient<ConversationResponse>("/conversations", {
    method: "POST",
    body: params,
    headers: authHeader(accessToken),
  });
}

// ================= LIST MINE =================
export function listMyConversationsRequest(
  accessToken: string,
  params: PaginationParams = {},
): Promise<PaginatedResult<ConversationListItem>> {
  const qs = toQueryString(params);
  return apiClient<PaginatedResult<ConversationListItem>>(
    `/conversations${qs}`,
    {
      headers: authHeader(accessToken),
    },
  );
}

// ================= GET ONE =================
export function getConversationRequest(
  accessToken: string,
  conversationId: string,
): Promise<ConversationDetailResponse> {
  return apiClient<ConversationDetailResponse>(
    `/conversations/${conversationId}`,
    {
      headers: authHeader(accessToken),
    },
  );
}

// ================= UPDATE (GROUP only, ADMIN only) =================
export function updateConversationRequest(
  accessToken: string,
  conversationId: string,
  params: { name?: string; avatar?: string },
): Promise<ConversationResponse> {
  return apiClient<ConversationResponse>(`/conversations/${conversationId}`, {
    method: "PATCH",
    body: params,
    headers: authHeader(accessToken),
  });
}

// ================= ADD PARTICIPANTS (GROUP only, ADMIN only) =================
export function addParticipantsRequest(
  accessToken: string,
  conversationId: string,
  userIds: string[],
): Promise<{ addedCount: number }> {
  return apiClient<{ addedCount: number }>(
    `/conversations/${conversationId}/participants`,
    {
      method: "POST",
      body: { userIds },
      headers: authHeader(accessToken),
    },
  );
}

// ================= LEAVE (GROUP only — DIRECT rejects this server-side) =================
export function leaveConversationRequest(
  accessToken: string,
  conversationId: string,
): Promise<void> {
  return apiClient<void>(`/conversations/${conversationId}/leave`, {
    method: "DELETE",
    headers: authHeader(accessToken),
  });
}

// ================= MESSAGES: LIST =================
export function listChatMessagesRequest(
  accessToken: string,
  conversationId: string,
  params: PaginationParams = {},
): Promise<PaginatedResult<ChatMessageResponse>> {
  const qs = toQueryString(params);
  return apiClient<PaginatedResult<ChatMessageResponse>>(
    `/conversations/${conversationId}/messages${qs}`,
    { headers: authHeader(accessToken) },
  );
}

// ================= MESSAGES: SEND (idempotent via clientMessageId) =================
export function sendChatMessageRequest(
  accessToken: string,
  conversationId: string,
  params: {
    text?: string;
    mediaUrl?: string;
    mediaType?: MessageMediaType;
    clientMessageId?: string;
  },
): Promise<ChatMessageResponse> {
  return apiClient<ChatMessageResponse>(
    `/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: params,
      headers: authHeader(accessToken),
    },
  );
}

// ================= MESSAGES: EDIT (sender only) =================
export function editChatMessageRequest(
  accessToken: string,
  conversationId: string,
  messageId: string,
  text: string,
): Promise<ChatMessageResponse> {
  return apiClient<ChatMessageResponse>(
    `/conversations/${conversationId}/messages/${messageId}`,
    { method: "PATCH", body: { text }, headers: authHeader(accessToken) },
  );
}

// ================= MESSAGES: DELETE (sender or GROUP ADMIN) =================
export function deleteChatMessageRequest(
  accessToken: string,
  conversationId: string,
  messageId: string,
): Promise<void> {
  return apiClient<void>(
    `/conversations/${conversationId}/messages/${messageId}`,
    {
      method: "DELETE",
      headers: authHeader(accessToken),
    },
  );
}
