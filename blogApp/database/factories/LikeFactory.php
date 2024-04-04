<?php

namespace Database\Factories;

use App\Models\Like;
use App\Models\Blog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Like>
 */
class LikeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'blog_id' => Blog::factory(),
            'user_id' => User::factory(),
            'liked' => $this->faker->boolean,
        ];
    }
}
