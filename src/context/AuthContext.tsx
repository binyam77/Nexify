import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

export interface User {
  username: string;
  email: string;
  bio?: string;
  photo?: string;
  // ✅ backend ሲመጣ ሌሎች fields እዚህ ጨምር (id, avatar, etc.)
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ⏳ ለጊዜው localStorage — backend ሲመጣ ይህን ብቻ ቀይር:
    // const res = await api.getMe(); setUser(res.data);
    try {
      const stored = localStorage.getItem("authUser");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem("authUser");
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    // backend ሲመጣ: const res = await api.login(userData); setUser(res.data);
    localStorage.setItem("authUser", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    //authUser አናስወጣም _>> ተጠካሚው ተመልሶ login ማድረግ እንዲችል
    // backend ሲመጣ: session/token ብቻ ያጠፋል

    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...userData };
      // localStorage sync - backend ሲመጣ: await api.updateUser(userData)
      localStorage.setItem("authUser", JSON.stringify(updated));
      localStorage.setItem(
        "userProfile",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("userProfile") || "{}"),
          ...userData,
        }),
      );
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: !!user, isLoading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth ከ AuthProvider ውጪ ጥቅም ላይ ዋለ");
  return context;
}
