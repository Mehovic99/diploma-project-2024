<?php

namespace App\Contracts\Repositories;

use Illuminate\Support\Collection;
use DateTimeInterface;

interface NewsSourceRepositoryInterface
{
    public function allActive(): Collection;

    public function dueForCrawl(DateTimeInterface $now): Collection;
}
