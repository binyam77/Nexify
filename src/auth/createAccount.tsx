import React, { useState } from "react";
import { motion } from "framer-motion";
import { registerRequest } from "../features/auth.api";
import { ApiError } from "../lib/api-client";
import VerifyEmailModal from "../components/VerifyEmailModal";
import logo from "../assets/logo.png";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

interface CreateAccountProps {
  onNavigateToLogin: () => void;
}

export default function CreateAccount({
  onNavigateToLogin,
}: CreateAccountProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }

    // Username email መያዝ የለበትም
    if (/\S+@\S+\.\S+/.test(username) || username.includes("@")) {
      setError("Username cannot contain an email address.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Password strength: >8 chars, 1 letter, 1 number, 1 uppercase
    if (password.length <= 8) {
      setError("Password must be more than 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one letter.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Backend: hash + duplicate check + verification token + email መላክ
      // ⚠️ Token/accessToken አይመለስም — Email verification እስኪደረግ Login አይፈቀድም
      await registerRequest({ username, email, password });
      setSuccess(true);
      setShowVerifyModal(true); // ← Code-entry modal ወዲያውኑ ይከፈታል
      // onSubmit(username, email) አልጠራንም - Auto-login/navigate አያደርግም
      // (ተጠቃሚው email ማረጋገጥ አለበት መጀመሪያ)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 409) {
          // Backend's ConflictException: "Username or email is already in use."
          setError(err.message);
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full sm:max-w-md min-h-screen sm:min-h-0 bg-bodey-bg sm:rounded-2xl sm:shadow-card overflow-hidden border-0 sm:border sm:border-border p-6 sm:p-8 md:p-10 flex flex-col justify-center sm:justify-start sm:block"
        id="create-account-card"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo" className="h-12 w-auto" />
        </div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-text-h2 tracking-tight">
            Create Account
          </h2>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Get started with your free account
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
            <span>
              Account created! Please check your email to verify your account
              before logging in.
            </span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" id="createAccount">
          {/* Username Input - floating label */}
          <div className="relative">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=" "
              autoComplete="username"
              required
              className="peer w-full px-4 pt-4 pb-1.5 bg-input border border-input-border rounded-lg text-input-text placeholder-transparent
              focus:outline-none focus:border-input-focus hover:border-input-hover transition-all text-sm"
            />
            <label
              htmlFor="username"
              className="absolute left-4 -top-2 px-1 bg-bodey-bg text-xs text-brand transition-all pointer-events-none
              peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent
              peer-focus:-top-2 peer-focus:text-xs peer-focus:text-brand peer-focus:bg-bodey-bg"
            >
              Username
            </label>
          </div>

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
              focus:outline-none focus:border-input-focus hover:border-input-hover transition-all text-sm"
            />
            <label
              htmlFor="email"
              className="absolute left-4 -top-2 px-1 bg-bodey-bg text-xs text-brand transition-all pointer-events-none
              peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent
              peer-focus:-top-2 peer-focus:text-xs peer-focus:text-brand peer-focus:bg-bodey-bg"
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
                autoComplete="new-password"
                required
                className="peer w-full px-4 pr-12 pt-4 pb-1.5 bg-input border border-input-border rounded-lg text-text-input placeholder-transparent
                hover:border-input-hover focus:outline-none focus:border-input-focus transition-all text-sm"
              />
              <label
                htmlFor="password"
                className="absolute left-4 -top-2 px-1 bg-bodey-bg text-xs text-brand transition-all pointer-events-none
                peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-brand peer-focus:bg-bodey-bg"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-input-text hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 pl-1">
              At least 8 characters, with uppercase, lowercase, a number.
              Special characters are optional but recommended.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="button"
            disabled={isSubmitting || success}
            className="w-full py-3.5 px-4 bg-brand text-white font-semibold rounded-lg text-sm sm:text-base cursor-pointer hover:bg-brand-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Redirect Link */}
        <p className="text-center mt-7 text-sm text-gray-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-brand hover:text-brand-dark font-bold hover:underline cursor-pointer focus:outline-none ml-1"
          >
            Log In
          </button>
        </p>
      </motion.div>

      {showVerifyModal && (
        <VerifyEmailModal
          email={email}
          onClose={() => setShowVerifyModal(false)}
          onVerified={() => {
            setShowVerifyModal(false);
            onNavigateToLogin();
          }}
        />
      )}
    </>
  );
}
