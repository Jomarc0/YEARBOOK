<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    // GET /api/admin/settings
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Setting::pluck('value', 'key'),
        ]);
    }

    // POST /api/admin/settings
    public function save(Request $request): JsonResponse
    {
        $allowed = [
            'site_name', 'site_tagline', 'contact_email',
            'maintenance_mode', 'allow_registration', 'require_email_verification',
            'max_upload_size_mb', 'allowed_file_types',
            'storage_limit_free_mb', 'storage_limit_premium_mb',
            'enable_ai_recognition', 'enable_voice_notes',
            'enable_subscriptions', 'enable_yearbook_flipbook',
            'ai_confidence_threshold', 'session_lifetime_minutes', 'max_login_attempts',
        ];

        foreach ($request->only($allowed) as $key => $value) {
            Setting::putValue($key, $value);
        }

        $this->logAction('settings_update', 'Admin updated system settings.');

        return response()->json(['message' => 'Settings saved successfully.']);
    }

    // DELETE /api/admin/settings/clear-audit-logs
    public function clearAuditLogs(): JsonResponse
    {
        AuditLog::truncate();
        return response()->json(['message' => 'Audit logs cleared.']);
    }

    // POST /api/admin/settings/reset
    public function reset(): JsonResponse
    {
        $defaults = [
            'site_name'                  => 'Sinag-Bughaw Digital Yearbook',
            'site_tagline'               => 'NU Lipa College of Computing and Information Technology',
            'contact_email'              => '',
            'maintenance_mode'           => '0',
            'allow_registration'         => '1',
            'require_email_verification' => '1',
            'max_upload_size_mb'         => '10',
            'allowed_file_types'         => 'jpg,jpeg,png,mp4,mp3,pdf',
            'storage_limit_free_mb'      => '500',
            'storage_limit_premium_mb'   => '5120',
            'enable_ai_recognition'      => '1',
            'enable_voice_notes'         => '1',
            'enable_subscriptions'       => '1',
            'enable_yearbook_flipbook'   => '1',
            'ai_confidence_threshold'    => '80',
            'session_lifetime_minutes'   => '120',
            'max_login_attempts'         => '5',
        ];

        foreach ($defaults as $key => $value) {
            Setting::putValue($key, $value);
        }

        $this->logAction('settings_reset', 'Admin reset all settings to defaults.');

        return response()->json(['message' => 'Settings reset to defaults.']);
    }

    private function logAction(string $action, string $details): void
    {
        $admin = auth('sanctum')->user();
        AuditLog::create([
            'admin_id'   => $admin?->id,
            'user_name'  => $admin?->username ?? 'admin',
            'action'     => $action,
            'details'    => $details,
            'ip_address' => request()->ip(),
            'status'     => 'Success',
            'logged_at'  => now(),
        ]);
    }
}