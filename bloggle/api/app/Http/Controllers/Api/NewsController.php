<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\PostRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Services\NewsIngestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class NewsController extends Controller
{
    public function __construct(
        private readonly PostRepositoryInterface $postRepository,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $newsPosts = $this->postRepository->paginateNews(20);
        $user = auth('sanctum')->user();

        if ($user) {
            $newsPosts->getCollection()->load([
                'votes' => fn ($query) => $query->where('user_id', $user->id),
            ]);
        }

        return PostResource::collection($newsPosts)->response();
    }

    public function refresh(Request $request, NewsIngestService $newsIngestService): JsonResponse
    {
        $ttlSeconds = 90;
        $lockKey = 'news_refresh_lock';
        $expiresAt = now()->addSeconds($ttlSeconds)->getTimestamp();

        if (!Cache::add($lockKey, $expiresAt, $ttlSeconds)) {
            $lockedUntil = Cache::get($lockKey);
            $remaining = max(1, (int) $lockedUntil - now()->getTimestamp());

            return response()->json([
                'message' => 'Refresh locked. Try again in ' . $remaining . ' seconds.',
                'retry_after' => $remaining,
            ], 429);
        }

        $limit = (int) $request->input('limit', 10);
        $limit = max(1, min(10, $limit));

        try {
            $result = $newsIngestService->pullKlix($limit);
        } catch (\Throwable $exception) {
            return response()->json([
                'message' => 'Unable to refresh Klix news.',
            ], 500);
        }

        return response()->json([
            'status' => 'ok',
            'fetched' => $result['fetched'] ?? 0,
            'created' => $result['created'] ?? 0,
            'skipped' => $result['skipped'] ?? 0,
        ]);
    }
}
