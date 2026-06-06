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

        $filled = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date  = now()->subDays($i)->format('Y-m-d');
            $label = Carbon::parse($date)->format('M d');
            $match = $data->firstWhere('label', $label);
            $filled[] = ['label' => $label, 'value' => $match ? $match['value'] : 0];
        }

        return response()->json(['data' => $filled]);
    }

    public function topProfiles(Request $request): JsonResponse
    {
        $limit = max(1, min((int) $request->get('limit', 10), 50));

        $data = ProfileView::query()
            ->selectRaw('viewed_user_id, COUNT(*) as view_count')
            ->groupBy('viewed_user_id')
            ->orderByDesc('view_count')
            ->limit($limit)
            ->get();

        $userIds = $data->pluck('viewed_user_id');

        $users = DB::table('users')
            ->leftJoin('students', 'users.student_record_id', '=', 'students.id')
            ->whereIn('users.id', $userIds)
            ->select(
                'users.id',
                'users.first_name',
                'users.last_name',
                'users.profile_picture',
                'students.course',
                'students.graduation_year'
            )
            ->get()
            ->keyBy('id');

        $result = $data->map(fn($row) => [
            'id'              => $row->viewed_user_id,
            'name'            => isset($users[$row->viewed_user_id])
                ? trim("{$users[$row->viewed_user_id]->first_name} {$users[$row->viewed_user_id]->last_name}")
                : 'Unknown',
            'profile_picture' => $users[$row->viewed_user_id]?->profile_picture ?? null,
            'course'          => $users[$row->viewed_user_id]?->course ?? null,
            'graduation_year' => $users[$row->viewed_user_id]?->graduation_year ?? null,
            'view_count'      => (int) $row->view_count,
        ]);

        return response()->json(['data' => $result]);
    }

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

        $users = DB::table('users')
            ->leftJoin('students', 'users.student_record_id', '=', 'students.id')
            ->whereIn('users.id', $userIds)
            ->select(
                'users.id',
                'users.first_name',
                'users.last_name',
                'users.profile_picture',
                'students.course',
                'students.graduation_year'
            )
            ->get()
            ->keyBy('id');

        $result = $data->map(fn($row) => [
            'id'              => $row->viewed_user_id,
            'name'            => isset($users[$row->viewed_user_id])
                ? trim("{$users[$row->viewed_user_id]->first_name} {$users[$row->viewed_user_id]->last_name}")
                : 'Unknown',
            'profile_picture' => $users[$row->viewed_user_id]?->profile_picture ?? null,
            'course'          => $users[$row->viewed_user_id]?->course ?? null,
            'graduation_year' => $users[$row->viewed_user_id]?->graduation_year ?? null,
            'view_count'      => (int) $row->view_count,
        ]);

        return response()->json(['data' => $result]);
    }

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

    public function presence(Request $request): JsonResponse
    {
        $items = UserPresence::query()
            ->with('user:id,first_name,last_name,profile_picture')
            ->orderByDesc('is_online')
            ->orderByDesc('last_seen_at')
            ->limit(50)
            ->get()
            ->map(fn($p) => [
                'user_id'            => $p->user_id,
                'name'               => $p->user
                    ? trim("{$p->user->first_name} {$p->user->last_name}")
                    : 'Unknown',
                'profile_picture'    => $p->user?->profile_picture,
                'is_online'          => $p->is_online,
                'last_seen_at'       => $p->last_seen_at,
                'last_seen_at_human' => $p->last_seen_at
                    ? Carbon::parse($p->last_seen_at)->diffForHumans()
                    : null,
            ]);

        return response()->json(['data' => $items]);
    }
}