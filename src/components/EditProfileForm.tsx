import { useState } from "react";
import { Camera } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api-client";

// TODO: ከ profile.tsx ጋር ተመሳሳይ ነው፤ ወደ አንድ የጋራ ፋይል (lib/username.ts) ይዛወራል
const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

interface EditProfileFormProps {
  showUsername?: boolean;
  onSaved?: () => void;
}

export default function EditProfileForm({
  showUsername = true,
  onSaved,
}: EditProfileFormProps) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || user?.username || "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);

  // Storage ገና ስለሌለ ፎቶ መቀየር አይቻልም፤ በዝምታ አናስመስልም
  const handlePhotoClick = () => {
    setPhotoNotice("Photo upload isn't available yet. Coming soon.");
    setTimeout(() => setPhotoNotice(null), 4000);
  };

  const handleSave = async () => {
    setSaved(false);
    if (!name.trim()) {
      setSaveError("Display name can't be empty.");
      return;
    }
    const nextUsername = username.trim().toLowerCase();
    if (showUsername && !USERNAME_RE.test(nextUsername)) {
      setSaveError("Username: 3–30 characters, only a–z, 0–9 and _.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await updateProfile({
        displayName: name.trim(),
        // username የተቀየረ ከሆነ ብቻ ይላካል
        ...(showUsername &&
          nextUsername !== user?.username && { username: nextUsername }),
        bio: bio.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved?.();
    } catch (e) {
      console.error("Failed to save profile:", e);
      setSaveError(
        e instanceof ApiError && e.statusCode === 409
          ? "That username is already taken."
          : "Couldn't save. Check your connection and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={handlePhotoClick}
          aria-label="Change photo"
          className="relative w-28 h-28"
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-surface-secondary flex items-center justify-center">
            {user?.photo ? (
              <img
                src={user.photo}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-8 h-8 text-icon-muted" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white shadow-md border border-border-subtle flex items-center justify-center">
            <Camera className="w-4 h-4 text-icon-primary" />
          </div>
        </button>
        {photoNotice && (
          <p className="mt-2 text-xs font-semibold text-warning text-center">
            {photoNotice}
          </p>
        )}
      </div>

      {/* Fields */}
      <div>
        <label className="block text-sm text-text-secondary mb-1.5">
          Display Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 20))}
          className="w-full px-4 py-3 bg-input-bg border border-input-border focus:border-input-focus outline-none rounded-xl text-base text-input-text"
        />
      </div>

      {showUsername && (
        <div>
          <label className="block text-sm text-text-secondary mb-1.5">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-text-muted select-none">
              @
            </span>
            <input
              type="text"
              value={username}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().slice(0, 30))
              }
              className="w-full pl-9 pr-4 py-3 bg-input-bg border border-input-border focus:border-input-focus outline-none rounded-xl text-base text-input-text"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm text-text-secondary mb-1.5">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 150))}
          rows={3}
          className="w-full px-4 py-3 bg-input-bg border border-input-border focus:border-input-focus outline-none rounded-xl text-base text-input-text resize-none"
        />
      </div>

      {saveError && (
        <p className="text-sm font-semibold text-error bg-error-light border border-error-border rounded-xl px-4 py-2.5">
          {saveError}
        </p>
      )}
      {saved && <p className="text-sm font-semibold text-success">Saved</p>}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-3.5 rounded-xl bg-primary hover:opacity-90 text-text-on-primary text-base font-bold transition-opacity disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
