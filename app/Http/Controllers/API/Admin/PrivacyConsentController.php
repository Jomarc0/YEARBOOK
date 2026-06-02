<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Consent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrivacyConsentController extends Controller
{
    // GET /api/admin/privacy/stats
    public function stats(): JsonResponse
    {
        return response()->json([
            'total_consents'   => Consent::count(),
            'privacy_accepted' => Consent::where('type', 'privacy_policy')->where('accepted', true)->count(),
            'declined'         => Consent::where('accepted', false)->count(),
            'audit_today'      => AuditLog::whereDate('logged_at', today())->count(),
        ]);
    }

    // GET /api/admin/privacy/consents
    public function consents(Request $request): JsonResponse
    {
        $query = Consent::with('user:id,first_name,last_name,email')
            ->orderByDesc('accepted_at');

        if ($search = $request->get('search')) {
            $query->whereHas('user', fn ($q) =>
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name',  'like', "%{$search}%")
                  ->orWhere('email',      'like', "%{$search}%")
            );
        }

        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        if ($request->has('accepted')) {
            $query->where('accepted', (bool) $request->get('accepted'));
        }

        return response()->json(
            $query->paginate($request->get('per_page', 15))
        );
    }

    // GET /api/admin/privacy/audit-logs
    public function auditLogs(Request $request): JsonResponse
    {
        $query = AuditLog::orderByDesc('logged_at');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('user_name', 'like', "%{$search}%")
                  ->orWhere('action',  'like', "%{$search}%")
                  ->orWhere('details', 'like', "%{$search}%");
            });
        }

        if ($action = $request->get('action')) {
            $query->where('action', $action);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        return response()->json(
            $query->paginate($request->get('per_page', 15))
        );
    }
}