import { useNavigate } from "react-router-dom";
import useFeed from "../lib/hooks/useFeed";
import FeedList from "../components/FeedList.jsx";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";

export default function News() {
  const navigate = useNavigate();
  const { items, loading, error } = useFeed("/api/news");

  const handleUserClick = (userId) => {
    if (!userId) return;
    navigate(`/profile/${userId}`);
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {loading ? <Loading message="Loading news..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error ? (
        <FeedList
          items={items}
          emptyTitle="No news found."
          emptySubtitle="Check back later for updates."
          onUserClick={handleUserClick}
        />
      ) : null}
    </main>
  );
}
