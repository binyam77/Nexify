import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  X,
  User,
  AtSign,
  Mail,
  Lock,
  LogOut,
  Info,
  HelpCircle,
  ShieldCheck,
  FileText,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import {
  changeUsernameRequest,
  changePasswordRequest,
} from "../api/auth.api";
import { ApiError } from "../lib/api-client";

type View =
  | "main"
  | "profileAccount"
  | "editProfile"
  | "username"
  | "email"
  | "password";

export default function Settings() {
  const [view, setView] = useState<View>("main");
  const navigate = useNavigate();

  return (
    <main className="w-full max-w-2xl mx-auto min-h-screen bg-bodey-bg text-text">
      {view === "main" && (
        <MainSettingsView onNavigate={setView} onBack={() => navigate(-1)} />
      )}
      {view === "profileAccount" && (
        <ProfileAccountView
          onNavigate={setView}
          onBack={() => setView("main")}
        />
      )}
      {view === "editProfile" && (
        <EditProfileView onBack={() => setView("profileAccount")} />
      )}
      {view === "username" && (
        <UsernameView onBack={() => setView("profileAccount")} />
      )}
      {view === "email" && (
        <EmailView onBack={() => setView("profileAccount")} />
      )}
      {view === "password" && (
        <PasswordView onBack={() => setView("profileAccount")} />
      )}
    </main>
  );
}

// ============================================================================
// SHARED: Sub-page header (ArrowLeft + Title + optional X)
// ============================================================================
function SubPageHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-4 sticky top-0 z-10 bg-bodey-bg border-b border-border">
      <button
        onClick={onBack}
        aria-label="Back"
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-raised transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h1 className="text-base font-semibold">{title}</h1>
      <button
        onClick={onBack}
        aria-label="Close"
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-raised transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

// ============================================================================
// MAIN SETTINGS LIST
// ============================================================================
function MainSettingsView({
  onNavigate,
  onBack,
}: {
  onNavigate: (v: View) => void;
  onBack: () => void;
}) {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to Logout?")) return;
    await logout();
    navigate("/login");
  };

  return (
    <div className="px-4 py-6 sm:py-10">
      <div className="flex items-center gap-3 mb-6 md:hidden">
        <button
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-raised"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <SectionLabel>Profile & Account</SectionLabel>
      <ListCard>
        <ListRow
          icon={<User className="w-5 h-5 text-brand" />}
          label="Profile & Account"
          onClick={() => onNavigate("profileAccount")}
        />
      </ListCard>

      <div className="mt-6">
        <ListCard>
          <ListRow
            label={theme === "dark" ? "Dark Mode" : "Light Mode"}
            trailing={
              <ThemeSwitch checked={theme === "dark"} onToggle={toggleTheme} />
            }
            noChevron
          />
        </ListCard>
      </div>

      <SectionLabel className="mt-8">Help & Privacy</SectionLabel>
      <ListCard>
        <ListRow
          icon={<Info className="w-5 h-5 text-brand" />}
          label="About"
          onClick={() => navigate("/about")}
        />
        <Divider />
        <ListRow
          icon={<HelpCircle className="w-5 h-5 text-brand" />}
          label="Help"
          onClick={() => navigate("/helps")}
        />
        <Divider />
        <ListRow
          icon={<ShieldCheck className="w-5 h-5 text-brand" />}
          label="Privacy Policy"
          onClick={() => navigate("/privacy")}
        />
        <Divider />
        <ListRow
          icon={<FileText className="w-5 h-5 text-brand" />}
          label="Terms"
          onClick={() => navigate("/terms")}
        />
      </ListCard>

      <SectionLabel className="mt-8">Logout</SectionLabel>
      <ListCard>
        <ListRow
          icon={<LogOut className="w-5 h-5 text-danger" />}
          label="Logout"
          labelClassName="text-danger font-semibold"
          onClick={handleLogout}
          noChevron
        />
      </ListCard>
    </div>
  );
}

