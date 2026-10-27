import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { loginRequest, logoutRequest, meRequest } from "../api/auth.api";
import {
  refreshAccessToken,
  RefreshError,
  subscribeToTokenRefreshed,
} from "../lib/refresh-coordinator";
import { fetchMyProfile, updateMyProfile } from "../api/profile.api";
import type { UpdateProfileInput } from "../api/profile.api";
import { setStoredToken } from "../lib/token-store";
import { subscribeToSessionExpired } from "../lib/session-events";
export interface User {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
  role: "USER" | "MODERATOR" | "ADMIN";
  // --- Profile fields (GET /profile/me ይሞላቸዋል) ---
  name?: string;
  bio?: string;
  photo?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithTokens: (accessToken: string) => Promise<void>;
  replaceAccessToken: (token: string) => void;
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
      setStoredToken(null); // የሞተ token በ store ውስጥ እንዳይቀር
      setUser(null);
      // ለሚቀጥለው ሰው እንዳይተላለፍ
      localStorage.removeItem("viewedPostIds");
    });
  }, []);

  // api-client/coordinator አዲስ token ሲያገኝ React state ም ይዘምናል፤ ሌሎች components
  // (ለምሳሌ ወደፊት socket) accessToken ን ከ useAuth ስለሚያነቡ ከ store ጋር መለያየት የለበትም
  useEffect(() => {
    return subscribeToTokenRefreshed((token) => setAccessTokenState(token));
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

  const hasSilentRefreshRun = useRef(false);

  useEffect(() => {
    if (hasSilentRefreshRun.current) return;
    hasSilentRefreshRun.current = true;

    async function silentRefresh() {
      try {
        const newToken = await refreshAccessToken();
        setAccessToken(newToken);
        const me = await meRequest(newToken);
        setUser(me);
        await loadProfileData();
      } catch (err) {
        setAccessToken(null);
        setUser(null);
        // Session በእርግጥ ካለቀ ብቻ (ጊዜያዊ network ችግር ዝርዝሩን አይሰርዝም)
        if (err instanceof RefreshError && err.sessionInvalid) {
          localStorage.removeItem("viewedPostIds");
        }
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
  // accessToken (እና refresh cookie) ቀድሞ ላለው ፍሰት (ለምሳሌ Google exchange)፦
  // /auth/me ብቻ እንጠራለን፣ ከዚያ እንደ login() profile ን እንጭናለን
  const loginWithTokens = async (newAccessToken: string) => {
    setAccessToken(newAccessToken);
    const me = await meRequest(newAccessToken);
    setUser(me);
    await loadProfileData();
  };

  // access token ብቻ ይተካል (user/profile state አይነካም)፤ ለምሳሌ password ከተቀየረ በኋላ
  const replaceAccessToken = (token: string) => {
    setAccessToken(token);
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
      localStorage.removeItem("viewedPostIds");
    }
  };

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
          replaceAccessToken,
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
