import { apiClient } from "./api-client";

const PROBE_TIMEOUT_MS = 4000;

/**
 * server ጋር በ 4 ሰከንድ ውስጥ መድረስ ይቻላል? (እውነተኛ ፍተሻ)
 * - የ server ምላሽ (401/404 ስህተት ቢሆንም) = ተደራሽ
 * - network error ወይም timeout = ግንኙነት የለም / ደካማ
 */
export async function isServerReachable(accessToken: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;

  const timeout = new Promise<"timeout">((resolve) =>
    setTimeout(() => resolve("timeout"), PROBE_TIMEOUT_MS),
  );

  const request = apiClient<unknown>("/notifications/unread-count", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
    .then(() => "ok" as const)
    .catch((err: unknown) =>
      // server መልሷል (HTTP status አለው) → ደርሰናል፤ ካልሆነ network ስህተት ነው
      typeof (err as { status?: unknown } | null)?.status === "number"
        ? ("ok" as const)
        : ("network" as const),
    );

  return (await Promise.race([request, timeout])) === "ok";
}