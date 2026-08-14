import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Check,
  AlertCircle,
  Save,
  LogOut,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
export default function Settings() {
  // --- ስቴት ማስተዳደሪያዎች (State Management) ---
  const { logout, user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const { theme, toggleTheme } = useTheme();
  // 4. የማስታወቂያዎች ስቴት (Notifications State)
  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    follows: false,
  });

  // 5. የደህንነት/የይለፍ ቃል ስቴት (Security/Password State)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 6. ለተጠቃሚው የሚታዩ መልዕክቶች ስቴት (Alert / Feedback Messages State)
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // --- ተግባራት (Handlers / Functions) ---

  // መልዕክት ለተወሰነ ሰከንድ አሳይቶ ለማጥፋት (Helper to show alerts)
  const showAlert = (type: "success" | "error", text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage(null);
    }, 4000);
  };

  // 1. የአካውንት መረጃን ለማስቀመጥ (Save Account Info)
  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      showAlert("error", "Username and email cannot be empty!");
      return;
    }
    updateUser({ username: username.trim(), email: email.trim() });
    showAlert("success", "Your account information is successfully saved!");
  };

  // 4. የማስታወቂያ ምርጫዎችን ለማስቀመጥ (Save Notification Settings)
  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showAlert("success", "Your advertising choices are saved successfully!");
  };

  // 5. የይለፍ ቃል ለመቀየር (Change Password Verification)
  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showAlert("error", "Please fill in both password boxes!");
      return;
    }
    if (newPassword.length < 8) {
      showAlert("error", "Password must be at least 8 characters!");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("error", "The password do not match! Please try again.");
      return;
    }
    showAlert("success", "Your password has been successfully changed!");
    setNewPassword("");
    setConfirmPassword("");
  };

  // 6. አካውንት መውጫ ተግባር (Logout confirmation)
  const handleLogout = async () => {
    const confirmAction = window.confirm("Are you sure you want to Logout?");
    if (!confirmAction) return;
    await logout(); // Backend's refresh token revoke ያደርጋል + local state ያጸዳል
    navigate("/auth/login");
  };

  return (
    <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8 bg-bodey-bg text-text overflow-y-auto h-screen">
      {/* 🔔 የተጠቃሚ መልዕክቶች ማሳያ (Toast Alert Banner) */}
      {alertMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-lg shadow-xl text-white transition-all duration-300 animate-bounce ${
            alertMessage.type === "success"
              ? "bg-emerald-600 border border-emerald-500"
              : "bg-rose-600 border border-rose-500"
          }`}
        >
          {alertMessage.type === "success" ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{alertMessage.text}</span>
        </div>
      )}
      <div className="flex items-center gap-3 px-3 py-3 sticky top-0 z-50 md:hidden bg-surface border-gray-100">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex items-center justify-center w-10 h-10 rounded-full 
bg-white/90 active:bg-gray-200 transition-color"
        >
          <ArrowLeft size={22} strokeWidth={2.5} className="text-gray-900" />
        </button>
      </div>
      <button
        onClick={toggleTheme}
        role="switch"
        aria-checked={theme === "dark"}
        aria-label="Toggle dark mode"
        className="flex items-center justify-between w-full p-4 rounded-xl bg-surface border border-slate-200"
      >
        <span className="text-sm font-medium text-slate-700">
          {theme === "dark" ? "Dark Mode" : "Light Mode"}
        </span>

        <span
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
            theme === "dark" ? "bg-brand" : "bg-slate-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
              theme === "dark" ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </span>
      </button>

      {/* ==========================================================================
          1. የአካውንት መረጃ ክፍል (Account Info Section)
          ========================================================================== */}
      <section className="bg-surface border border-border rounded-xl p-6 sm:p-8 w-full shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-xl font-bold text-text-h2 mb-6 pb-2 border-b-2 border-slate-100 flex items-center gap-2">
          Account Info
        </h2>
        <form onSubmit={handleAccountSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 ">
            <label className="text-sm font-medium text-small-text">
              Edit username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full max-w-lg px-4 py-2.5 bg-input border border-input-border rounded-lg text-input-text focus:border-input-focus focus:outline-none transition-all text-sm"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-small-text">
              Change email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              className="w-full max-w-lg px-4 py-2.5 bg-input border border-input-border rounded-lg text-input-text focus:border-input-focus  focus:outline-none transition-all text-sm"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-small-text">
              Change password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="w-full max-w-lg px-4 py-2.5 bg-input border border-input-border rounded-lg text-input-text focus:border-input-focus focus:outline-none transition-all text-sm"
              required
            />
          </div>

          {/* 🔘 ብሉ ግራዲየንት አዝራር (Custom Blue Gradient Button) */}
          <button
            type="submit"
            className="self-start bg-brand hover:brightness-110 text-one-text font-semibold rounded-lg px-6 py-2.5 shadow-md active:scale-[0.98] transition-all text-sm flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </form>
      </section>

      {/* ==========================================================================
          4. የማስታወቂያዎች ክፍል (Notifications Section)
          ========================================================================== */}
      <section className="bg-surface border border-border rounded-xl p-6 sm:p-8 w-full shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-xl font-bold text-text-h2 mb-6 pb-2 border-b-2 border-slate-100">
          Notifications
        </h2>
        <form
          onSubmit={handleNotificationsSubmit}
          className="flex flex-col gap-5"
        >
          <fieldset className="border border-border rounded-lg p-5 flex flex-col gap-4 bg-surface-raised">
            <legend className="px-2.5 text-sm font-semibold text-small-text">
              Manage Notifications
            </legend>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="likes"
                  name="like_alerts"
                  checked={notifications.likes}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      likes: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-[#0071e3] rounded focus:ring-[#0071e3] "
                />
                <label
                  htmlFor="likes"
                  className="text-sm text-text cursor-pointer"
                >
                  Like
                </label>
              </div>

              <div className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="comment"
                  name="comment_alerts"
                  checked={notifications.comments}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      comments: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-[#0185E5] rounded focus:ring-[#0185E5]"
                />
                <label
                  htmlFor="comment"
                  className="text-sm text-text cursor-pointer"
                >
                  Comments
                </label>
              </div>

              <div className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="follows"
                  name="follows_alerts"
                  checked={notifications.follows}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      follows: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-[#0185E5] rounded focus:ring-[#0185E5]"
                />
                <label
                  htmlFor="follows"
                  className="text-sm text-text cursor-pointer"
                >
                  New Follows
                </label>
              </div>
            </div>

            {/* 🔘 ብሉ ግራዲየንት አዝራር (Custom Blue Gradient Button) */}
            <button
              type="submit"
              className="mt-2 self-start bg-gradient-to-b from-[#019BE5] via-[#0185E5] to-[#0071E3] text-white font-semibold rounded-lg px-6 py-2.5 shadow-md hover:brightness-110 active:scale-[0.98] transition-all text-sm flex items-center gap-2 cursor-pointer"
            >
              Save Preferences
            </button>
          </fieldset>
        </form>
      </section>

      {/* ==========================================================================
          5. የደህንነት ክፍል (Security Section)
          ========================================================================== */}
      <section className="bg-surface border border-border rounded-xl p-6 sm:p-8 w-full shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-xl font-bold text-text-h2 mb-6 pb-2 border-b-2 border-slate-100">
          Security
        </h2>
        <form onSubmit={handleSecuritySubmit} className="flex flex-col gap-5">
          <fieldset className="bg-surface-raised  border border-border rounded-lg p-5 flex flex-col gap-4">
            <legend className="px-2.5 text-sm font-semibold text-small-text">
              Change Your Password
            </legend>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-small-text">
                  New password
                </label>
                <input
                  type="password"
                  id="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full max-w-lg px-4 py-2.5 bg-input border border-input-border rounded-lg text-input-text focus:border-input-focus focus:outline-none transition-all text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-small-text">
                  Confirm password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full max-w-lg px-4 py-2.5 bg-input border border-input-border rounded-lg text-input-text focus:border-input-focus focus:outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>

            {/* 🔘 ብሉ ግራዲየንት አዝራር (Custom Blue Gradient Button) */}
            <button
              type="submit"
              className="mt-2 self-start bg-gradient-to-b from-[#019BE5] via-[#0185E5] to-[#0071E3] text-white font-semibold rounded-lg px-6 py-2.5 shadow-md hover:brightness-110 active:scale-[0.98] transition-all text-sm flex items-center gap-2 cursor-pointer"
            >
              Save
            </button>
          </fieldset>
        </form>
      </section>

      {/* ==========================================================================
          6. አካውንት መውጫ እና ማጥፊያ ክፍል (Account Action Section)
          ========================================================================== */}
      <section className="bg-surface border border-border rounded-xl p-6 sm:p-8 w-full shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-xl font-bold text-text-h2 mb-6 pb-2 border-b-2 border-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" /> Account Action
        </h2>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            id="logoutBtn"
            onClick={handleLogout}
            className="bg-danger hover:bg-danger-hover text-one-text font-semibold rounded-lg px-6 py-2.5 shadow-md transition-colors text-sm flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </section>
    </main>
  );
}
