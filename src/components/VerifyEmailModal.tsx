import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import {
  verifyEmailRequest,
  resendVerificationRequest,
} from "../features/auth.api";
import { ApiError } from "../lib/api-client";

interface VerifyEmailModalProps {
  email: string;
  onClose: () => void;
  onVerified: () => void; // ስኬታማ ሲሆን - Parent (ለምሳሌ ወደ Login ማዞር) ይህን ይጠራል
}

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmailModal({
  email,
  onClose,
  onVerified,
}: VerifyEmailModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");

  const handleCodeChange = (value: string) => {
    // ቁጥር ብቻ ይፈቀዳል፣ ከ6 ቁምፊ በላይ አይገባም
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
    setCode(digitsOnly);
    setError("");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyEmailRequest({ email, code });
      onVerified();
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

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError("");
    setResendMessage("");
    try {
      const res = await resendVerificationRequest(email);
      setResendMessage(res.message);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);

      // Countdown timer - 1 ሰከንድ በ1 ሰከንድ ይቀንሳል
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
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
          className="w-full h-screen sm:h-auto sm:max-w-sm bg-surface sm:rounded-2xl sm:shadow-card border-0 sm:border-border p-6 sm:p-8 relative flex-col justify-center"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-text-h2">
              Verify your email
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              We sent a 6-digit code to{" "}
              <span className="font-semibold">{email}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resendMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-sm flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resendMessage}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
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

            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full py-3 px-4 bg-brand text-white font-semibold rounded-lg text-sm cursor-pointer hover:bg-brand-dark active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Verifying..." : "Verify Email"}
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
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend code"}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
