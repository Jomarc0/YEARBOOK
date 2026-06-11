<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Photo;
use App\Models\VoiceNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class ReportsController extends Controller
{
    // GET /api/admin/reports/stats 

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

    // GET /api/admin/reports/audit-logs

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

        if ($status = $request->get('status') and strtolower($status) !== 'all') {
            $query->whereRaw('LOWER(status) = ?', [strtolower($status)]);
        }

        return response()->json(
            $query->paginate($request->integer('per_page', 15))
        );
    }

    // GET /api/admin/reports/upload-logs
    public function uploadLogs(Request $request): JsonResponse
    {
        $type    = $request->get('type', '');
        $search  = $request->get('search', '');
        $perPage = $request->integer('per_page', 15);
        $page    = $request->integer('page', 1);

        $photos = collect();
        $voices = collect();

        // Photos 
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

        // Voice Notes 
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

        // Merge, sort, paginate in memory
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

    // GET /api/admin/reports/login-history 
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
