<?php

return [
    'api_key' => env('BREVO_API_KEY'),
    'from_address' => env('BREVO_FROM_ADDRESS', 'noreply@nu-lipa.edu.ph'),
    'from_name' => env('BREVO_FROM_NAME', 'Sinag-Bughaw'),
];
