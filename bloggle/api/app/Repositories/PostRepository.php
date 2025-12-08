<?php

namespace App\Repositories;

use App\Contracts\Repositories\PostRepositoryInterface;
use App\Models\Post;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class PostRepository implements PostRepositoryInterface
{
    public function __construct(private Post $post)
    {
    }

    public function paginateFeed(int $perPage = 20): LengthAwarePaginator
    {
        return $this->post->newQuery()
            ->where('status', 'published')
            ->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function findById(int $id): ?Post
    {
        return $this->post->newQuery()->find($id);
    }

    public function findBySlug(string $slug): ?Post
    {
        return $this->post->newQuery()
            ->where('slug', $slug)
            ->first();
    }

    public function createForUser(User $user, array $data): Post
    {
        $post = new Post($data);
        $post->user()->associate($user);

        if (array_key_exists('news_source_id', $data)) {
            $post->news_source_id = $data['news_source_id'];
        }

        $post->slug = Str::slug($data['title']) . '-' . Str::random(6);
        $post->save();

        return $post->fresh();
    }

    public function update(Post $post, array $data): Post
    {
        $post->fill($data);

        if (array_key_exists('news_source_id', $data)) {
            $post->news_source_id = $data['news_source_id'];
        }

        if (array_key_exists('title', $data)) {
            $post->slug = Str::slug($data['title']) . '-' . Str::random(6);
        }

        $post->save();

        return $post->fresh();
    }

    public function adjustScore(Post $post, int $delta): void
    {
        if ($delta === 0) {
            return;
        }

        $post->increment('score', $delta);
    }

    public function incrementCommentsCount(Post $post): void
    {
        $post->increment('comments_count');
    }
}
