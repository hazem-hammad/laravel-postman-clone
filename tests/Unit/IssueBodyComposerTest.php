<?php

use HazemHammad\PostmanClone\Services\Github\IssueBodyComposer;

it('builds the body with all context blocks present', function () {
    $body = (new IssueBodyComposer())->compose([
        'user_body' => 'Returns 500 on empty payload.',
        'collection_name' => 'Ticket Scape API',
        'request_path' => 'Auth / Email Start',
        'method' => 'POST',
        'url_raw' => '{{base_url}}/api/v1/auth/email/start',
        'url_resolved' => 'http://ticketscape.test/api/v1/auth/email/start',
        'env_id' => 'local',
        'branch' => 'feat/auth-flow',
        'last_run' => ['status' => 401, 'error_kind' => null, 'message' => 'Invalid or missing API key', 'timing_ms' => 37],
        'filer_login' => 'hazem-hammad',
    ]);

    expect($body)->toContain('Returns 500 on empty payload.');
    expect($body)->toContain('### Request context');
    expect($body)->toContain('**Method + URL:** POST `{{base_url}}/api/v1/auth/email/start`');
    expect($body)->toContain('**Resolved URL:** http://ticketscape.test/api/v1/auth/email/start');
    expect($body)->toContain('**Active env:** `local`');
    expect($body)->toContain('**Branch:** `feat/auth-flow`');
    expect($body)->toContain('**Last response:** 401 (37 ms)');
    expect($body)->toContain('> Filed via Postman Clone by @hazem-hammad');
});

it('omits last_run block when no run was made', function () {
    $body = (new IssueBodyComposer())->compose([
        'user_body' => 'See above.', 'collection_name' => 'X', 'request_path' => 'Y',
        'method' => 'GET', 'url_raw' => 'u', 'url_resolved' => 'u', 'env_id' => null,
        'branch' => null, 'last_run' => null, 'filer_login' => 'me',
    ]);
    expect($body)->not->toContain('Last response');
});
