<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NewsSourceResource extends JsonResource
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
            'name' => $this->name,
            'slug' => $this->slug,
            'homepage_url' => $this->homepage_url,
            'rss_url' => $this->rss_url,
            'is_active' => $this->is_active,
            'crawl_interval_min' => $this->crawl_interval_min,
            'last_crawled_at' => $this->last_crawled_at,
        ];
    }
}
