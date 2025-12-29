import { useEffect, useMemo, useRef, useState } from "react";
import { Camera } from "lucide-react";
import Avatar from "./Avatar.jsx";
import Button from "./Button.jsx";

export default function ProfileEditor({
  user,
  isOnboarding = false,
  onSave,
  onCancel,
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    setName(user?.name ?? "");
    setBio(user?.bio ?? "");
  }, [user]);

  const previewUrl = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : ""),
    [avatarFile]
  );

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const avatarSrc = previewUrl || user?.avatar_url || null;

  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");

    try {
      await onSave?.({
        name: name.trim(),
        bio: bio.trim(),
        avatarFile,
      });
    } catch (err) {
      setError(err?.data?.message || err.message || "Unable to update profile.");
      setSaving(false);
      return;
    }

    setSaving(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-lg bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isOnboarding ? "Customize Your Profile" : "Edit Profile"}
          </h2>
          <p className="text-zinc-500">
            {isOnboarding
              ? "Let others get to know you better."
              : "Update your public details."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={handlePickAvatar}
              className="relative group cursor-pointer focus:outline-none"
            >
              <Avatar name={name || "User"} size="xl" src={avatarSrc} />
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
              className="hidden"
            />
            <p className="text-xs text-zinc-500">Tap to change avatar</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-white focus:border-white focus:outline-none transition-all placeholder:text-zinc-700"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={3}
                maxLength={300}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-white focus:border-white focus:outline-none transition-all placeholder:text-zinc-700 resize-none"
                placeholder="Tell us about yourself..."
              />
              <p className="text-[11px] text-zinc-600 mt-2 text-right">
                {bio.length}/300
              </p>
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="flex gap-3 pt-4">
            {!isOnboarding && onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 rounded-full border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors font-bold"
              >
                Cancel
              </button>
            ) : null}
            <Button type="submit" className="flex-1 w-full py-3 text-base" disabled={saving}>
              {saving
                ? "Saving..."
                : isOnboarding
                  ? "Complete Setup"
                  : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
