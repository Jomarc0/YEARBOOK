<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Support\PlatformSettings;
use Illuminate\Http\JsonResponse;

class AppConfigController extends Controller
{
    /**
     * GET /api/app-config
     */
    public function show(): JsonResponse
    {
        $config = PlatformSettings::publicConfig();

        return response()->json([
            'data' => array_merge($config, [
                'features' => [
                    'maintenance_mode'                => PlatformSettings::bool('maintenance_mode'),
                    'publish_yearbook'                => PlatformSettings::bool('publish_yearbook'),
                    'allow_student_posts'             => PlatformSettings::bool('allow_student_posts'),
                    'allow_comments'                  => PlatformSettings::bool('allow_comments'),
                    'allow_reactions'                 => PlatformSettings::bool('allow_reactions'),
                    'enable_premium_subscription'     => PlatformSettings::bool('enable_premium_subscription'),
                    'premium_badge_display'           => PlatformSettings::bool('premium_badge_display'),
                    'enable_flipbook_viewer'          => PlatformSettings::bool('enable_flipbook_viewer'),
                    'enable_yearbook_pdf_download'    => PlatformSettings::bool('enable_yearbook_pdf_download'),
                    'enable_student_directory_search' => PlatformSettings::bool('enable_student_directory_search'),
                ],
                'upload' => [
                    'max_upload_size_mb' => (int) PlatformSettings::get('max_upload_size_mb'),
                    'allowed_file_types' => PlatformSettings::get('allowed_file_types'),
                ],
            ]),
        ]);
    }
}
