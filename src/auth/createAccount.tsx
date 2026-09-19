import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api-client";
import { registerRequest } from "../api/auth.api";


interface CreateAccountProps {
  onNavigateToLogin: () => void;
}

export default function CreateAccount({
  onNavigateToLogin,
}: CreateAccountProps) {
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): string | null => {
    if (username.trim().length < 3)
      return "Username must be at least 3 characters long.";
    if (/@/.test(username)) return "Username cannot contain an email address.";
    if (!/\S+@\S+\.\S+/.test(email))
      return "Please enter a valid email address.";
    if (password.length < 8)
      return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password))
      return "Password must contain an uppercase letter.";
    if (!/[a-z]/.test(password))
      return "Password must contain a lowercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain a number.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSubmitting(true);
    try {
      const { accessToken } = await registerRequest({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      await loginWithTokens(accessToken);
      navigate("/");
    } catch (err) {
      console.log("🔍 FRONTEND CATCH:", err)
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = () => {
    // TODO: Google OAuth backend ገና አልተገነባም - UI placeholder ብቻ
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full bg-bodey-bg flex flex-col items-center px-6 pt-10 pb-10"
    >
      
      <h1 className="text-3xl font-bold text-text-h2 mb-8">Create Account</h1>

      <div className="w-full max-w-sm">
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleClick}
          className="w-full py-4 px-4 bg-white border border-input-border rounded-xl text-base font-medium text-gray-700 flex items-center justify-center gap-3 hover:bg-surface-raised transition-all mb-5"
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

        <div className="flex items-center gap-3 mb-5">
          <span className="h-px flex-1 bg-border" />
          <span className="text-sm text-gray-400">OR</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
            className="w-full px-4 py-4 bg-surface-raised rounded-xl text-input-text placeholder:text-input-placeholder border-1 focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition-all text-base"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full px-4 py-4 bg-surface-raised rounded-xl text-input-text placeholder:text-input-placeholder border-1 focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition-all text-base"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="new-password"
              className="w-full px-4 py-4 pr-12 bg-surface-raised rounded-xl text-input-text placeholder:text-input-placeholder border-1 focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition-all text-base"
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
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-brand text-white font-semibold rounded-full text-base hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-[#2563eb] font-semibold"
          >
            Log in
          </button>
        </p>
      </div>
    </motion.div>
  );
}
