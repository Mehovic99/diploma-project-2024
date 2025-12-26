<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\CommentRepositoryInterface;
use App\Contracts\Repositories\PostRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Http\Resources\PostResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function __construct(
        private readonly PostRepositoryInterface $postRepository,
        private readonly CommentRepositoryInterface $commentRepository,
    ) {
    }

    public function index(): JsonResponse
    {
        $posts = $this->postRepository->paginateFeed(20);

        return PostResource::collection($posts)->response();
    }

    public function show(string $slug): JsonResponse
    {
        $post = $this->postRepository->findBySlug($slug);

        if (!$post) {
            abort(404);
        }

        $post->load(['user', 'newsSource']);

        $commentsPaginator = $this->commentRepository->paginateForPost(
            $post,
            max(1, $post->comments()->count())
        );

        $comments = $commentsPaginator->getCollection()->load('user');

        return response()->json([
            'post' => new PostResource($post),
            'comments' => CommentResource::collection($comments),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validatedData = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body_md' => ['nullable', 'string'],
            'link_url' => ['nullable', 'url'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($request->hasFile('image')) {
            $validatedData['image_path'] = $request->file('image')->store('post-images', 'public');
        }

        unset($validatedData['image']);

        $post = $this->postRepository->createForUser($user, $validatedData);

        return (new PostResource($post))
            ->response()
            ->setStatusCode(201);
    }
}
