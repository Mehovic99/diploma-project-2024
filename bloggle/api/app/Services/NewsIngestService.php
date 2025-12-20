<?php

namespace App\Services;

use App\Models\NewsSource;
use App\Models\Post;
use DOMDocument;
use DOMElement;
use DOMXPath;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class NewsIngestService
{
    private const KLIX_BASE_URL = 'https://www.klix.ba';
    private const KLIX_LISTING_PATH = '/vijesti';
    public const DEFAULT_LIMIT = 30;

    private const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

    public function __construct(
        private readonly Post $posts,
        private readonly NewsSource $newsSources,
    ) {
    }

    /**
     * Pulls Klix listing and stores latest news items.
     *
     * @return array{source: NewsSource, fetched: int, created: int, skipped: int, errors: array<int, string>}
     */
    public function pullKlix(int $maxItems = self::DEFAULT_LIMIT): array
    {
        $newsSource = $this->ensureKlixSource();

        $rssBody = $this->fetchRss($newsSource->rss_url);
        $articles = $this->parseRss($rssBody, $maxItems);

        $created = 0;
        $skipped = 0;
        $errors = [];

        foreach ($articles as $article) {
            try {
                if ($this->postExists($article['url'])) {
                    $skipped++;
                    continue;
                }

                $this->storePost($newsSource, $article);
                $created++;
            } catch (\Throwable $exception) {
                $errors[] = sprintf(
                    'Failed to save "%s": %s',
                    $article['url'] ?? 'unknown url',
                    $exception->getMessage()
                );
            }
        }

        return [
            'source' => $newsSource,
            'fetched' => count($articles),
            'created' => $created,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    private function ensureKlixSource(): NewsSource
    {
        return $this->newsSources->newQuery()->firstOrCreate(
            ['slug' => 'klix-ba'],
            [
                'name' => 'Klix.ba',
                'homepage_url' => self::KLIX_BASE_URL,
                'rss_url' => 'https://www.klix.ba/rss',
                'is_active' => DB::raw('TRUE'),
            ]
        );
    }

    private function fetchRss(string $url): string
    {
        $response = Http::withHeaders([
            'User-Agent' => self::USER_AGENT,
            'Accept' => 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
        ])->get($url);

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to fetch Klix RSS: HTTP ' . $response->status());
        }

        $body = $response->body();

        if (trim($body) === '') {
            throw new \RuntimeException('Klix RSS response is empty.');
        }

        return $body;
    }

    /**
     * @return array<int, array{title: string, url: string, published_at: Carbon|null}>
     */
    private function parseRss(string $rssBody, int $maxItems): array
    {
        $xml = @simplexml_load_string($rssBody);

        if ($xml === false || !isset($xml->channel->item)) {
            throw new \RuntimeException('Failed to parse Klix RSS feed.');
        }

        $items = [];

        foreach ($xml->channel->item as $item) {
            if (count($items) >= $maxItems) {
                break;
            }

            $title = trim((string) $item->title);
            $link = trim((string) $item->link);
            $publishedAt = $this->parseDate((string) $item->pubDate);

            if ($title === '' || $link === '') {
                continue;
            }

            $items[] = [
                'title' => $title,
                'url' => $link,
                'published_at' => $publishedAt,
            ];
        }

        return $items;
    }

    private function fetchListing(): string
    {
        $response = Http::withHeaders([
            'User-Agent' => self::USER_AGENT,
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ])->get(self::KLIX_BASE_URL . self::KLIX_LISTING_PATH);

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to fetch Klix listing: HTTP ' . $response->status());
        }

        $body = $response->body();

        if (trim($body) === '') {
            throw new \RuntimeException('Klix listing response is empty.');
        }

        return $body;
    }

    /**
     * @return array<int, array{title: string, url: string, published_at: Carbon|null}>
     */
    private function parseListing(string $html): array
    {
        $document = new DOMDocument();
        $previous = libxml_use_internal_errors(true);
        $document->loadHTML($html);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $xpath = new DOMXPath($document);

        $anchors = $xpath->query("//article//a[contains(@href, '/vijesti/')]");

        if ($anchors->length === 0) {
            $anchors = $xpath->query("//a[contains(@href, '/vijesti/')]");
        }

        $items = [];

        /** @var DOMElement $anchor */
        foreach ($anchors as $anchor) {
            $href = trim($anchor->getAttribute('href'));
            $title = trim($anchor->textContent);

            if ($href === '' || strlen($title) < 5) {
                continue;
            }

            $url = $this->normalizeUrl($href);
            $items[$url] = [
                'title' => $title,
                'url' => $url,
                'published_at' => $this->extractPublishedAt($xpath, $anchor),
            ];
        }

        return array_values($items);
    }

    private function normalizeUrl(string $href): string
    {
        if (str_starts_with($href, 'http://') || str_starts_with($href, 'https://')) {
            return $href;
        }

        if (str_starts_with($href, '//')) {
            return 'https:' . $href;
        }

        return rtrim(self::KLIX_BASE_URL, '/') . '/' . ltrim($href, '/');
    }

    private function extractPublishedAt(DOMXPath $xpath, DOMElement $anchor): ?Carbon
    {
        $timeNode = $this->closestTimeNode($xpath, $anchor);

        if ($timeNode instanceof DOMElement) {
            $candidates = [
                $timeNode->getAttribute('datetime'),
                $timeNode->getAttribute('data-published'),
                $timeNode->getAttribute('data-time'),
                trim($timeNode->textContent),
            ];

            foreach ($candidates as $candidate) {
                $parsed = $this->parseDate($candidate);
                if ($parsed) {
                    return $parsed;
                }
            }
        }

        foreach (['data-published', 'data-time', 'data-timestamp'] as $attribute) {
            $value = $anchor->getAttribute($attribute);
            $parsed = $this->parseDate($value);

            if ($parsed) {
                return $parsed;
            }
        }

        return null;
    }

    private function closestTimeNode(DOMXPath $xpath, DOMElement $anchor): ?DOMElement
    {
        $timeOnParent = $xpath->query('.//time', $anchor->parentNode);
        if ($timeOnParent->length > 0) {
            return $timeOnParent->item(0);
        }

        $timeAncestor = $xpath->query('ancestor::*//time', $anchor);
        if ($timeAncestor->length > 0) {
            return $timeAncestor->item(0);
        }

        return null;
    }

    private function parseDate(?string $value): ?Carbon
    {
        if (!$value) {
            return null;
        }

        $trimmed = trim($value);

        if ($trimmed === '') {
            return null;
        }

        if (is_numeric($trimmed)) {
            try {
                return Carbon::createFromTimestamp((int) $trimmed);
            } catch (\Throwable) {
                return null;
            }
        }

        try {
            return Carbon::parse($trimmed);
        } catch (\Throwable) {
            return null;
        }
    }

    private function postExists(string $url): bool
    {
        return $this->posts->newQuery()
            ->where('link_url', $url)
            ->exists();
    }

    /**
     * @param array{title: string, url: string, published_at: Carbon|null} $article
     */
    private function storePost(NewsSource $newsSource, array $article): Post
    {
        $post = new Post([
            'type' => 'news',
            'title' => $article['title'],
            'slug' => $this->generateSlug($article['title']),
            'body_html' => null,
            'link_url' => $article['url'],
            'status' => 'published',
            'published_at' => $article['published_at'],
        ]);

        $post->news_source_id = $newsSource->id;
        $post->save();

        return $post;
    }

    private function generateSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'news';

        for ($i = 0; $i < 3; $i++) {
            $slug = $base . '-' . Str::lower(Str::random(6));

            $exists = $this->posts->newQuery()
                ->where('slug', $slug)
                ->exists();

            if (!$exists) {
                return $slug;
            }
        }

        return $base . '-' . Str::lower(Str::random(12));
    }
}
