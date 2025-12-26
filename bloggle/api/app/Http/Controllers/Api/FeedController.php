<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeedController extends Controller
{
    public function following(Request $request): JsonResponse
    {
        $user = $request->user();
        $qualifiedKey = $user->following()->getRelated()->getQualifiedKeyName();
        $followingIds = $user->following()->pluck($qualifiedKey);

        $posts = Post::query()
            ->whereIn('user_id', $followingIds)
            ->where('type', 'user_post')
            ->orderByDesc('created_at')
            ->paginate(20);

        return PostResource::collection($posts)->response();
    }
}
