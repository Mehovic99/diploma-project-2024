export default function PostCard({ post }) {
  return (
    <article className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {post.image_url ? (
        <div className="border-b border-zinc-800">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full max-h-96 object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold">{post.title}</h3>
          {post.link_url ? (
            <a
              href={post.link_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-sky-400 underline"
            >
              {post.link_url}
            </a>
          ) : null}
        </div>
        {post.body_html ? (
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{post.body_html}</p>
        ) : null}
      </div>
    </article>
  );
}
