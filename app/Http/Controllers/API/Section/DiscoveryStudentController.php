<?php

namespace App\Http\Controllers\API\Section;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Subscription;
use App\Support\PlatformSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscoveryStudentController extends Controller
{
    public function show(Request $request, int $id): JsonResponse
    {
        $student = Student::with([
            'section:id,name',
            'batch:id,name,graduation_year,department',
            'user:id,student_record_id',
        ])->findOrFail($id);

        $viewer = $request->user();

        $isPremium = ! PlatformSettings::bool('enable_premium_subscription')
            || ($viewer && Subscription::where('user_id', $viewer->id)
                ->where('status', 'active')
                ->where('tier', 'premium')
                ->exists());

        $data = [
            'id'                => $student->id,
            'user_id'           => $student->user?->id ?? null,
            'first_name'        => $student->first_name,
            'last_name'         => $student->last_name,
            'student_no'        => $student->student_no,
            'photo'             => $student->photo,
            'photo_url'         => $student->photo_url,
            'course'            => $student->course,
            'graduation_year'   => $student->graduation_year,
            'section'           => $student->section,
            'batch'             => $student->batch,
            'is_premium_viewer' => $isPremium,
        ];

        if ($isPremium) {
            $data = array_merge($data, [
                'middle_name'           => $student->middle_name,
                'nickname'              => $student->nickname,
                'email'                 => $student->email,
                'birthday'              => $student->birthday,
                'hometown'              => $student->hometown,
                'honors'                => $student->honors,
                'organizations'         => $student->organizations,
                'achievements'          => $student->achievements,
                'motto'                 => $student->motto,
                'student_quote'         => $student->student_quote,
                'fondest_memory'        => $student->fondest_memory,
                'ambition'              => $student->ambition,
                'future_plans'          => $student->future_plans,
                'message_to_batchmates' => $student->message_to_batchmates,
                'message_to_parents'    => $student->message_to_parents,
                'most_likely_to'        => $student->most_likely_to,
                'facebook_url'          => $student->facebook_url,
                'instagram_url'         => $student->instagram_url,
                'linkedin_url'          => $student->linkedin_url,
                'github_url'            => $student->github_url,
            ]);
        }

        return response()->json(['data' => $data]);
    }
}
