<?php

return [
    'route' => [
        'prefix' => 'postman',
    ],

    'access' => [
        'enabled_environments' => ['local'],
        'middleware' => [],
        'gate' => null,
    ],

    'theme' => [
        'primary_color' => '#0B5FFF',
        'primary_text' => '#FFFFFF',
        'app_name' => 'Postman Clone',
        'logo_url' => null,
        'favicon_url' => null,
        'default_mode' => 'system',
    ],

    'storage' => [
        'driver' => env('POSTMAN_CLONE_STORAGE', 'sqlite'),
        'connection' => null,
        'sqlite' => [
            'path' => storage_path('postman-clone/history.sqlite'),
        ],
        'table_prefix' => 'postman_clone_',
    ],

    'collections' => [
        // base_path('docs/postman/collection.postman_collection.json'),
    ],

    'environments' => [
        // 'local' => [
        //     'base_url' => 'http://localhost:8000/api/v1',
        //     'token' => env('POSTMAN_CLONE_LOCAL_TOKEN'),
        // ],
    ],

    'default_environment' => null,

    'execution' => [
        'timeout_seconds' => 30,
        'response_body_cap_mb' => 5,
        'follow_redirects' => true,
        'max_redirects' => 5,
        'verify_tls' => true,
    ],

    'history' => [
        'retain_days' => 14,
        'retain_max_rows' => 5000,
    ],
];
