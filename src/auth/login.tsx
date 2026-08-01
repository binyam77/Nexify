import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api-client";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
// TODO: አድራሻውን የእርስዎ project structure መሰረት ያስተካክሉ
// (ለምሳሌ Login.tsx በ src/pages/ ውስጥ ከሆነ "../assets/logo.png" ትክክል ነው)
import logo from "../assets/logo.png";

interface LoginProps {
  onNavigateToSignup: () => void;
  onSubmit: (email: string) => void;
  // OAuth handlers: parent component ደረጃ ላይ (App.tsx / auth service) ይተገበራሉ.
  // Backend ሲገባ፣ እዚህ component ውስጥ ምንም ለውጥ አያስፈልግም — parent ብቻ API call ይጨምራል.
  onGoogleLogin?: () => void;
  onFacebookLogin?: () => void;
}

export default function Login({
  onNavigateToSignup,
  onSubmit,
  onGoogleLogin,
  onFacebookLogin,
}: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      // AuthContext's login() → Backend POST /auth/login → accessToken ያገኛል
      // → GET /auth/me ራሱ በራሱ ይጠራል → user state ይሞላል
      await login(email, password);
      setSuccess(true);
      onSubmit(email); // Parent (routing) ን ማሳወቅ - ነባር pattern
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 403) {
          // Backend's ForbiddenException: "Please verify your email..."
          setError(err.message);
        } else if (err.statusCode === 401) {
          setError("Invalid email or password.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleGoogleLogin = () => {
    // Placeholder — Backend ሲገባ: redirect to /api/auth/google
    // (state parameter ለ CSRF prevention፣ token exchange ደግሞ ሙሉ በሙሉ backend-side)
    onGoogleLogin?.();
  };

  const handleFacebookLogin = () => {
    // Placeholder — Backend ሲገባ: redirect to /api/auth/facebook
    onFacebookLogin?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full sm:max-w-md min-h-screen sm:min-h-0 bg-transparent sm:bg-surface sm:rounded-2xl sm:shadow-card overflow-hidden border-0 sm:border sm:border-border p-6 sm:p-8 md:p-10 flex flex-col justify-center sm:justify-start sm:block"
      id="login-card"
    >
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <img src={logo} alt="Logo" className="h-12 w-auto" />
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-text-h2 tracking-tight">
          Welcome Back
        </h2>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">
          Sign in to continue
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-5 p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-sm flex items-start gap-2.5"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-5 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-sm flex items-start gap-2.5"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>Authenticated! Connecting your integration...</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" id="loginForm">
        {/* Email Input - floating label */}
        <div className="relative">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=" "
            autoComplete="email"
            required
            className="peer w-full px-4 pt-4 pb-1.5 bg-input border border-input-border rounded-lg text-input-text placeholder-transparent
              hover:border-input-hover focus:outline-none focus:border-input-focus transition-all text-sm"
          />
          <label
            htmlFor="email"
            className="absolute left-4 -top-2 px-1 bg-surface text-xs text-brand transition-all pointer-events-none
              peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent
              peer-focus:-top-2 peer-focus:text-xs peer-focus:text-brand peer-focus:bg-surface"
          >
            Email
          </label>
        </div>

        {/* Password Input - floating label */}
        <div className="space-y-2">
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              autoComplete="current-password"
              required
              className="peer w-full px-4 pr-12 pt-4 pb-1.5 bg-input border border-input-border rounded-lg text-input-text placeholder-transparent
                focus:border-input-focus hover:border-input-hover focus:outline-none transition-all text-sm"
            />
            <label
              htmlFor="password"
              className="absolute left-4 -top-2 px-1 bg-surface text-xs text-brand transition-all pointer-events-none
                peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-brand peer-focus:bg-surface"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs font-semibold text-brand hover:text-brand-dark hover:underline focus:outline-none"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {/* Submit Button */}
       <button
          type="submit"
          id="button"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 bg-brand text-white font-semibold rounded-lg text-sm sm:text-base cursor-pointer hover:bg-brand-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/15 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Social Login */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-3 px-4 bg-white border border-input-border rounded-lg text-sm font-semibold text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.88c2.27-2.09 3.54-5.17 3.54-8.87z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.3v3.09C3.27 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.31 14.33c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.68H1.3A11.98 11.98 0 000 12.05c0 1.93.46 3.76 1.3 5.37l4.01-3.09z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.27 2.7 1.3 6.68l4.01 3.09c.94-2.82 3.58-4.92 6.69-4.92z"
            />
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={handleFacebookLogin}
          className="w-full py-3 px-4 bg-white border border-input-border rounded-lg text-sm font-semibold text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z" />
          </svg>
          Continue with Facebook
        </button>
      </div>

      {/* Redirect Link */}
      <p className="text-center mt-7 text-sm text-gray-500">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onNavigateToSignup}
          className="text-brand hover:text-brand-dark font-bold hover:underline cursor-pointer focus:outline-none ml-1"
        >
          Create Account
        </button>
      </p>
    </motion.div>
  );
}
