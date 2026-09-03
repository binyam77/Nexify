import { useState } from "react";
import { motion } from "framer-motion";
import {  Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api-client";
import {
  registerStartRequest,
  verifyEmailRequest,
  resendVerificationRequest,
  completeRegistrationRequest,
} from "../api/auth.api";

interface CreateAccountProps {
  onNavigateToLogin: () => void;
}

type Step = "username" | "email" | "verify" | "password";

const RESEND_COOLDOWN_SECONDS = 30;

export default function CreateAccount({
  onNavigateToLogin,
}: CreateAccountProps) {
  const { loginWithTokens } = useAuth();

  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");

  const startCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ---- Step 1: Username ----
  const handleUsernameNext = () => {
    setError("");
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    if (/@/.test(username)) {
      setError("Username cannot contain an email address.");
      return;
    }
    setStep("email");
  };

  // ---- Step 2: Email → registerStart ----
  const handleEmailNext = async () => {
    setError("");
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    try {
      await registerStartRequest({
        username: username.trim(),
        email: email.trim(),
      });
      setStep("verify");
      startCooldown();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Step 3: Verify code ----
  const handleCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, "").slice(0, 6));
    setError("");
  };

  const handleVerify = async () => {
    setError("");
    if (code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setIsSubmitting(true);
    try {
      await verifyEmailRequest({ email, code });
      setStep("password");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setResendMessage("");
    try {
      const res = await resendVerificationRequest(email);
      setResendMessage(res.message);
      startCooldown();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  };

  // ---- Step 4: Password → completeRegistration → auto-login ----
  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter.";
    if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter.";
    if (!/[0-9]/.test(pw)) return "Password must contain a number.";
    return null;
  };

  const handleComplete = async () => {
    setError("");
    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }
    setIsSubmitting(true);
    try {
      const { accessToken } = await completeRegistrationRequest({
        email,
        password,
      });
      if (loginWithTokens) {
        await loginWithTokens(accessToken);
      }
      // AuthContext ራሱ accessToken/user ን ካልያዘ (loginWithTokens ገና ካልገነባን)፣
      // ቢያንስ Login ገፅ ላይ ብቻ ይላካል (ከታች fallback)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const titles: Record<Step, string> = {
    username: "Enter a username",
    email: "What's your email?",
    verify: "Verify your email",
    password: "Create a password",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full bg-bodey-bg flex flex-col px-6 pt-6 pb-10"
    >
     

      <h1 className="text-3xl font-bold text-text-h2 mb-8">{titles[step]}</h1>

      {error && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {resendMessage && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{resendMessage}</span>
        </div>
      )}

      {/* STEP: USERNAME */}
      {step === "username" && (
        <div className="flex flex-col gap-5">
          <div>
            <label className="text-sm text-gray-500 mb-1.5 block">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
              className="w-full px-4 py-3.5 bg-surface-raised rounded-lg text-input-text placeholder:text-input-placeholder border-0 focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition-all text-base"
            />
          </div>
          <button
            type="button"
            onClick={handleUsernameNext}
            disabled={!username}
            className="w-full py-4 bg-brand text-white font-semibold rounded-lg text-base hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      )}

      {/* STEP: EMAIL */}
      {step === "email" && (
        <div className="flex flex-col gap-5">
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
          <button
            type="button"
            onClick={handleEmailNext}
            disabled={isSubmitting || !email}
            className="w-full py-4 bg-brand text-white font-semibold rounded-lg text-base hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Sending..." : "Continue"}
          </button>
        </div>
      )}

      {/* STEP: VERIFY */}
      {step === "verify" && (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-gray-500 -mt-4">
            We sent a 6-digit code to{" "}
            <span className="font-semibold">{email}</span>
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="000000"
            maxLength={6}
            className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3.5 bg-surface-raised rounded-lg text-input-text border-0 focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition-all"
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={isSubmitting || code.length !== 6}
            className="w-full py-4 bg-brand text-white font-semibold rounded-lg text-base hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Verifying..." : "Verify"}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="self-center text-sm font-medium text-[#2563eb] disabled:opacity-60 disabled:text-gray-400"
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend code"}
          </button>
        </div>
      )}

      {/* STEP: PASSWORD */}
      {step === "password" && (
        <div className="flex flex-col gap-5">
          <div>
            <label className="text-sm text-gray-500 mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-3.5 pr-12 bg-surface-raised rounded-lg text-input-text border-0 focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition-all text-base"
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
            <p className="text-xs text-gray-400 mt-1.5">
              At least 8 characters, with uppercase, lowercase, and a number.
            </p>
          </div>
          <button
            type="button"
            onClick={handleComplete}
            disabled={isSubmitting || !password}
            className="w-full py-4 bg-brand text-white font-semibold rounded-lg text-base hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Finishing..." : "Create account"}
          </button>
        </div>
      )}
    </motion.div>
  );
}
