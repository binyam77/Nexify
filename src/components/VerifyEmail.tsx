import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api-client";
import { verifyEmailRequest, resendVerificationRequest } from "../api/auth.api";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

interface VerifyEmailProps {
  email: string;
  // verify ከተሳካ በኋላ በራስ-ሰር login ለማድረግ (in-memory ብቻ፣ የትም አይቀመጥም)
  password: string;
  // Login ላይ 403 ሲመጣ ኮድ ገና ስላልተላከ፣ ሲከፈት በራስ-ሰር ይላክ
  sendCodeOnMount?: boolean;
  onBack: () => void;
  onGoToLogin: () => void;
  onVerified?: () => void;
}

export default function VerifyEmail({
  email,
  password,
  sendCodeOnMount = false,
  onBack,
  onGoToLogin,
  onVerified,
}: VerifyEmailProps) {
  const { login } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const didAutoSend = useRef(false);

  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [needsManualLogin, setNeedsManualLogin] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    sendCodeOnMount ? 0 : RESEND_COOLDOWN_SECONDS,
  );

  // Resend cooldown ቆጣሪ (backend throttle: 3/ደቂቃ ስለሆነ ተጠቃሚው እንዳይመታው)
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const sendCode = useCallback(async () => {
    setError("");
    setInfo("");
    setIsResending(true);
    try {
      await resendVerificationRequest(email);
      setInfo("A new code has been sent to your email.");
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setCode("");
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setIsResending(false);
    }
  }, [email]);

  // Login ላይ ለመጣ ተጠቃሚ ኮድ በራስ-ሰር ይላካል። ref ጠባቂው React StrictMode
  // (dev ላይ effect 2 ጊዜ ይሮጣል) ሁለት ኢሜል እንዳይላክ ይከላከላል
  useEffect(() => {
    if (!sendCodeOnMount || didAutoSend.current) return;
    didAutoSend.current = true;
    void sendCode();
  }, [sendCodeOnMount, sendCode]);

  const submit = async (value: string) => {
    if (isSubmitting) return;
    setError("");
    setInfo("");
    setIsSubmitting(true);

    try {
      await verifyEmailRequest({ email, code: value });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
      setCode("");
      setIsSubmitting(false);
      inputRef.current?.focus();
      return;
    }

    // Email ተረጋግጧል → በራስ-ሰር login
    try {
      await login(email, password);
      onVerified?.();
    } catch {
      setNeedsManualLogin(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ቁጥር ብቻ፤ paste/autofill ("123 456" ወይም "123-456") ቢሆንም ይጸዳል
    const next = e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(next);
    if (next.length === CODE_LENGTH) void submit(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === CODE_LENGTH) void submit(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        // ሞባይል፦ ሙሉ ስክሪን (h-dvh — የ browser address bar ን ያገናዝባል)፣ ከላይ ጀምሮ
        // (keyboard ሲከፈት እንዳይሸፍነው)። sm+፦ የመሃል card
        className="w-full h-dvh sm:h-auto sm:max-w-sm bg-surface sm:rounded-2xl sm:shadow-card px-6 pb-6 pt-20 sm:p-8 relative flex flex-col justify-start sm:justify-center overflow-y-auto"
      >
        {!needsManualLogin && (
          <button
            type="button"
            onClick={onBack}
            className="absolute top-4 left-4 text-icon-muted hover:text-icon-secondary"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {needsManualLogin ? "Email verified" : "Verify your email"}
          </h2>
          {!needsManualLogin && (
            <p className="text-sm text-text-secondary">
              Enter the 6-digit code we sent to{" "}
              <span className="font-semibold text-text-primary break-all">
                {email}
              </span>
              .
            </p>
          )}
        </div>

        <div aria-live="polite">
          {error && !needsManualLogin && (
            <div className="mb-4 p-3 bg-error-light border border-error-border text-error rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="mb-4 p-3 bg-success-light border border-success-border text-success rounded-lg text-sm flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{info}</span>
            </div>
          )}
        </div>

        {needsManualLogin ? (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-success-light border border-success-border text-success rounded-lg text-sm flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Your email is verified, but we couldn't log you in
                automatically. Please log in.
              </span>
            </div>
            <button
              type="button"
              onClick={onGoToLogin}
              className="w-full py-3.5 bg-gradient-to-b from-primary to-primary-hover text-text-on-primary font-semibold rounded-lg text-base hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Go to log in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* 6 የሚታዩ ሳጥኖች + አንድ እውነተኛ (ግልጽ) input — paste፣ backspace እና
                የ iOS/Android ኮድ autofill በራሱ ይሰራሉ */}
            <div className="relative">
              <div className="flex gap-2">
                {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 min-w-0 h-14 flex items-center justify-center rounded-lg bg-input-special-bg text-input-special-text text-2xl font-semibold border-1 border-input-special-border transition-all ${
                      focused && i === Math.min(code.length, CODE_LENGTH - 1)
                        ? "ring-2 ring-input-special-focus"
                        : ""
                    }`}
                  >
                    {code[i] ?? ""}
                  </div>
                ))}
              </div>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={handleChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                disabled={isSubmitting}
                aria-label="6-digit verification code"
                className="absolute inset-0 w-full h-full opacity-0 cursor-text text-base"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || code.length < CODE_LENGTH}
              className="w-full py-3.5 bg-gradient-to-b from-primary to-primary-hover text-text-on-primary font-semibold rounded-lg text-base hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Verifying..." : "Verify"}
            </button>

            <p className="text-center text-sm text-text-secondary">
              Didn't get the code?{" "}
              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={secondsLeft > 0 || isResending || isSubmitting}
                className="text-link font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isResending
                  ? "Sending..."
                  : secondsLeft > 0
                    ? `Resend in ${secondsLeft}s`
                    : "Resend code"}
              </button>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
