import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  loginRequest,
  logoutRequest,
  refreshRequest,
  meRequest,
} from "../api/auth.api";
import { fetchMyProfile, updateMyProfile } from "../api/profile.api";
import type { UpdateProfileInput } from "../api/profile.api";
import { setStoredToken } from "../lib/token-store";
import { subscribeToSessionExpired } from "../lib/session-events";
export interface User {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
  role: "user" | "moderator" | "admin";
  // --- Backend ገና ያልሰጠን fields (Profile module ሲገነባ ይሞላሉ) ---
  name?: string;
  bio?: string;
  photo?: string;
  cover?: string;
  followersCount?: number;
  followingCount?: number;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithTokens: (accessToken: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  profileLoadError: string | null;
  retryLoadProfile: () => Promise<void>;
  updateFollowCount: (
    type: "followers" | "following",
    increment: boolean,
  ) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // ⚠️ accessToken በፍጹም localStorage/sessionStorage አይገባም — React state (in-memory) ብቻ
  // (XSS ቢኖር እንኳ ስርቆት እንዳይቻል)

  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);

  // React state (for re-renders) + module-level store (for api-client.ts
  // to auto-attach Authorization on every request) are always updated
  // together, from this one place, so they can never drift apart.
  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    setStoredToken(token);
  };

  // If api-client.ts's auto-refresh-retry ever fails (refresh_token itself
  // expired/revoked), it clears the store and fires this event — clearing
  // React state here too so isLoggedIn flips false and route guards send
  // the person back to login, instead of the app quietly staying "logged
  // in" while every subsequent request keeps 401ing.
  useEffect(() => {
    return subscribeToSessionExpired(() => {
      setAccessTokenState(null);
      setUser(null);
    });
  }, []);

  // --- Silent Refresh on App Load ---
  // Page reload ሲደረግ accessToken (in-memory) ይጠፋል፣ ግን refresh_token
  // httpOnly cookie አሁንም አለ — ይህን ተጠቅመን በራሱ አዲስ accessToken እናገኛለን
  const loadProfileData = async (): Promise<void> => {
    setProfileLoadError(null);
    try {
      const profileData = await fetchMyProfile();
      setUser((prev) => (prev ? { ...prev, ...profileData } : prev));
    } catch (e) {
      console.error("Failed to load profile data:", e);
      setProfileLoadError("Profile data መጫን አልተቻለም።");
    }
  };

  useEffect(() => {
    async function silentRefresh() {
      try {
        const { accessToken: newToken } = await refreshRequest();
        setAccessToken(newToken);
        const me = await meRequest(newToken);
        setUser(me);
        await loadProfileData();
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    void silentRefresh();
  }, []);

  const login = async (email: string, password: string) => {
    const { accessToken: newToken } = await loginRequest({ email, password });
    setAccessToken(newToken);
    const me = await meRequest(newToken);
    setUser(me);
    await loadProfileData();
  };
  // Complete Registration ራሱ accessToken ስለሚመልስ (refresh cookie already
  // Backend ራሱ አዘጋጅቶታል) - loginRequest() ደግመን አንጠራም፣ /auth/me ብቻ እንጠራለን
  const loginWithTokens = async (newAccessToken: string) => {
    setAccessToken(newAccessToken);

    // Register ካደረገ ወዲያውኑ (millisecond ውስጥ) /auth/me ስለሚጠራ፣
    // Database's eventual-consistency window ን ለማለፍ አጭር retry
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const me = await meRequest(newAccessToken);
        setUser(me);
        return;
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
    throw lastError;
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch {
      // Logout request ቢወድቅ እንኳ (ለምሳሌ network issue)፣ local state ግን እናጸዳለን
      // ተጠቃሚው በ UI ደረጃ "logged out" ሆኖ እንዲታይ
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  // --- Profile fields (bio, photo, ...) — Backend Profile module ገና ስለሌለ
  // ለጊዜው local state ብቻ ነው የሚቀየረው (UI optimistic update)፣ persist አያደርግም
  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : prev));
  };

  const updateProfile = async (input: UpdateProfileInput) => {
    const profileData = await updateMyProfile(input);
    setUser((prev) => (prev ? { ...prev, ...profileData } : prev));
  };

  const updateFollowCount = (
    type: "followers" | "following",
    increment: boolean,
  ) => {
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        followersCount:
          type === "followers"
            ? (prev.followersCount ?? 0) + (increment ? 1 : -1)
            : prev.followersCount,
        followingCount:
          type === "following"
            ? (prev.followingCount ?? 0) + (increment ? 1 : -1)
            : prev.followingCount,
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoggedIn: !!user,
        isLoading,
        login,

        logout,
        loginWithTokens,
        updateUser,
        updateProfile,
        updateFollowCount,
        profileLoadError,
        retryLoadProfile: loadProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth ከ AuthProvider ውጪ ጥቅም ላይ ዋለ");
  return context;
}
