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
  const newsSource = post.news_source ?? null;
  const authorName = newsSource?.name ?? resolvedAuthor.name ?? "Unknown";
  const authorUsername = newsSource?.slug ?? getUsername(resolvedAuthor);
  const authorId = resolvedAuthor.id;
  const isNews = post.category === "news" || post.type === "news";
  const title = post.title ?? post.content ?? "";
  const bodyHtml = post.body_html ?? "";
  const bodyText = post.body_md ?? "";
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const toastTimeoutRef = useRef(null);
  const normalizeText = (value) =>
    String(value ?? "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  const normalizedTitle = normalizeText(title);
  const normalizedBodyHtml = normalizeText(bodyHtml);
  const normalizedBodyText = normalizeText(bodyText);
  const showBodyHtml =
    !isNews && bodyHtml && normalizedBodyHtml !== normalizedTitle;
  const showBodyText =
    !isNews && !showBodyHtml && bodyText && normalizedBodyText !== normalizedTitle;

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

  const handleDeleteClick = (event) => {
    event.stopPropagation();
    setDeleteError("");
    setConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    setDeleting(true);
    setDeleteError("");

    try {
      await onDelete();
      setConfirmDelete(false);
    } catch (err) {
      setDeleteError(err?.data?.message || err.message || "Unable to delete post.");
    } finally {
      setDeleting(false);
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
          {isOwner && onDelete ? (
            <button
              onClick={handleDeleteClick}
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
          {title ? (
            <h3 className="text-white mb-2 text-[15px] font-semibold leading-snug">
              {title}
            </h3>
          ) : null}
          {showBodyHtml ? (
            <p
              className="text-zinc-200 mb-3 text-[15px] leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          ) : showBodyText ? (
            <p className="text-zinc-200 mb-3 text-[15px] leading-relaxed whitespace-pre-wrap">
              {bodyText}
            </p>
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
      {confirmDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => (!deleting ? setConfirmDelete(false) : null)}
        >
          <div
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-2">Delete this post?</h3>
            <p className="text-sm text-zinc-400 mb-6">
              This action cannot be undone.
            </p>
            {deleteError ? <p className="text-sm text-red-400 mb-4">{deleteError}</p> : null}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-3 rounded-full bg-white text-black font-bold transition-colors disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-full bg-black text-white font-bold border border-zinc-800 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
