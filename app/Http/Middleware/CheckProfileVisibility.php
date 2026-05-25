<?php
namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;

class CheckProfileVisibility
{
    public function handle(Request $request, Closure $next)
    {
        $profileId = $request->route('id');
        if (!$profileId) return $next($request);

        $profile = User::find($profileId);
        if (!$profile) return $next($request);

        $viewer = $request->user();

        // Owner always has full access
        if ($viewer && $viewer->id === (int) $profile->id) {
            return $next($request);
        }

        if ($profile->profile_visibility === 'private') {
            return response()->json([
                'message'    => 'This profile is private.',
                'visibility' => 'private',    // ← frontend reads this
            ], 403);
        }

        if ($profile->profile_visibility === 'alumni_only' && !$viewer) {
            return response()->json([
                'message'    => 'Login required to view this profile.',
                'visibility' => 'alumni_only', // ← frontend reads this
            ], 401);
        }

        return $next($request);
    }
}