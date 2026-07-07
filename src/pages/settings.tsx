import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import type { User } from "../context/AuthContext";
import {
  Check,
  AlertCircle,
  Save,
  LogOut,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
export default function Settings() {
  // --- ስቴት ማስተዳደሪያዎች (State Management) ---
  const { logout, user, updateUser } = useAuth();
  const navigate = useNavigate();
  // 1. የአካውንት መረጃ ስቴት (Account Info State)
  const savedProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const { theme, toggleTheme } = useTheme();
  // 2. የፕሮፋይል ስቴት (Profile State)
  const [profilePic, setProfilePic] = useState<string | null>(
    savedProfile.photo || null,
  );
  const [bio, setBio] = useState(savedProfile.bio || user?.bio || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. የግላዊነት ስቴት (Privacy State)
  const [privacy, setPrivacy] = useState("public"); // "public" ወይም "private"

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

  // 2. የፕሮፋይል ምስል ለመምረጥ እና ለማሳየት (Handle Profile Image Upload)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
        showAlert("success", "የፕሮፋይል ምስልዎ ተቀይሯል!");
      };
      reader.readAsDataURL(file);
    }
  };

  // የፕሮፋይል ዝርዝሮችን ለማዘመን (Update Profile Bio)
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      bio: bio.trim(),
      photo: profilePic || user?.photo || "",
    });
    showAlert(
      "success",
      "Your profile information has been successfully updated!",
    );
  };

  // 3. የግላዊነት ምርጫን ለማስቀመጥ (Save Privacy Settings)
  const handlePrivacySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showAlert(
      "success",
      `የግላዊነት ምርጫዎ ወደ [${privacy === "public" ? "ሁሉም ሰው ማየት ይችላል" : "ተከታዮች ብቻ ማየት ይችላሉ"}] ተቀይሯል!`,
    );
  };

  // 4. የማስታወቂያ ምርጫዎችን ለማስቀመጥ (Save Notification Settings)
  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showAlert("success", "የማስታወቂያ ምርጫዎችዎ በስኬት ተቀምጠዋል!");
  };

  // 5. የይለፍ ቃል ለመቀየር (Change Password Verification)
  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showAlert("error", "እባክዎ ሁለቱንም የይለፍ ቃል ሳጥኖች ይሙሉ!");
      return;
    }
    if (newPassword.length < 8) {
      showAlert("error", "የይለፍ ቃል ቢያንስ 8 ቁምፊዎች መሆን አለበት!");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("error", "የይለፍ ቃላቱ አይዛመዱም! እባክዎ እንደገና ይሞክሩ።");
      return;
    }
    showAlert("success", "የይለፍ ቃልዎ በስኬት ተቀይሯል!");
    setNewPassword("");
    setConfirmPassword("");
  };

  // 6. አካውንት መውጫ ተግባር (Logout confirmation)
  const handleLogout = () => {
    const confirmAction = window.confirm("Are you sure you want to Logout?");
    if (confirmAction) {
      logout();
      navigate("./auth/login");
    }
  };

  // አካውንት መሰረዣ ተግባር (Delete Account confirmation)
  const handleAccountDelete = () => {
    const confirmAction = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone!",
    );
    if (confirmAction) {
      localStorage.removeItem("authUser");
      localStorage.removeItem("userProfile");
      logout();
      navigate("./auth/createAccount");
    }
  };

  return (
    <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8 text-slate-800 overflow-y-auto h-screen">
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
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 w-full shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-xl font-bold text-slate-900 mb-6 pb-2 border-b-2 border-slate-100 flex items-center gap-2">
          Account Info
        </h2>
        <form onSubmit={handleAccountSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-600">
              Edit username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full max-w-lg px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-[#0185E5] focus:ring-2 focus:ring-[#0185E5]/20 focus:outline-none transition-all text-sm"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-600">
              Change email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              className="w-full max-w-lg px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-[#0185E5] focus:ring-2 focus:ring-[#0185E5]/20 focus:outline-none transition-all text-sm"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-600">
              Change password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="w-full max-w-lg px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-[#0185E5] focus:ring-2 focus:ring-[#0185E5]/20 focus:outline-none transition-all text-sm"
              required
            />
          </div>

          {/* 🔘 ብሉ ግራዲየንት አዝራር (Custom Blue Gradient Button) */}
          <button
            type="submit"
            className="self-start bg-gradient-to-b from-[#019BE5] via-[#0185E5] to-[#0071E3] text-white font-semibold rounded-lg px-6 py-2.5 shadow-md hover:brightness-110 active:scale-[0.98] transition-all text-sm flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </form>
      </section>

      {/* ==========================================================================
          2. የፕሮፋይል ክፍል (Profile Section)
          ========================================================================== */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 w-full shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-xl font-bold text-slate-900 mb-6 pb-2 border-b-2 border-slate-100">
          Profile
        </h2>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600">
              Profile Picture
            </label>
            <div className="flex items-center gap-5 mt-2 flex-wrap">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profile Image"
                  className="w-[90px] h-[90px] rounded-full object-cover border-3 border-[#0185E5] shadow-sm"
                />
              ) : (
                <div className="w-[90px] h-[90px] rounded-full bg-slate-100 border-3 border-dashed border-[#0185E5] flex items-center justify-center text-slate-400 font-bold text-xs">
                  No Image
                </div>
              )}
              <div className="file">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <label id="me" className="text-sm font-medium text-slate-600">
              About You
            </label>
            <textarea
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Bio..."
              className="w-full max-w-lg px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-[#0185E5] focus:ring-2 focus:ring-[#0185E5]/20 focus:outline-none transition-all text-sm resize-y min-h-[100px]"
            />
          </div>

          {/* 🔘 ብሉ ግራዲየንት አዝራር (Custom Blue Gradient Button) */}
          <button
            type="button"
            onClick={handleProfileUpdate}
            className="self-start bg-gradient-to-b from-[#019BE5] via-[#0185E5] to-[#0071E3] text-white font-semibold rounded-lg px-6 py-2.5 shadow-md hover:brightness-110 active:scale-[0.98] transition-all text-sm flex items-center gap-2 cursor-pointer"
          >
            Update Profile
          </button>
        </div>
      </section>

      {/* ==========================================================================
          3. የግላዊነት ክፍል (Privacy Section)
          ========================================================================== */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 w-full shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-xl font-bold text-slate-900 mb-6 pb-2 border-b-2 border-slate-100">
          Privacy
        </h2>
        <form onSubmit={handlePrivacySubmit} className="flex flex-col gap-5">
          <fieldset className="border border-slate-300 rounded-lg p-5 flex flex-col gap-4">
            <legend className="px-2.5 text-sm font-semibold text-slate-700">
              Who can see my profile?
            </legend>

            <div className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                id="public"
                name="privacy"
                value="public"
                checked={privacy === "public"}
                onChange={() => setPrivacy("public")}
                className="w-4 h-4 text-[#0185E5] focus:ring-[#0185E5]"
              />
              <label
                htmlFor="public"
                className="text-sm text-slate-700 cursor-pointer"
              >
                Public (Everyone)
              </label>
            </div>

            <div className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                id="private"
                name="privacy"
                value="private"
                checked={privacy === "private"}
                onChange={() => setPrivacy("private")}
                className="w-4 h-4 text-[#0185E5] focus:ring-[#0185E5]"
              />
              <label
                htmlFor="private"
                className="text-sm text-slate-700 cursor-pointer"
              >
                Private (Only Followers/Members)
              </label>
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
          4. የማስታወቂያዎች ክፍል (Notifications Section)
          ========================================================================== */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 w-full shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-xl font-bold text-slate-900 mb-6 pb-2 border-b-2 border-slate-100">
          Notifications
        </h2>
        <form
          onSubmit={handleNotificationsSubmit}
          className="flex flex-col gap-5"
        >
          <fieldset className="border border-slate-300 rounded-lg p-5 flex flex-col gap-4">
            <legend className="px-2.5 text-sm font-semibold text-slate-700">
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
                  className="w-4 h-4 text-[#0185E5] rounded focus:ring-[#0185E5]"
                />
                <label
                  htmlFor="likes"
                  className="text-sm text-slate-700 cursor-pointer"
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
                  className="text-sm text-slate-700 cursor-pointer"
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
                  className="text-sm text-slate-700 cursor-pointer"
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
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 w-full shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-xl font-bold text-slate-900 mb-6 pb-2 border-b-2 border-slate-100">
          Security
        </h2>
        <form onSubmit={handleSecuritySubmit} className="flex flex-col gap-5">
          <fieldset className="border border-slate-300 rounded-lg p-5 flex flex-col gap-4">
            <legend className="px-2.5 text-sm font-semibold text-slate-700">
              Change Your Password
            </legend>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-600">
                  New password
                </label>
                <input
                  type="password"
                  id="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full max-w-lg px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-[#0185E5] focus:ring-2 focus:ring-[#0185E5]/20 focus:outline-none transition-all text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-600">
                  Confirm password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full max-w-lg px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-[#0185E5] focus:ring-2 focus:ring-[#0185E5]/20 focus:outline-none transition-all text-sm"
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
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 w-full shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-xl font-bold text-slate-900 mb-6 pb-2 border-b-2 border-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" /> Account Action
        </h2>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            id="logoutBtn"
            onClick={handleLogout}
            className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold rounded-lg px-6 py-2.5 shadow-md transition-colors text-sm flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
          <button
            onClick={handleAccountDelete}
            className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold rounded-lg px-6 py-2.5 shadow-md transition-colors text-sm flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>
      </section>

      {/* ==========================================================================
          7. የግርጌ ማሳያ (Footer Section)
          ========================================================================== */}
      <footer className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-400 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-semibold text-slate-500">&copy; Nexify</div>
        <div className="flex items-center gap-4 flex-wrap">
          <span
            onClick={() => navigate("./footer/about")}
            className="hover:text-[#0185e5] transition-colors cursor-pointer"
          >
            About
          </span>

          <span
            onClick={() => navigate("./footer/privacy")}
            className="hover:text-[#0185e5] transition-colors cursor-pointer"
          >
            Privacy
          </span>

          <span
            onClick={() => navigate("./footer/terms")}
            className="hover:text-[#0185e5] transition-colors cursor-pointer"
          >
            Terms
          </span>

          <span
            onClick={() => navigate("./footer/contact")}
            className="hover:text-[#0185e5] transition-colors cursor-pointer"
          >
            Contact
          </span>
        </div>
      </footer>
    </main>
  );
}
