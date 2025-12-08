<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\CommentRepositoryInterface;
use App\Contracts\Repositories\PostRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function __construct(
        private readonly PostRepositoryInterface $postRepository,
        private readonly CommentRepositoryInterface $commentRepository,
    ) {
    }

    public function index(string $slug): JsonResponse
    {
        $post = $this->postRepository->findBySlug($slug);

        if (!$post) {
            abort(404);
        }

        $comments = $this->commentRepository->paginateForPost($post);
        $comments->getCollection()->load('user');

        return CommentResource::collection($comments)->response();
    }

    public function store(Request $request, string $slug): JsonResponse
    {
        $post = $this->postRepository->findBySlug($slug);

        if (!$post) {
            abort(404);
        }

        $validatedData = $request->validate([
            'body' => ['required', 'string'],
            'parent_id' => ['nullable', 'integer', 'exists:comments,id'],
        ]);

        $comment = $this->commentRepository->createForPost(
            $post,
            $request->user(),
            $validatedData
        );

        $comment->load('user');

        return (new CommentResource($comment))
            ->response()
            ->setStatusCode(201);
    }
}
