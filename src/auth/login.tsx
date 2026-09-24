import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Eye, EyeOff, AlertCircle, CheckCircle2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api-client";
import ResetPasswordModal from "../components/ResetPasswordModal";
import logo from "../assets/logo.png";

interface LoginProps {
  onNavigateToSignup: () => void;
}

export default function Login({ onNavigateToSignup }: LoginProps) {
  const [showEmailCard, setShowEmailCard] = useState(false);

  const handleGoogleClick = () => {
    window.location.href = "http://localhost:3000/auth/google";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full bg-bodey-bg flex flex-col items-center justify-center px-6"
    >
      <img src={logo} alt="Logo" className="h-20 w-auto mb-10" />

      <div className="w-full max-w-sm flex flex-col gap-4">
        <button
          type="button"
          onClick={handleGoogleClick}
          className="w-full py-4 px-4 bg-white border border-input-border rounded-xl text-base font-medium text-gray-700 flex items-center justify-center gap-3 hover:bg-surface-raised transition-all"
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
          onClick={() => setShowEmailCard(true)}
          className="w-full py-4 px-4 border-1 border-[#2563be] rounded-xl text-base font-semibold text-[#2563eb] flex items-center justify-center gap-3 hover:bg-blue-50 transition-all"
        >
          <Mail className="w-5 h-5" />
          Continue with Email
        </button>

        <p className="text-center text-xs text-gray-400 mt-1">
          By using Nexify, you agree to our{" "}
          <a href="/privacy" className="text-[#2563eb]">
            Privacy Policy
          </a>{" "}
          and{" "}
          <a href="/terms" className="text-[#2563eb]">
            Terms & Services
          </a>
          .
        </p>

        <button
          type="button"
          onClick={onNavigateToSignup}
          className="w-full py-4 border-1 border-[#2563eb] rounded-full text-base font-semibold text-[#2563eb] hover:bg-blue-50 transition-all mt-1"
        >
          Create account
        </button>
      </div>

      {showEmailCard && (
        <LoginEmailCard onClose={() => setShowEmailCard(false)} />
      )}
    </motion.div>
  );
}

// ============================================================================
// Email Login Card (Modal)
// ============================================================================
function LoginEmailCard({ onClose }: { onClose: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full h-screen sm:h-auto sm:max-w-sm bg-surface sm:rounded-2xl sm:shadow-card p-6 sm:p-8 relative flex flex-col justify-center"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-bold text-text-h2 mb-6">Log in</h2>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {resetSuccessMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-sm flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full px-4 py-3.5 bg-surface-raised rounded-lg text-input-text placeholder:text-input-placeholder border-0 focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition-all text-base"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full px-4 py-3.5 pr-12 bg-surface-raised rounded-lg text-input-text placeholder:text-input-placeholder border-0 focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition-all text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="self-start text-sm font-medium text-[#2563eb]"
            >
              Forgot password?
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-b from-[#3b82f6] to-[#2563eb] text-white font-semibold rounded-lg text-base hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>
          </form>
        </motion.div>
      </div>

      {showResetModal && (
        <ResetPasswordModal
          onClose={() => setShowResetModal(false)}
          onResetSuccess={() => {
            setShowResetModal(false);
            setResetSuccessMessage(
              "Password reset successfully! Please log in with your new password.",
            );
          }}
        />
      )}
    </>
  );
}
