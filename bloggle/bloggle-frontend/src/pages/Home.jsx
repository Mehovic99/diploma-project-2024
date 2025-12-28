import { useCallback, useMemo, useRef, useState } from "react";
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
  const { items, setItems, loading, error, reload } = useFeed("/api/posts");
  const [voteError, setVoteError] = useState("");
  const voteQueueRef = useRef(new Map());
  const voteInFlightRef = useRef(new Set());

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

  const processVoteQueue = useCallback(
    async function runQueue(postId) {
      const queue = voteQueueRef.current.get(postId);
      if (!queue || queue.length === 0) {
        voteInFlightRef.current.delete(postId);
        return;
      }

      voteInFlightRef.current.add(postId);

      const { slug, value } = queue.shift();
      if (queue.length === 0) {
        voteQueueRef.current.delete(postId);
      }

      try {
        const data = await api(`/api/posts/${slug}/vote`, {
          method: "POST",
          body: { value },
        });

        const nextScore = typeof data?.score === "number" ? data.score : undefined;
        const nextVoteFromServer =
          typeof data?.user_vote === "number" ? data.user_vote : 0;

        setItems((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  score: nextScore ?? post.score,
                  user_vote: nextVoteFromServer,
                }
              : post
          )
        );
      } catch (err) {
        setVoteError(err?.data?.message || err.message || "Unable to vote.");
        await reload();
      } finally {
        runQueue(postId);
      }
    },
    [reload, setItems]
  );

  const handleInteraction = (postId, type) => {
    const target = items.find((post) => post.id === postId);
    if (!target?.slug) return;

    setVoteError("");

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
    const currentVote = typeof target.user_vote === "number" ? target.user_vote : 0;
    const nextVote =
      value === 1
        ? currentVote === 1
          ? 0
          : 1
        : currentVote === -1
          ? 0
          : -1;
    const optimisticScore = currentScore + (nextVote - currentVote);

    setItems((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, score: optimisticScore, user_vote: nextVote }
          : post
      )
    );

    const queue = voteQueueRef.current.get(postId) ?? [];
    queue.push({ slug: target.slug, value });
    voteQueueRef.current.set(postId, queue);

    if (!voteInFlightRef.current.has(postId)) {
      processVoteQueue(postId);
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
