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

                $article = $this->enrichArticleDetails($article);

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
     * @return array<int, array{title: string, url: string, published_at: Carbon|null, body_html: string|null, image_url: string|null}>
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
            $description = trim((string) $item->description);

            $contentNode = $item->children('content', true);
            $encoded = $contentNode && isset($contentNode->encoded)
                ? trim((string) $contentNode->encoded)
                : '';

            $bodyHtml = $encoded !== '' ? $encoded : ($description !== '' ? $description : null);
            $imageUrl = $this->extractImageFromRss($item);

            if (!$imageUrl && $bodyHtml) {
                $imageUrl = $this->extractImageFromHtml($bodyHtml);
            }

            if ($imageUrl && $bodyHtml) {
                $bodyHtml = $this->stripFirstImageTag($bodyHtml);
            }

            if ($bodyHtml) {
                $bodyText = $this->normalizeText($bodyHtml);
                $titleText = $this->normalizeText($title);
                if ($bodyText !== '' && $bodyText === $titleText) {
                    $bodyHtml = null;
                }
            }

            if ($title === '' || $link === '') {
                continue;
            }

            $items[] = [
                'title' => $title,
                'url' => $link,
                'published_at' => $publishedAt,
                'body_html' => $bodyHtml,
                'image_url' => $imageUrl,
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
     * @param array{title: string, url: string, published_at: Carbon|null, body_html: string|null, image_url: string|null} $article
     */
    private function storePost(NewsSource $newsSource, array $article): Post
    {
        $post = new Post([
            'type' => 'news',
            'title' => $article['title'],
            'slug' => $this->generateSlug($article['title']),
            'body_html' => $article['body_html'] ?? null,
            'link_url' => $article['url'],
            'image_path' => $article['image_url'] ?? null,
            'status' => 'published',
            'published_at' => $article['published_at'],
        ]);

        $post->news_source_id = $newsSource->id;
        $post->save();

        return $post;
    }

    private function enrichArticleDetails(array $article): array
    {
        if (!$this->needsArticleDetails($article)) {
            return $article;
        }

        try {
            $details = $this->fetchArticleDetails($article['url']);
        } catch (\Throwable) {
            return $article;
        }

        if ($this->needsArticleBody($article) && !empty($details['body_html'])) {
            $article['body_html'] = $details['body_html'];
        }

        if (empty($article['image_url']) && !empty($details['image_url'])) {
            $article['image_url'] = $details['image_url'];
        }

        $titleText = $this->normalizeText($article['title'] ?? '');
        $bodyText = $this->normalizeText($article['body_html'] ?? null);

        if ($bodyText !== '' && $bodyText === $titleText) {
            $article['body_html'] = null;
        }

        if (!empty($article['image_url']) && !empty($article['body_html'])) {
            $article['body_html'] = $this->stripFirstImageTag($article['body_html']);
        }

        return $article;
    }

    private function needsArticleDetails(array $article): bool
    {
        if ($this->needsArticleBody($article)) {
            return true;
        }

        return empty($article['image_url']);
    }

    private function needsArticleBody(array $article): bool
    {
        $bodyText = $this->normalizeText($article['body_html'] ?? null);
        $titleText = $this->normalizeText($article['title'] ?? null);

        if ($bodyText === '') {
            return true;
        }

        if ($bodyText === $titleText) {
            return true;
        }

        return strlen($bodyText) < 60;
    }

    /**
     * @return array{body_html: string|null, image_url: string|null}
     */
    private function fetchArticleDetails(string $url): array
    {
        $response = Http::withHeaders([
            'User-Agent' => self::USER_AGENT,
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ])->timeout(10)->get($url);

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to fetch Klix article: HTTP ' . $response->status());
        }

        $body = $response->body();

        if (trim($body) === '') {
            throw new \RuntimeException('Klix article response is empty.');
        }

        return $this->parseArticleHtml($body);
    }

    /**
     * @return array{body_html: string|null, image_url: string|null}
     */
    private function parseArticleHtml(string $html): array
    {
        $document = new DOMDocument();
        $previous = libxml_use_internal_errors(true);
        $document->loadHTML($html);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $xpath = new DOMXPath($document);
        $imageUrl = $this->extractMetaImage($xpath);

        [$bodyHtml, $bodyImage] = $this->extractArticleBodyHtml($xpath);

        if (!$imageUrl && $bodyImage) {
            $imageUrl = $bodyImage;
        }

        if (!$imageUrl && $bodyHtml) {
            $imageUrl = $this->extractImageFromHtml($bodyHtml);
        }

        if ($bodyHtml) {
            $bodyText = $this->normalizeText($bodyHtml);
            if (strlen($bodyText) < 60) {
                $bodyHtml = null;
            }
        }

        return [
            'body_html' => $bodyHtml,
            'image_url' => $imageUrl,
        ];
    }

    private function extractMetaImage(DOMXPath $xpath): ?string
    {
        $candidates = ['og:image', 'twitter:image', 'twitter:image:src'];

        foreach ($candidates as $candidate) {
            $nodes = $xpath->query("//meta[@property='{$candidate}']/@content | //meta[@name='{$candidate}']/@content");
            if ($nodes->length > 0) {
                $value = trim($nodes->item(0)->nodeValue ?? '');
                if ($value !== '') {
                    return $value;
                }
            }
        }

        return null;
    }

    /**
     * @return array{0: string|null, 1: string|null}
     */
    private function extractArticleBodyHtml(DOMXPath $xpath): array
    {
        $selectors = [
            "//div[contains(@class,'article-body')]",
            "//div[contains(@class,'article__body')]",
            "//div[contains(@class,'article-content')]",
            "//div[contains(@class,'article__content')]",
            "//div[contains(@class,'post-content')]",
            "//div[contains(@class,'post-body')]",
            "//div[contains(@class,'entry-content')]",
            "//article",
        ];

        foreach ($selectors as $selector) {
            $nodes = $xpath->query($selector);
            if (!$nodes || $nodes->length === 0) {
                continue;
            }

            foreach ($nodes as $node) {
                if (!$node instanceof DOMElement) {
                    continue;
                }

                $rawHtml = $this->innerHtml($node);
                $imageUrl = $rawHtml ? $this->extractImageFromHtml($rawHtml) : null;

                $this->stripElements($node, [
                    'script',
                    'style',
                    'figure',
                    'img',
                    'picture',
                    'source',
                    'svg',
                    'video',
                    'iframe',
                    'aside',
                    'nav',
                    'header',
                    'footer',
                ]);

                $cleanHtml = $this->innerHtml($node);
                $text = $this->normalizeText($cleanHtml);

                if ($text !== '' && strlen($text) >= 60) {
                    return [$cleanHtml, $imageUrl];
                }
            }
        }

        return [null, null];
    }

    private function stripElements(DOMElement $root, array $tags): void
    {
        $xpath = new DOMXPath($root->ownerDocument);

        foreach ($tags as $tag) {
            $nodes = $xpath->query('.//' . $tag, $root);
            if (!$nodes) {
                continue;
            }

            foreach ($nodes as $node) {
                if ($node->parentNode) {
                    $node->parentNode->removeChild($node);
                }
            }
        }
    }

    private function innerHtml(DOMElement $element): string
    {
        $html = '';
        foreach ($element->childNodes as $child) {
            $html .= $element->ownerDocument->saveHTML($child);
        }

        return trim($html);
    }

    private function extractImageFromRss(\SimpleXMLElement $item): ?string
    {
        $media = $item->children('media', true);

        if ($media && isset($media->content)) {
            foreach ($media->content as $content) {
                $attributes = $content->attributes();
                if (isset($attributes['url'])) {
                    $url = trim((string) $attributes['url']);
                    if ($url !== '') {
                        return $url;
                    }
                }
            }
        }

        if ($media && isset($media->thumbnail)) {
            $attributes = $media->thumbnail->attributes();
            if (isset($attributes['url'])) {
                $url = trim((string) $attributes['url']);
                if ($url !== '') {
                    return $url;
                }
            }
        }

        if (isset($item->enclosure)) {
            $attributes = $item->enclosure->attributes();
            if (isset($attributes['url'])) {
                $url = trim((string) $attributes['url']);
                if ($url !== '') {
                    return $url;
                }
            }
        }

        return null;
    }

    private function extractImageFromHtml(string $html): ?string
    {
        if (preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', $html, $matches)) {
            $url = trim($matches[1]);
            return $url !== '' ? $url : null;
        }

        return null;
    }

    private function stripFirstImageTag(string $html): string
    {
        return preg_replace('/<img[^>]*>/i', '', $html, 1) ?? $html;
    }

    private function normalizeText(?string $value): string
    {
        if (!$value) {
            return '';
        }

        $decoded = html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $decoded = preg_replace('/\s+/', ' ', $decoded) ?? $decoded;

        return trim($decoded);
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
