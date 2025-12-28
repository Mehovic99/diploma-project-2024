<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class PostResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'slug' => $this->slug,
            'body_html' => $this->body_html,
            'link_url' => $this->link_url,
            'image_url' => $this->image_path ? Storage::disk('public')->url($this->image_path) : null,
            'status' => $this->status,
            'score' => $this->score,
            'comments_count' => $this->comments_count,
            'votes_count' => $this->votes_count,
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'author' => $this->whenLoaded('user', function () {
                $user = $this->user;

                if (!$user) {
                    return null;
                }

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar_url' => $user->avatar_path
                        ? Storage::disk('public')->url($user->avatar_path)
                        : null,
                ];
            }),
            'user_vote' => $request->user()
                ? ($this->relationLoaded('votes') ? $this->votes->first()?->value : null)
                : null,
            'news_source' => $this->whenLoaded('newsSource', function () {
                $newsSource = $this->newsSource;

                if (!$newsSource) {
                    return null;
                }

                return [
                    'id' => $newsSource->id,
                    'name' => $newsSource->name,
                    'slug' => $newsSource->slug,
                ];
            }),
        ];
    }
}
