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

// ቁልፉ በተጠቃሚ ተለይቷል — ያለዚያ ከመውጣት በኋላ የገባ ሌላ ተጠቃሚ የቀደመው ሰው
// መልዕክቶችን በራሱ ስም ይልካል (እና ጽሑፉ በመሣሪያው ላይ ይቀራል)
const STORAGE_PREFIX = "nexify_offline_queue:";
// ባለቤት የሌለው የድሮ ቅርጸት — ማን እንደጻፈው ስለማይታወቅ ይወገዳል
const LEGACY_STORAGE_KEY = "nexify_offline_queue";

const MAX_QUEUE_LENGTH = 100;
// ከዚህ በላይ የቆየ መልዕክት ባልተጠበቀ ሰዓት እንዳይላክ ይወገዳል
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

export interface QueuedMessage {
  clientMessageId: string;
  scope: "community" | "conversation";
  targetId: string; // communityId or conversationId, depending on scope
  text?: string;
  mediaUrl?: string;
  mediaType?: MessageMediaType;
  createdAt: string; // for display ordering only — server createdAt is authoritative once sent
}

let ownerUserId: string | null = null;

/** የገባው ተጠቃሚ — ከማንኛውም getQueue/enqueue በፊት መጠራት አለበት። null = የገባ የለም። */
export function setQueueOwner(userId: string | null): void {
  ownerUserId = userId;
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* localStorage የለም — ችላ */
  }
}

function storageKey(): string | null {
  return ownerUserId ? `${STORAGE_PREFIX}${ownerUserId}` : null;
}

function isQueuedMessage(value: unknown): value is QueuedMessage {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.clientMessageId === "string" &&
    (m.scope === "community" || m.scope === "conversation") &&
    typeof m.targetId === "string" &&
    typeof m.createdAt === "string" &&
    (m.text === undefined || typeof m.text === "string") &&
    (m.mediaUrl === undefined || typeof m.mediaUrl === "string")
  );
}

export function getQueue(): QueuedMessage[] {
  const key = storageKey();
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter(
      (m): m is QueuedMessage =>
        isQueuedMessage(m) && now - new Date(m.createdAt).getTime() < MAX_AGE_MS,
    );
  } catch (e) {
    console.error("Failed to read offline queue from localStorage:", e);
    return [];
  }
}

/** true = ተቀምጧል፤ false = አልተቻለም (ማከማቻ ሞልቷል፣ ባለቤት የለም፣ ወይም ወረፋው ሙሉ ነው) */
function saveQueue(queue: QueuedMessage[]): boolean {
  const key = storageKey();
  if (!key) return false;
  try {
    localStorage.setItem(key, JSON.stringify(queue));
    return true;
  } catch (e) {
    console.error("Failed to persist offline queue to localStorage:", e);
    return false;
  }
}

/** true = በወረፋው ውስጥ አለ (አዲስ ወይም ቀድሞ የነበረ)፣ false = ማስቀመጥ አልተቻለም። */
export function enqueue(message: QueuedMessage): boolean {
  const queue = getQueue();
  if (queue.some((m) => m.clientMessageId === message.clientMessageId)) {
    return true;
  }
  if (queue.length >= MAX_QUEUE_LENGTH) return false;
  queue.push(message);
  return saveQueue(queue);
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