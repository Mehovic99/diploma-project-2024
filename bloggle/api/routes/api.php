<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\NewsController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\VoteController;
use Illuminate\Support\Facades\Route;

Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{slug}', [PostController::class, 'show']);
Route::get('/posts/{slug}/comments', [CommentController::class, 'index']);
Route::get('/news', [NewsController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/posts', [PostController::class, 'store']);
    Route::post('/posts/{slug}/comments', [CommentController::class, 'store']);
    Route::post('/posts/{slug}/vote', [VoteController::class, 'votePost']);
    Route::post('/comments/{id}/vote', [VoteController::class, 'voteComment']);
    Route::post('/posts/{slug}/reports', [ReportController::class, 'storePostReport']);
    Route::post('/comments/{id}/reports', [ReportController::class, 'storeCommentReport']);
    Route::get('/reports', [ReportController::class, 'index']);
    Route::post('/reports/{id}/resolve', [ReportController::class, 'resolve']);

    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});
