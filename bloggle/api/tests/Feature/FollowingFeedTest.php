<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FollowingFeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_following_feed_returns_only_followed_users_posts(): void
    {
        $follower = User::factory()->create();
        $followed = User::factory()->create();
        $stranger = User::factory()->create();

        $follower->following()->attach($followed->id);

        $older = $this->makePost($followed, 'Older Post', 'older-post', now()->subDay());
        $newer = $this->makePost($followed, 'Newer Post', 'newer-post', now());
        $this->makePost($followed, 'News Post', 'news-post', now()->subHours(3), 'news');
        $this->makePost($stranger, 'Stranger Post', 'stranger-post', now()->subHours(2));

        Sanctum::actingAs($follower);

        $response = $this->getJson('/api/feed/following');

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $slugs = array_column($response->json('data'), 'slug');

        $this->assertSame([$newer->slug, $older->slug], $slugs);
    }

    public function test_following_feed_is_empty_when_following_none(): void
    {
        $user = User::factory()->create();
        $author = User::factory()->create();

        $this->makePost($author, 'Solo Post', 'solo-post', now());

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/feed/following');

        $response
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_following_feed_excludes_news_posts(): void
    {
        $follower = User::factory()->create();
        $followed = User::factory()->create();

        $follower->following()->attach($followed->id);

        $newsPost = $this->makePost($followed, 'News Post', 'news-post', now()->subHour(), 'news');
        $userPost = $this->makePost($followed, 'User Post', 'user-post', now());

        Sanctum::actingAs($follower);

        $response = $this->getJson('/api/feed/following');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $slugs = array_column($response->json('data'), 'slug');

        $this->assertSame([$userPost->slug], $slugs);
        $this->assertNotContains($newsPost->slug, $slugs);
    }

    private function makePost(
        User $author,
        string $title,
        string $slug,
        Carbon $createdAt,
        string $type = 'user_post'
    ): Post
    {
        $post = new Post([
            'type' => $type,
            'title' => $title,
            'slug' => $slug,
            'body_md' => null,
            'body_html' => null,
            'link_url' => null,
            'status' => 'published',
            'published_at' => $createdAt,
        ]);

        $post->user()->associate($author);
        $post->created_at = $createdAt;
        $post->updated_at = $createdAt;
        $post->save();

        return $post;
    }
}
