import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle, CheckCircle2, AtSign, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api-client";
import ResetPasswordModal from "../components/ResetPasswordModal";

interface LoginProps {
  onNavigateToSignup: () => void;
  onNavigateBack?: () => void;
}

export default function Login({ onNavigateToSignup }: LoginProps) {
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
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };
  const handleFacebookLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/facebook`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen w-full bg-bodey-bg flex flex-col px-6 pt-6 pb-24"
      >

        <h1 className="text-3xl font-bold text-text-h2 mb-8">Log in</h1>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {resetSuccessMessage && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{resetSuccessMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm text-gray-500 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-4 py-3.5 bg-surface-raised rounded-lg text-input-text placeholder:text-input-placeholder border-0 focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition-all text-base"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-3.5 pr-12 bg-surface-raised rounded-lg text-input-text border-0 focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition-all text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
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
            className="w-full py-4 bg-brand text-white font-semibold rounded-lg text-base hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {isSubmitting ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-7">
          <span className="h-px flex-1 bg-border" />
          <span className="text-sm text-gray-400">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3.5 px-4 border border-input-border rounded-lg text-base font-medium text-gray-700 flex items-center justify-center gap-3 hover:bg-surface-raised transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.88c2.27-2.09 3.54-5.17 3.54-8.87z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.3v3.09C3.27 21.3 7.31 24 12 24z" />
              <path fill="#FBBC05" d="M5.31 14.33c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.68H1.3A11.98 11.98 0 000 12.05c0 1.93.46 3.76 1.3 5.37l4.01-3.09z" />
              <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.27 2.7 1.3 6.68l4.01 3.09c.94-2.82 3.58-4.92 6.69-4.92z" />
            </svg>
            Continue with Google
          </button>
          <button
            type="button"
            onClick={handleFacebookLogin}
            className="w-full py-3.5 px-4 border border-input-border rounded-lg text-base font-medium text-gray-700 flex items-center justify-center gap-3 hover:bg-surface-raised transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z" />
            </svg>
            Continue with Facebook
          </button>
        </div>

    
      </motion.div>

      {/* Bottom sticky bar - mirrors Binance's alternate-method bar */}
      <button
        type="button"
        onClick={onNavigateToSignup}
        className="fixed bottom-0 left-0 right-0 bg-surface-raised border-t border-border py-4 px-6 flex items-center justify-center gap-2 text-brand text-base font-medium"
      >
        <AtSign className="w-4 h-4" />
        Create account
        <ChevronRight className="w-4 h-4" />
      </button>

      {showResetModal && (
        <ResetPasswordModal
          onClose={() => setShowResetModal(false)}
          onResetSuccess={() => {
            setShowResetModal(false);
            setResetSuccessMessage("Password reset successfully! Please log in with your new password.");
          }}
        />
      )}
    </>
  );
}