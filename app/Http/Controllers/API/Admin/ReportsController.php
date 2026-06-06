<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Photo;
use App\Models\VoiceNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ReportsController
 *
 * Single controller for all report-related endpoints.
 * The auditLogs() method in AdminController has been REMOVED
 * to avoid duplication — route it here instead:
 *
 *   Route::get('/admin/audit-logs', [ReportsController::class, 'auditLogs']);
 *   Route::prefix('admin/reports')->group(function () {
 *       Route::get('stats',       [ReportsController::class, 'stats']);
 *       Route::get('audit-logs',  [ReportsController::class, 'auditLogs']);
 *       Route::get('upload-logs', [ReportsController::class, 'uploadLogs']);
 *   });
 */
class ReportsController extends Controller
{
    // ─── GET /api/admin/reports/stats ─────────────────────────────────────────

    public function stats(): JsonResponse
    {
        return response()->json([
            'total_audit'   => AuditLog::count(),
            'total_uploads' => Photo::count(),
            'logins_today'  => AuditLog::where('action', 'login')
                                ->whereDate('logged_at', today())
                                ->count(),
        ]);
    }

    // ─── GET /api/admin/reports/audit-logs ───────────────────────────────────
    // Also aliased as GET /api/admin/audit-logs (replaces AdminController::auditLogs)
    //
    // Query params:
    //   search   — matches user_name, action, details
    //   action   — exact action string
    //   status   — Success | Failed | Warning  (case-insensitive)
    //   page     — page number (default 1)
    //   per_page — records per page (default 15)

    public function auditLogs(Request $request): JsonResponse
    {
        $query = AuditLog::orderByDesc('logged_at');

        if ($search = $request->get('search')) {
            $query->where(fn ($q) =>
                $q->where('user_name', 'like', "%{$search}%")
                  ->orWhere('action',   'like', "%{$search}%")
                  ->orWhere('details',  'like', "%{$search}%")
            );
        }

        if ($action = $request->get('action')) {
            $query->where('action', $action);
        }

        // Case-insensitive status filter — supports both "all" (from old AuditLogsPage)
        // and empty string (from ReportsPage) as "no filter"
        if ($status = $request->get('status') and strtolower($status) !== 'all') {
            $query->whereRaw('LOWER(status) = ?', [strtolower($status)]);
        }

        return response()->json(
            $query->paginate($request->integer('per_page', 15))
        );
    }

    // ─── GET /api/admin/reports/upload-logs ──────────────────────────────────
    // Merges Photo + VoiceNote into one sorted feed with manual pagination.
    //
    // Query params:
    //   type     — photo | voice
    //   search   — matches filename / uploader name
    //   page     — page number (default 1)
    //   per_page — records per page (default 15)

    public function uploadLogs(Request $request): JsonResponse
    {
        $type    = $request->get('type', '');
        $search  = $request->get('search', '');
        $perPage = $request->integer('per_page', 15);
        $page    = $request->integer('page', 1);

        $photos = collect();
        $voices = collect();

        // ── Photos ────────────────────────────────────────────────────────────
        if (! $type || $type === 'photo') {
            $photos = Photo::with('user:id,first_name,last_name')
                ->when($search, fn ($q) =>
                    $q->where('caption', 'like', "%{$search}%")
                      ->orWhereHas('user', fn ($u) =>
                          $u->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name',  'like', "%{$search}%")
                      )
                )
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($p) => [
                    'id'         => 'photo_' . $p->id,
                    'filename'   => $p->caption ?? basename($p->file_path ?? ''),
                    'uploader'   => $p->user
                                     ? "{$p->user->first_name} {$p->user->last_name}"
                                     : 'Unknown',
                    'type'       => 'photo',
                    'file_size'  => null, // TODO: add file_size column to photos table
                    'status'     => $p->status ?? 'pending',
                    'created_at' => $p->created_at?->toISOString(),
                ]);
        }

        // ── Voice Notes ───────────────────────────────────────────────────────
        if (! $type || $type === 'voice') {
            $voices = VoiceNote::with('sender:id,first_name,last_name')
                ->when($search, fn ($q) =>
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhereHas('sender', fn ($u) =>
                          $u->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name',  'like', "%{$search}%")
                      )
                )
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($v) => [
                    'id'         => 'voice_' . $v->id,
                    'filename'   => $v->title ?? 'Voice Note',
                    'uploader'   => $v->sender
                                     ? "{$v->sender->first_name} {$v->sender->last_name}"
                                     : 'Unknown',
                    'type'       => 'voice',
                    'file_size'  => null,
                    'status'     => $v->status,
                    'created_at' => $v->created_at?->toISOString(),
                ]);
        }

        // ── Merge, sort, paginate in memory ───────────────────────────────────
        $merged   = $photos->merge($voices)->sortByDesc('created_at')->values();
        $total    = $merged->count();
        $lastPage = (int) ceil($total / $perPage);

        return response()->json([
            'data' => $merged->forPage($page, $perPage)->values(),
            'meta' => [
                'current_page' => $page,
                'last_page'    => max(1, $lastPage),
                'per_page'     => $perPage,
                'total'        => $total,
                'from'         => $total ? ($page - 1) * $perPage + 1 : 0,
                'to'           => min($page * $perPage, $total),
            ],
        ]);
    }

    // ─── GET /api/admin/reports/login-history ────────────────────────────────
    // Kept as a dedicated endpoint for future login-specific reporting.

    public function loginHistory(Request $request): JsonResponse
    {
        $query = AuditLog::where('action', 'login')
            ->orderByDesc('logged_at');

        if ($search = $request->get('search')) {
            $query->where('user_name', 'like', "%{$search}%");
        }

        return response()->json(
            $query->paginate($request->integer('per_page', 15))
        );
    }

    public function aiLogs(Request $request): JsonResponse
    {
        $search = $request->get('search');

        $query = AuditLog::query()
            ->where(function ($q) {
                $q->where('action', 'like', '%AI%')
                  ->orWhere('action', 'like', '%Face%')
                  ->orWhere('action', 'like', '%Transcript%')
                  ->orWhere('details', 'like', '%AI%')
                  ->orWhere('details', 'like', '%face%')
                  ->orWhere('details', 'like', '%transcript%');
            })
            ->when($search, function ($q, string $term) {
                $q->where(function ($inner) use ($term) {
                    $inner->where('user_name', 'like', "%{$term}%")
                        ->orWhere('action', 'like', "%{$term}%")
                        ->orWhere('details', 'like', "%{$term}%")
                        ->orWhere('subject_name', 'like', "%{$term}%");
                });
            })
            ->orderByDesc('logged_at');

        return response()->json(
            $query->paginate($request->integer('per_page', 15))
        );
    }
}
