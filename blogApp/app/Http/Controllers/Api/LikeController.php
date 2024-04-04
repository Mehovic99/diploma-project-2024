<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\Like;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LikeController extends Controller
{
    public function toggle(Request $request, Blog $blog)
    {
        $user = Auth::user();
        $like = $user->likes()->where('blog_id', $blog->id)->first();

        if ($like) {
            $like->delete();
            return response()->json(['message' => 'Reaction removed']);
        } else {
            $blog->likes()->create([
                'user_id' => $user->id,
                'liked' => $request->boolean('liked'),
            ]);
            return response()->json(['message' => 'Reaction added']);
        }
    }
}
