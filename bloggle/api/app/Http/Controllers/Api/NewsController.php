<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\PostRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NewsController extends Controller
{
    public function __construct(
        private readonly PostRepositoryInterface $postRepository,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $newsPosts = $this->postRepository->paginateNews(20);
        $user = $request->user();

        if ($user) {
            $newsPosts->getCollection()->load([
                'votes' => fn ($query) => $query->where('user_id', $user->id),
            ]);
        }

        return PostResource::collection($newsPosts)->response();
    }
}
