<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\AuditLog;
use App\Models\Setting;
use Carbon\Carbon;

/**
 * AdminController
 *
 * Handles: dashboard, settings, and student management.
 *
 * NOTE: auditLogs() has been REMOVED from here.
 *       Route /api/admin/audit-logs now points to ReportsController::auditLogs()
 *       so all audit logic lives in one place.
 */
class AdminController extends Controller
{
    // ─── GET /api/admin/dashboard ─────────────────────────────────────────────

    public function dashboard(Request $request): JsonResponse
    {
        $totalStudents       = DB::table('users')->where('role', 'student')->count();
        $facultyMembers      = DB::table('users')->where('role', 'faculty')->count();
        $galleryPhotos       = DB::table('photos')->count();

        // System alerts: audit log failures today
        $alertCount = DB::table('audit_logs')
            ->where('status', 'Failed')
            ->whereDate('created_at', today())
            ->count();

        $activeSubscriptions = DB::table('subscriptions')
            ->where('status', 'active')
            ->where(fn ($q) =>
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now())
            )
            ->count();

        // TODO: swap 0 for real sum once file_size column is added to photos
        $storageUsedGB = 0;

        $metrics = [
            'total_students'       => $totalStudents,
            'faculty_members'      => $facultyMembers,
            'gallery_photos'       => $galleryPhotos,
            'system_alerts'        => $alertCount,
            'active_subscriptions' => $activeSubscriptions,
            'storage_used_gb'      => $storageUsedGB,
            'storage_total_gb'     => config('storage.limit_gb', 100),
            'ai_processed_today'   => 0,
        ];

        // ── Enrollment by Year ────────────────────────────────────────────────
        $enrollmentByYear = DB::table('users')
            ->where('role', 'student')
            ->whereNotNull('graduation_year')
            ->selectRaw('graduation_year as year, COUNT(*) as total')
            ->groupBy('graduation_year')
            ->orderBy('graduation_year')
            ->get();

        // ── Recent Activity ───────────────────────────────────────────────────
        $recentActivity = DB::table('audit_logs')
            ->orderByDesc('logged_at')
            ->limit(10)
            ->get()
            ->map(fn ($log) => [
                'id'      => $log->id,
                'type'    => $this->mapActionToType($log->action),
                'title'   => $log->action,
                'subject' => $log->user_name ?? 'System',
                'time'    => Carbon::parse($log->logged_at)->diffForHumans(),
            ]);

        // ── Recent Uploads ────────────────────────────────────────────────────
        $recentUploads = DB::table('photos')
            ->join('users', 'photos.user_id', '=', 'users.id')
            ->selectRaw("
                photos.id,
                SUBSTRING_INDEX(photos.file_path, '/', -1) AS filename,
                CONCAT(users.first_name, ' ', users.last_name) AS uploader,
                'image' AS type,
                photos.created_at
            ")
            ->orderByDesc('photos.created_at')
            ->limit(8)
            ->get()
            ->map(fn ($u) => [
                'id'       => $u->id,
                'filename' => $u->filename,
                'uploader' => $u->uploader,
                'type'     => $u->type,
                'time'     => Carbon::parse($u->created_at)->diffForHumans(),
            ]);

        // ── Trending Alumni ───────────────────────────────────────────────────
        $trendingAlumni = DB::table('users')
            ->where('role', 'student')
            ->whereNotNull('profile_views')
            ->where('profile_views', '>', 0)
            ->selectRaw("
                id,
                CONCAT(first_name, ' ', last_name) AS name,
                course AS program,
                profile_views AS views,
                UPPER(CONCAT(LEFT(first_name, 1), LEFT(last_name, 1))) AS avatar_initials
            ")
            ->orderByDesc('profile_views')
            ->limit(5)
            ->get();

        // ── Engagement ────────────────────────────────────────────────────────
        $engagement = [
            'weekly_visits' => DB::table('audit_logs')
                ->where('logged_at', '>=', now()->subDays(7))
                ->count(),

            'returning_alumni' => DB::table('personal_access_tokens')
                ->join('users', 'personal_access_tokens.tokenable_id', '=', 'users.id')
                ->where('users.role', 'student')
                ->where('personal_access_tokens.last_used_at', '>=', now()->subDays(7))
                ->distinct('users.id')
                ->count('users.id'),

            'new_registrations' => DB::table('users')
                ->where('role', 'student')
                ->where('created_at', '>=', now()->subDays(7))
                ->count(),
        ];

        return response()->json([
            'metrics'            => $metrics,
            'enrollment_by_year' => $enrollmentByYear,
            'recent_activity'    => $recentActivity,
            'recent_uploads'     => $recentUploads,
            'trending_alumni'    => $trendingAlumni,
            'engagement'         => $engagement,
        ]);
    }

    // ─── GET /api/admin/settings ─────────────────────────────────────────────

    public function getSettings(): JsonResponse
    {
        return response()->json(['data' => Setting::pluck('value', 'key')]);
    }

    // ─── POST /api/admin/settings ────────────────────────────────────────────

    public function saveSettings(Request $request): JsonResponse
    {
        foreach ($request->all() as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }
        return response()->json(['message' => 'Settings saved.']);
    }

    // ─── DELETE /api/admin/students/{id} ─────────────────────────────────────

    public function deleteStudent(int $id): JsonResponse
    {
        $deleted = DB::table('users')
            ->where('id', $id)
            ->where('role', 'student')
            ->delete();

        return $deleted
            ? response()->json(['message' => 'Student deleted.'])
            : response()->json(['message' => 'Student not found.'], 404);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function mapActionToType(string $action): string
    {
        $action = strtolower($action);

        return match(true) {
            str_contains($action, 'register') || str_contains($action, 'created') => 'register',
            str_contains($action, 'upload')                                        => 'upload',
            str_contains($action, 'update')  || str_contains($action, 'edit')     => 'update',
            str_contains($action, 'delete')  || str_contains($action, 'removed')  => 'delete',
            str_contains($action, 'setting')                                       => 'settings',
            str_contains($action, 'login')   || str_contains($action, 'logout')   => 'login',
            default                                                                => 'default',
        };
    }
}