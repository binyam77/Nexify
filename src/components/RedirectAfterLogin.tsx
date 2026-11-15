import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "../routes";
import {
  clearPostLoginRedirect,
  peekPostLoginRedirect,
} from "../lib/post-login-redirect";

// ገብቶ የጨረሰ ተጠቃሚን መጀመሪያ ወደ ፈለገው ገጽ (ወይም Home) ይልካል።
// ብቸኛው የ "ከ login በኋላ የት ልሂድ" ውሳኔ ቦታ ይህ ነው።
export default function RedirectAfterLogin() {
  const [target] = useState(() => peekPostLoginRedirect(ROUTES.home));
  useEffect(() => {
    clearPostLoginRedirect(); // አንዴ ከተጠቀምን በኋላ እንዳይደገም
  }, []);
  return <Navigate to={target} replace />;
}