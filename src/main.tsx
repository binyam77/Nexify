// src/main.tsx
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.tsx";
import { RealtimeProvider } from "./context/RealtimeContext.tsx";
import App from "./App.tsx";
import "./index.css";
import { FeedProvider } from "./context/FeedContext.tsx";
import { NotificationProvider } from "./context/NotificationContext.tsx";
import { ThemeProvider } from "./context/ThemeContext";

// ተጠቃሚ ሲቀየር ወይም ሲወጣ FeedProvider (እና ከስሩ ያለው ሁሉ) እንደገና ይፈጠራል፣
// ስለዚህ የቀድሞው ሰው liked/feed ሁኔታ ለሚቀጥለው ሰው አይተላለፍም
function UserScopedFeedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return <FeedProvider key={user?.id ?? "anonymous"}>{children}</FeedProvider>;
}
// ከ backend በፊት የነበሩ የ localStorage ቁልፎች ቅሪት። አንድ ጊዜ ማጽዳት፣ ከዚያ በኋላ ምንም አያደርግም
["userPostsMeta", "userProfile", "feedCommentsMap", "countF", "countS"].forEach(
  (key) => localStorage.removeItem(key),
);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <RealtimeProvider>
            <UserScopedFeedProvider>
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </UserScopedFeedProvider>
          </RealtimeProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
