import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api-client";

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeOAuthLogin } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    // Backend ራሱ error ካጋጠመው (email_not_verified, oauth_failed) query
    // param ላይ ይመልሳል - ወዲያውኑ Login ገፅ ላይ በ message እናሳያለን
    if (errorParam) {
      const messages: Record<string, string> = {
        email_not_verified: "Your Google/Facebook email is not verified.",
        oauth_failed: "Login failed. Please try again.",
      };
      navigate("/login", {
        replace: true,
        state: { oauthError: messages[errorParam] ?? "Login failed." },
      });
      return;
    }

    if (!code) {
      navigate("/login", { replace: true });
      return;
    }

    completeOAuthLogin(code)
      .then(() => navigate("/", { replace: true }))
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError ? err.message : "Something went wrong.",
        );
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount ላይ 1 ጊዜ ብቻ ይሮጣል - handoff code single-use ስለሆነ

  return (
    <div className="min-h-screen flex items-center justify-center bg-bodey-bg">
      <p className="text-sm text-gray-500">{error || "Signing you in..."}</p>
    </div>
  );
}
