import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import useFeed from "../lib/hooks/useFeed";
import FeedList from "../components/FeedList.jsx";
import PostComposer from "../components/PostComposer.jsx";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";

export default function Home() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { items, setItems, loading, error } = useFeed("/api/posts");
  const [voteError, setVoteError] = useState("");
  const [voteBusy, setVoteBusy] = useState(false);

  const posts = useMemo(
    () => items.filter((post) => post.type !== "news"),
    [items]
  );

  const handleCreated = (created) => {
    if (!created) return;
    setItems((prev) => [created, ...prev]);
  };

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
    const currentScore =
      typeof target.score === "number"
        ? target.score
        : Number(target.likes ?? 0) - Number(target.dislikes ?? 0);
    const optimisticScore = currentScore + value;

    setItems((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, score: optimisticScore } : post
      )
    );
    setVoteBusy(true);
    setVoteError("");

    try {
      const data = await api(`/api/posts/${target.slug}/vote`, {
        method: "POST",
        body: { value },
      });

      const nextScore = typeof data?.score === "number" ? data.score : optimisticScore;
      setItems((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, score: nextScore } : post
        )
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, score: currentScore } : post
        )
      );
      setVoteError(err?.data?.message || err.message || "Unable to vote.");
    } finally {
      setVoteBusy(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <PostComposer onCreated={handleCreated} />

      {loading ? <Loading message="Loading posts..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {voteError ? <ErrorState message={voteError} /> : null}
      {!loading && !error ? (
        <FeedList
          items={posts}
          currentUserId={user?.id}
          emptyTitle="No posts found."
          onUserClick={handleUserClick}
          onPostClick={handlePostClick}
          onInteraction={handleInteraction}
        />
      ) : null}
    </main>
  );
}
