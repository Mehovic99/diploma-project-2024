import { useEffect, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import Avatar from "./Avatar.jsx";
import Button from "./Button.jsx";

export default function PostComposer({ onCreated }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [showImageInput, setShowImageInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ""),
    [imageFile]
  );

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setLinkUrl("");
    setImageFile(null);
    setShowImageInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!token) {
      navigate("/login", {
        replace: false,
        state: { message: "Please sign in to create a post." },
      });
      return;
    }

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title.trim());

      if (body.trim()) {
        formData.append("body_md", body.trim());
      }

      if (linkUrl.trim()) {
        formData.append("link_url", linkUrl.trim());
      }

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const data = await api("/api/posts", {
        method: "POST",
        body: formData,
      });

      let created = data?.data ?? data;
      if (created && !created.author && user) {
        created = {
          ...created,
          author: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar_url: user.avatar_url ?? null,
          },
        };
      }
      onCreated?.(created);
      resetForm();
    } catch (err) {
      setError(err?.data?.message || err.message || "Failed to create post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl"
    >
      <div className="flex gap-4">
        <div className="hidden sm:block pt-2 cursor-pointer">
          <Avatar name={user?.name ?? "Guest"} src={user?.avatar_url} />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors text-base mb-3"
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Create a post"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none h-24 text-base"
          ></textarea>

          <div className="mt-3">
            <input
              type="url"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="Add a link (optional)"
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
            />
          </div>

          {showImageInput ? (
            <div className="mt-3 relative animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-2 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                  className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowImageInput(false);
                    setImageFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="p-2 text-zinc-500 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              {previewUrl ? (
                <div className="mt-2 h-32 w-full rounded-lg bg-black border border-zinc-800 overflow-hidden flex items-center justify-center relative">
                  <img src={previewUrl} alt="Preview" className="h-full object-cover" />
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-400 mt-3">{error}</p> : null}

          <div className="flex justify-between items-center pt-3 mt-1">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className={`p-2 rounded-full transition-colors flex items-center gap-2 text-sm font-medium ${
                  showImageInput
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                }`}
              >
                <ImageIcon size={20} /> <span className="hidden sm:inline">Image</span>
              </button>
            </div>
            <Button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5"
            >
              {submitting ? "Posting..." : "Post"} <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
