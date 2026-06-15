<?php

namespace App\Services\Student;

use App\Models\Batch;
use App\Models\Student;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class BatchService
{
    // NU Lipa Department & Course Maps 

    public const DEPARTMENT_MAP = [
        'Bachelor of Science in Architecture'           => 'SACE',
        'Bachelor of Multimedia Arts'                   => 'SACE',
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
        'Master in Management' => 'SABM',
        'ABM'                       => 'SHS',
        'STEM'                      => 'SHS',
        'HUMSS'                     => 'SHS',
    ];

    public const COURSE_CODE_MAP = [
        'Bachelor of Science in Architecture' => 'BSArch',
        'Bachelor of Multimedia Arts' => 'BMA',
        'Bachelor of Science in Civil Engineering' => 'BSCE',
        'Bachelor of Science in Computer Science' => 'BSCS',
        'Bachelor of Science in Information Technology' => 'BSIT',
        'Bachelor of Science in Nursing' => 'BSN',
        'Bachelor of Science in Medical Technology' => 'BSMT',
        'Bachelor of Science in Psychology' => 'BSPsych',
        'Bachelor of Science in Accountancy' => 'BSA',
        'Bachelor of Science in Business Administration - Financial Management' => 'BSBA-FM',
        'Bachelor of Science in Business Administration - Marketing Management' => 'BSBA-MM',
        'Bachelor of Science in Tourism Management' => 'BSTM',
        'Master in Management' => 'MM',
        'ABM'                       => 'ABM',
        'STEM'                      => 'STEM',
        'HUMSS'                     => 'HUMSS',
    ];

    public const COURSE_ALIASES = [
        'Bachelor of Science in Architecture' => [
            'Bachelor of Science in Architecture',
            'BS Architecture',
            'BSArch',
        ],
        'Bachelor of Multimedia Arts' => [
            'Bachelor of Multimedia Arts',
            'Bachelor of Multimedia Arts (BMMA)',
            'BMA',
            'BMMA',
        ],
        'Bachelor of Science in Civil Engineering' => [
            'Bachelor of Science in Civil Engineering',
            'BS Civil Engineering',
            'BSCE',
        ],
        'Bachelor of Science in Computer Science' => [
            'Bachelor of Science in Computer Science',
            'BS Computer Science',
            'BSCS',
        ],
        'Bachelor of Science in Information Technology' => [
            'Bachelor of Science in Information Technology',
            'BS Information Technology',
            'BSIT',
        ],
        'Bachelor of Science in Nursing' => [
            'Bachelor of Science in Nursing',
            'BS Nursing',
            'BSN',
        ],
        'Bachelor of Science in Medical Technology' => [
            'Bachelor of Science in Medical Technology',
            'BS Medical Technology',
            'BSMT',
        ],
        'Bachelor of Science in Psychology' => [
            'Bachelor of Science in Psychology',
            'BS Psychology',
            'BSPsych',
            'BSP',
        ],
        'Bachelor of Science in Accountancy' => [
            'Bachelor of Science in Accountancy',
            'BS Accountancy',
            'BSA',
        ],
        'Bachelor of Science in Business Administration - Financial Management' => [
            'Bachelor of Science in Business Administration - Financial Management',
            'BSBA Financial Management',
            'BSBA-FM',
            'BSBAFM',
        ],
        'Bachelor of Science in Business Administration - Marketing Management' => [
            'Bachelor of Science in Business Administration - Marketing Management',
            'BSBA Marketing Management',
            'BSBA-MM',
            'BSBAMM',
        ],
        'Bachelor of Science in Tourism Management' => [
            'Bachelor of Science in Tourism Management',
            'BS Tourism Management',
            'BSTM',
            'BBSTM',
        ],
        'Master in Management' => [
            'Master in Management',
            'MM',
        ],
        'ABM' => ['ABM'],
        'STEM' => ['STEM'],
        'HUMSS' => ['HUMSS', 'HUMMS'],
    ];

    // Columns 

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

    // Base query 
    public function baseQuery(bool $isPremium)
    {
        return Student::select($this->cols($isPremium))
            ->with([
                'section:id,name',
                'batch:id,name,graduation_year,department',
                'userAccount:id,student_record_id',
            ]);
    }

    // Helpers 
    private function coursesForDepartment(string $department): array
    {
        return collect(self::DEPARTMENT_MAP)
            ->filter(fn ($dept) => $dept === $department)
            ->keys()
            ->flatMap(fn ($course) => $this->courseVariants($course))
            ->unique()
            ->toArray();
    }

    private function normalizeFilter(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);

        return $value === '' || strtolower($value) === 'null' || strtolower($value) === 'undefined'
            ? null
            : $value;
    }

    private function canonicalCourse(?string $course): ?string
    {
        $course = $this->normalizeFilter($course);

        if ($course === null) {
            return null;
        }

        foreach (self::COURSE_ALIASES as $canonical => $aliases) {
            if (in_array(strtolower($course), array_map('strtolower', $aliases), true)) {
                return $canonical;
            }
        }

        return $course;
    }

    private function courseVariants(?string $course): array
    {
        $canonical = $this->canonicalCourse($course);

        if ($canonical === null) {
            return [];
        }

        return array_values(array_unique(self::COURSE_ALIASES[$canonical] ?? [$canonical]));
    }

    public static function courseVariantsFor(?string $course): array
    {
        if ($course === null) {
            return [];
        }

        $course = trim($course);

        if ($course === '' || strtolower($course) === 'null' || strtolower($course) === 'undefined') {
            return [];
        }

        foreach (self::COURSE_ALIASES as $canonical => $aliases) {
            if (in_array(strtolower($course), array_map('strtolower', $aliases), true)) {
                return array_values(array_unique($aliases));
            }
        }

        return [$course];
    }

    private function whereCourseMatches($query, ?string $course)
    {
        $variants = $this->courseVariants($course);

        return empty($variants) ? $query : $query->whereIn('students.course', $variants);
    }

    // Discovery: Batchmates
    public function getBatchmates(User $viewer, ?string $course = null, ?int $year = null, ?string $department = null): Collection
    {
        $requestedYear = $year;
        $course     = $this->normalizeFilter($course);
        $department = $this->normalizeFilter($department);
        $year       = $year ?? $viewer->studentRecord?->graduation_year ?? $viewer->graduation_year;

        if ($course === null && $department === null && $requestedYear === null) {
            $course = $viewer->studentRecord?->course ?? $viewer->course;
        }

        return $this->baseQuery($viewer->is_premium)
            ->when($department, fn ($q) => $q->whereIn('students.course', $this->coursesForDepartment($department)))
            ->when($course, fn ($q) => $this->whereCourseMatches($q, $course))
            ->when($year,   fn ($q) => $q->where('students.graduation_year', $year))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(fn ($s) => $this->formatStudent($s));
    }

    // Discovery: Sectionmates 
    public function getSectionmates(User $viewer): Collection
    {
        $sectionId = $viewer->studentRecord?->section_id ?? $viewer->section_id;

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

    // Discovery: Whole School 

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

        if (! empty($filters['course']))      $this->whereCourseMatches($query, $filters['course']);
        if (! empty($filters['year']))        $query->where('students.graduation_year', (int) $filters['year']);
        if (! empty($filters['section_id']))  $query->where('students.section_id',      (int) $filters['section_id']);

        if (! empty($filters['department'])) {
            $courses = $this->coursesForDepartment($filters['department']);
            $query->whereIn('students.course', $courses);
        }

        return $query
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($perPage)
            ->through(fn ($s) => $this->formatStudent($s));
    }

    // Discovery: Cross-Program 

    public function getCrossProgram(User $viewer, array $filters = [], int $perPage = 40): LengthAwarePaginator
    {
        $viewerCourse = $viewer->studentRecord?->course ?? $viewer->course;

        $query = $this->baseQuery($viewer->is_premium)
            ->when($viewerCourse, fn ($q) => $q->whereNotIn('students.course', $this->courseVariants($viewerCourse)));

        if (! empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(fn ($q) => $q
                ->where('first_name',   'like', $term)
                ->orWhere('last_name',  'like', $term)
                ->orWhere('student_no', 'like', $term)
                ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", [$term])
            );
        }

        if (! empty($filters['course']))     $this->whereCourseMatches($query, $filters['course']);
        if (! empty($filters['year']))       $query->where('students.graduation_year', (int) $filters['year']);

        if (! empty($filters['department'])) {
            $courses = $this->coursesForDepartment($filters['department']);
            $query->whereIn('students.course', $courses);
        }

        return $query
            ->orderBy('students.course')
            ->orderBy('students.graduation_year', 'desc')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($perPage)
            ->through(fn ($s) => $this->formatStudent($s));
    }

    // Discovery: Cross-Program Stats 

    public function getCrossProgramStats(User $viewer): array
    {
        $viewerCourse = $viewer->studentRecord?->course ?? $viewer->course;

        $base = Student::when($viewerCourse, fn ($q) => $q->whereNotIn('students.course', $this->courseVariants($viewerCourse)));

        return [
            'total_students' => (clone $base)->count(),
            'total_programs' => (clone $base)->distinct()->count('students.course'),
            'departments'    => (clone $base)
                ->join('batches', 'students.batch_id', '=', 'batches.id')
                ->distinct()
                ->pluck('batches.department')
                ->filter()
                ->values(),
        ];
    }

    // Discovery: By Department 

    public function getByDepartment(User $viewer, string $department): Collection
    {
        return $this->baseQuery($viewer->is_premium)
            ->whereIn('students.course', $this->coursesForDepartment($department))
            ->orderBy('students.course')
            ->orderBy('last_name')
            ->get()
            ->map(fn ($s) => $this->formatStudent($s))
            ->groupBy('course');
    }

    // Batch Helpers 
    public function getBatchesByDepartment(): Collection
    {
        return Batch::withCount('students')
            ->with([
                'sections:id,batch_id,name,course,department,batch_year',
                'sections.students' => function ($query) {
                    $query->select([
                        'id',
                        'section_id',
                        'batch_id',
                        'first_name',
                        'last_name',
                        'student_no',
                        'course',
                        'graduation_year',
                        'photo',
                    ])->with('userAccount:id,student_record_id');
                },
            ])
            ->orderBy('graduation_year', 'desc')
            ->get()
            ->map(function (Batch $batch) {
                $batch->sections->transform(function ($section) use ($batch) {
                    $section->students->transform(function (Student $student) use ($section, $batch) {
                        $student->name = trim("{$student->first_name} {$student->last_name}");
                        $student->profile_picture = $student->photo_url ?? $student->photo;
                        $student->account_user_id = $student->userAccount?->id;
                        $student->user_id = $student->userAccount?->id;
                        $student->section_name = $section->name;
                        $student->batch_name = $batch->name;
                        $student->batch_year = $batch->graduation_year;
                        $student->department = $batch->department;

                        return $student;
                    });

                    return $section;
                });

                return $batch;
            })
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

    // Static Helpers

    public static function getDepartment(string $course): string
    {
        foreach (self::COURSE_ALIASES as $canonical => $aliases) {
            if (in_array(strtolower($course), array_map('strtolower', $aliases), true)) {
                return self::DEPARTMENT_MAP[$canonical] ?? 'General';
            }
        }

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

    // Formatter

    private function formatStudent(Student $student): array
    {
        $data = $student->toArray();

        $data['name']            = trim("{$student->first_name} {$student->last_name}");
        $data['student_record_id'] = $student->id;
        $data['account_user_id'] = $student->userAccount?->id;
        $data['user_id']         = $student->userAccount?->id;
        $data['profile_picture'] = $student->photo_url ?? $student->photo;
        $data['department']      = $student->batch?->department
            ?: self::getDepartment((string) $student->course);
        $data['section_name']    = $student->section?->name;
        $data['batch_year']      = $student->batch?->graduation_year ?? $student->graduation_year;

        return $data;
    }
}
