<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NewsSource extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'homepage_url',
        'rss_url',
        'is_active',
        'crawl_interval_min',
        'last_crawled_at',
    ];

    protected $casts = [
        'is_active' => 'bool',
        'last_crawled_at' => 'datetime',
    ];

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function ingestItems(): HasMany
    {
        return $this->hasMany(IngestItem::class);
    }
}
