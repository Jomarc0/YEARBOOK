<?php

return [
    'paths' => [
        'api/*',
        'broadcasting/auth',
        'sanctum/csrf-cookie',
        'auth/*',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(array_merge(
        [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
        ],
        array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', '')))
    )),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];