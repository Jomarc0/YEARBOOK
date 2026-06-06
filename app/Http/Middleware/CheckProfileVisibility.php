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
        if (! $profileId) {
            return $next($request);
        }

        $profile = User::find($profileId);
        if (! $profile) {
            return $next($request);
        }

        $viewer = $request->user();

        if ($viewer && $viewer->id === (int) $profile->id) {
            return $next($request);
        }

        if ($profile->profile_visibility === 'private') {
            return response()->json([
                'message'    => 'This profile is private.',
                'visibility' => 'private',
            ], 403);
        }

        if ($this->isBatchmatesOnly($profile) && ! $viewer) {
            return response()->json([
                'message'    => 'Login required to view this profile.',
                'visibility' => 'batchmates',
            ], 401);
        }

        if ($this->isBatchmatesOnly($profile) && ! $this->sameBatch($viewer, $profile)) {
            return response()->json([
                'message'    => 'This profile is visible to batchmates only.',
                'visibility' => 'batchmates',
            ], 403);
        }

        return $next($request);
    }

    private function sameBatch(?User $viewer, User $profile): bool
    {
        if (! $viewer) {
            return false;
        }

        if ($viewer->batch_id && $profile->batch_id) {
            return (int) $viewer->batch_id === (int) $profile->batch_id;
        }

        $viewerYear = $viewer->graduation_year ?? $viewer->batch;
        $profileYear = $profile->graduation_year ?? $profile->batch;

        return $viewerYear && $profileYear && (string) $viewerYear === (string) $profileYear;
    }

    private function isBatchmatesOnly(User $profile): bool
    {
        return in_array($profile->profile_visibility, ['batchmates', 'alumni_only'], true);
    }
}
