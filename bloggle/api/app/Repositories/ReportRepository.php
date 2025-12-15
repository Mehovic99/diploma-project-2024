<?php

namespace App\Repositories;

use App\Contracts\Repositories\ReportRepositoryInterface;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ReportRepository implements ReportRepositoryInterface
{
    public function __construct(private Report $report)
    {
    }

    public function openForModeration(int $limit = 50): Collection
    {
        return $this->report->newQuery()
            ->where('status', 'open')
            ->orderBy('created_at')
            ->limit($limit)
            ->get();
    }

    public function createFor(Model $reportable, User $reporter, ?string $reason): Report
    {
        $report = new Report([
            'reason' => $reason,
        ]);

        $report->reporter()->associate($reporter);
        $report->reportable()->associate($reportable);
        $report->save();

        return $report->fresh();
    }

    public function resolve(Report $report, User $resolver, string $status): Report
    {
        $report->status = $status;
        $report->resolvedBy()->associate($resolver);
        $report->resolved_at = Carbon::now();
        $report->save();

        return $report->fresh();
    }

    public function findById(int $id): ?Report
    {
        return $this->report->newQuery()->find($id);
    }
}
