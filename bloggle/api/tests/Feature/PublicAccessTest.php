<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_can_view_posts_and_news(): void
    {
        $author = User::factory()->create();

        $this->makePost($author, 'User Post', 'user-post', now(), 'user_post');
        $this->makePost($author, 'News Post', 'news-post', now(), 'news');

        $this->getJson('/api/posts')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson('/api/news')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_guests_cannot_create_posts(): void
    {
        $this->postJson('/api/posts', [
            'title' => 'Guest post',
            'body_md' => 'Nope',
        ])->assertStatus(401);
    }

    public function test_guests_cannot_comment_on_posts(): void
    {
        $author = User::factory()->create();
        $post = $this->makePost($author, 'User Post', 'user-post', now(), 'user_post');

        $this->postJson("/api/posts/{$post->slug}/comments", [
            'body' => 'Nice post',
        ])->assertStatus(401);
    }

    private function makePost(
        User $author,
        string $title,
        string $slug,
        Carbon $createdAt,
        string $type
    ): Post {
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
