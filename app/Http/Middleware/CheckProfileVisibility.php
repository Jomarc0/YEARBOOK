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
        if (! $profileId) return $next($request);

        $profile = User::find($profileId);
        if (! $profile) return $next($request);

        $viewer = $request->user();

        if ($profile->profile_visibility === 'private') {
            if (! $viewer || $viewer->id !== $profile->id) {
                return response()->json(['message' => 'This profile is private.'], 403);
            }
        }

        if ($profile->profile_visibility === 'alumni_only') {
            if (! $viewer) {
                return response()->json(['message' => 'Login required to view this profile.'], 401);
            }
        }

        return $next($request);
    }
}