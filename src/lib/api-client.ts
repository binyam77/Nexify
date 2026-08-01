// ⭐ ይህ ፋይል "Backend ጋር እንዴት እንገናኝ" የሚለውን 1 ቦታ ብቻ ይይዛል።
// Login.tsx/CreateAccount.tsx ውስጥ fetch() በቀጥታ አንጽፍም —
// ሁሉም በዚህ wrapper በኩል ያልፋል (DRY + single source of truth)

const API_URL = import.meta.env.VITE_API_URL as string;

if (!API_URL) {
  // Build-time/runtime ላይ በግልጽ እንዲታወቅ — silent misconfiguration አደገኛ ነው
  throw new Error("VITE_API_URL is not defined in .env");
}

export class ApiError extends Error {
  readonly statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?:Record<string, string>;
}



export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json", ...options.headers },
    // ⚠️ ይህ ወሳኝ ነው — refresh_token httpOnly cookie እንዲላክ/እንዲቀበል ያደርጋል
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Backend ላይ Content ከሌለ (ለምሳሌ 204) ወይም JSON ካልሆነ ይህን እናስተናግዳለን
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Backend's error format: { message, error, statusCode }
    const message =
      (data as { message?: string })?.message ??
      "An unexpected error occurred.";
    throw new ApiError(response.status, message);
  }

  return data as T;
}
