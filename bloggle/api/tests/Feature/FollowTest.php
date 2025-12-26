<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FollowTest extends TestCase
{
    use RefreshDatabase;

    public function test_follow_unfollow_and_lists(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        Sanctum::actingAs($alice);

        $follow = $this->postJson("/api/users/{$bob->id}/follow");

        $follow
            ->assertOk()
            ->assertJson([
                'status' => 'following',
                'is_following' => true,
                'follower_count' => 1,
                'following_count' => 1,
            ]);

        $this->assertDatabaseHas('follows', [
            'follower_id' => $alice->id,
            'followed_id' => $bob->id,
        ]);

        $following = $this->getJson('/api/users/me/following');

        $following
            ->assertOk()
            ->assertJsonFragment([
                'id' => $bob->id,
                'email' => $bob->email,
            ]);

        Sanctum::actingAs($bob);

        $followers = $this->getJson('/api/users/me/followers');

        $followers
            ->assertOk()
            ->assertJsonFragment([
                'id' => $alice->id,
                'email' => $alice->email,
            ]);

        Sanctum::actingAs($alice);

        $unfollow = $this->deleteJson("/api/users/{$bob->id}/follow");

        $unfollow
            ->assertOk()
            ->assertJson([
                'status' => 'unfollowed',
                'is_following' => false,
            ]);

        $this->assertDatabaseMissing('follows', [
            'follower_id' => $alice->id,
            'followed_id' => $bob->id,
        ]);
    }

    public function test_cannot_follow_self(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this
            ->postJson("/api/users/{$user->id}/follow")
            ->assertStatus(422);
    }

    public function test_follow_and_unfollow_are_idempotent(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        Sanctum::actingAs($user);

        $this->postJson("/api/users/{$other->id}/follow")
            ->assertOk()
            ->assertJson([
                'status' => 'following',
                'is_following' => true,
            ]);

        $this->postJson("/api/users/{$other->id}/follow")
            ->assertOk()
            ->assertJson([
                'status' => 'already_following',
                'is_following' => true,
            ]);

        $this->deleteJson("/api/users/{$other->id}/follow")
            ->assertOk()
            ->assertJson([
                'status' => 'unfollowed',
                'is_following' => false,
            ]);

        $this->deleteJson("/api/users/{$other->id}/follow")
            ->assertOk()
            ->assertJson([
                'status' => 'not_following',
                'is_following' => false,
            ]);
    }
}
