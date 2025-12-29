import { useEffect, useRef, useState } from "react";
import {
  ArrowBigDown,
  ArrowBigUp,
  MessageCircle,
  Share2,
  Trash2,
} from "lucide-react";
import Avatar from "./Avatar.jsx";
import { getUsername } from "../lib/userUtils";
import { copyText } from "../lib/clipboard";

export default function PostCard({
  post,
  author,
  isOwner = false,
  onDelete,
  onInteraction,
  onClick,
  onUserClick,
}) {
  const resolvedAuthor = author ?? post.author ?? {};
  const authorName = resolvedAuthor.name ?? "Unknown";
  const authorUsername = getUsername(resolvedAuthor);
  const authorId = resolvedAuthor.id;
  const isNews = post.category === "news" || post.type === "news";
  const content = post.content ?? post.body_html ?? post.title ?? "";
  const imageUrl = post.image ?? post.image_url;
  const timestamp =
    post.timestamp ??
    (post.created_at ? new Date(post.created_at).toLocaleDateString() : "");
  const likes =
    typeof post.likes === "number"
      ? post.likes
      : typeof post.score === "number"
        ? post.score
        : 0;
  const dislikes = typeof post.dislikes === "number" ? post.dislikes : 0;
  const score =
    typeof post.score === "number" ? post.score : Number(likes) - Number(dislikes);
  const userVote = typeof post.user_vote === "number" ? post.user_vote : 0;
  const [toast, setToast] = useState("");
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);
  const commentsCount =
    post.comments?.length ??
    post.comments_count ??
    (Array.isArray(post.comments) ? post.comments.length : 0);

  const handleUserClick = (event) => {
    event.stopPropagation();
    if (onUserClick && authorId) {
      onUserClick(authorId);
    }
  };

  const handleOpenDetail = (event) => {
    event?.stopPropagation();
    onClick?.();
  };

  const handleShare = async (event) => {
    event?.stopPropagation();
    const url = post?.slug ? `${window.location.origin}/posts/${post.slug}` : window.location.href;

    try {
      const copied = await copyText(url);
      setToast(copied ? "Link copied." : "Unable to copy link.");
    } catch {
      setToast("Unable to copy link.");
    }

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToast(""), 2000);
  };

  return (
    <div
      onClick={onClick}
      className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-sm hover:border-zinc-700 hover:bg-zinc-900/80 transition-all cursor-pointer group/card"
    >
      <div className="p-4 sm:p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-3 items-center">
            <div className="cursor-pointer" onClick={handleUserClick}>
              <Avatar name={authorName} size="sm" src={resolvedAuthor.avatar_url} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
              <h3
                className="font-bold text-white text-sm hover:underline cursor-pointer"
                onClick={handleUserClick}
              >
                {authorName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="hidden sm:inline">•</span>
                <span>@{authorUsername}</span>
                <span>•</span>
                <span>{timestamp}</span>
              </div>
            </div>
          </div>
          {isOwner ? (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.();
              }}
              className="text-zinc-600 hover:text-red-400 p-2 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          ) : null}
        </div>

        <div className="pl-0 sm:pl-11">
          {isNews ? (
            <div className="mb-2">
              <span className="bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-zinc-700">
                News
              </span>
            </div>
          ) : null}
          {content ? (
            post.body_html && !post.content ? (
              <p
                className="text-zinc-200 mb-3 text-[15px] leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: post.body_html }}
              />
            ) : (
              <p className="text-zinc-200 mb-3 text-[15px] leading-relaxed whitespace-pre-wrap">
                {content}
              </p>
            )
          ) : null}
          {imageUrl ? (
            <div className="mb-3 rounded-xl overflow-hidden border border-zinc-800 bg-black">
              <img
                src={imageUrl}
                alt="Post attachment"
                className="w-full h-auto max-h-[500px] object-contain"
                loading="lazy"
              />
            </div>
          ) : null}

          <div
            className="flex items-center gap-1 text-zinc-500 pt-1"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center bg-black border border-zinc-800 rounded-full mr-2">
              <button
                onClick={() => onInteraction?.(post.id, "likes")}
                className="p-1.5 pl-3 hover:bg-zinc-800 hover:text-orange-500 transition-colors rounded-l-full group"
              >
                <ArrowBigUp
                  size={20}
                  className={userVote === 1 ? "fill-orange-500/20 text-orange-500" : ""}
                />
              </button>
              <span
                className={`text-sm font-bold px-1 min-w-[1.5rem] text-center ${
                  score > 0
                    ? "text-orange-500"
                    : score < 0
                      ? "text-blue-500"
                      : "text-zinc-300"
                }`}
              >
                {score}
              </span>
              <button
                onClick={() => onInteraction?.(post.id, "dislikes")}
                className="p-1.5 pr-3 hover:bg-zinc-800 hover:text-blue-500 transition-colors rounded-r-full group"
              >
                <ArrowBigDown
                  size={20}
                  className={userVote === -1 ? "fill-blue-500/20 text-blue-500" : ""}
                />
              </button>
            </div>
            <button
              onClick={handleOpenDetail}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 hover:text-white rounded-full transition-colors ml-2"
            >
              <MessageCircle size={18} />
              <span className="text-sm font-bold">{commentsCount}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 hover:text-white rounded-full transition-colors ml-auto"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>
      {toast ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-4 py-2 rounded-full border border-zinc-800 shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
