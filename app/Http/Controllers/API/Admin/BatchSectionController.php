<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\AuditsAdminActions;
use App\Models\AuditLog;
use App\Models\Batch;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BatchSectionController extends Controller
{
    use AuditsAdminActions;

    // ══════════════════════════════════════════════════════════════════════════
    // BATCHES
    // ══════════════════════════════════════════════════════════════════════════

    // GET /api/admin/batches
    public function batchIndex(Request $request): JsonResponse
    {
        $query = Batch::query()->withCount(['sections', 'students']);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name',          'like', "%{$search}%")
                  ->orWhere('course',      'like', "%{$search}%")
                  ->orWhere('course_code', 'like', "%{$search}%")
                  ->orWhere('department',  'like', "%{$search}%");
            });
        }

        if ($year = $request->get('graduation_year')) {
            $query->where('graduation_year', $year);
        }

        if ($dept = $request->get('department')) {
            $query->where('department', $dept);
        }

        $batches = $query
            ->orderByDesc('graduation_year')
            ->orderBy('name')
            ->paginate($request->get('per_page', 20));

        return response()->json($batches);
    }

    // GET /api/admin/batches/{batch}
    public function batchShow(Batch $batch): JsonResponse
    {
        $batch->load(['sections.students', 'students']);
        $batch->loadCount(['sections', 'students']);

        return response()->json(['data' => $batch]);
    }

    // GET /api/admin/batches/{batch}/departments
    public function batchDepartments(Batch $batch): JsonResponse
    {
        $departments = Section::query()
            ->where('batch_id', $batch->id)
            ->whereNotNull('department')
            ->selectRaw('department, COUNT(*) as sections_count, SUM(
                (SELECT COUNT(*) FROM students WHERE students.section_id = sections.id)
            ) as students_count')
            ->groupBy('department')
            ->orderBy('department')
            ->get();

        return response()->json(['data' => $departments]);
    }

    // GET /api/admin/batches/{batch}/departments/{department}/courses
    public function batchDepartmentCourses(Batch $batch, string $department): JsonResponse
    {
        $courses = Section::query()
            ->where('batch_id', $batch->id)
            ->where('department', $department)
            ->whereNotNull('course')
            ->selectRaw('course, COUNT(*) as sections_count, SUM(
                (SELECT COUNT(*) FROM students WHERE students.section_id = sections.id)
            ) as students_count')
            ->groupBy('course')
            ->orderBy('course')
            ->get();

        return response()->json(['data' => $courses]);
    }

    // POST /api/admin/batches
    public function batchStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'course'          => 'nullable|string|max:255',
            'course_code'     => 'nullable|string|max:20',
            'graduation_year' => 'required|integer|min:2000|max:2100',
            'department'      => 'nullable|string|max:255',
            'description'     => 'nullable|string|max:500',
        ]);

        $batch = Batch::create($validated);

        $this->audit(
            AuditLog::ACTION_BATCH_CREATED,
            "Created batch '{$batch->name}' ({$batch->graduation_year}) ID #{$batch->id}.",
            AuditLog::STATUS_SUCCESS,
            null,
            $batch->id,
            "batch#{$batch->id}",
        );

        return response()->json([
            'message' => 'Batch created successfully.',
            'data'    => $batch,
        ], 201);
    }

    // PUT /api/admin/batches/{batch}
    public function batchUpdate(Request $request, Batch $batch): JsonResponse
    {
        $validated = $request->validate([
            'name'            => 'sometimes|string|max:255',
            'course'          => 'nullable|string|max:255',
            'course_code'     => 'nullable|string|max:20',
            'graduation_year' => 'sometimes|integer|min:2000|max:2100',
            'department'      => 'nullable|string|max:255',
            'description'     => 'nullable|string|max:500',
        ]);

        $batch->update($validated);

        $this->audit(
            AuditLog::ACTION_BATCH_UPDATED,
            "Updated batch '{$batch->name}' ID #{$batch->id}. Fields: " . implode(', ', array_keys($validated)),
            AuditLog::STATUS_SUCCESS,
            null,
            $batch->id,
            "batch#{$batch->id}",
        );

        return response()->json([
            'message' => 'Batch updated successfully.',
            'data'    => $batch->fresh(),
        ]);
    }

    // DELETE /api/admin/batches/{batch}
    public function batchDestroy(Batch $batch): JsonResponse
    {
        $snapshot = "{$batch->name} ({$batch->graduation_year}) ID #{$batch->id}";

        $batch->delete();

        $this->audit(
            AuditLog::ACTION_BATCH_DELETED,
            "Moved batch '{$snapshot}' to trash.",
            AuditLog::STATUS_WARNING,
            null,
            $batch->id,
            "batch#{$batch->id}",
        );

        return response()->json(['message' => 'Batch moved to trash.']);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SECTIONS
    // ══════════════════════════════════════════════════════════════════════════

    // GET /api/admin/sections
    public function sectionIndex(Request $request): JsonResponse
    {
        $query = Section::query()
            ->withCount('students')
            ->with(['batch:id,name,graduation_year', 'adviser:id,first_name,last_name']);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name',        'like', "%{$search}%")
                  ->orWhere('course',    'like', "%{$search}%")
                  ->orWhere('department','like', "%{$search}%");
            });
        }

        if ($batchId = $request->get('batch_id')) {
            $query->where('batch_id', $batchId);
        }

        if ($department = $request->get('department')) {
            $query->where('department', $department);
        }

        if ($course = $request->get('course')) {
            $query->where('course', $course);
        }

        if ($year = $request->get('batch_year')) {
            $query->where('batch_year', $year);
        }

        $sections = $query
            ->orderBy('department')
            ->orderBy('course')
            ->orderBy('name')
            ->paginate($request->get('per_page', 20));

        return response()->json($sections);
    }

    // GET /api/admin/sections/{section}
    public function sectionShow(Section $section): JsonResponse
    {
        $section->load(['batch', 'adviser', 'students']);
        $section->loadCount('students');

        return response()->json(['data' => $section]);
    }

    // POST /api/admin/sections
    public function sectionStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'course'      => 'nullable|string|max:255',
            'department'  => 'nullable|string|max:255',
            'batch_year'  => 'nullable|integer|min:2000|max:2100',
            'batch_id'    => 'nullable|exists:batches,id',
            'adviser_id'  => 'nullable|exists:faculty,id',
            'description' => 'nullable|string|max:500',
        ]);

        $section = Section::create($validated);

        $this->audit(
            AuditLog::ACTION_SECTION_CREATED,
            "Created section '{$section->name}' (batch ID #{$section->batch_id}) ID #{$section->id}.",
            AuditLog::STATUS_SUCCESS,
            null,
            $section->id,
            "section#{$section->id}",
        );

        return response()->json([
            'message' => 'Section created successfully.',
            'data'    => $section,
        ], 201);
    }

    // PUT /api/admin/sections/{section}
    public function sectionUpdate(Request $request, Section $section): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'course'      => 'nullable|string|max:255',
            'department'  => 'nullable|string|max:255',
            'batch_year'  => 'nullable|integer|min:2000|max:2100',
            'batch_id'    => 'nullable|exists:batches,id',
            'adviser_id'  => 'nullable|exists:faculty,id',
            'description' => 'nullable|string|max:500',
        ]);

        $section->update($validated);

        $this->audit(
            AuditLog::ACTION_SECTION_UPDATED,
            "Updated section '{$section->name}' ID #{$section->id}. Fields: " . implode(', ', array_keys($validated)),
            AuditLog::STATUS_SUCCESS,
            null,
            $section->id,
            "section#{$section->id}",
        );

        return response()->json([
            'message' => 'Section updated successfully.',
            'data'    => $section->fresh(['batch', 'adviser']),
        ]);
    }

    // DELETE /api/admin/sections/{section}
    public function sectionDestroy(Section $section): JsonResponse
    {
        $snapshot = "{$section->name} ID #{$section->id}";

        $section->delete();

        $this->audit(
            AuditLog::ACTION_SECTION_DELETED,
            "Moved section '{$snapshot}' to trash.",
            AuditLog::STATUS_WARNING,
            null,
            $section->id,
            "section#{$section->id}",
        );

        return response()->json(['message' => 'Section moved to trash.']);
    }
}