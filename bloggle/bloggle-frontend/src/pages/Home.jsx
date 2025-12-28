import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import useFeed from "../lib/hooks/useFeed";
import FeedList from "../components/FeedList.jsx";
import PostComposer from "../components/PostComposer.jsx";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, setItems, loading, error } = useFeed("/api/posts");

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

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <PostComposer onCreated={handleCreated} />

      {loading ? <Loading message="Loading posts..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error ? (
        <FeedList
          items={posts}
          currentUserId={user?.id}
          emptyTitle="No posts found."
          onUserClick={handleUserClick}
          onPostClick={handlePostClick}
        />
      ) : null}
    </main>
  );
}
