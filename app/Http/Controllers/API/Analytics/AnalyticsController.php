<?php
namespace App\Http\Controllers\API\Analytics;

use App\Http\Controllers\Controller;
use App\Models\AlumniActivity;
use App\Models\ProfileView;
use App\Models\User;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function topViewed()
    {
        $students = User::withCount('profileViews')
            ->orderByDesc('profile_views')
            ->limit(10)
            ->get(['id','name','course','profile_picture','profile_views','student_id']);

        return response()->json($students);
    }

    public function myStats(Request $request)
    {
        $userId = $request->user()->id;

        return response()->json([
            'total_views'    => ProfileView::where('viewed_user_id', $userId)->count(),
            'views_this_week'=> ProfileView::where('viewed_user_id', $userId)
                ->where('created_at', '>=', now()->subWeek())->count(),
            'recent_activities' => AlumniActivity::where('user_id', $userId)
                ->latest()->limit(10)->get(),
        ]);
    }

    public function batchmates(Request $request)
    {
        $user = $request->user();

        $batchmates = User::where('batch', $user->batch)
            ->where('id', '!=', $user->id)
            ->whereNotNull('batch')
            ->get(['id','name','course','profile_picture','student_id','batch']);

        return response()->json($batchmates);
    }
}