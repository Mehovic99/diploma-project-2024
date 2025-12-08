<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OAuthIdentity;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse;

class AuthController extends Controller
{
    protected function ensureSupportedProvider(string $provider): void
    {
        if (! in_array($provider, ['google', 'facebook'], true)) {
            abort(400);
        }
    }

    public function redirectToProvider(string $provider): RedirectResponse
    {
        $this->ensureSupportedProvider($provider);

        return Socialite::driver($provider)->redirect();
    }

    public function handleProviderCallback(string $provider): JsonResponse
    {
        $this->ensureSupportedProvider($provider);

        $socialUser = Socialite::driver($provider)->stateless()->user();

        $providerUserId = $socialUser->getId();
        $email = $socialUser->getEmail();
        $name = $socialUser->getName() ?: ($email ?: 'User');

        $oauthIdentity = OAuthIdentity::where('provider', $provider)
            ->where('provider_user_id', $providerUserId)
            ->first();

        if ($oauthIdentity) {
            $user = $oauthIdentity->user;
        } else {
            $user = $email ? User::where('email', $email)->first() : null;

            if (! $user) {
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make(Str::random(32)),
                ]);
            }

            $tokenExpiresAt = $socialUser->expiresIn ? now()->addSeconds($socialUser->expiresIn) : null;

            OAuthIdentity::create([
                'user_id' => $user->id,
                'provider' => $provider,
                'provider_user_id' => $providerUserId,
                'access_token' => $socialUser->token ?? null,
                'refresh_token' => $socialUser->refreshToken ?? null,
                'token_expires_at' => $tokenExpiresAt,
            ]);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(null, 204);
    }
}
