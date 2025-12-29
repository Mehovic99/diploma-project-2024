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
  const [imageMeta, setImageMeta] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, zoom: 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const cropRef = useRef(null);
  const dragRef = useRef(null);
  const cropSize = 240;

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

  useEffect(() => {
    if (!previewUrl) {
      setImageMeta(null);
      setCrop({ x: 0, y: 0, zoom: 1 });
      return;
    }

    const image = new Image();
    image.onload = () => {
      const meta = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
      setImageMeta(meta);

      const baseScale = Math.max(cropSize / meta.width, cropSize / meta.height);
      const renderW = meta.width * baseScale;
      const renderH = meta.height * baseScale;
      setCrop({
        x: (cropSize - renderW) / 2,
        y: (cropSize - renderH) / 2,
        zoom: 1,
      });
    };
    image.src = previewUrl;
  }, [previewUrl]);

  const avatarSrc = previewUrl || user?.avatar_url || null;

  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  const clampCrop = (next) => {
    if (!imageMeta) return next;
    const baseScale = Math.max(
      cropSize / imageMeta.width,
      cropSize / imageMeta.height
    );
    const scale = baseScale * next.zoom;
    const renderW = imageMeta.width * scale;
    const renderH = imageMeta.height * scale;
    const minX = cropSize - renderW;
    const minY = cropSize - renderH;

    return {
      ...next,
      x: Math.min(0, Math.max(minX, next.x)),
      y: Math.min(0, Math.max(minY, next.y)),
    };
  };

  const handlePointerDown = (event) => {
    if (!imageMeta) return;
    event.preventDefault();
    cropRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: crop.x,
      originY: crop.y,
    };
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;

    setCrop((prev) =>
      clampCrop({
        ...prev,
        x: dragRef.current.originX + dx,
        y: dragRef.current.originY + dy,
      })
    );
  };

  const handlePointerUp = (event) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  const getCroppedAvatarFile = async () => {
    if (!avatarFile || !previewUrl || !imageMeta) return avatarFile;

    const image = new Image();
    image.src = previewUrl;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const baseScale = Math.max(
      cropSize / imageMeta.width,
      cropSize / imageMeta.height
    );
    const scale = baseScale * crop.zoom;
    const cropX = Math.max(0, -crop.x / scale);
    const cropY = Math.max(0, -crop.y / scale);
    const cropSizeOriginal = cropSize / scale;

    const outputSize = 512;
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");

    if (!ctx) return avatarFile;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropSizeOriginal,
      cropSizeOriginal,
      0,
      0,
      outputSize,
      outputSize
    );

    const supported = ["image/png", "image/jpeg", "image/webp"];
    const mime = supported.includes(avatarFile.type)
      ? avatarFile.type
      : "image/jpeg";

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, mime, 0.9)
    );

    if (!blob) return avatarFile;

    const extension = mime.split("/")[1] || "jpg";
    const filename = avatarFile.name || `avatar.${extension}`;
    return new File([blob], filename, { type: mime });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");

    try {
      const croppedAvatar = await getCroppedAvatarFile();
      await onSave?.({
        name: name.trim(),
        bio: bio.trim(),
        avatarFile: croppedAvatar,
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
            {avatarFile && imageMeta ? (
              <div className="w-full flex flex-col items-center gap-3">
                <div
                  ref={cropRef}
                  className="relative rounded-2xl border border-zinc-800 bg-black overflow-hidden"
                  style={{ width: cropSize, height: cropSize }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                >
                  <img
                    src={previewUrl}
                    alt="Crop preview"
                    className="absolute top-0 left-0 select-none touch-none"
                    style={{
                      width: imageMeta.width,
                      height: imageMeta.height,
                      transform: `translate(${crop.x}px, ${crop.y}px) scale(${
                        Math.max(
                          cropSize / imageMeta.width,
                          cropSize / imageMeta.height
                        ) * crop.zoom
                      })`,
                      transformOrigin: "top left",
                    }}
                    draggable={false}
                  />
                </div>
                <div className="w-full">
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">
                    Zoom
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.01"
                    value={crop.zoom}
                    onChange={(event) =>
                      setCrop((prev) =>
                        clampCrop({ ...prev, zoom: Number(event.target.value) })
                      )
                    }
                    className="w-full"
                  />
                </div>
                <p className="text-xs text-zinc-500">Drag to reposition</p>
              </div>
            ) : null}
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
