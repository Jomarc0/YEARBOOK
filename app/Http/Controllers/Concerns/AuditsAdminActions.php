<?php

namespace App\Http\Controllers\Concerns;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;

trait AuditsAdminActions
{
    protected function audit(
        string  $action,
        string  $details,
        string  $status = AuditLog::STATUS_SUCCESS,
        ?string $note   = null,
        ?int    $subjectId   = null,
        ?string $subjectName = null,
    ): void {
        try {
            $request = request();
            $user    = $request->user();

            AuditLog::create([
                'admin_id'     => $user?->id,
                'user_name'    => $this->resolveAdminName($user),
                'action'       => $action,
                'details'      => $details,
                'note'         => $note,
                'ip_address'   => $request->ip() ?? '127.0.0.1',
                'status'       => $status,
                'logged_at'    => now(),
                'subject_id'   => $subjectId,
                'subject_name' => $subjectName,
                'created_by'   => $user?->id,
            ]);
        } catch (\Throwable $e) {
            Log::warning("[Audit] Failed to write audit log: {$e->getMessage()}");
        }
    }

    private function resolveAdminName(?object $user): string
    {
        if (! $user) return 'system';
        if (isset($user->username))   return $user->username;
        if (isset($user->first_name)) return trim("{$user->first_name} {$user->last_name}");
        return $user->email ?? 'admin';
    }
}