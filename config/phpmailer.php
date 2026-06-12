<?php

return [
    'host'         => env('PHPMAILER_HOST',       'smtp.gmail.com'),
    'port'         => (int) env('PHPMAILER_PORT',  587),
    'username'     => env('PHPMAILER_USERNAME'),
    'password'     => env('PHPMAILER_PASSWORD'),
    'encryption'   => env('PHPMAILER_ENCRYPTION', 'tls'),
    'from_address' => env('PHPMAILER_FROM_ADDRESS'),
    'from_name'    => env('PHPMAILER_FROM_NAME',  'Sinag-Bughaw'),
];