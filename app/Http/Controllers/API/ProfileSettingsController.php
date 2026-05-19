<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlumniActivity;
use App\Models\ProfileView;
use App\Models\User;
use Illuminate\Http\Request;

class ProfileSettingsController extends Controller
{
    public function updateVisibility(Request $request)
    {
        $request->validate([
            'visibility' => 'required|in:public,private,alumni_only',
        ]);

        $request->user()->update(['profile_visibility' => $request->visibility]);

        return response()->json(['message' => 'Visibility updated.']);
    }

    public function updateMotto(Request $request)
    {
        $request->validate(['motto' => 'nullable|string|max:255']);
        $request->user()->update(['motto' => $request->motto]);
        return response()->json(['message' => 'Motto updated.']);
    }

    public function trackView(Request $request, int $id)
    {
        $profile = User::findOrFail($id);

        // Don't track own views
        if ($request->user()?->id === $id) {
            return response()->json(['tracked' => false]);
        }

        ProfileView::create([
            'viewed_user_id' => $id,
            'viewer_id'      => $request->user()?->id,
            'ip_address'     => $request->ip(),
        ]);

        $profile->increment('profile_views');

        AlumniActivity::create([
            'user_id'     => $id,
            'action'      => 'profile_viewed',
            'description' => 'Profile was viewed',
            'metadata'    => ['viewer_id' => $request->user()?->id],
        ]);

        return response()->json(['tracked' => true]);
    }

    public function topViewed()
    {
        $students = User::withCount('profileViews')
            ->orderByDesc('profile_views')
            ->limit(10)
            ->get(['id','name','course','profile_picture','profile_views','student_id']);

        return response()->json($students);
    }
}