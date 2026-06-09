<?php

namespace App\Http\Controllers\API\Section;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use App\Services\Student\BatchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BatchController extends Controller
{
    public function __construct(private readonly BatchService $batchService) {}

    // ── GET /api/batches ───────────────────────────────────────────────────

    public function index(): JsonResponse
    {
        $grouped = $this->batchService->getBatchesByDepartment();

        return response()->json([
            'data'        => $grouped,
            'departments' => $grouped->keys()->values(),
        ]);
    }

    // ── GET /api/batches/{batch} ───────────────────────────────────────────

    public function show(Batch $batch): JsonResponse
    {
        return response()->json([
            'batch' => $batch->load('sections:id,batch_id,name'),
            'stats' => $this->batchService->getBatchStats($batch),
        ]);
    }

    // ── GET /api/batches/{batch}/students ──────────────────────────────────

    public function students(Request $request, Batch $batch): JsonResponse
    {
        $viewer    = $request->user();
        $isPremium = $viewer->is_premium;

        $students = $this->batchService->getBatchStudents($batch, $isPremium);

        return response()->json([
            'data'       => $students,
            'is_premium' => $isPremium,
            'batch'      => $batch->only(['id', 'name', 'course', 'graduation_year', 'department']),
        ]);
    }

    // ── GET /api/batchmates ────────────────────────────────────────────────

    public function batchmates(Request $request): JsonResponse
    {
        $viewer  = $request->user();
        $course  = $this->cleanFilter($request->query('course'));
        $department = $this->cleanFilter($request->query('department'));
        $results = $this->batchService->getBatchmates(
            $viewer,
            $course,
            $request->query('year') ? (int) $request->query('year') : null,
            $department
        );

        return response()->json([
            'data'       => $results,
            'count'      => count($results),
            'is_premium' => $viewer->is_premium,
            'view_mode'  => 'batch',
            'filter'     => [
                'course'     => $course ?? ($request->query('year') || $department ? null : ($viewer->studentRecord?->course ?? $viewer->course)),
                'department' => $department,
                'year'       => $request->query('year')   ?? $viewer->graduation_year,
            ],
        ]);
    }

    private function cleanFilter(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);

        return $value === '' || strtolower($value) === 'null' || strtolower($value) === 'undefined'
            ? null
            : $value;
    }

    // ── GET /api/discover/sectionmates ─────────────────────────────────────

    public function sectionmates(Request $request): JsonResponse
    {
        $viewer  = $request->user();
        $results = $this->batchService->getSectionmates($viewer);

        return response()->json([
            'data'       => $results,
            'count'      => count($results),
            'is_premium' => $viewer->is_premium,
            'view_mode'  => 'section',
            'section'    => $viewer->section?->only(['id', 'name']),
        ]);
    }

    // ── GET /api/discover/school ───────────────────────────────────────────

    public function wholeSchool(Request $request): JsonResponse
    {
        $viewer    = $request->user();
        $filters   = $request->only(['search', 'course', 'department', 'year', 'section_id']);
        $paginated = $this->batchService->getWholeSchool($viewer, $filters, 40);

        return response()->json([
            'data'       => $paginated,
            'is_premium' => $viewer->is_premium,
            'view_mode'  => 'school',
            'filters'    => $filters,
        ]);
    }

    // ── GET /api/discover/cross-program ───────────────────────────────────

    public function crossProgram(Request $request): JsonResponse
    {
        $viewer    = $request->user();
        $filters   = $request->only(['search', 'course', 'department', 'year', 'exclude_course']);
        $paginated = $this->batchService->getCrossProgram($viewer, $filters, 40);
        $stats     = $this->batchService->getCrossProgramStats($viewer);

        return response()->json([
            'data'       => $paginated,
            'stats'      => $stats,
            'is_premium' => $viewer->is_premium,
            'view_mode'  => 'cross_program',
            'filters'    => $filters,
        ]);
    }

    // ── GET /api/discover/department/{department} ──────────────────────────

    public function byDepartment(Request $request, string $department): JsonResponse
    {
        $viewer  = $request->user();
        $grouped = $this->batchService->getByDepartment($viewer, urldecode($department));

        return response()->json([
            'data'       => $grouped,
            'department' => urldecode($department),
            'courses'    => $grouped->keys()->values(),
            'is_premium' => $viewer->is_premium,
            'total'      => $grouped->flatten(1)->count(),
        ]);
    }
}
