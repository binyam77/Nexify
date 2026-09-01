// src/App.tsx
import { useAuth } from "./context/AuthContext";
import { UIProvider } from "./context/UIContext";
import { AnimatePresence } from "framer-motion";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Home from "./pages/home";
import Layout from "./components/Layout";
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
import OAuthCallbackPage from "./auth/OAuthCallbackPage";
import SinglePostView from "./pages/singlePostView";
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, isLoading } = useAuth();

  // የድሮውን handleNavigate በ react-router-dom መተካት
  const handleNavigate = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  // Login.tsx/CreateAccount.tsx ራሳቸው useAuth().login() ን ይጠራሉ (Backend ጋር) —
  // App.tsx's ኃላፊነት navigation ብቻ ነው
  const handleLoginSuccess = () => {
    // RequireAuth's `state: { from: location }` ን ካስቀመጠ፣ እዚያው ይመልሳል፣
    // ካልነበረ (ቀጥታ Login ገፅ ላይ ከሆነ) Home ይልካል
    const from =
      (location.state as { from?: Location })?.from?.pathname ?? ROUTES.home;
    navigate(from, { replace: true });
  };

  // ማረጋገጫው እስከሚጨርስ ሎዲንግ ማሳየት (ከሁሉም በላይ መሆን አለበት)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-4">
          <span className="w-2 h-2 rounded-full bg-gray-300 animate-loading-dot"/>
          <span className="w-2 h-2 rounded-full bg-gray-300 animate-loading-dot [animate-delay:150ms]"/>
          <span className="w-2 h-2 rounded-full bg-gray-300 animate-loading-dot [animate-delay:300ms]"/>
        </div>
      </div>
    );
  }

  return (
    <UIProvider>
      <Routes>
        {/* FirstEntry ገጽ */}
        <Route path="/" element={<Navigate to={ROUTES.home} replace/>}/>
        {/* ✅ የተጠበቁ ገጾች (Protected Routes) */}
        <Route
          element={
            <RequireAuth>
              <Layout />{" "}
            </RequireAuth>
          }
        >
          <Route path={ROUTES.home} element={<Home />} />
          <Route path={ROUTES.profile} element={<Profile />} />
          <Route path={ROUTES.notifications} element={<Notifications />} />
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
              <div className="min-h-screen w-full bg-bodey-bg flex flex-col justify-center items-center p-4 sm:p-6 overflow-x-hidden relative">
                <main className="w-full max-w-md z-10 flex justify-center items-center">
                  <AnimatePresence mode="wait">
                    <CreateAccount
                      key="signup"
                      onNavigateToLogin={() => navigate("/login")}
                    />
                  </AnimatePresence>
                </main>
              </div>
            ) : (
              <Navigate to={ROUTES.home} replace />
            )
          }
        />
        <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
        <Route path="/post/:id" element={<SinglePostView />} />
        <Route
          path="/login"
          element={
            !isLoggedIn ? (
              <div className="min-h-screen w-full bg-bodey-bg flex flex-col justify-center items-center p-4 sm:p-6 overflow-x-hidden relative">
                <main className="w-full max-w-md z-10 flex justify-center items-center">
                  <AnimatePresence mode="wait">
                    <Login
                      key="login"
                      onNavigateToSignup={() => navigate("/createAccount")}
                      onSubmit={handleLoginSuccess}
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
    </UIProvider>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  // ⚠️ TEMPORARY: Login/Google OAuth ገና ስለሚስተካከል፣ ደረጃው ለ development
  // ብቻ ታግዷል። Login ስንጨርስ ከታች ያለውን commented-out code እንመልሳለን።
  return <>{children}</>;

  // const { isLoggedIn } = useAuth();
  // const location = useLocation();
  // if (!isLoggedIn) {
  //   return <Navigate to="/login" state={{ from: location }} replace />;
  // }
  // return <>{children}</>;
}