<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLog extends Model
{
    // ── Auth ──────────────────────────────────────────────────────────────────
    const ACTION_LOGIN           = 'Login';
    const ACTION_LOGOUT          = 'Logout';
    const ACTION_LOGIN_FAILED    = 'Login Failed';
    const ACTION_PASSWORD_RESET  = 'Password Reset';

    // ── Albums ────────────────────────────────────────────────────────────────
    const ACTION_ALBUM_CREATED   = 'Album Created';
    const ACTION_ALBUM_UPDATED   = 'Album Updated';
    const ACTION_ALBUM_DELETED   = 'Album Deleted';

    // ── Photos ────────────────────────────────────────────────────────────────
    const ACTION_PHOTO_UPLOADED  = 'Photo Uploaded';
    const ACTION_PHOTO_DELETED   = 'Photo Deleted';
    const ACTION_PHOTO_APPROVED  = 'Photo Approved';
    const ACTION_PHOTO_REJECTED  = 'Photo Rejected';
    const ACTION_PHOTO_REVERTED  = 'Photo Reverted';

    // ── Videos ────────────────────────────────────────────────────────────────
    const ACTION_VIDEO_UPLOADED  = 'Video Uploaded';
    const ACTION_VIDEO_DELETED   = 'Video Deleted';
    const ACTION_VIDEO_APPROVED  = 'Video Approved';
    const ACTION_VIDEO_REJECTED  = 'Video Rejected';
    const ACTION_VIDEO_REVERTED  = 'Video Reverted';

    // ── Users / Students / Faculty ────────────────────────────────────────────
    const ACTION_USER_CREATED      = 'User Created';
    const ACTION_USER_UPDATED      = 'User Updated';
    const ACTION_USER_DELETED      = 'User Deleted';
    const ACTION_PROFILE_UPDATED   = 'Profile Updated';
    const ACTION_FACULTY_ADDED     = 'Faculty Added';
    const ACTION_FACULTY_REMOVED   = 'Faculty Removed';
    const ACTION_STUDENT_DELETED   = 'Student Deleted';

    // ── Settings ──────────────────────────────────────────────────────────────
    const ACTION_SETTINGS_UPDATED  = 'Settings Updated';

    // ── Moderation ────────────────────────────────────────────────────────────
    const ACTION_APPROVED          = 'approved';
    const ACTION_REJECTED          = 'rejected';
    const ACTION_REVERTED          = 'reverted';

    // ── Statuses ──────────────────────────────────────────────────────────────
    const STATUS_SUCCESS           = 'Success';
    const STATUS_WARNING           = 'Warning';
    const STATUS_FAILED            = 'Failed';
    const STATUS_CRITICAL          = 'Critical';

    // ─────────────────────────────────────────────────────────────────────────

    protected $fillable = [
        'admin_id',
        'user_name',
        'action',
        'details',
        'ip_address',
        'status',
        'logged_at',
        'subject_id',
        'subject_name',
        'reason',
        'note',
        'severity',
        'created_by',
    ];

    protected $casts = [
        'logged_at' => 'datetime',
    ];

    /**
     * Quick log from a controller with a Request object.
     * Used by other parts of the app (non-moderation).
     *
     * Example:
     *   AuditLog::record($request, AuditLog::ACTION_LOGIN, 'Successful login from Chrome/Windows');
     *   AuditLog::record($request, AuditLog::ACTION_LOGIN_FAILED, 'Invalid credentials', AuditLog::STATUS_CRITICAL);
     */
    public static function record(
        Request $request,
        string  $action,
        string  $details,
        string  $status = self::STATUS_SUCCESS
    ): self {
        $user    = $request->user();
        $adminId = ($user?->role === 'admin') ? $user->id : null;

        return self::create([
            'admin_id'   => $adminId,
            'user_name'  => $user?->email ?? 'system',
            'action'     => $action,
            'details'    => $details,
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'status'     => $status,
            'logged_at'  => now(),
        ]);
    }

    /**
     * Log a moderation action (approve / reject).
     * Used by MediaModerationController::log()
     *
     * Example:
     *   AuditLog::moderation('photo', $photo->id, AuditLog::ACTION_APPROVED, $admin, 'Looks good');
     */
    public static function moderation(
        string  $type,
        int     $id,
        string  $action,
        ?object $admin  = null,
        ?string $reason = null
    ): self {
        return self::create([
            'admin_id'     => $admin?->id,
            'user_name'    => $admin ? "{$admin->first_name} {$admin->last_name}" : 'system',
            'action'       => $action,
            'details'      => "Admin {$action} {$type} #{$id}" . ($reason ? ": {$reason}" : ''),
            'subject_id'   => $id,
            'subject_name' => "{$type}#{$id}",
            'reason'       => $reason,
            'severity'     => 'info',
            'status'       => self::STATUS_SUCCESS,
            'logged_at'    => now(),
            'created_by'   => $admin?->id,
        ]);
    }

    /**
     * Log a revert action.
     * Used by MediaModerationController::logRevert()
     *
     * Example:
     *   AuditLog::revert('photo', $photo->id, 'approved', 'pending', $admin, 'Wrong photo');
     */
    public static function revert(
        string  $type,
        int     $id,
        string  $from,
        string  $to,
        ?object $admin = null,
        ?string $note  = null
    ): self {
        return self::create([
            'admin_id'     => $admin?->id,
            'user_name'    => $admin ? "{$admin->first_name} {$admin->last_name}" : 'system',
            'action'       => self::ACTION_REVERTED,
            'details'      => "Admin reverted {$type} #{$id}: {$from}→{$to}",
            'subject_id'   => $id,
            'subject_name' => "{$type}#{$id}",
            'note'         => $note,
            'severity'     => 'info',
            'status'       => self::STATUS_SUCCESS,
            'logged_at'    => now(),
            'created_by'   => $admin?->id,
        ]);
    }
}