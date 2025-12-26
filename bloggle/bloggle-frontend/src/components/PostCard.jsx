import { useState } from "react";
import { Heart, MessageCircle, Share2, ThumbsDown, Trash2 } from "lucide-react";
import Avatar from "./Avatar.jsx";
import { getUsername } from "../lib/userUtils";

export default function PostCard({
  post,
  author,
  isOwner = false,
  onDelete,
  onInteraction,
  onClick,
  onUserClick,
}) {
  const [showComments, setShowComments] = useState(false);
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
            <div className="flex items-center bg-black border border-zinc-800 rounded-full">
              <button
                onClick={() => onInteraction?.(post.id, "likes")}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 hover:text-white transition-colors rounded-l-full group"
              >
                <Heart size={18} className={likes > 0 ? "fill-white text-white" : ""} />
                <span className="text-sm font-bold">{likes}</span>
              </button>
              <div className="w-[1px] h-4 bg-zinc-800"></div>
              <button
                onClick={() => onInteraction?.(post.id, "dislikes")}
                className="px-3 py-1.5 hover:bg-zinc-800 hover:text-red-400 transition-colors rounded-r-full"
              >
                <ThumbsDown size={18} className={dislikes > 0 ? "text-red-400" : ""} />
              </button>
            </div>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 hover:text-white rounded-full transition-colors ml-2"
            >
              <MessageCircle size={18} />
              <span className="text-sm font-bold">{commentsCount}</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 hover:text-white rounded-full transition-colors ml-auto">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
