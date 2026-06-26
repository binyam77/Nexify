// src/App.tsx
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Routes, Route, Navigate } from "react-router-dom"; // ✅ Navigate ጨምረናል
import Home from "./pages/home";
import Layout from "./components/Layout";
import FirstEntry from "./auth/firstEntry";
import CreateAccount from "./auth/createAccount";
import Login from "./auth/login";
import Profile from "./pages/profile";
import Community from "./pages/comminty";
import Settings from "./pages/settings";
import { ROUTES } from "./routes";
import About from "./footer/about";
import Privacy from "./footer/privacy";
import Terms from "./footer/terms";
import Contact from "./footer/contact";
import Helps from "./footer/helps";

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("main_app");
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // ✅ የ"Flash" ችግርን ለመከላከል የመጫኛ (Loading) State
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!user);
    setIsLoading(false); // ቼክ አድርጎ ሲጨርስ Loading ን ያቆማል
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSignupSubmit = (username: string, email: string) => {
    console.log("Signup Submitted:", { username, email });
    setMode("login");
  };

  const handleLoginSubmit = (email: string) => {
    console.log("Login Submitted:", { email });
    setIsLoggedIn(true);
    setCurrentPage("main_app");
  };

  // Footer Pages Navigation Logic
  switch (currentPage) {
    case "privacy":
      return <Privacy onNavigate={handleNavigate} />;
    case "terms":
      return <Terms onNavigate={handleNavigate} />;
    case "contact":
      return <Contact onNavigate={handleNavigate} />;
    case "helps":
      return <Helps onNavigate={handleNavigate} />;
    case "about":
      return <About onNavigate={handleNavigate} />;
    case "main_app":
    default:
      break;
  }

  // ማረጋገጫው እስከሚጨርስ ባዶ ገጽ ወይም ስፒነር ማሳየት
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* FirstEntry ገጽ */}
      <Route path="/" element={<FirstEntry />} />

      {/* ✅ የተጠበቁ ገጾች (Protected Routes) */}
      <Route
        element={isLoggedIn ? <Layout /> : <Navigate to="/login" replace />}
      >
        <Route path={ROUTES.home} element={<Home />} />
        <Route path={ROUTES.profile} element={<Profile />} />
        <Route path={ROUTES.community} element={<Community />} />
        <Route path={ROUTES.settings} element={<Settings />} />
      </Route>

      {/* ✅ የAuth ገጾች (ያልገቡ ሰዎች ብቻ የሚያዩት) */}
      <Route
        path="/createAccount"
        element={
          !isLoggedIn ? (
            <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 overflow-x-hidden relative">
              <main className="w-full max-w-md z-10 flex justify-center items-center">
                <AnimatePresence mode="wait">
                  <CreateAccount
                    key="signup"
                    onNavigateToLogin={() => setMode("login")}
                    onSubmit={handleSignupSubmit}
                  />
                </AnimatePresence>
              </main>
            </div>
          ) : (
            <Navigate to={ROUTES.home} replace />
          )
        }
      />

      <Route
        path="/login"
        element={
          !isLoggedIn ? (
            <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 overflow-x-hidden relative">
              <main className="w-full max-w-md z-10 flex justify-center items-center">
                <AnimatePresence mode="wait">
                  <Login
                    key="login"
                    onNavigateToSignup={() => setMode("signup")}
                    onSubmit={handleLoginSubmit}
                  />
                </AnimatePresence>
              </main>
            </div>
          ) : (
            <Navigate to={ROUTES.home} replace />
          )
        }
      />

      {/* በስህተት ለሚጻፍ Route ወደ መጀመሪያው ይመልሳል */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
