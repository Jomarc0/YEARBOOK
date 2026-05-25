<?php

namespace App\Http\Controllers\API\Section;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    // ── GET /api/sections ──────────────────────────────────────────────────
    // All sections with student count + avatar preview.
    // Supports ?batch_id= and ?course= filters.

    public function index(Request $request): JsonResponse
    {
        $query = Section::withCount('students')
            ->with([
                'batch:id,name,graduation_year,department',
                'students' => fn ($q) => $q
                    ->select('id', 'name', 'profile_picture', 'section_id')
                    ->take(5),
            ]);

        if ($request->filled('batch_id')) {
            $query->where('batch_id', $request->batch_id);
        }

        if ($request->filled('course')) {
            $query->where('course', $request->course);
        }

        return response()->json($query->orderBy('name')->get());
    }

    // ── GET /api/sections/{id} ─────────────────────────────────────────────
    // Single section + paginated students — respects premium & visibility rules.

    public function show(Request $request, int $id): JsonResponse
    {
        $viewer    = $request->user();
        $isPremium = $viewer->is_premium;

        $section = Section::with('batch:id,name,graduation_year,department')
            ->findOrFail($id);

        // ── Build student query with access rules ────────────────────────

        $studentQuery = User::where('section_id', $id)
            ->where('profile_visibility', '!=', 'private')   // always hide private
            ->orderBy('name');

        if (! $isPremium) {
            // Free tier: public only + limited columns
            $studentQuery
                ->where('profile_visibility', 'public')
                ->select(['id', 'name', 'profile_picture', 'student_id', 'section_id']);
        } else {
            // Premium: public + connections_only + full columns
            $studentQuery
                ->whereIn('profile_visibility', ['public', 'connections_only'])
                ->select([
                    'id', 'name', 'profile_picture', 'student_id', 'section_id',
                    'email', 'course', 'graduation_year', 'motto', 'profile_visibility',
                ]);
        }

        $students = $studentQuery->paginate(30);

        return response()->json([
            'section'    => $section,
            'students'   => $students,
            'is_premium' => $isPremium,
            'total'      => $section->students()->count(),          // true count (all)
            'visible'    => $students->total(),                     // count respecting rules
        ]);
    }
}