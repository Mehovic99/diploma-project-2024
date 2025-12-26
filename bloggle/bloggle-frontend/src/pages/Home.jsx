import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import PostCard from "../components/PostCard.jsx";

export default function Home() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let active = true;

    const loadPosts = async () => {
      setLoading(true);
      setFeedError("");
      try {
        const data = await api("/api/posts");
        if (!active) return;
        setPosts(data?.data ?? []);
      } catch (err) {
        if (!active) return;
        setFeedError(err?.data?.message || err.message || "Failed to load posts.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPosts();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError("");

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

      const created = data?.data ?? data;
      setPosts((prev) => [created, ...prev]);
      setTitle("");
      setBody("");
      setLinkUrl("");
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setSubmitError(err?.data?.message || err.message || "Failed to create post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Welcome back</p>
          <h1 className="text-3xl font-bold">Home</h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4"
      >
        <div className="space-y-2">
          <label className="text-sm text-zinc-300" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            type="text"
            className="w-full rounded-xl bg-black/40 border border-zinc-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-zinc-300" htmlFor="body_md">
            Body
          </label>
          <textarea
            id="body_md"
            className="w-full rounded-xl bg-black/40 border border-zinc-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 min-h-[120px]"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-zinc-300" htmlFor="link_url">
            Link (optional)
          </label>
          <input
            id="link_url"
            type="url"
            className="w-full rounded-xl bg-black/40 border border-zinc-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-zinc-300" htmlFor="image">
            Image (optional)
          </label>
          <input
            ref={fileInputRef}
            id="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-zinc-200"
          />
        </div>
        {submitError ? <p className="text-sm text-red-400">{submitError}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-xl bg-white text-black font-semibold disabled:opacity-60"
        >
          {submitting ? "Posting..." : "Create post"}
        </button>
      </form>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Latest posts</h2>
        {loading ? <p className="text-zinc-400">Loading posts...</p> : null}
        {feedError ? <p className="text-sm text-red-400">{feedError}</p> : null}
        {!loading && !feedError && posts.length === 0 ? (
          <p className="text-zinc-400">No posts yet.</p>
        ) : null}
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <p className="text-sm text-zinc-400 mb-2">Current user</p>
        <pre className="bg-black/40 border border-zinc-800 rounded-xl p-4 overflow-auto text-sm">
{JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
}
