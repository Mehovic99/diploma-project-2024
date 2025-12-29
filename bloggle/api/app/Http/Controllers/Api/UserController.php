<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\UserPayload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = $request->user();
        $path = $request->file('avatar')->store('avatars', 'public');

        $user->avatar_path = $path;
        $user->save();

        return response()->json([
            'user' => UserPayload::from($user),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:300'],
        ]);

        $user = $request->user();

        if (array_key_exists('name', $validated)) {
            $user->name = $validated['name'];
        }

        if (array_key_exists('bio', $validated)) {
            $user->bio = $validated['bio'];
        }

        $user->save();

        return response()->json([
            'user' => UserPayload::from($user),
        ]);
    }
}
