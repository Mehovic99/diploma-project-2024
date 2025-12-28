import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowBigDown,
  ArrowBigUp,
  ArrowLeft,
  Calendar,
  Share2,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import { getUsername } from "../lib/userUtils";
import Avatar from "../components/Avatar.jsx";
import Button from "../components/Button.jsx";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";

export default function PostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voteBusy, setVoteBusy] = useState(false);
  const [userVote, setUserVote] = useState(0);

  useEffect(() => {
    let active = true;

    const loadPost = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const data = await api(`/api/posts/${slug}`);
        if (!active) return;

        const resolvedPost = data?.post?.data ?? data?.post ?? null;
        const commentPayload = data?.comments?.data ?? data?.comments ?? [];

        setPost(resolvedPost);
        setComments(Array.isArray(commentPayload) ? commentPayload : []);
      } catch (err) {
        if (!active) return;
        setLoadError(err?.data?.message || err.message || "Failed to load post.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPost();

    return () => {
      active = false;
    };
  }, [slug]);

  const author = post?.author ?? {};
  const authorName = author?.name ?? "Unknown";
  const authorUsername = getUsername(author);
  const imageUrl = post?.image_url ?? post?.image;
  const content = post?.content ?? post?.body_html ?? post?.title ?? "";
  const isNews = post?.category === "news" || post?.type === "news";

  const formattedDate = useMemo(() => {
    if (!post?.published_at && !post?.created_at) return "";
    const value = post?.published_at ?? post?.created_at;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  }, [post?.published_at, post?.created_at]);

  const score =
    typeof post?.score === "number"
      ? post.score
      : Number(post?.likes ?? 0) - Number(post?.dislikes ?? 0);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();

    if (!commentText.trim() || submitting) return;

    if (!token) {
      navigate("/login", {
        replace: false,
        state: { message: "Please sign in to comment." },
      });
      return;
    }

    setSubmitting(true);
    setActionError("");

    try {
      const data = await api(`/api/posts/${slug}/comments`, {
        method: "POST",
        body: { body: commentText.trim() },
      });

      const created = data?.data ?? data;
      setComments((prev) => [created, ...prev]);
      setCommentText("");
    } catch (err) {
      setActionError(err?.data?.message || err.message || "Failed to add comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (value) => {
    if (voteBusy || !post?.slug) return;

    if (!token) {
      navigate("/login", {
        replace: false,
        state: { message: "Please sign in to vote." },
      });
      return;
    }

    const currentScore =
      typeof post.score === "number"
        ? post.score
        : Number(post.likes ?? 0) - Number(post.dislikes ?? 0);
    const optimisticScore = currentScore + value;
    const previousVote = userVote;

    setPost((prev) => (prev ? { ...prev, score: optimisticScore } : prev));
    setUserVote(value);
    setVoteBusy(true);
    setActionError("");

    try {
      const data = await api(`/api/posts/${post.slug}/vote`, {
        method: "POST",
        body: { value },
      });

      const nextScore = typeof data?.score === "number" ? data.score : optimisticScore;
      setPost((prev) => (prev ? { ...prev, score: nextScore } : prev));
      setUserVote(data?.user_vote ?? value);
    } catch (err) {
      setPost((prev) => (prev ? { ...prev, score: currentScore } : prev));
      setUserVote(previousVote);
      setActionError(err?.data?.message || err.message || "Failed to vote.");
    } finally {
      setVoteBusy(false);
    }
  };

  if (loading) {
    return <Loading message="Loading post..." />;
  }

  if (loadError || !post) {
    return <ErrorState message={loadError || "Post not found."} />;
  }

  return (
    <div className="max-w-3xl mx-auto px-0 sm:px-4 py-4 sm:py-8 animate-in slide-in-from-right-4 duration-300">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 px-4 sm:px-0 transition-colors"
      >
        <ArrowLeft size={20} /> <span className="font-medium">Back to feed</span>
      </button>

      <div className="bg-zinc-900 sm:rounded-3xl border-y sm:border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800/50">
          <div className="flex justify-between items-start">
            <div className="flex gap-4 items-center cursor-pointer group">
              <Avatar name={authorName} size="lg" src={author?.avatar_url} />
              <div>
                <h1 className="text-xl font-bold text-white group-hover:underline">
                  {authorName}
                </h1>
                <p className="text-zinc-500">@{authorUsername}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isNews ? (
            <span className="inline-block bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-md mb-3 border border-zinc-700">
              News
            </span>
          ) : null}
          {content ? (
            post?.body_html && !post?.content ? (
              <div
                className="text-white text-xl leading-relaxed whitespace-pre-wrap mb-6"
                dangerouslySetInnerHTML={{ __html: post.body_html }}
              />
            ) : (
              <p className="text-white text-xl leading-relaxed whitespace-pre-wrap mb-6">
                {content}
              </p>
            )
          ) : null}
          {imageUrl ? (
            <div className="mb-8 rounded-2xl overflow-hidden border border-zinc-800 bg-black shadow-lg">
              <img
                src={imageUrl}
                alt="Post attachment"
                className="w-full h-auto object-contain max-h-[700px]"
              />
            </div>
          ) : null}

          {formattedDate ? (
            <div className="flex items-center gap-6 text-zinc-500 text-sm mb-6 pb-6 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{formattedDate}</span>
              </div>
            </div>
          ) : null}

          {actionError ? <ErrorState message={actionError} /> : null}

          <div className="flex items-center justify-between mb-8">
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-white">
                <span
                  className={`font-bold text-lg ${
                    score > 0
                      ? "text-orange-500"
                      : score < 0
                        ? "text-blue-500"
                        : "text-zinc-400"
                  }`}
                >
                  {score}
                </span>
                <span className="text-zinc-500">Score</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <span className="font-bold text-lg">{comments.length}</span>
                <span className="text-zinc-500">Comments</span>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-full mr-2">
                <button
                  onClick={() => handleVote(1)}
                  className="p-2 pl-4 hover:bg-zinc-800 hover:text-orange-500 transition-colors rounded-l-full group"
                >
                  <ArrowBigUp
                    size={24}
                    className={userVote === 1 ? "fill-orange-500/20 text-orange-500" : ""}
                  />
                </button>
                <div className="w-[1px] h-4 bg-zinc-800"></div>
                <button
                  onClick={() => handleVote(-1)}
                  className="p-2 pr-4 hover:bg-zinc-800 hover:text-blue-500 transition-colors rounded-r-full group"
                >
                  <ArrowBigDown
                    size={24}
                    className={userVote === -1 ? "fill-blue-500/20 text-blue-500" : ""}
                  />
                </button>
              </div>
              <Button variant="ghost">
                <Share2 size={24} />
              </Button>
            </div>
          </div>

          <div className="bg-zinc-950/50 rounded-2xl p-6 border border-zinc-800/50">
            <h3 className="text-lg font-bold text-white mb-6">Comments</h3>
            <form onSubmit={handleCommentSubmit} className="flex gap-4 mb-8">
              <div className="hidden sm:block">
                <Avatar name={user?.name ?? "Guest"} src={user?.avatar_url} />
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Post your reply..."
                  className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-600 transition-colors"
                />
                <Button type="submit" disabled={!commentText.trim() || submitting}>
                  Reply
                </Button>
              </div>
            </form>
            <div className="space-y-6">
              {comments.length > 0 ? (
                comments.map((comment) => {
                  const commenter = comment.user ?? {};
                  const commenterName = commenter?.name ?? "User";
                  const commenterUsername = getUsername(commenter);
                  const createdAt = comment.created_at
                    ? new Date(comment.created_at).toLocaleDateString()
                    : "";

                  return (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar name={commenterName} size="sm" src={commenter?.avatar_url} />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white text-sm">@{commenterUsername}</span>
                          {createdAt ? (
                            <span className="text-zinc-600 text-xs">• {createdAt}</span>
                          ) : null}
                        </div>
                        <p className="text-zinc-300">{comment.body}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-zinc-500 text-center py-4">No comments yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
