<?php

use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use HazemHammad\PostmanClone\Exceptions\GithubApiException;
use HazemHammad\PostmanClone\Services\Github\GithubClient;

function ghClient(MockHandler $mock): GithubClient
{
    $http = new Client(['handler' => HandlerStack::create($mock), 'base_uri' => 'https://api.github.com/']);

    return new GithubClient($http, 'tok-xyz');
}

it('attaches Bearer token to every request', function () {
    $captured = null;
    $mock = new MockHandler([
        function (Request $req) use (&$captured) {
            $captured = $req->getHeaderLine('Authorization');

            return new Response(200, [], json_encode(['ok' => true]));
        },
    ]);
    ghClient($mock)->getAuthenticatedUser();
    expect($captured)->toBe('Bearer tok-xyz');
});

it('returns user payload from /user', function () {
    $mock = new MockHandler([
        new Response(200, [], json_encode(['id' => 1, 'login' => 'octocat'])),
    ]);
    $u = ghClient($mock)->getAuthenticatedUser();
    expect($u['login'])->toBe('octocat');
});

it('returns null for getRepo on 404', function () {
    $mock = new MockHandler([new Response(404, [], '{}')]);
    expect(ghClient($mock)->getRepo('foo/bar'))->toBeNull();
});

it('throws GithubApiException on 5xx', function () {
    $mock = new MockHandler([new Response(503, ['Retry-After' => '60'], 'Service unavailable')]);
    ghClient($mock)->getRepo('foo/bar');
})->throws(GithubApiException::class);

it('createIssue posts title + body + assignees and returns parsed response', function () {
    $captured = null;
    $mock = new MockHandler([
        function (Request $req) use (&$captured) {
            $captured = json_decode((string) $req->getBody(), true);

            return new Response(201, [], json_encode([
                'number' => 42, 'title' => 'X', 'state' => 'open',
                'html_url' => 'https://github.com/o/r/issues/42',
                'assignees' => [['login' => 'octocat']], 'comments' => 0,
            ]));
        },
    ]);
    $issue = ghClient($mock)->createIssue('o/r', 'X', 'body', ['octocat']);
    expect($captured)->toBe(['title' => 'X', 'body' => 'body', 'assignees' => ['octocat']]);
    expect($issue['number'])->toBe(42);
});

it('getIssueWithComments uses html accept header and forwards ETag', function () {
    $headers = [];
    $mock = new MockHandler([
        function (Request $req) use (&$headers) {
            $headers['accept'] = $req->getHeaderLine('Accept');
            $headers['if-none-match'] = $req->getHeaderLine('If-None-Match');

            return new Response(200, ['ETag' => 'W/"abc"'], json_encode([
                'state' => 'open', 'title' => 'T', 'body_html' => '<p>hi</p>',
                'comments' => 1, 'html_url' => '…',
                'assignees' => [],
            ]));
        },
        function () {
            return new Response(200, [], json_encode([
                ['body_html' => '<p>reply</p>', 'user' => ['login' => 'b']],
            ]));
        },
    ]);
    $r = ghClient($mock)->getIssueWithComments('o/r', 1, 'W/"prev"');
    expect($headers['accept'])->toContain('vnd.github.html+json');
    expect($headers['if-none-match'])->toBe('W/"prev"');
    expect($r['etag'])->toBe('W/"abc"');
    expect($r['html'])->toContain('<p>hi</p>');
    expect($r['html'])->toContain('<p>reply</p>');
});

it('getIssueWithComments returns notModified=true on 304', function () {
    $mock = new MockHandler([new Response(304, ['ETag' => 'W/"abc"'])]);
    $r = ghClient($mock)->getIssueWithComments('o/r', 1, 'W/"abc"');
    expect($r['notModified'])->toBeTrue();
});
