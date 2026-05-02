<?php

namespace HazemHammad\PostmanClone\Services\Github;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use HazemHammad\PostmanClone\Exceptions\GithubApiException;
use Psr\Http\Message\ResponseInterface;

class GithubClient
{
    public function __construct(
        private readonly Client $http,
        private readonly string $accessToken,
    ) {
    }

    public function exchangeOauthCode(string $code, string $clientId, string $clientSecret): string
    {
        $response = $this->http->post(config('postman-clone.github.oauth_token_url'), [
            'headers' => ['Accept' => 'application/json'],
            'json' => ['client_id' => $clientId, 'client_secret' => $clientSecret, 'code' => $code],
            'http_errors' => false,
        ]);
        $body = json_decode((string) $response->getBody(), true) ?: [];
        if (! isset($body['access_token'])) {
            throw new GithubApiException($response->getStatusCode(), $body, null, 'OAuth code exchange failed');
        }

        return (string) $body['access_token'];
    }

    /**
     * @return array<string,mixed>
     */
    public function getAuthenticatedUser(): array
    {
        return $this->getJson('user');
    }

    /**
     * @return array<int, array<string,mixed>>
     */
    public function getUserEmails(): array
    {
        return $this->getJson('user/emails');
    }

    /**
     * @return array<string,mixed>|null Null on 404/403.
     */
    public function getRepo(string $repo): ?array
    {
        $response = $this->request('GET', "repos/{$repo}");
        $status = $response->getStatusCode();
        if ($status === 404 || $status === 403) {
            return null;
        }

        return json_decode((string) $response->getBody(), true) ?: [];
    }

    /**
     * @param  array<int,string>  $assignees
     * @return array<string,mixed>
     */
    public function createIssue(string $repo, string $title, string $body, array $assignees): array
    {
        $payload = ['title' => $title, 'body' => $body, 'assignees' => array_values($assignees)];

        return $this->postJson("repos/{$repo}/issues", $payload);
    }

    /**
     * @return array{notModified:bool, etag:?string, html:string, state:string, title:string, comment_count:int, html_url:string, assignee_login:?string}
     */
    public function getIssueWithComments(string $repo, int $number, ?string $etag = null): array
    {
        $issue = $this->request('GET', "repos/{$repo}/issues/{$number}", [
            'headers' => array_filter([
                'Accept' => 'application/vnd.github.html+json',
                'If-None-Match' => $etag,
            ]),
        ]);
        if ($issue->getStatusCode() === 304) {
            return [
                'notModified' => true,
                'etag' => $issue->getHeaderLine('ETag') ?: $etag,
                'html' => '',
                'state' => '',
                'title' => '',
                'comment_count' => 0,
                'html_url' => '',
                'assignee_login' => null,
            ];
        }
        $issueJson = json_decode((string) $issue->getBody(), true) ?: [];

        $comments = $this->getJson("repos/{$repo}/issues/{$number}/comments", [
            'Accept' => 'application/vnd.github.html+json',
        ]);

        $html = $this->renderPostBlock(
            $issueJson['user'] ?? [],
            $issueJson['created_at'] ?? null,
            $issueJson['body_html'] ?? '',
            true,
        );
        foreach ($comments as $c) {
            $html .= $this->renderPostBlock(
                $c['user'] ?? [],
                $c['created_at'] ?? null,
                $c['body_html'] ?? '',
                false,
            );
        }

        return [
            'notModified' => false,
            'etag' => $issue->getHeaderLine('ETag') ?: null,
            'html' => $html,
            'state' => $issueJson['state'] ?? 'open',
            'title' => $issueJson['title'] ?? '',
            'comment_count' => (int) ($issueJson['comments'] ?? 0),
            'html_url' => $issueJson['html_url'] ?? '',
            'assignee_login' => $issueJson['assignees'][0]['login'] ?? null,
        ];
    }

