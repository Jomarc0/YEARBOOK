<?php

namespace App\Http\Controllers\API\Section;

use App\Http\Controllers\Controller;
use App\Models\Student;
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

        $data = [
            // Identity
            'id'                    => $student->id,
            'user_id'               => $student->user?->id ?? null,
            'first_name'            => $student->first_name,
            'last_name'             => $student->last_name,
            'middle_name'           => $student->middle_name,
            'nickname'              => $student->nickname,
            'student_no'            => $student->student_no,
            'email'                 => $student->email,

            // Photo
            'photo'                 => $student->photo,
            'photo_url'             => $student->photo_url,

            // Personal
            'birthday'              => $student->birthday,
            'hometown'              => $student->hometown,
            'course'                => $student->course,
            'graduation_year'       => $student->graduation_year,

            // Academic
            'honors'                => $student->honors,
            'organizations'         => $student->organizations,
            'achievements'          => $student->achievements,
            'section'               => $student->section,
            'batch'                 => $student->batch,

            // Yearbook — all public
            'motto'                 => $student->motto,
            'student_quote'         => $student->student_quote,
            'fondest_memory'        => $student->fondest_memory,
            'ambition'              => $student->ambition,
            'future_plans'          => $student->future_plans,
            'message_to_batchmates' => $student->message_to_batchmates,
            'message_to_parents'    => $student->message_to_parents,
            'most_likely_to'        => $student->most_likely_to,

            // Socials
            'facebook_url'          => $student->facebook_url,
            'instagram_url'         => $student->instagram_url,
            'linkedin_url'          => $student->linkedin_url,
            'github_url'            => $student->github_url,
        ];

        return response()->json(['data' => $data]);
    }
}