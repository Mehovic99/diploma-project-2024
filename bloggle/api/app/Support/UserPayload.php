<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Storage;

class UserPayload
{
    public static function from(User $user): array
    {
        $avatarUrl = null;

        if ($user->avatar_path) {
            $avatarUrl = Storage::disk('public')->url($user->avatar_path);
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $avatarUrl,
        ];
    }
}
