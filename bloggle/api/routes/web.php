<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/auth/{provider}/redirect', [AuthController::class, 'redirectToProvider'])
    ->whereIn('provider', ['google', 'facebook']);

Route::get('/auth/{provider}/callback', [AuthController::class, 'handleProviderCallback'])
    ->whereIn('provider', ['google', 'facebook']);
