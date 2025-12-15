<?php

namespace App\Contracts\Repositories;

use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

interface ReportRepositoryInterface
{
    public function openForModeration(int $limit = 50): Collection;

    public function createFor(Model $reportable, User $reporter, ?string $reason): Report;

    public function resolve(Report $report, User $resolver, string $status): Report;

    public function findById(int $id): ?Report;
}
