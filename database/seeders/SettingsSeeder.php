<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'school_name'                      => 'National University - Lipa',
            'yearbook_name'                    => 'Sinag-Bughaw Digital Yearbook',
            'contact_email'                    => '',
            'maintenance_mode'                 => '0',
            'academic_year'                    => '2025-2026',
            'graduation_batch'                 => '',
            'graduation_date'                  => '',
            'graduation_theme'                 => '',
            'publish_yearbook'                 => '0',
            'max_upload_size_mb'               => '10',
            'allowed_file_types'               => 'jpg,jpeg,png,mp4,mp3,pdf',
            'allow_student_posts'              => '1',
            'allow_comments'                   => '1',
            'allow_reactions'                  => '1',
            'enable_premium_subscription'      => '1',
            'premium_storage_limit_mb'         => '5120',
            'premium_badge_display'            => '1',
            'enable_flipbook_viewer'           => '1',
            'enable_yearbook_pdf_download'     => '1',
            'enable_student_directory_search'  => '1',
            'session_timeout_minutes'          => '120',
            'max_login_attempts'               => '5',
            'auto_backup_database'             => '0',
            'audit_logs_enabled'               => '1',
        ];

        foreach ($defaults as $key => $value) {
            Setting::query()->firstOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }
}
