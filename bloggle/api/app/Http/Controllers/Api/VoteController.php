<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\CommentRepositoryInterface;
use App\Contracts\Repositories\PostRepositoryInterface;
use App\Contracts\Repositories\VoteRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoteController extends Controller
{
    public function __construct(
        private readonly PostRepositoryInterface $postRepository,
        private readonly CommentRepositoryInterface $commentRepository,
        private readonly VoteRepositoryInterface $voteRepository,
    ) {
    }

    public function votePost(Request $request, string $slug): JsonResponse
    {
        $validatedData = $request->validate([
            'value' => ['required', 'integer', 'in:-1,1'],
        ]);

        $post = $this->postRepository->findBySlug($slug);

        if (!$post) {
            abort(404);
        }

        $vote = $this->voteRepository->vote(
            $request->user(),
            $post,
            $validatedData['value']
        );

        $post->refresh();

        return response()->json([
            'score' => $post->score,
            'user_vote' => $vote?->value,
        ]);
    }

    public function voteComment(Request $request, int $id): JsonResponse
    {
        $validatedData = $request->validate([
            'value' => ['required', 'integer', 'in:-1,1'],
        ]);

        $comment = $this->commentRepository->findById($id);

        if (!$comment) {
            abort(404);
        }

        $vote = $this->voteRepository->vote(
            $request->user(),
            $comment,
            $validatedData['value']
        );

        $comment->refresh();

        return response()->json([
            'score' => $comment->score,
            'user_vote' => $vote?->value,
        ]);
    }
}
