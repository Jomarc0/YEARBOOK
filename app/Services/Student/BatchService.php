<?php

namespace App\Services\Student;

use App\Models\Batch;
use App\Models\Student;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class BatchService
{
    // ── NU Lipa Department & Course Maps ───────────────────────────────────

    public const DEPARTMENT_MAP = [
        'Bachelor of Science in Architecture'           => 'SACE',
        'Bachelor of Science in Civil Engineering'      => 'SACE',
        'Bachelor of Science in Computer Science'       => 'SACE',
        'Bachelor of Science in Information Technology' => 'SACE',
        'Bachelor of Science in Nursing'                => 'SAHS',
        'Bachelor of Science in Medical Technology'     => 'SAHS',
        'Bachelor of Science in Psychology'             => 'SAHS',
        'Bachelor of Science in Accountancy' => 'SABM',
        'Bachelor of Science in Business Administration - Financial Management' => 'SABM',
        'Bachelor of Science in Business Administration - Marketing Management' => 'SABM',
        'Bachelor of Science in Tourism Management' => 'SABM',
        'ABM'                       => 'SHS',
        'STEM'                      => 'SHS',
        'HUMSS'                     => 'SHS',
    ];

    public const COURSE_CODE_MAP = [
        'BS Architecture'           => 'BSArch',
        'BS Civil Engineering'      => 'BSCE',
        'BS Computer Science'       => 'BSCS',
        'BS Information Technology' => 'BSIT',
        'BS Nursing'                => 'BSN',
        'BS Medical Technology'     => 'BSMT',
        'BS Psychology'             => 'BSPsych',
        'BS Accountancy'            => 'BSA',
        'BSBA Financial Management' => 'BSBA-FM',
        'BSBA Marketing Management' => 'BSBA-MM',
        'BS Tourism Management'     => 'BSTM',
        'ABM'                       => 'ABM',
        'STEM'                      => 'STEM',
        'HUMSS'                     => 'HUMSS',
    ];

    // ── Columns ────────────────────────────────────────────────────────────

    private const PUBLIC_COLS = [
        'id',
        'first_name',
        'last_name',
        'photo',
        'student_no',
        'course',
        'graduation_year',
        'section_id',
        'batch_id',
    ];

    private const PREMIUM_COLS = [
        'id',
        'first_name',
        'last_name',
        'middle_name',
        'nickname',
        'photo',
        'student_no',
        'email',
        'birthday',
        'hometown',
        'course',
        'graduation_year',
        'section_id',
        'batch_id',
        'honors',
        'organizations',
        'achievements',
        'motto',
        'student_quote',
        'ambition',
        'future_plans',
        'most_likely_to',
        'message_to_batchmates',
        'facebook_url',
        'instagram_url',
        'linkedin_url',
        'github_url',
    ];

    private function cols(bool $isPremium): array
    {
        return $isPremium ? self::PREMIUM_COLS : self::PUBLIC_COLS;
    }

    // ── Base query ─────────────────────────────────────────────────────────

    public function baseQuery(bool $isPremium)
    {
        return Student::select($this->cols($isPremium))
            ->with(['section:id,name', 'batch:id,name,graduation_year,department']);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private function coursesForDepartment(string $department): array
    {
        return collect(self::DEPARTMENT_MAP)
            ->filter(fn ($dept) => $dept === $department)
            ->keys()
            ->toArray();
    }

    // ── Discovery: Batchmates ──────────────────────────────────────────────

    public function getBatchmates(User $viewer, ?string $course = null, ?int $year = null): Collection
    {
        $course = $course ?? $viewer->student?->course          ?? $viewer->course;
        $year   = $year   ?? $viewer->student?->graduation_year ?? $viewer->graduation_year;

        return $this->baseQuery($viewer->is_premium)
            ->when($course, fn ($q) => $q->where('course', $course))
            ->when($year,   fn ($q) => $q->where('graduation_year', $year))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(fn ($s) => $this->formatStudent($s));
    }

    // ── Discovery: Sectionmates ────────────────────────────────────────────

    public function getSectionmates(User $viewer): Collection
    {
        $sectionId = $viewer->student?->section_id ?? $viewer->section_id;

        if (! $sectionId) {
            return collect();
        }

        return $this->baseQuery($viewer->is_premium)
            ->where('section_id', $sectionId)
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(fn ($s) => $this->formatStudent($s));
    }

    // ── Discovery: Whole School ────────────────────────────────────────────

    public function getWholeSchool(User $viewer, array $filters = [], int $perPage = 40): LengthAwarePaginator
    {
        $query = $this->baseQuery($viewer->is_premium);

        if (! empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(fn ($q) => $q
                ->where('first_name',   'like', $term)
                ->orWhere('last_name',  'like', $term)
                ->orWhere('student_no', 'like', $term)
                ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", [$term])
            );
        }

        if (! empty($filters['course']))      $query->where('course',          $filters['course']);
        if (! empty($filters['year']))        $query->where('graduation_year', (int) $filters['year']);
        if (! empty($filters['section_id']))  $query->where('section_id',      (int) $filters['section_id']);

        if (! empty($filters['department'])) {
            $courses = $this->coursesForDepartment($filters['department']);
            $query->whereIn('course', $courses);
        }

        return $query
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($perPage)
            ->through(fn ($s) => $this->formatStudent($s));
    }

    // ── Discovery: Cross-Program ───────────────────────────────────────────

    public function getCrossProgram(User $viewer, array $filters = [], int $perPage = 40): LengthAwarePaginator
    {
        $viewerCourse = $viewer->student?->course ?? $viewer->course;

        $query = $this->baseQuery($viewer->is_premium)
            ->when($viewerCourse, fn ($q) => $q->where('course', '!=', $viewerCourse));

        if (! empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(fn ($q) => $q
                ->where('first_name',   'like', $term)
                ->orWhere('last_name',  'like', $term)
                ->orWhere('student_no', 'like', $term)
                ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", [$term])
            );
        }

        if (! empty($filters['course']))     $query->where('course',          $filters['course']);
        if (! empty($filters['year']))       $query->where('graduation_year', (int) $filters['year']);

        if (! empty($filters['department'])) {
            $courses = $this->coursesForDepartment($filters['department']);
            $query->whereIn('course', $courses);
        }

        return $query
            ->orderBy('course')
            ->orderBy('graduation_year', 'desc')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($perPage)
            ->through(fn ($s) => $this->formatStudent($s));
    }

    // ── Discovery: Cross-Program Stats ────────────────────────────────────

    public function getCrossProgramStats(User $viewer): array
    {
        $viewerCourse = $viewer->student?->course ?? $viewer->course;

        $base = Student::when($viewerCourse, fn ($q) => $q->where('course', '!=', $viewerCourse));

        return [
            'total_students' => (clone $base)->count(),
            'total_programs' => (clone $base)->distinct()->count('course'),
            'departments'    => (clone $base)
                ->join('batches', 'students.batch_id', '=', 'batches.id')
                ->distinct()
                ->pluck('batches.department')
                ->filter()
                ->values(),
        ];
    }

    // ── Discovery: By Department ───────────────────────────────────────────

    public function getByDepartment(User $viewer, string $department): Collection
    {
        return $this->baseQuery($viewer->is_premium)
            ->whereIn('course', $this->coursesForDepartment($department))
            ->orderBy('course')
            ->orderBy('last_name')
            ->get()
            ->map(fn ($s) => $this->formatStudent($s))
            ->groupBy('course');
    }

    // ── Batch Helpers ──────────────────────────────────────────────────────

    public function getBatchesByDepartment(): Collection
    {
        return Batch::withCount('students')
            ->with('sections:id,batch_id,name')
            ->orderBy('graduation_year', 'desc')
            ->get()
            ->groupBy('department');
    }

    public function getBatchStats(Batch $batch): array
    {
        return [
            'total_students' => $batch->students()->count(),
            'total_sections' => $batch->sections()->count(),
            'sections'       => $batch->sections()->withCount('students')->get(['id', 'name']),
            'by_course'      => $batch->students()
                ->selectRaw('course, COUNT(*) as count')
                ->groupBy('course')
                ->pluck('count', 'course'),
        ];
    }

    public function getBatchStudents(Batch $batch, bool $isPremium): Collection
    {
        return $this->baseQuery($isPremium)
            ->where('batch_id', $batch->id)
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(fn ($s) => $this->formatStudent($s));
    }

    // ── Static Helpers ─────────────────────────────────────────────────────

    public static function getDepartment(string $course): string
    {
        return self::DEPARTMENT_MAP[$course] ?? 'General';
    }

    public static function getCourseCode(string $course): string
    {
        return self::COURSE_CODE_MAP[$course] ?? strtoupper(substr($course, 0, 4));
    }

    public static function getAllDepartments(): array
    {
        return collect(self::DEPARTMENT_MAP)->unique()->values()->sort()->values()->toArray();
    }

    public static function getAllCourses(): array
    {
        return array_keys(self::DEPARTMENT_MAP);
    }

    // ── Formatter ──────────────────────────────────────────────────────────

    private function formatStudent(Student $student): array
    {
        $data = $student->toArray();

        $data['name']            = trim("{$student->first_name} {$student->last_name}");
        $data['profile_picture'] = $student->photo_url ?? $student->photo;

        return $data;
    }
}