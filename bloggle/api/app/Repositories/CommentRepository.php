<?php

namespace App\Repositories;

use App\Contracts\Repositories\CommentRepositoryInterface;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CommentRepository implements CommentRepositoryInterface
{
    public function __construct(private Comment $comment)
    {
    }

    public function paginateForPost(Post $post, int $perPage = 50): LengthAwarePaginator
    {
        return $this->comment->newQuery()
            ->where('post_id', $post->id)
            ->where('status', 'published')
            ->orderBy('created_at')
            ->paginate($perPage);
    }

    public function createForPost(Post $post, User $user, array $data): Comment
    {
        $comment = new Comment($data);
        $comment->post()->associate($post);
        $comment->user()->associate($user);

        if (array_key_exists('parent_id', $data)) {
            $comment->parent_id = $data['parent_id'];
        }

        $comment->save();
        $post->increment('comments_count');

        return $comment->fresh();
    }

    public function update(Comment $comment, array $data): Comment
    {
        $comment->fill($data);
        $comment->save();

        return $comment->fresh();
    }

    public function adjustScore(Comment $comment, int $delta): void
    {
        if ($delta === 0) {
            return;
        }

        $comment->increment('score', $delta);
    }

    public function findById(int $id): ?Comment
    {
        return $this->comment->newQuery()->find($id);
    }
}
