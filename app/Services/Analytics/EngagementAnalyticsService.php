<?php

namespace App\Services\Analytics;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class EngagementAnalyticsService
{
    /**
     * Summary stats shown on the analytics dashboard (/analytics/summary).
     * Already called by AnalyticsController — just filling this in.
     */
    public function summary(): array
    {
        return [
            'total_students'  => User::where('role', 'student')->count(),
            'total_photos'    => DB::table('photos')->count(),
            'total_messages'  => DB::table('messages')->count(),
            'total_tagged'    => DB::table('tagged_photos')->where('status', 'approved')->count(),
        ];
    }

    /**
     * Stats for the logged-in user (/analytics/my-stats).
     */
    public function myStats(User $user): array
    {
        return [
            'profile_views'    => $user->profile_views,
            'photos_uploaded'  => $user->photos()->count(),
            'times_tagged'     => $user->taggedPhotos()->where('status', 'approved')->count(),
            'messages_sent'    => DB::table('messages')->where('sender_id', $user->id)->count(),
            'messages_received'=> DB::table('messages')->where('receiver_id', $user->id)->count(),
        ];
    }

    /**
     * Batchmate engagement stats (/analytics/batchmates).
     */
    public function batchmateStats(User $user): array
    {
        $batchId = $user->batch_id;

        $topProfiles = User::where('batch_id', $batchId)
            ->where('role', 'student')
            ->where('profile_visibility', 'public')
            ->where('id', '!=', $user->id)
            ->orderByDesc('profile_views')
            ->take(5)
            ->get(['id', 'name', 'profile_picture', 'course', 'profile_views'])
            ->map(fn ($u) => [
                'id'              => $u->id,
                'name'            => $u->name,
                'profile_picture' => $u->profile_picture,
                'course'          => $u->course,
                'views'           => $u->profile_views,
            ]);

        return [
            'batch_id'     => $batchId,
            'top_profiles' => $topProfiles,
        ];
    }

    /**
     * Top-viewed alumni across the whole platform (public route).
     * Used by MemoryRecommenderService card 5.
     */
    public function topViewed(int $limit = 10): array
    {
        return User::where('role', 'student')
            ->where('profile_visibility', 'public')
            ->orderByDesc('profile_views')
            ->take($limit)
            ->get(['id', 'name', 'profile_picture', 'course', 'batch', 'graduation_year', 'profile_views'])
            ->map(fn ($u) => [
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
}