    /**
     * @param  array<string, mixed>  $user
     */
    protected function renderPostBlock(array $user, ?string $createdAt, string $bodyHtml, bool $isOriginalPost): string
    {
        $login = htmlspecialchars((string) ($user['login'] ?? 'unknown'), ENT_QUOTES);
        $avatar = htmlspecialchars((string) ($user['avatar_url'] ?? ''), ENT_QUOTES);
        $time = $createdAt ? htmlspecialchars($createdAt, ENT_QUOTES) : '';
        $kindClass = $isOriginalPost ? 'pmc-post pmc-post--op' : 'pmc-post pmc-post--reply';
        $body = $bodyHtml !== '' ? $bodyHtml : '<p class="pmc-empty"><em>No content.</em></p>';

        return <<<HTML
<article class="{$kindClass}">
  <header class="pmc-post-header">
    <img class="pmc-avatar" src="{$avatar}" alt="" />
    <span class="pmc-author">{$login}</span>
    <time class="pmc-time" datetime="{$time}">{$time}</time>
  </header>
  <div class="pmc-post-body">{$body}</div>
</article>

HTML;
    }

    /**
     * @return array{notModified:bool, etag:?string, state:string, title:string, comment_count:int, assignee_login:?string}
     */
    public function getIssueStatus(string $repo, int $number, ?string $etag = null): array
    {
        $response = $this->request('GET', "repos/{$repo}/issues/{$number}", [
            'headers' => array_filter([
                'Accept' => 'application/vnd.github+json',
                'If-None-Match' => $etag,
            ]),
        ]);
        if ($response->getStatusCode() === 304) {
            return [
                'notModified' => true,
                'etag' => $response->getHeaderLine('ETag') ?: $etag,
                'state' => '',
                'title' => '',
                'comment_count' => 0,
                'assignee_login' => null,
            ];
        }
        if ($response->getStatusCode() === 404) {
            return [
                'notModified' => false,
                'etag' => null,
                'state' => 'deleted',
                'title' => '',
                'comment_count' => 0,
                'assignee_login' => null,
            ];
        }
        $j = json_decode((string) $response->getBody(), true) ?: [];

        return [
            'notModified' => false,
            'etag' => $response->getHeaderLine('ETag') ?: null,
            'state' => $j['state'] ?? 'open',
            'title' => $j['title'] ?? '',
            'comment_count' => (int) ($j['comments'] ?? 0),
            'assignee_login' => $j['assignees'][0]['login'] ?? null,
        ];
    }

    /**
     * @return array<int, array{login:string, avatar_url:string}>
     */
    public function listCollaborators(string $repo): array
    {
        $rows = $this->getJson("repos/{$repo}/collaborators");

        return array_map(fn ($r) => ['login' => $r['login'], 'avatar_url' => $r['avatar_url']], $rows);
    }

    public function searchUserByEmail(string $email): ?string
    {
        try {
            $r = $this->getJson('search/users?q='.urlencode($email.' in:email'));
        } catch (GithubApiException) {
            return null;
        }

        return $r['items'][0]['login'] ?? null;
    }

    /**
     * @param  array<string, string>  $extraHeaders
     * @return array<int|string, mixed>
     */
    protected function getJson(string $path, array $extraHeaders = []): array
    {
        return json_decode((string) $this->request('GET', $path, ['headers' => $extraHeaders])->getBody(), true) ?: [];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function postJson(string $path, array $payload): array
    {
        return json_decode((string) $this->request('POST', $path, ['json' => $payload])->getBody(), true) ?: [];
    }

    /**
     * @param  array{headers?: array<string,string>, json?: array<string,mixed>|null}  $opts
     */
    protected function request(string $method, string $path, array $opts = []): ResponseInterface
    {
        $headers = ($opts['headers'] ?? []) + [
            'Authorization' => 'Bearer '.$this->accessToken,
            'Accept' => 'application/vnd.github+json',
            'X-GitHub-Api-Version' => '2022-11-28',
            'User-Agent' => 'postman-clone',
        ];
        $url = preg_match('#^https?://#', $path) === 1
            ? $path
            : rtrim((string) config('postman-clone.github.api_base', 'https://api.github.com'), '/').'/'.ltrim($path, '/');
        try {
            $response = $this->http->request($method, $url, [
                'headers' => $headers,
                'json' => $opts['json'] ?? null,
                'http_errors' => false,
                'timeout' => 30,
            ]);
        } catch (ConnectException $e) {
            throw new GithubApiException(0, null, null, 'Network error: '.$e->getMessage());
        }
        $status = $response->getStatusCode();
        if ($status >= 200 && $status < 400) {
            return $response;
        }
        if ($status === 404) {
            return $response;
        }
        $body = json_decode((string) $response->getBody(), true);
        throw new GithubApiException(
            $status,
            $body,
            $response->getHeaderLine('Retry-After') ?: null,
        );
    }
}
