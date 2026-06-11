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

        $profile = User::with(['section', 'studentRecord'])->find($profileId);
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
                'student'    => $this->publicProfilePayload($profile),
            ], 403);
        }

        if ($this->isBatchmatesOnly($profile) && ! $viewer) {
            return response()->json([
                'message'    => 'Login required to view this profile.',
                'visibility' => 'batchmates',
                'student'    => $this->publicProfilePayload($profile),
            ], 401);
        }

        if ($this->isBatchmatesOnly($profile) && ! $this->sameBatch($viewer, $profile)) {
            return response()->json([
                'message'    => 'This profile is visible to batchmates only.',
                'visibility' => 'batchmates',
                'student'    => $this->publicProfilePayload($profile),
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

    private function publicProfilePayload(User $profile): array
    {
        $record = $profile->studentRecord;

        return [
            'id' => $profile->id,
            'name' => $profile->name,
            'first_name' => $profile->first_name,
            'last_name' => $profile->last_name,
            'profile_picture' => $profile->profile_picture,
            'photo' => $record?->photo,
            'course' => $profile->course ?: $record?->course,
            'course_short' => $profile->course_short,
            'section' => [
                'name' => $profile->section?->name ?: $record?->section,
                'batch_year' => $profile->section?->batch_year,
            ],
            'graduation_year' => $profile->graduation_year ?: $profile->batch ?: $record?->graduation_year,
            'batch' => $profile->batch,
        ];
    }
}
