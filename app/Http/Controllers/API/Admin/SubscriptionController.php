<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends Controller
{
    // Plan keys that exist in the DB (set by PaymentController)
    private const PREMIUM_PLANS  = ['premium_monthly', 'premium_yearly'];
    private const STANDARD_PLANS = ['standard_monthly', 'standard_yearly'];

    // GET /api/admin/subscriptions/stats
    public function stats(): JsonResponse
    {
        $activeCount = Subscription::where('status', 'active')
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->count();

        return response()->json([
            'active_count'    => $activeCount,
            'cancelled_count' => Subscription::where('status', 'cancelled')->count(),
            'total_revenue'   => Subscription::where('status', 'active')->sum('amount_paid'),
            'expiring_soon'   => Subscription::where('status', 'active')
                ->whereBetween('expires_at', [now(), now()->addDays(30)])
                ->count(),
            'tiers' => [
                // free = no subscription row or expired
                'free'             => \App\Models\User::whereDoesntHave('subscriptions', fn ($q) =>
                                        $q->where('status', 'active')
                                          ->where(fn ($q2) => $q2->whereNull('expires_at')->orWhere('expires_at', '>', now()))
                                      )->where('role', 'student')->count(),
                'premium_standard' => Subscription::whereIn('plan', self::STANDARD_PLANS)->where('status', 'active')->count(),
                'premium'          => Subscription::whereIn('plan', self::PREMIUM_PLANS)->where('status', 'active')->count(),
            ],
        ]);
    }

    // GET /api/admin/subscriptions
    public function index(Request $request): JsonResponse
    {
        $query = Subscription::with('user:id,first_name,last_name,email')
            ->orderByDesc('created_at');

        if ($search = $request->get('search')) {
            $query->whereHas('user', fn ($q) =>
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name',  'like', "%{$search}%")
                  ->orWhere('email',      'like', "%{$search}%")
            );
        }

        // Filter by plan group: 'standard' or 'premium'
        if ($plan = $request->get('plan')) {
            if ($plan === 'premium') {
                $query->whereIn('plan', self::PREMIUM_PLANS);
            } elseif ($plan === 'standard') {
                $query->whereIn('plan', self::STANDARD_PLANS);
            }
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        return response()->json(
            $query->paginate($request->get('per_page', 15))
        );
    }

    // GET /api/admin/subscriptions/{subscription}
    public function show(Subscription $subscription): JsonResponse
    {
        $subscription->load('user:id,first_name,last_name,email');

        return response()->json([
            'data' => array_merge($subscription->toArray(), [
                'storage_tier_label' => $subscription->storage_tier_label,
                'storage_limit_bytes'=> $subscription->storage_limit_bytes,
                'hd_enabled'         => $subscription->hd_enabled,
                'bulk_upload_limit'  => $subscription->bulk_upload_limit,
            ]),
        ]);
    }

    // PATCH /api/admin/subscriptions/{subscription}/cancel
    public function cancel(Subscription $subscription): JsonResponse
    {
        if ($subscription->status !== 'active') {
            return response()->json(['message' => 'Subscription is not active.'], 422);
        }

        $subscription->update([
            'status'     => 'cancelled',
            'expires_at' => now(),
        ]);

        $admin = auth('sanctum')->user();

        DB::table('audit_logs')->insert([
            'admin_id'   => $admin?->id,
            'user_name'  => $admin?->email ?? 'admin',
            'action'     => 'cancel_subscription',
            'details'    => "Cancelled subscription #{$subscription->id} for user #{$subscription->user_id}",
            'ip_address' => request()->ip(),
            'status'     => 'Success',
            'logged_at'  => now(),
        ]);

        return response()->json(['message' => 'Subscription cancelled.']);
    }
}