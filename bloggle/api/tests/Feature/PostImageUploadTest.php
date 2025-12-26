<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PostImageUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_post_image_upload_stores_path_and_returns_url(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->post('/api/posts', [
            'title' => 'Post with image',
            'body_md' => 'Hello world',
            'image' => UploadedFile::fake()->image('post.jpg'),
        ], [
            'Accept' => 'application/json',
        ]);

        $response
            ->assertStatus(201)
            ->assertJsonPath('data.image_url', fn ($value) => ! empty($value));

        $post = Post::query()->firstOrFail();

        $this->assertNotNull($post->image_path);
        Storage::disk('public')->assertExists($post->image_path);
    }
}
