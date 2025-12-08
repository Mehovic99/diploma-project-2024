<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IngestItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'ext_id_hash',
        'title',
        'url',
        'byline',
        'summary',
        'status',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'raw_payload' => 'array',
    ];

    public function newsSource(): BelongsTo
    {
        return $this->belongsTo(NewsSource::class);
    }
}
