import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import useFeed from "../lib/hooks/useFeed";
import FeedList from "../components/FeedList.jsx";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";

export default function News() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { items, setItems, loading, error } = useFeed("/api/news");
  const [voteError, setVoteError] = useState("");
  const [voteBusy, setVoteBusy] = useState(false);

  const handleUserClick = (userId) => {
    if (!userId) return;
    navigate(`/profile/${userId}`);
  };

  const handlePostClick = (post) => {
    if (!post?.slug) return;
    navigate(`/posts/${post.slug}`);
  };

  const handleInteraction = async (postId, type) => {
    if (voteBusy) return;
    const target = items.find((post) => post.id === postId);
    if (!target?.slug) return;

    if (!token) {
      navigate("/login", {
        replace: false,
        state: { message: "Please sign in to vote." },
      });
      return;
    }

    const value = type === "likes" ? 1 : -1;
    setVoteBusy(true);
    setVoteError("");

    try {
      const data = await api(`/api/posts/${target.slug}/vote`, {
        method: "POST",
        body: { value },
      });

      setItems((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, score: data?.score ?? post.score } : post
        )
      );
    } catch (err) {
      setVoteError(err?.data?.message || err.message || "Unable to vote.");
    } finally {
      setVoteBusy(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {loading ? <Loading message="Loading news..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {voteError ? <ErrorState message={voteError} /> : null}
      {!loading && !error ? (
        <FeedList
          items={items}
          emptyTitle="No news found."
          emptySubtitle="Check back later for updates."
          onUserClick={handleUserClick}
          onPostClick={handlePostClick}
          onInteraction={handleInteraction}
        />
      ) : null}
    </main>
  );
}
