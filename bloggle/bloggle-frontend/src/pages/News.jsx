import { useEffect, useState } from "react";
import { api } from "../lib/api";
import PostCard from "../components/PostCard.jsx";

export default function News() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadNews = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api("/api/news");
        if (!active) return;
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setItems(list);
      } catch (err) {
        if (!active) return;
        setError(err?.data?.message || err.message || "Failed to load news.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadNews();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">News</h1>
        <p className="text-zinc-400">Latest stories from the feed</p>
      </div>

      {loading ? <p className="text-zinc-400">Loading news...</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {!loading && !error && items.length === 0 ? (
        <p className="text-zinc-400">No news yet.</p>
      ) : null}

      <div className="space-y-4">
        {items.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