// ============================================================================
// PROFILE & ACCOUNT LIST
// ============================================================================
function ProfileAccountView({
  onNavigate,
  onBack,
}: {
  onNavigate: (v: View) => void;
  onBack: () => void;
}) {
  const { user } = useAuth();

  return (
    <div>
      <SubPageHeader title="Profile & Account" onBack={onBack} />
      <div className="px-4 py-6">
        <p className="text-sm text-gray-500 mb-6">
          Manage your profile information and account credentials.
        </p>

        <ListCard>
          <ListRow
            icon={<User className="w-5 h-5 text-brand" />}
            label="Edit Profile"
            sublabel="Update your profile photo, bio and other public info."
            onClick={() => onNavigate("editProfile")}
          />
        </ListCard>

        <div className="mt-4">
          <ListCard>
            <ListRow
              icon={<AtSign className="w-5 h-5 text-brand" />}
              label="Username"
              sublabel="Change your unique username."
              trailingText={user?.username ? `@${user.username}` : undefined}
              onClick={() => onNavigate("username")}
            />
            <Divider />
            <ListRow
              icon={<Mail className="w-5 h-5 text-brand" />}
              label="Email"
              sublabel="Update your email address."
              trailingText={user?.email}
              onClick={() => onNavigate("email")}
            />
            <Divider />
            <ListRow
              icon={<Lock className="w-5 h-5 text-brand" />}
              label="Password"
              sublabel="Change your password."
              onClick={() => onNavigate("password")}
            />
          </ListCard>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EDIT PROFILE (UI-only — Backend Profile module ገና ስላልተገነባ)
// ============================================================================
function EditProfileView({ onBack }: { onBack: () => void }) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // ⚠️ ለአሁን local-only (UI preview) - Profile module (avatar/cover/bio
    // persist) ገና ስላልተገነባ backend ጋር አልተገናኘም
    updateUser({ name, username, bio });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <SubPageHeader title="Edit Profile" onBack={onBack} />
      <div className="px-4 py-6 flex flex-col gap-6">
        {/* Cover */}
        <div className="relative">
          <div className="h-32 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-xs text-gray-400">
            Cover photo (coming soon)
          </div>
          {/* Profile photo overlapping cover */}
          <div className="absolute -bottom-8 left-4 w-20 h-20 rounded-full bg-surface border-4 border-bodey-bg flex items-center justify-center text-gray-400">
            <User className="w-8 h-8" />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <Field
            label="Name"
            value={name}
            onChange={setName}
            placeholder="Your name"
          />
          <Field
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="username"
            prefix="@"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-small-text">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Tell people about yourself"
              className="w-full px-4 py-2.5 bg-input border border-input-border rounded-lg text-input-text placeholder:text-input-placeholder focus:outline-none focus:border-input-focus transition-all text-sm resize-none"
            />
          </div>
        </div>

        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm">
            <CheckCircle2 className="w-4 h-4" /> Saved (preview only — full sync
            coming soon)
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full py-3 bg-brand text-white font-semibold rounded-lg text-sm hover:bg-brand-dark active:scale-[0.98] transition-all"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// USERNAME VIEW
// ============================================================================
function UsernameView({ onBack }: { onBack: () => void }) {
  const { user, accessToken, updateUser } = useAuth();
  const [newUsername, setNewUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidFormat = /^[a-zA-Z0-9_.]{3,30}$/.test(newUsername);

  const handleSave = async () => {
    setError("");
    setSuccess("");
    if (!isValidFormat) {
      setError(
        "Username must be 3–30 characters and can include letters, numbers, dots and underscores.",
      );
      return;
    }
    if (!accessToken) return;

    setIsSubmitting(true);
    try {
      await changeUsernameRequest(newUsername, accessToken);
      updateUser({ username: newUsername });
      setSuccess("Username updated successfully.");
      setTimeout(onBack, 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <SubPageHeader title="Change Username" onBack={onBack} />
      <div className="px-4 py-6 flex flex-col gap-5">
        <div>
          <label className="text-sm font-medium text-small-text">
            Current username
          </label>
          <p className="text-sm text-gray-500 mt-1">@{user?.username ?? "—"}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-small-text">
            New username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
              @
            </span>
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="new.username"
              className="w-full pl-7 pr-10 py-2.5 bg-input border border-input-border rounded-lg text-input-text placeholder:text-input-placeholder focus:outline-none focus:border-input-focus transition-all text-sm"
            />
            {newUsername.length > 0 && (
              <span className="absolute inset-y-0 right-3 flex items-center">
                {isValidFormat ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : null}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Username must be 3–30 characters and can include letters, numbers,
            dots and underscores.
          </p>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}

        <button
          onClick={handleSave}
          disabled={isSubmitting || !newUsername}
          className="w-full py-3 bg-brand text-white font-semibold rounded-lg text-sm hover:bg-brand-dark active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save Username"}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// EMAIL VIEW (disabled — backend ገና አልተገነባም)
// ============================================================================
function EmailView({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();

  return (
    <div>
      <SubPageHeader title="Change Email" onBack={onBack} />
      <div className="px-4 py-8 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-surface-raised flex items-center justify-center">
          <Mail className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 max-w-xs">
          Email changes are not available yet. This feature is coming soon.
        </p>
        <div className="w-full mt-4">
          <label className="text-sm font-medium text-small-text">
            Current email
          </label>
          <p className="text-sm text-gray-500 mt-1">{user?.email ?? "—"}</p>
        </div>
        <input
          disabled
          placeholder="New email"
          className="w-full mt-2 px-4 py-2.5 bg-input border border-input-border rounded-lg text-sm opacity-60 cursor-not-allowed"
        />
        <button
          disabled
          className="w-full py-3 bg-brand text-white font-semibold rounded-lg text-sm opacity-50 cursor-not-allowed"
        >
          Send Confirmation Link
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// PASSWORD VIEW
// ============================================================================
function PasswordView({ onBack }: { onBack: () => void }) {
  const { accessToken } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checks = {
    length: newPassword.length >= 8,
    numberOrSpecial:
      /[0-9]/.test(newPassword) || /[^a-zA-Z0-9]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword,
  };
  const allValid = checks.length && checks.numberOrSpecial && checks.match;

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }
    if (!allValid) {
      setError("Please make sure your new password meets all requirements.");
      return;
    }
    if (!accessToken) return;

    setIsSubmitting(true);
    try {
      await changePasswordRequest(
        { currentPassword, newPassword },
        accessToken,
      );
      setSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(onBack, 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <SubPageHeader title="Change Password" onBack={onBack} />
      <div className="px-4 py-6 flex flex-col gap-4">
        <PasswordField
          label="Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          show={showCurrent}
          onToggleShow={() => setShowCurrent((s) => !s)}
        />
        <PasswordField
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          onToggleShow={() => setShowNew((s) => !s)}
        />
        <PasswordField
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showNew}
          onToggleShow={() => setShowNew((s) => !s)}
        />

        <div className="flex flex-col gap-1.5 mt-1">
          <CheckItem ok={checks.length} label="At least 8 characters" />
          <CheckItem
            ok={checks.numberOrSpecial}
            label="Includes a number or special character"
          />
          <CheckItem ok={checks.match} label="Passwords match" />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !allValid || !currentPassword}
          className="w-full py-3 bg-brand text-white font-semibold rounded-lg text-sm hover:bg-brand-dark active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SMALL SHARED UI PIECES
// ============================================================================
function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-xs font-semibold tracking-wide text-gray-400 uppercase mb-2 px-1 ${className}`}
    >
      {children}
    </p>
  );
}

function ListCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border mx-4" />;
}

function ListRow({
  icon,
  label,
  sublabel,
  trailing,
  trailingText,
  onClick,
  noChevron,
  labelClassName = "",
}: {
  icon?: React.ReactNode;
  label: string;
  sublabel?: string;
  trailing?: React.ReactNode;
  trailingText?: string;
  onClick?: () => void;
  noChevron?: boolean;
  labelClassName?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-raised transition-colors disabled:cursor-default"
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1 min-w-0">
        <span
          className={`block text-sm font-medium text-text ${labelClassName}`}
        >
          {label}
        </span>
        {sublabel && (
          <span className="block text-xs text-gray-400 mt-0.5">{sublabel}</span>
        )}
      </span>
      {trailingText && (
        <span className="text-sm text-brand shrink-0">{trailingText}</span>
      )}
      {trailing}
      {!noChevron && onClick && (
        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
      )}
    </button>
  );
}

function ThemeSwitch({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <span
      onClick={onToggle}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 cursor-pointer ${
        checked ? "bg-brand" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-small-text">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
            {prefix}
          </span>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${prefix ? "pl-7" : "pl-4"} pr-4 py-2.5 bg-input border border-input-border rounded-lg text-input-text placeholder:text-input-placeholder focus:outline-none focus:border-input-focus transition-all text-sm`}
        />
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-small-text">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-4 pr-10 py-2.5 bg-input border border-input-border rounded-lg text-input-text focus:outline-none focus:border-input-focus transition-all text-sm"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle2
        className={`w-4 h-4 shrink-0 ${ok ? "text-emerald-500" : "text-gray-300"}`}
      />
      <span className={ok ? "text-text" : "text-gray-400"}>{label}</span>
    </div>
  );
}
