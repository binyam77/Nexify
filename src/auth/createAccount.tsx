import React, { useState } from "react";
import { motion } from "framer-motion";

import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface CreateAccountProps {
  onNavigateToLogin: () => void;
  onSubmit: (username: string, email: string) => void;
}

export default function CreateAccount({
  onNavigateToLogin,
  onSubmit,
}: CreateAccountProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setSuccess(true);
    onSubmit(username, email);
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-md bg-white rounded-2xl shadow-input overflow-hidden border border-gray-200 p-8 sm:p-10"
      id="create-account-card"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
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
            Account created successfully! Connecting your integration...
          </span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" id="createAccount">
        {/* Username Input */}
        <div className="space-y-2">
          <label
            htmlFor="username"
            className="text-sm font-semibold text-gray-700 block"
          >
            Username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <User className="w-5 h-5" />
            </span>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              className="w-full pl-10 pr-4 py-3 bg-input  border border-input-border rounded-lg text-input-text placeholder:text-input-placeholder focus:outline-none  focus:border-input-focus
              hover:border-input-hover transition-all text-sm"
            />
          </div>
        </div>

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
              className="w-full pl-10 pr-4 py-3 bg-input  border border-input-border rounded-lg text-input-text placeholder:text-input-placeholder focus:outline-none 
              focus:input-focus hover:border-input-hover transition-all text-sm"
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
              placeholder="Create a strong password"
              required
              className="w-full pl-10 pr-12 py-3 bg-input border border-input-border rounded-lg text-text-input placeholder:text-input-placeholder
              hover:border-input-hover    focus:outline-none showdaw-soft transition-all text-sm"
            />
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
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="button"
          className="w-full py-3.5 px-4 bg-brand text-white font-semibold rounded-lg text-sm sm:text-base cursor-pointer hover:bg-brand-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15"
        >
          Create Account
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
  );
}
