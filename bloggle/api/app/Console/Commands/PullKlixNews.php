<?php

namespace App\Console\Commands;

use App\Services\NewsIngestService;
use Illuminate\Console\Command;

class PullKlixNews extends Command
{
    protected $signature = 'klix:pull {--limit=30 : Maximum number of items to ingest (max 50)}';

    protected $description = 'Fetch the latest Klix.ba news and store them as posts.';

    public function __construct(private readonly NewsIngestService $newsIngestService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $limit = $limit > 0 ? $limit : NewsIngestService::DEFAULT_LIMIT;
        $limit = min($limit, 50);

        try {
            $result = $this->newsIngestService->pullKlix($limit);
        } catch (\Throwable $exception) {
            $this->error('Klix ingestion failed: ' . $exception->getMessage());
            return self::FAILURE;
        }

        $this->info(sprintf(
            'Fetched %d items. Created %d, skipped %d.',
            $result['fetched'],
            $result['created'],
            $result['skipped']
        ));

        if (!empty($result['errors'])) {
            $this->warn('Completed with errors:');
            foreach ($result['errors'] as $error) {
                $this->line(' - ' . $error);
            }
        }

        return empty($result['errors']) ? self::SUCCESS : self::FAILURE;
    }
}
