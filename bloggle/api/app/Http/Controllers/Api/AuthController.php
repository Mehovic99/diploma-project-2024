<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OAuthIdentity;
use App\Models\User;
use App\Support\UserPayload;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    protected function ensureSupportedProvider(string $provider): void
    {
        if (! in_array($provider, ['google', 'facebook'], true)) {
            abort(400);
        }
    }

    protected function providerScopes(string $provider): array
    {
        return match ($provider) {
            'google' => ['openid', 'email', 'profile'],
            'facebook' => ['email', 'public_profile'],
            default => [],
        };
    }

    public function redirectToProvider(string $provider): RedirectResponse
    {
        $this->ensureSupportedProvider($provider);

        return Socialite::driver($provider)
            ->stateless()
            ->scopes($this->providerScopes($provider))
            ->redirect();
    }

    public function handleProviderCallback(string $provider): RedirectResponse
    {
        $this->ensureSupportedProvider($provider);

        $socialUser = Socialite::driver($provider)->stateless()->user();

        $providerUserId = $socialUser->getId();
        $email = $socialUser->getEmail();

        $frontend = rtrim((string) config('app.frontend_url'), '/');

        if (! $email) {
            return redirect()->away($frontend . '/login?error=email_required');
        }

        $name = $socialUser->getName() ?: ($email ?: 'User');

        $oauthIdentity = OAuthIdentity::where('provider', $provider)
            ->where('provider_user_id', $providerUserId)
            ->first();

        if ($oauthIdentity) {
            $user = $oauthIdentity->user;
        } else {
            $user = User::where('email', $email)->first();

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

        return redirect()->away($frontend . '/oauth/callback?token=' . urlencode($token));
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json(UserPayload::from($user));
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            $user->currentAccessToken()?->delete();
        }

        $bearerToken = $request->bearerToken();

        if ($bearerToken) {
            PersonalAccessToken::findToken($bearerToken)?->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }
}
