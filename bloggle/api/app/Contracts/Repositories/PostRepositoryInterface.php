<?php

namespace App\Contracts\Repositories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface PostRepositoryInterface
{
    public function paginateFeed(int $perPage = 20): LengthAwarePaginator;

    public function paginateNews(int $perPage = 20): LengthAwarePaginator;

    public function findById(int $id): ?Post;

    public function findBySlug(string $slug): ?Post;

    public function createForUser(User $user, array $data): Post;

    public function update(Post $post, array $data): Post;

    public function adjustScore(Post $post, int $delta): void;

    public function incrementCommentsCount(Post $post): void;
}
