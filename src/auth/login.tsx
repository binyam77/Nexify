import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface LoginProps {
  onNavigateToSignup: () => void;
  onSubmit: (email: string) => void;
}

export default function Login({ onNavigateToSignup, onSubmit }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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
    // ለጊዘው localStorage check -backend ሲመጣ API call ይተካዋል
    const stored = localStorage.getItem("authUser");
    if (!stored) {
      setError("No account found.Please create an account first.");
      return;
    }
    const storedUser = JSON.parse(stored);
    if (storedUser.email! == email) {
      setError("Email not found.Please check and try again.");
      return;
    }
    setSuccess(true);
    onSubmit(email);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-md bg-surface rounded-2xl shadow-card overflow-hidden border border-border p-8 sm:p-10"
      id="login-card"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-text-h2 tracking-tight">
          Welcome Back
        </h2>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">
          Log in to access your account
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
        {/* Email Input */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-semibold text-gray-700 block"
          >
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Mail className="w-5 h-5" />
            </span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
              required
              className="w-full pl-10 pr-4 py-3 bg-input  border border-input-border rounded-lg text-input-text placeholder:text-input-placeholder
             hover:border-input-hover  focus:outline-none  focus:border-input-focus transition-all text-sm"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-gray-700 block"
          >
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Lock className="w-5 h-5" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full pl-10 pr-12 py-3 bg-input  border border-input-border rounded-lg text-input-text placeholder:text-input-placeholder
              focus:border-input-foces hover:border-input-hover focus:outline-none transition-all text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="button"
          className="w-full py-3.5 px-4 bg-brand text-white font-semibold rounded-lg text-sm sm:text-base cursor-pointer hover:bg-brand-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/15"
        >
          Log In
        </button>
      </form>

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
