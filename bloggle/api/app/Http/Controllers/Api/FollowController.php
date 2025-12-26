<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\UserPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FollowController extends Controller
{
    public function follow(Request $request, int $id): JsonResponse
    {
        $actor = $request->user();
        $target = User::findOrFail($id);

        if ($actor->id === $target->id) {
            return response()->json([
                'message' => 'You cannot follow yourself.',
            ], 422);
        }

        $alreadyFollowing = $actor->following()
            ->whereKey($target->id)
            ->exists();

        if ($alreadyFollowing) {
            return response()->json($this->responsePayload($actor, $target, true, 'already_following'));
        }

        $actor->following()->attach($target->id);

        return response()->json($this->responsePayload($actor, $target, true, 'following'));
    }

    public function unfollow(Request $request, int $id): JsonResponse
    {
        $actor = $request->user();
        $target = User::findOrFail($id);

        if ($actor->id === $target->id) {
            return response()->json([
                'message' => 'You cannot unfollow yourself.',
            ], 422);
        }

        $alreadyFollowing = $actor->following()
            ->whereKey($target->id)
            ->exists();

        if (! $alreadyFollowing) {
            return response()->json($this->responsePayload($actor, $target, false, 'not_following'));
        }

        $actor->following()->detach($target->id);

        return response()->json($this->responsePayload($actor, $target, false, 'unfollowed'));
    }

    public function following(Request $request): JsonResponse
    {
        $user = $request->user();
        $following = $user->following()->get();

        return response()->json([
            'users' => $following->map(fn (User $followed) => UserPayload::from($followed))->all(),
            'follower_count' => $user->followers()->count(),
            'following_count' => $user->following()->count(),
        ]);
    }

    public function followers(Request $request): JsonResponse
    {
        $user = $request->user();
        $followers = $user->followers()->get();

        return response()->json([
            'users' => $followers->map(fn (User $follower) => UserPayload::from($follower))->all(),
            'follower_count' => $user->followers()->count(),
            'following_count' => $user->following()->count(),
        ]);
    }

    private function responsePayload(User $actor, User $target, bool $isFollowing, string $status): array
    {
        return [
            'status' => $status,
            'user' => UserPayload::from($target),
            'follower_count' => $target->followers()->count(),
            'following_count' => $actor->following()->count(),
            'is_following' => $isFollowing,
        ];
    }
}
