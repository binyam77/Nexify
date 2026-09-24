import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // ⚠ ትክክለኛውን relative path አስተካክል
import { exchangeGoogleCodeRequest } from "../api/auth.api"; // ⚠ ትክክለኛውን relative path አስተካክል
import { ROUTES } from "../routes"; // ⚠ ትክክለኛውን relative path አስተካክል (route.ts የት እንዳለ)

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    // React StrictMode (dev mode) effect ን 2 ጊዜ ስለሚጠራ፣ handoff code
    // ግን single-use ስለሆነ (2ኛው ጥሪ 401 ያመጣል) - 1 ጊዜ ብቻ እንዲሮጥ እንከላከላለን
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      navigate(`${ROUTES.login}?error=missing_code`);
      return;
    }

    exchangeGoogleCodeRequest(code)
      .then(({ accessToken }) => loginWithTokens(accessToken))
      .then(() => navigate(ROUTES.home))
      .catch(() => {
        navigate(`${ROUTES.login}?error=google_login_failed`);
      });
  }, [navigate, loginWithTokens]);

  return <div>Signing you in…</div>;
}
