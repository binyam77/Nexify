import type { MessageMediaType } from "../api/community.api";

// ============================================================================
// OFFLINE MESSAGE QUEUE
//
// localStorage-backed so a queued message survives a page refresh/app close
// while network is down — not just in-memory (per explicit decision).
//
// Duplicate-safety ("እንዳይደጋገም"): every queued item carries a stable
// `clientMessageId`, generated ONCE at enqueue time and reused on every
// retry. The backend's (userId, clientMessageId) unique constraint — same
// mechanism as the Chat domain's idempotent send — makes a message that
// was actually persisted but whose ack was lost a safe no-op on retry,
// rather than a duplicate post.
// ============================================================================

const STORAGE_KEY = "nexify_offline_queue";

export interface QueuedMessage {
  clientMessageId: string;
  communityId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: MessageMediaType;
  createdAt: string; // for display ordering only — server createdAt is authoritative once sent
}

export function getQueue(): QueuedMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedMessage[]) : [];
  } catch (e) {
    console.error("Failed to read offline queue from localStorage:", e);
    return [];
  }
}

function saveQueue(queue: QueuedMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to persist offline queue to localStorage:", e);
  }
}

export function enqueue(message: QueuedMessage): void {
  const queue = getQueue();
  queue.push(message);
  saveQueue(queue);
}

/** Removes a single item once it has been successfully sent (or confirmed as a duplicate-of-already-sent by the backend). */
export function dequeue(clientMessageId: string): void {
  const queue = getQueue().filter((m) => m.clientMessageId !== clientMessageId);
  saveQueue(queue);
}

export function generateClientMessageId(): string {
  // crypto.randomUUID() is available in all modern browsers this app targets.
  return crypto.randomUUID();
}