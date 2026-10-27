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
  role: "USER" | "MODERATOR" | "ADMIN";
  isVerified: boolean;
  createdAt: string;
}
export interface MessageResponse {
  message: string;
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
// ================= REQUEST PASSWORD RESET =================
export function requestPasswordResetRequest(
  email: string,
): Promise<MessageResponse> {
  return apiClient<MessageResponse>("/auth/request-password-reset", {
    method: "POST",
    body: { email },
  });
}

// ================= RESET PASSWORD =================
export function resetPasswordRequest(params: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<MessageResponse> {
  return apiClient<MessageResponse>("/auth/reset-password", {
    method: "POST",
    body: params,
  });
}

// Authorization ራሱ በ apiClient ከ token-store ይያያዛል (ጊዜው ካለፈ በራስ-ሰር refresh ያደርጋል)
export function changeUsernameRequest(
  username: string,
): Promise<MessageResponse> {
  return apiClient<MessageResponse>("/auth/me/username", {
    method: "PATCH",
    body: { username },
  });
}

export function changePasswordRequest(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string; accessToken: string }> {
  return apiClient("/auth/me/password", {
    method: "PATCH",
    body: params,
  });
}

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
// ================= GOOGLE OAUTH EXCHANGE =================
// Google callback ላይ የተፈጠረውን 1-ጊዜ-ብቻ handoff code በ real tokens
// ይለውጣል (accessToken body ላይ፣ refreshToken httpOnly cookie ራሱ
// Backend ራሱ ያዘጋጃል - apiClient's credentials:"include" ስላለው)
export function exchangeGoogleCodeRequest(
  code: string,
): Promise<LoginResponse> {
  return apiClient<LoginResponse>("/auth/google/exchange", {
    method: "POST",
    body: { code },
  });
}
