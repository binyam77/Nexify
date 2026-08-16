import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  loginRequest,
  logoutRequest,
  refreshRequest,
  meRequest,
  exchangeOAuthCodeRequest,
} from "../features/auth.api";

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
  completeOAuthLogin: (handoffCode: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Silent Refresh on App Load ---
  // Page reload ሲደረግ accessToken (in-memory) ይጠፋል፣ ግን refresh_token
  // httpOnly cookie አሁንም አለ — ይህን ተጠቅመን በራሱ አዲስ accessToken እናገኛለን
  useEffect(() => {
    async function silentRefresh() {
      try {
        const { accessToken: newToken } = await refreshRequest();
        setAccessToken(newToken);
        const me = await meRequest(newToken);
        setUser(me);
      } catch {
        // Refresh token የለም/expired ነው — ተጠቃሚው logged out ነው ማለት ብቻ ነው (error አይደለም)
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
  };

  const completeOAuthLogin = async (handoffCode: string) => {
    const { accessToken: newToken } =
      await exchangeOAuthCodeRequest(handoffCode);
    setAccessToken(newToken);
    const me = await meRequest(newToken);
    setUser(me);
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
        completeOAuthLogin,
        logout,
        updateUser,
        updateFollowCount,
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
