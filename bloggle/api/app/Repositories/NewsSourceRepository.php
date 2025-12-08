<?php

namespace App\Repositories;

use App\Contracts\Repositories\NewsSourceRepositoryInterface;
use App\Models\NewsSource;
use DateTimeInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class NewsSourceRepository implements NewsSourceRepositoryInterface
{
    public function __construct(private NewsSource $newsSource)
    {
    }

    public function allActive(): Collection
    {
        return $this->newsSource->newQuery()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    public function dueForCrawl(DateTimeInterface $now): Collection
    {
        $now = Carbon::instance($now);

        return $this->newsSource->newQuery()
            ->where('is_active', true)
            ->get()
            ->filter(function (NewsSource $source) use ($now) {
                if ($source->last_crawled_at === null) {
                    return true;
                }

                $nextCrawlAt = Carbon::instance($source->last_crawled_at)
                    ->addMinutes($source->crawl_interval_min);

                return $nextCrawlAt->lessThanOrEqualTo($now);
            })
            ->values();
    }
}
