<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\CommentRepositoryInterface;
use App\Contracts\Repositories\PostRepositoryInterface;
use App\Contracts\Repositories\ReportRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\ReportResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        private readonly PostRepositoryInterface $postRepository,
        private readonly CommentRepositoryInterface $commentRepository,
        private readonly ReportRepositoryInterface $reportRepository,
    ) {
    }

    public function storePostReport(Request $request, string $slug): JsonResponse
    {
        $validatedData = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $post = $this->postRepository->findBySlug($slug);

        if (!$post) {
            abort(404);
        }

        $report = $this->reportRepository->createFor(
            $post,
            $request->user(),
            $validatedData['reason']
        );

        $report->load('reporter');

        return (new ReportResource($report))
            ->response()
            ->setStatusCode(201);
    }

    public function storeCommentReport(Request $request, int $id): JsonResponse
    {
        $validatedData = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $comment = $this->commentRepository->findById($id);

        if (!$comment) {
            abort(404);
        }

        $report = $this->reportRepository->createFor(
            $comment,
            $request->user(),
            $validatedData['reason']
        );

        $report->load('reporter');

        return (new ReportResource($report))
            ->response()
            ->setStatusCode(201);
    }

    public function index(): JsonResponse
    {
        $this->ensureModeratorOrAdmin(request()->user());

        $reports = $this->reportRepository->openForModeration();
        $reports->load(['reporter', 'resolvedBy']);

        return ReportResource::collection($reports)->response();
    }

    public function resolve(int $id): JsonResponse
    {
        $user = request()->user();

        $this->ensureModeratorOrAdmin($user);

        $report = $this->reportRepository->findById($id);

        if (!$report) {
            abort(404);
        }

        $resolved = $this->reportRepository->resolve($report, $user, 'resolved');
        $resolved->load(['reporter', 'resolvedBy']);

        return (new ReportResource($resolved))->response();
    }

    private function ensureModeratorOrAdmin(?User $user): void
    {
        if (!$user || !in_array($user->role, ['moderator', 'admin', 'super_admin'], true)) {
            abort(403);
        }
    }
}
