import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import useFeed from "../lib/hooks/useFeed";
import FeedList from "../components/FeedList.jsx";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import Toast from "../components/Toast.jsx";

export default function News() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const outletContext = useOutletContext() || {};
  const { setRefreshHandler } = outletContext;
  const { items, setItems, loading, error, reload } = useFeed("/api/news");
  const [voteError, setVoteError] = useState("");
  const [toast, setToast] = useState("");
  const toastTimeoutRef = useRef(null);
  const voteQueueRef = useRef(new Map());
  const voteInFlightRef = useRef(new Set());

  const handleUserClick = (userId) => {
    if (!userId) return;
    navigate(`/profile/${userId}`);
  };

  const handlePostClick = (post) => {
    if (!post?.slug) return;
    navigate(`/posts/${post.slug}`);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToast(""), 2000);
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      const data = await api("/api/news/refresh", {
        method: "POST",
        body: { limit: 10 },
      });
      const created = Number(data?.created ?? 0);
      showToast(created > 0 ? `Added ${created} news items.` : "No new news yet.");
      await reload({ silent: true });
    } catch (err) {
      if (err?.status === 429) {
        const retry = err?.data?.retry_after;
        showToast(
          retry
            ? `Refresh locked. Try again in ${retry}s.`
            : err?.data?.message || "Refresh locked."
        );
        return;
      }
      showToast(err?.data?.message || err.message || "Failed to refresh news.");
    }
  }, [reload, showToast]);

  useEffect(() => {
    if (!setRefreshHandler) return undefined;
    setRefreshHandler(() => handleRefresh);
    return () => setRefreshHandler(null);
  }, [handleRefresh, setRefreshHandler]);

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
      <Toast message={toast} />
    </main>
  );
}
