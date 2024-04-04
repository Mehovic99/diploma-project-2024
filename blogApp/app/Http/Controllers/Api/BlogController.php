<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BlogController extends Controller
{
    public function index()
    {
        $blogs = Blog::with('user')->get();
        return response()->json($blogs);
    }

    public function show(Blog $blog)
    {
        return response()->json($blog->load('user', 'comments.user', 'likes'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'image' => 'nullable|url'
        ]);

        $blog = Auth::user()->blogs()->create($request->all());
        return response()->json($blog, 201);
    }

    public function update(Request $request, Blog $blog)
    {
        $this->authorize('update', $blog);

        $request->validate([
            'title' => 'string|max:255',
            'body' => 'string',
            'image' => 'nullable|url'
        ]);

        $blog->update($request->all());
        return response()->json($blog);
    }

    public function destroy(Blog $blog)
    {
        $this->authorize('delete', $blog);
        
        $blog->delete();
        return response()->json(['message' => 'Blog deleted successfully']);
    }
}
