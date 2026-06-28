// src/App.tsx
import { useAuth } from "./context/AuthContext";
import { AnimatePresence } from "framer-motion";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
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
import Notifications from "./pages/notfications";

export default function App() {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading, login } = useAuth();

  // የድሮውን handleNavigate በ react-router-dom መተካት
  const handleNavigate = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSignupSubmit = (username: string, email: string) => {
    login({ username, email });
    navigate(ROUTES.home);
  };

  const handleLoginSubmit = (email: string) => {
    // ለጊዘው localStorage--> backend  ሲመጣ  API response ይጠከማል
    const stored = localStorage.getItem("authUser");
    const storedUser = stored ? JSON.parse(stored) : null;
    login({
      email,
      username: storedUser?.username || email,
    });
    navigate(ROUTES.home);
  };

  // ማረጋገጫው እስከሚጨርስ ሎዲንግ ማሳየት (ከሁሉም በላይ መሆን አለበት)
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
        <Route path={ROUTES.notifications} element={<Notifications/>}/>
        <Route path={ROUTES.community} element={<Community />} />
        <Route path={ROUTES.settings} element={<Settings />} />
      </Route>

      {/* ✅ የFooter ገጾች (አሁን በRoute ሆነዋል!) */}
      <Route
        path="/privacy"
        element={<Privacy onNavigate={handleNavigate} />}
      />
      <Route path="/terms" element={<Terms onNavigate={handleNavigate} />} />
      <Route
        path="/contact"
        element={<Contact onNavigate={handleNavigate} />}
      />
      <Route path="/helps" element={<Helps onNavigate={handleNavigate} />} />
      <Route path="/about" element={<About onNavigate={handleNavigate} />} />

      {/* ✅ የAuth ገጾች */}
      <Route
        path="/createAccount"
        element={
          !isLoggedIn ? (
            <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 overflow-x-hidden relative">
              <main className="w-full max-w-md z-10 flex justify-center items-center">
                <AnimatePresence mode="wait">
                  <CreateAccount
                    key="signup"
                    onNavigateToLogin={() => navigate("/login")}
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
                    onNavigateToSignup={() => navigate("/createAccount")}
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

      {/* በስህተት ለሚጻፍ Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
