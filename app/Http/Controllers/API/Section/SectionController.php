<?php

namespace App\Http\Controllers\API\Section;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\Student;
use App\Services\Student\BatchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    // GET /api/sections 
    // All sections with student count + avatar preview.

    public function index(Request $request): JsonResponse
    {
        $query = Section::withCount('students')
            ->with([
                'batch:id,name,graduation_year,department',
                'students' => fn ($q) => $q
                    ->select('id', 'first_name', 'last_name', 'photo', 'section_id')
                    ->take(5),
            ]);

        if ($request->filled('batch_id')) {
            $query->where('batch_id', $request->batch_id);
        }

        if ($request->filled('course')) {
            $courses = BatchService::courseVariantsFor($request->course);

            if ($courses) {
                $query->whereIn('course', $courses);
            }
        }

        return response()->json($query->orderBy('name')->get());
    }

    // GET /api/sections/{id} 
    // Single section + paginated students espects premium & visibility rules.

    public function show(Request $request, int $id): JsonResponse
    {
        $viewer    = $request->user();
        $isPremium = $viewer->is_premium;

        $section = Section::with('batch:id,name,graduation_year,department')
            ->findOrFail($id);

        // Base Student query 

        $studentQuery = Student::where('section_id', $id)
            ->orderBy('last_name')
            ->orderBy('first_name');

        if (! $isPremium) {
            // Free tier: limited columns — no premium yearbook fields
            $studentQuery->select([
                'id',
                'first_name',
                'last_name',
                'photo',
                'student_no',
                'course',
                'graduation_year',
                'section_id',
                'batch_id',
            ]);
        } else {
            // Premium: all public + yearbook fields
            $studentQuery->select([
                'id',
                'first_name',
                'last_name',
                'middle_name',
                'nickname',
                'photo',
                'student_no',
                'email',
                'course',
                'graduation_year',
                'section_id',
                'batch_id',
                'honors',
                'organizations',
                'motto',
                'student_quote',
                'ambition',
                'future_plans',
                'most_likely_to',
                'achievements',
                'facebook_url',
                'instagram_url',
                'linkedin_url',
                'github_url',
            ]);
        }

        $students = $studentQuery->paginate(30);

        return response()->json([
            'section'    => $section,
            'students'   => $students,
            'is_premium' => $isPremium,
            'total'      => $section->students()->count(),
            'visible'    => $students->total(),
        ]);
    }
}
