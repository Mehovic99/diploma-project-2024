<?php

namespace App\Contracts\Repositories;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CommentRepositoryInterface
{
    public function paginateForPost(Post $post, int $perPage = 50): LengthAwarePaginator;

    public function createForPost(Post $post, User $user, array $data): Comment;

    public function update(Comment $comment, array $data): Comment;

    public function adjustScore(Comment $comment, int $delta): void;
}
