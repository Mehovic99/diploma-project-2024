<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_returns_token_and_user(): void
    {
        $payload = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response
            ->assertStatus(201)
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email', 'avatar_url'],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
        ]);
    }

    public function test_login_me_and_logout_flow(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret123'),
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $login
            ->assertOk()
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email', 'avatar_url'],
            ]);

        $token = $login->json('token');

        $me = $this
            ->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $me
            ->assertOk()
            ->assertJson([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]);

        $logout = $this
            ->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');

        $logout->assertOk();

        $this->assertNull(PersonalAccessToken::findToken($token));
        $this->app['auth']->forgetGuards();

        $this
            ->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me')
            ->assertStatus(401);
    }
}
