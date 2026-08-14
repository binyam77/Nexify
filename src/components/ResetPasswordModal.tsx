import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {  AlertCircle, X, Eye, EyeOff } from "lucide-react";
import {
  requestPasswordResetRequest,
  resetPasswordRequest,
} from "../features/auth.api";
import { ApiError } from "../lib/api-client";

interface ResetPasswordModalProps {
  onClose: () => void;
  onResetSuccess: () => void; // Password reset ስኬታማ ሲሆን - Login ገፅ ላይ message ለማሳየት
}

const RESEND_COOLDOWN_SECONDS = 30;

export default function ResetPasswordModal({
  onClose,
  onResetSuccess,
}: ResetPasswordModalProps) {
  // Step 1 = email input, Step 2 = code + new password
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ================= STEP 1: Request Code =================
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend ሁልጊዜ generic message ይመልሳል (email ቢኖርም ባይኖርም) - enumeration ይከላከላል
      await requestPasswordResetRequest(email);
      setStep(2);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      startCooldownTimer();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= STEP 2: Verify Code + Set New Password =================
  const handleCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, "").slice(0, 6));
    setError("");
  };

  const validateNewPassword = (password: string): string | null => {
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain a number.";
    
    return null;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    const passwordError = validateNewPassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPasswordRequest({ email, code, newPassword });
      onResetSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= Resend Code =================
  const startCooldownTimer = () => {
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

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    setError("");
    try {
      await requestPasswordResetRequest(email);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      startCooldownTimer();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 sm:p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full h-screen sm:h-auto sm:max-w-sm bg-surface sm:rounded-2xl sm:shadow-card border-0 sm:border sm:border-border p-6 sm:p-8 relative flex flex-col justify-center"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1 ================= */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-text-h2">Reset your password</h2>
                <p className="text-gray-500 mt-2 text-sm">
                  Enter your email and we'll send you a reset code.
                </p>
              </div>
              <form onSubmit={handleRequestCode} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-input border border-input-border rounded-lg text-input-text placeholder:text-input-placeholder focus:outline-none focus:border-input-focus transition-all text-sm"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-brand text-white font-semibold rounded-lg text-sm cursor-pointer hover:bg-brand-dark active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Send Reset Code"}
                </button>
              </form>
            </>
          )}

          {/* ================= STEP 2 ================= */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-text-h2">Enter code & new password</h2>
                <p className="text-gray-500 mt-2 text-sm">
                  We sent a 6-digit code to <span className="font-semibold">{email}</span>
                </p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 bg-input border border-input-border rounded-lg text-input-text placeholder:text-input-placeholder focus:outline-none focus:border-input-focus transition-all"
                />

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    autoComplete="new-password"
                    className="w-full px-4 pr-12 py-3 bg-input border border-input-border rounded-lg text-input-text placeholder:text-input-placeholder focus:outline-none focus:border-input-focus transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  At least 8 characters, with uppercase, lowercase, a number, and a special character.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || code.length !== 6}
                  className="w-full py-3 px-4 bg-brand text-white font-semibold rounded-lg text-sm cursor-pointer hover:bg-brand-dark active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </button>
              </form>

              <p className="text-center mt-5 text-sm text-gray-500">
                Didn't get the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || resendCooldown > 0}
                  className="text-brand hover:text-brand-dark font-semibold hover:underline disabled:opacity-60 disabled:no-underline disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}