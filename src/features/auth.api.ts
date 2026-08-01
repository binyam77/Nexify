import { apiClient } from "../lib/api-client";

// Backend's response shapes — Controller ላይ ያለውን በትክክል ያንጸባርቃል
// (auth.controller.ts ን ይመልከቱ፣ ተመሳሳይ shape ነው)

export interface LoginResponse {
  accessToken: string;
}
export interface MeResponse {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
}
export interface MessageResponse {
  message: string;
}

// ================= REGISTER =================
export function registerRequest(params: {
  username: string;
  email: string;
  password: string;
}): Promise<MessageResponse> {
  return apiClient<MessageResponse>("/auth/register", {
    method: "POST",
    body: params,
  });
}
// ================= LOGIN =================
export function loginRequest(params: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  return apiClient<LoginResponse>("/auth/login", {
    method: "POST",
    body: params,
  });
}

// ================= VERIFY EMAIL (Code-based) =================
export function verifyEmailRequest(params: {
  email: string;
  code: string;
}): Promise<MessageResponse> {
  return apiClient<MessageResponse>("/auth/verify-email", {
    method: "POST",
    body: params,
  });
}

// ================= RESEND VERIFICATION CODE =================
export function resendVerificationRequest(
  email: string,
): Promise<MessageResponse> {
  return apiClient<MessageResponse>("/auth/resend-verification", {
    method: "POST",
    body: { email },
  });
}

// ================= REFRESH =================
export function refreshRequest(): Promise<LoginResponse> {
  // Body አያስፈልገውም — refresh_token cookie ራሱ (httpOnly) አውቶማቲክ ይላካል
  // (apiClient's credentials: "include" ስላደረግን)
  return apiClient<LoginResponse>("/auth/refresh", { method: "POST" });
}

// ================= LOGOUT =================
export function logoutRequest(): Promise<MessageResponse> {
  return apiClient<MessageResponse>("/auth/logout", { method: "POST" });
}
// ================= GET CURRENT USER (Me) =================
export function meRequest(accessToken: string): Promise<MeResponse> {
  return apiClient<MeResponse>("/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
