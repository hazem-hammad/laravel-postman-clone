<?php

namespace HazemHammad\PostmanClone\Services\Execution;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Psr7\Request;
use Psr\Http\Message\ResponseInterface;

class RequestExecutor
{
    /**
     * @param array{
     *   timeout_seconds:int|float,
     *   response_body_cap_mb:int|float,
     *   follow_redirects:bool,
     *   max_redirects:int,
     *   verify_tls:bool
     * } $config
     */
    public function __construct(
        private readonly Client $client,
        private readonly array $config,
    ) {
    }

    /**
     * @param array{
     *   method:string,
     *   url:string,
     *   headers:array<int, array{key:string,value:string,disabled?:bool}>,
     *   params:array<int, array{key:string,value:string,disabled?:bool}>,
     *   body_mode:?string,
     *   body:mixed
     * } $req
     */
    public function execute(array $req): ResultDto
    {
        $url = $this->buildUrl($req['url'], $req['params']);
        $headers = $this->buildHeaders($req['headers']);
        [$body, $bodyHeaders] = $this->buildBody($req['body_mode'], $req['body']);
        // Body-derived headers (e.g. auto Content-Type for JSON) only apply
        // when the caller hasn't already declared the same header — case
        // insensitive. User-set headers always win.
        foreach ($bodyHeaders as $name => $value) {
            if (! $this->hasHeader($headers, $name)) {
                $headers[$name] = $value;
            }
        }

        $request = new Request($req['method'], $url, $headers, $body);

        $cap = (int) ($this->config['response_body_cap_mb'] * 1024 * 1024);

        $start = microtime(true);
        try {
            $response = $this->client->send($request, [
                'timeout' => $this->config['timeout_seconds'],
                'allow_redirects' => $this->config['follow_redirects']
                    ? ['max' => $this->config['max_redirects'], 'strict' => false, 'referer' => false]
                    : false,
                'verify' => $this->config['verify_tls'],
                'http_errors' => false,
            ]);
        } catch (ConnectException $e) {
            $msg = $e->getMessage();
            $kind = 'network';
            if (stripos($msg, 'timed out') !== false || stripos($msg, 'timeout') !== false) {
                $kind = 'timeout';
            } elseif (stripos($msg, 'name or service') !== false || stripos($msg, 'getaddrinfo') !== false) {
                $kind = 'dns';
            } elseif (stripos($msg, 'ssl') !== false || stripos($msg, 'certificate') !== false) {
                $kind = 'tls';
            }
            return ResultDto::networkError($kind, $msg, (int) ((microtime(true) - $start) * 1000));
        } catch (RequestException $e) {
            return ResultDto::networkError(
                'unknown',
                $e->getMessage(),
                (int) ((microtime(true) - $start) * 1000)
            );
        }

        return $this->buildResult($response, $cap, (int) ((microtime(true) - $start) * 1000));
    }

    /**
     * @param array<int, array{key:string,value:string,disabled?:bool}> $params
     */
    protected function buildUrl(string $url, array $params): string
    {
        $active = array_filter($params, fn (array $p) => empty($p['disabled']));
        if ($active === []) {
            return $url;
        }

        $pairs = array_map(
            fn (array $p) => urlencode((string) $p['key']) . '=' . urlencode((string) $p['value']),
            $active
        );

        $separator = str_contains($url, '?') ? '&' : '?';
        return $url . $separator . implode('&', $pairs);
    }

    /**
     * @param array<int, array{key:string,value:string,disabled?:bool}> $headers
     * @return array<string, string>
     */
    protected function buildHeaders(array $headers): array
    {
        $out = [];
        foreach ($headers as $h) {
            if (! empty($h['disabled'])) {
                continue;
            }
            $out[(string) $h['key']] = (string) $h['value'];
        }
        return $out;
    }

    /**
     * Returns [body, suggestedHeaders]. Suggested headers are applied by
     * execute() only when the caller hasn't already set the same header —
     * an explicit per-request Content-Type always wins.
     *
     * For raw mode: when the body parses as JSON, suggest
     * `Content-Type: application/json`. Mirrors Postman's auto-inject when
     * raw language is set to JSON, and saves the consumer from having to
     * remember to add it manually for every JSON request.
     *
     * @return array{0:?string,1:array<string,string>}
     */
    protected function buildBody(?string $mode, mixed $body): array
    {
        if ($mode === null || $body === null) {
            return [null, []];
        }
        if ($mode === 'raw') {
            $bodyStr = (string) $body;
            $suggested = [];
            if ($bodyStr !== '' && $this->looksLikeJson($bodyStr)) {
                $suggested = ['Content-Type' => 'application/json'];
            }
            return [$bodyStr, $suggested];
        }
        if ($mode === 'urlencoded' && is_array($body)) {
            $active = array_filter($body, fn (array $r) => empty($r['disabled']));
            $parts = array_map(
                fn (array $r) => urlencode((string) $r['key']) . '=' . urlencode((string) $r['value']),
                $active
            );
            return [implode('&', $parts), ['Content-Type' => 'application/x-www-form-urlencoded']];
        }
        return [(string) $body, []];
    }

    /**
     * @param array<string, string> $headers
     */
    protected function hasHeader(array $headers, string $name): bool
    {
        foreach ($headers as $key => $_value) {
            if (strcasecmp($key, $name) === 0) {
                return true;
            }
        }
        return false;
    }

    protected function looksLikeJson(string $body): bool
    {
        $trimmed = ltrim($body);
        if ($trimmed === '' || ($trimmed[0] !== '{' && $trimmed[0] !== '[')) {
            return false;
        }
        try {
            json_decode($body, associative: true, flags: JSON_THROW_ON_ERROR);
            return true;
        } catch (\JsonException) {
            return false;
        }
    }

    protected function buildResult(ResponseInterface $response, int $cap, int $timingMs): ResultDto
    {
        $stream = $response->getBody();
        $body = '';
        $totalSize = 0;
        $truncated = false;

        while (! $stream->eof()) {
            $chunk = $stream->read(8192);
            $totalSize += strlen($chunk);
            if (strlen($body) < $cap) {
                $remaining = $cap - strlen($body);
                if (strlen($chunk) > $remaining) {
                    $body .= substr($chunk, 0, $remaining);
                    $truncated = true;
                } else {
                    $body .= $chunk;
                }
            } else {
                $truncated = true;
            }
        }

        return new ResultDto(
            status: $response->getStatusCode(),
            headers: $response->getHeaders(),
            body: $body,
            bodyTruncated: $truncated,
            sizeBytes: $totalSize,
            timingMs: $timingMs,
            errorKind: null,
            errorMessage: null,
        );
    }
}
