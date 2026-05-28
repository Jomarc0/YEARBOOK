<?php

namespace App\Services\Analytics;

use App\Models\User;
use App\Models\ProfileView;
use Illuminate\Support\Facades\DB;

class EngagementAnalyticsService
{
    public function summary(): array
    {
        return [
            'total_students' => User::where('role', 'student')->count(),
            'total_photos'   => DB::table('photos')->count(),
            'total_messages' => DB::table('messages')->count(),
            'total_tagged'   => DB::table('tagged_photos')->where('status', 'approved')->count(),
        ];
    }

    public function myStats(User $user): array
    {
        return [
            'profile_views'     => $user->profile_views,
            'photos_uploaded'   => $user->photos()->count(),
            'times_tagged'      => $user->taggedPhotos()->where('status', 'approved')->count(),
            'messages_sent'     => DB::table('messages')->where('sender_id', $user->id)->count(),
            'messages_received' => DB::table('messages')->where('receiver_id', $user->id)->count(),
        ];
    }

    public function batchmateStats(User $user): array
    {
        $topProfiles = User::where('batch_id', $user->batch_id)
            ->where('role', 'student')
            ->where('profile_visibility', 'public')
            ->where('id', '!=', $user->id)
            ->orderByDesc('profile_views')
            ->take(5)
            ->get(['id', 'name', 'profile_picture', 'course', 'profile_views'])
            ->map(fn($u) => [
                'id'              => $u->id,
                'name'            => $u->name,
                'profile_picture' => $u->profile_picture,
                'course'          => $u->course,
                'views'           => $u->profile_views,
            ]);

        return [
            'batch_id'     => $user->batch_id,
            'top_profiles' => $topProfiles,
        ];
    }

    public function topViewed(int $limit = 10): array
    {
        return User::where('role', 'student')
            ->where('profile_visibility', 'public')
            ->orderByDesc('profile_views')
            ->take($limit)
            ->get(['id', 'name', 'profile_picture', 'course', 'batch', 'graduation_year', 'profile_views'])
            ->map(fn($u) => [
                'id'              => $u->id,
                'name'            => $u->name,
                'profile_picture' => $u->profile_picture,
                'course'          => $u->course,
                'batch'           => $u->batch,
                'graduation_year' => $u->graduation_year,
                'views'           => $u->profile_views,
            ])
            ->toArray();
    }

    public function trending(int $limit = 10): array
    {
        return DB::table('profile_views')
            ->select(
                'viewed_user_id as id',
                DB::raw('COUNT(*) as views_this_week'),
                'users.name',
                'users.profile_picture',
                'users.course',
                'users.batch',
                'users.graduation_year',
                'users.profile_views as total_views'
            )
            ->join('users', 'users.id', '=', 'profile_views.viewed_user_id')
            ->where('profile_views.created_at', '>=', now()->subDays(7))
            ->where('users.profile_visibility', 'public')
            ->where('users.role', 'student')
            ->groupBy(
                'viewed_user_id',
                'users.name',
                'users.profile_picture',
                'users.course',
                'users.batch',
                'users.graduation_year',
                'users.profile_views'
            )
            ->orderByDesc('views_this_week')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    // ── Core record logic ─────────────────────────────────────────────────────
    public function recordView(int $viewedUserId, ?int $viewerUserId, string $ipAddress): void
    {
        // Skip self-views
        if ($viewerUserId && $viewerUserId === $viewedUserId) {
            return;
        }

        // Dedup: same viewer + same profile within 1 hour = skip
        $alreadyViewed = ProfileView::where('viewed_user_id', $viewedUserId)
            ->where(function ($q) use ($viewerUserId, $ipAddress) {
                if ($viewerUserId) {
                    $q->where('viewer_user_id', $viewerUserId);
                } else {
                    $q->whereNull('viewer_user_id')->where('viewer_ip', $ipAddress);
                }
            })
            ->where('created_at', '>=', now()->subHour())
            ->exists();

        if ($alreadyViewed) {
            return;
        }

        ProfileView::create([
            'viewed_user_id' => $viewedUserId,
            'viewer_user_id' => $viewerUserId,
            'viewer_ip'      => $ipAddress,
        ]);

        // Increment denormalized counter
        User::where('id', $viewedUserId)->increment('profile_views');
    }

    public function weeklyTrend(int $userId, int $days = 30): array
    {
        $rows = ProfileView::where('viewed_user_id', $userId)
            ->where('created_at', '>=', now()->subDays($days))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as views')
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('views', 'date')
            ->toArray();

        // Fill in missing days with 0 for a continuous x-axis
        $filled = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date          = now()->subDays($i)->toDateString();
            $filled[$date] = $rows[$date] ?? 0;
        }

        return $filled;
    }

    public function platformEngagement(): array
    {
        return [
            'views_today'          => ProfileView::whereDate('created_at', today())->count(),
            'views_this_week'      => ProfileView::where('created_at', '>=', now()->subDays(7))->count(),
            'views_this_month'     => ProfileView::where('created_at', '>=', now()->subDays(30))->count(),
            'unique_viewers_today' => ProfileView::whereDate('created_at', today())
                                        ->whereNotNull('viewer_user_id')
                                        ->distinct('viewer_user_id')
                                        ->count('viewer_user_id'),
        ];
    }
}