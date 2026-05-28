<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Cloudinary Credentials
    |--------------------------------------------------------------------------
    | Pulled exclusively from environment variables. Never hardcode these.
    */

    'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
    'api_key'    => env('CLOUDINARY_API_KEY'),
    'api_secret' => env('CLOUDINARY_API_SECRET'),
    'url'        => env('CLOUDINARY_URL'),

    /*
    |--------------------------------------------------------------------------
    | Signed URL TTL (seconds)
    |--------------------------------------------------------------------------
    */

    'signed_url_ttl' => env('CLOUDINARY_SIGNED_URL_TTL', 3600),

    /*
    |--------------------------------------------------------------------------
    | Subscription Storage Tiers
    |--------------------------------------------------------------------------
    | storage_limit_bytes  — max cumulative storage per user
    | max_file_size_bytes  — max single file size
    | max_video_size_bytes — max single video size
    | hd_enabled           — whether HD (original quality) uploads are allowed
    | bulk_upload_limit    — max files per bulk upload request
    | allowed_mime_types   — accepted MIME types for this tier
    */

    'tiers' => [

        'free' => [
            'storage_limit_bytes'  => 500 * 1024 * 1024,       // 500 MB
            'max_file_size_bytes'  => 5  * 1024 * 1024,        // 5 MB per photo
            'max_video_size_bytes' => 50 * 1024 * 1024,        // 50 MB per video
            'hd_enabled'           => false,
            'bulk_upload_limit'    => 5,
            'folder_prefix'        => 'free',
            'allowed_mime_types'   => [
                // Images
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/heic',
                'image/gif',
                // Videos
                'video/mp4',
                'video/quicktime',
                'video/x-msvideo',
                'video/webm',
                'video/avi',
                // Audio
                'audio/mpeg',
                'audio/mp3',
                'audio/wav',
                'audio/x-wav',
                'audio/x-m4a',
                'audio/mp4',
                'audio/ogg',
                'audio/flac',
                'audio/webm',
                'audio/x-flac',
                // Documents
                'application/pdf',
            ],
            // Applied Cloudinary transformations for free uploads (compressed)
            'transformations' => [
                [
                    'quality'      => 'auto:low',
                    'fetch_format' => 'auto',
                    'width'        => 1280,
                    'height'       => 1280,
                    'crop'         => 'limit',
                ],
            ],
        ],

        // plan=premium, tier=standard
        // Mid-tier: HD enabled, moderate limits, no 4K video
        'premium_standard' => [
            'storage_limit_bytes'  => 5 * 1024 * 1024 * 1024,  // 5 GB
            'max_file_size_bytes'  => 20 * 1024 * 1024,         // 20 MB per photo
            'max_video_size_bytes' => 500 * 1024 * 1024,        // 500 MB per video
            'hd_enabled'           => true,
            'bulk_upload_limit'    => 20,
            'folder_prefix'        => 'premium_standard',
            'allowed_mime_types'   => [
                // Images
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/heic',
                'image/gif',
                'image/tiff',
                // Videos
                'video/mp4',
                'video/quicktime',
                'video/x-msvideo',
                'video/webm',
                'video/avi',
                // Audio
                'audio/mpeg',
                'audio/mp3',
                'audio/wav',
                'audio/x-wav',
                'audio/x-m4a',
                'audio/mp4',
                'audio/ogg',
                'audio/flac',
                'audio/webm',
                'audio/x-flac',
                // Documents
                'application/pdf',
            ],
            'transformations' => [
                [
                    'quality'      => 'auto:good',
                    'fetch_format' => 'auto',
                    'width'        => 2560,
                    'height'       => 2560,
                    'crop'         => 'limit',
                ],
            ],
        ],

        // plan=premium, tier=premium
        // Top-tier: full HD, no resize, best quality, bulk 50 files
        'premium' => [
            'storage_limit_bytes'  => 10 * 1024 * 1024 * 1024, // 10 GB
            'max_file_size_bytes'  => 50 * 1024 * 1024,         // 50 MB per photo
            'max_video_size_bytes' => 2  * 1024 * 1024 * 1024,  // 2 GB per video
            'hd_enabled'           => true,
            'bulk_upload_limit'    => 50,
            'folder_prefix'        => 'premium',
            'allowed_mime_types'   => [
                // Images
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/heic',
                'image/gif',
                'image/tiff',
                // Videos
                'video/mp4',
                'video/quicktime',
                'video/x-msvideo',
                'video/webm',
                'video/avi',
                // Audio
                'audio/mpeg',
                'audio/mp3',
                'audio/wav',
                'audio/x-wav',
                'audio/x-m4a',
                'audio/mp4',
                'audio/ogg',
                'audio/flac',
                'audio/webm',
                'audio/x-flac',
                // Documents
                'application/pdf',
            ],
            // HD uploads: no forced resize, best quality
            'transformations' => [
                [
                    'quality'      => 'auto:best',
                    'fetch_format' => 'auto',
                ],
            ],
        ],

    ],

];