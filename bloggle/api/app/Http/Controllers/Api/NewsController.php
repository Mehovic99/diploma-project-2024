<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\PostRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use Illuminate\Http\JsonResponse;

class NewsController extends Controller
{
    public function __construct(
        private readonly PostRepositoryInterface $postRepository,
    ) {
    }

    public function index(): JsonResponse
    {
        $newsPosts = $this->postRepository->paginateNews(20);

        return PostResource::collection($newsPosts)->response();
    }
}
