<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Photo;
use App\Models\PostMedia;
use App\Models\VoiceNote;
use App\Models\TaggedPhoto;
use App\Models\ProfileView;
use App\Models\User;
use App\Models\UserPresence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsAdminController extends Controller
{
    // ── GET /api/admin/analytics/overview ─────────────────────────────────────
    public function overview(): JsonResponse
    {
        return response()->json([
            'total_users'    => User::where('role', 'student')->count(),
            'total_views'    => ProfileView::count(),
            'views_today'    => ProfileView::whereDate('created_at', today())->count(),
            'total_messages' => Message::count(),
            'online_now'     => UserPresence::where('is_online', true)
                ->where('last_seen_at', '>=', now()->subMinutes(5))
                ->count(),
        ]);
    }

    // ── GET /api/admin/analytics/views-trend   ?days=30 ───────────────────────
    public function viewsTrend(Request $request): JsonResponse
    {
        $days = max(7, min((int) $request->get('days', 30), 90));

        $data = ProfileView::query()
            ->where('created_at', '>=', now()->subDays($days))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as value')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($row) => [
                'label' => Carbon::parse($row->date)->format('M d'),
                'value' => (int) $row->value,
            ]);

        // Fill in missing days with 0
        $filled = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date  = now()->subDays($i)->format('Y-m-d');
            $label = Carbon::parse($date)->format('M d');
            $match = $data->firstWhere('label', $label);
            $filled[] = ['label' => $label, 'value' => $match ? $match['value'] : 0];
        }

        return response()->json(['data' => $filled]);
    }

    // ── GET /api/admin/analytics/top-profiles   ?limit=10 ────────────────────
    public function topProfiles(Request $request): JsonResponse
    {
        $limit = max(1, min((int) $request->get('limit', 10), 50));

        $data = ProfileView::query()
            ->selectRaw('viewed_user_id, COUNT(*) as view_count')
            ->groupBy('viewed_user_id')
            ->orderByDesc('view_count')
            ->limit($limit)
            ->with('viewedUser:id,first_name,last_name,profile_picture,course,graduation_year')
            ->get()
            ->map(fn($row) => [
                'id'              => $row->viewed_user_id,
                'name'            => $row->viewedUser
                    ? "{$row->viewedUser->first_name} {$row->viewedUser->last_name}"
                    : 'Unknown',
                'profile_picture' => $row->viewedUser?->profile_picture,
                'course'          => $row->viewedUser?->course,
                'graduation_year' => $row->viewedUser?->graduation_year,
                'view_count'      => (int) $row->view_count,
            ]);

        return response()->json(['data' => $data]);
    }

    // ── GET /api/admin/analytics/trending   ?limit=10 ────────────────────────
    // Trending = most views in the last 7 days
    public function trending(Request $request): JsonResponse
    {
        $limit = max(1, min((int) $request->get('limit', 10), 50));

        $data = ProfileView::query()
            ->where('created_at', '>=', now()->subDays(7))
            ->selectRaw('viewed_user_id, COUNT(*) as view_count')
            ->groupBy('viewed_user_id')
            ->orderByDesc('view_count')
            ->limit($limit)
            ->get();

        $userIds = $data->pluck('viewed_user_id');
        $users   = User::whereIn('id', $userIds)
            ->get(['id', 'first_name', 'last_name', 'profile_picture', 'course', 'graduation_year'])
            ->keyBy('id');

        $result = $data->map(fn($row) => [
            'id'              => $row->viewed_user_id,
            'name'            => isset($users[$row->viewed_user_id])
                ? "{$users[$row->viewed_user_id]->first_name} {$users[$row->viewed_user_id]->last_name}"
                : 'Unknown',
            'profile_picture' => $users[$row->viewed_user_id]?->profile_picture ?? null,
            'course'          => $users[$row->viewed_user_id]?->course ?? null,
            'graduation_year' => $users[$row->viewed_user_id]?->graduation_year ?? null,
            'view_count'      => (int) $row->view_count,
        ]);

        return response()->json(['data' => $result]);
    }

    // ── GET /api/admin/analytics/engagement ──────────────────────────────────
    // Content volume breakdown across media types
    public function engagement(): JsonResponse
    {
        return response()->json([
            'photos'      => Photo::count(),
            'videos'      => PostMedia::where('resource_type', 'video')->count(),
            'voice_notes' => VoiceNote::count(),
            'messages'    => Message::count(),
            'tags'        => TaggedPhoto::count(),
        ]);
    }

    // ── GET /api/admin/analytics/presence ────────────────────────────────────
    // Recent online/offline users
    public function presence(Request $request): JsonResponse
    {
        $items = UserPresence::query()
            ->with('user:id,first_name,last_name,profile_picture')
            ->orderByDesc('is_online')
            ->orderByDesc('last_seen_at')
            ->limit(50)
            ->get()
            ->map(fn($p) => [
                'user_id'           => $p->user_id,
                'name'              => $p->user
                    ? "{$p->user->first_name} {$p->user->last_name}"
                    : 'Unknown',
                'profile_picture'   => $p->user?->profile_picture,
                'is_online'         => $p->is_online,
                'last_seen_at'      => $p->last_seen_at,
                'last_seen_at_human' => $p->last_seen_at
                    ? Carbon::parse($p->last_seen_at)->diffForHumans()
                    : null,
            ]);

        return response()->json(['data' => $items]);
    }
}