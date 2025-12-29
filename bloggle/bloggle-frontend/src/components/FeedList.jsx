import PostCard from "./PostCard.jsx";

export default function FeedList({
  items,
  emptyTitle = "No posts found.",
  emptySubtitle,
  currentUserId,
  onPostClick,
  onInteraction,
  onDelete,
  onUserClick,
}) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl">
        <p className="text-lg text-zinc-500">{emptyTitle}</p>
        {emptySubtitle ? <p className="text-sm text-zinc-600 mt-2">{emptySubtitle}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((post) => {
        const author = post.author ?? post.user ?? null;
        const isOwner = Boolean(author?.id && currentUserId && author.id === currentUserId);
        const key = post.id ?? post.slug;

        return (
          <PostCard
            key={key}
            post={post}
            author={author}
            isOwner={isOwner}
            onClick={onPostClick ? () => onPostClick(post) : undefined}
            onInteraction={onInteraction ? (postId, type) => onInteraction(postId, type) : undefined}
            onUserClick={onUserClick}
            onDelete={onDelete ? () => onDelete(post) : undefined}
          />
        );
      })}
    </div>
  );
}
