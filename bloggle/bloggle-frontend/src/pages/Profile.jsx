import { useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

export default function Profile() {
  const { id } = useParams();
  const { user, bootstrapMe } = useAuth();
  const isSelf = id === "me" || (user && String(user.id) === id);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file || uploading) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await api("/api/users/me/avatar", {
        method: "POST",
        body: formData,
      });
      await bootstrapMe();
      setSuccess("Avatar updated.");
      setFile(null);
    } catch (err) {
      setError(err?.data?.message || err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Profile</h1>
      <p className="text-zinc-300">Profile page for {id}</p>

      {isSelf ? (
        <form
          onSubmit={handleUpload}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3"
        >
          <div>
            <p className="text-sm text-zinc-400 mb-2">Upload avatar</p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-zinc-200"
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
          <button
            type="submit"
            disabled={!file || uploading}
            className="px-4 py-2 rounded-xl bg-white text-black font-semibold disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload avatar"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
