// src/App.tsx
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/home";

import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import FirstEntry from "./pages/firstEntry";
import CreateAccount from "../src/pages/createAccount";
import Login from "../src/pages/login";
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
  // 1. Footer Pages Navigation State
  const [currentPage, setCurrentPage] = useState<string>("main_app");

  // 2. Auth States
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

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
    setCurrentPage("main_app"); // Login ሲያደርግ ወደ ዋናው መተግበሪያ እንዲመለስ
  };

  // ሀ. መጀመሪያ ተጠቃሚው ከታች ያሉትን (Footer ገጾች) መርጦ ከሆነ እነሱን አሳይ
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
      // ወደ ዋናው መተግበሪያ ሎጂክ ያልፋል
      break;
  }

  // ለ. ተጠቃሚው Login ካደረገ የ Routes ገጾችን አሳይ
  if (isLoggedIn) {
    return (
      <Routes>
        <Route path="/" element={<FirstEntry />} />
        <Route element={<Layout />}>
          <Route path={ROUTES.home} element={<Home />} />
          <Route path={ROUTES.profile} element={<Profile />} />
          <Route path={ROUTES.community} element={<Community />} />
          <Route path={ROUTES.settings} element={<Settings />} />
        </Route>
      </Routes>
    );
  }

  // ሐ. ተጠቃሚው Login ካላደረገ የ Auth (Signup/Login) ገጾችን አሳይ
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 overflow-x-hidden relative">
      <main className="w-full max-w-md z-10 flex justify-center items-center">
        <AnimatePresence mode="wait">
          {mode === "signup" ? (
            <CreateAccount
              key="signup"
              onNavigateToLogin={() => setMode("login")}
              onSubmit={handleSignupSubmit}
            />
          ) : (
            <Login
              key="login"
              onNavigateToSignup={() => setMode("signup")}
              onSubmit={handleLoginSubmit}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}