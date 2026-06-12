<?php

return [
    'api_key'      => env('PHPMAILER_API_KEY'),
    'from_address' => env('PHPMAILER_FROM_ADDRESS'),
    'from_name'    => env('PHPMAILER_FROM_NAME', 'Sinag-Bughaw'),

    // These are no longer used but harmless to keep
    'host'         => env('PHPMAILER_HOST'),
    'port'         => (int) env('PHPMAILER_PORT', 587),
    'username'     => env('PHPMAILER_USERNAME'),
    'password'     => env('PHPMAILER_PASSWORD'),
    'encryption'   => env('PHPMAILER_ENCRYPTION', 'tls'),
];