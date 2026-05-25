<?php

namespace App\Services\Student;

use App\Models\Batch;
use App\Models\Section;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class BatchService
{
    // ── Static Maps ────────────────────────────────────────────────────────

    public const DEPARTMENT_MAP = [
        'Bachelor of Science in Computer Science'       => 'College of Computing',
        'Bachelor of Science in Information Technology' => 'College of Computing',
        'Bachelor of Science in Civil Engineering'      => 'College of Engineering',
        'Bachelor of Science in Mechanical Engineering' => 'College of Engineering',
        'Bachelor of Science in Nursing'                => 'College of Nursing',
        'Bachelor of Science in Accountancy'            => 'College of Business and Accountancy',
        'Bachelor of Science in Psychology'             => 'College of Liberal Arts',
        'Bachelor of Education'                         => 'College of Education',
    ];

    public const COURSE_CODE_MAP = [
        'Bachelor of Science in Computer Science'       => 'BSCS',
        'Bachelor of Science in Information Technology' => 'BSIT',
        'Bachelor of Science in Civil Engineering'      => 'BSCE',
        'Bachelor of Science in Mechanical Engineering' => 'BSME',
        'Bachelor of Science in Nursing'                => 'BSN',
        'Bachelor of Science in Accountancy'            => 'BSA',
        'Bachelor of Science in Psychology'             => 'BSP',
        'Bachelor of Education'                         => 'BEd',
    ];

    // ── Batch Generation ───────────────────────────────────────────────────

    public function generateBatches(): int
    {
        $created = 0;

        User::whereNotNull('graduation_year')
            ->whereNotNull('course')
            ->where('role', 'student')
            ->select('course', 'graduation_year')
            ->distinct()
            ->get()
            ->each(function ($group) use (&$created) {
                $code = self::getCourseCode($group->course);
                $dept = self::getDepartment($group->course);

                $batch = Batch::firstOrCreate(
                    ['course' => $group->course, 'graduation_year' => $group->graduation_year],
                    ['name' => "{$code} Batch {$group->graduation_year}", 'course_code' => $code, 'department' => $dept]
                );

                if ($batch->wasRecentlyCreated) $created++;
            });

        return $created;
    }

    public function assignUsersToBatches(): int
    {
        $updated = 0;
        Batch::all()->each(function (Batch $batch) use (&$updated) {
            $updated += User::where('course', $batch->course)
                ->where('graduation_year', $batch->graduation_year)
                ->where('role', 'student')
                ->update(['batch_id' => $batch->id]);
        });
        return $updated;
    }

    public function generateSections(int $studentsPerSection = 40): int
    {
        $created = 0;
        Batch::with('sections')->get()->each(function (Batch $batch) use ($studentsPerSection, &$created) {
            if ($batch->sections->isNotEmpty()) return;

            $total    = User::where('batch_id', $batch->id)->count();
            $numSects = max(1, (int) ceil($total / $studentsPerSection));
            $letters  = range('A', 'Z');

            for ($i = 0; $i < $numSects; $i++) {
                Section::firstOrCreate(
                    ['name' => $letters[$i], 'batch_id' => $batch->id],
                    ['course' => $batch->course, 'batch_year' => $batch->graduation_year]
                );
                $created++;
            }

            $sectionIds = Section::where('batch_id', $batch->id)->pluck('id')->toArray();
            User::where('batch_id', $batch->id)->whereNull('section_id')->pluck('id')
                ->each(fn($uid, $idx) => User::where('id', $uid)->update([
                    'section_id' => $sectionIds[$idx % count($sectionIds)],
                ]));
        });
        return $created;
    }

    // ── Discovery: My Batch ────────────────────────────────────────────────

    public function getBatchmates(User $viewer, ?string $course = null, ?int $year = null): array
    {
        $isPremium    = $viewer->is_premium;
        $targetCourse = $course ?? $viewer->course;
        $targetYear   = $year   ?? $viewer->graduation_year;

        $query = User::where('role', 'student')
            ->where('id', '!=', $viewer->id)
            ->where('course', $targetCourse)
            ->where('graduation_year', $targetYear)
            ->where('profile_visibility', '!=', 'private');

        if (! $isPremium) {
            $query->where('profile_visibility', 'public')
                  ->select(['id', 'name', 'profile_picture', 'course', 'student_id']);
        } else {
            $query->whereIn('profile_visibility', ['public', 'connections_only'])
                  ->select(['id', 'name', 'profile_picture', 'course', 'student_id',
                             'graduation_year', 'section_id', 'batch', 'motto', 'profile_visibility']);
        }

        return $query->with($isPremium ? ['section:id,name'] : [])->orderBy('name')->get()->toArray();
    }

    // ── Discovery: My Section ──────────────────────────────────────────────

    public function getSectionmates(User $viewer): array
    {
        if (! $viewer->section_id) return [];

        $isPremium = $viewer->is_premium;

        $query = User::where('section_id', $viewer->section_id)
            ->where('id', '!=', $viewer->id)
            ->where('profile_visibility', '!=', 'private');

        if (! $isPremium) {
            $query->where('profile_visibility', 'public')
                  ->select(['id', 'name', 'profile_picture', 'course', 'student_id', 'section_id']);
        } else {
            $query->whereIn('profile_visibility', ['public', 'connections_only'])
                  ->select(['id', 'name', 'profile_picture', 'course', 'student_id',
                             'section_id', 'graduation_year', 'motto', 'profile_visibility']);
        }

        return $query->orderBy('name')->get()->toArray();
    }

    // ── Discovery: Whole School ────────────────────────────────────────────

    /**
     * Paginated view of all students across every batch, course, section.
     * Supports server-side search, course, year, department filters.
     * Respects subscription and visibility rules.
     */
    public function getWholeSchool(
        User    $viewer,
        array   $filters  = [],
        int     $perPage  = 40
    ): LengthAwarePaginator {
        $isPremium = $viewer->is_premium;

        $query = User::where('role', 'student')
            ->where('id', '!=', $viewer->id)
            ->where('profile_visibility', '!=', 'private');

        // ── Subscription gate ──────────────────────────────────────────────
        if (! $isPremium) {
            // Free tier: public profiles only + limited columns
            $query->where('profile_visibility', 'public')
                  ->select(['id', 'name', 'profile_picture', 'course', 'student_id', 'graduation_year']);
        } else {
            $query->whereIn('profile_visibility', ['public', 'connections_only'])
                  ->select(['id', 'name', 'profile_picture', 'course', 'student_id',
                             'graduation_year', 'section_id', 'batch_id',
                             'motto', 'profile_visibility'])
                  ->with(['section:id,name', 'batchRecord:id,name,course_code']);
        }

        // ── Filters ────────────────────────────────────────────────────────

        // Text search (server-side LIKE — for full-text use Meilisearch)
        if (! empty($filters['search'])) {
            $term = $filters['search'];
            $query->where(fn ($q) =>
                $q->where('name',       'like', "%{$term}%")
                  ->orWhere('student_id', 'like', "%{$term}%")
            );
        }

        // Filter by specific course
        if (! empty($filters['course'])) {
            $query->where('course', $filters['course']);
        }

        // Filter by department (maps to multiple courses)
        if (! empty($filters['department'])) {
            $courses = collect(self::DEPARTMENT_MAP)
                ->filter(fn ($d) => $d === $filters['department'])
                ->keys()->toArray();
            $query->whereIn('course', $courses);
        }

        // Filter by graduation year
        if (! empty($filters['year'])) {
            $query->where('graduation_year', (int) $filters['year']);
        }

        // Filter by section
        if (! empty($filters['section_id'])) {
            $query->where('section_id', (int) $filters['section_id']);
        }

        return $query->orderBy('course')->orderBy('name')->paginate($perPage);
    }

    // ── Discovery: Cross-Program ───────────────────────────────────────────

    /**
     * Students from programs OTHER than the viewer's own course.
     * Grouped by course/program for easy browsing.
     * Supports fuzzy-search via Fuse.js on the client side.
     * Respects subscription and visibility rules.
     */
    public function getCrossProgram(
        User    $viewer,
        array   $filters = [],
        int     $perPage = 40
    ): LengthAwarePaginator {
        $isPremium     = $viewer->is_premium;
        $excludeCourse = $filters['exclude_course'] ?? $viewer->course;

        $query = User::where('role', 'student')
            ->where('id', '!=', $viewer->id)
            ->where('profile_visibility', '!=', 'private');

        // Exclude viewer's own program (or custom exclusion)
        if ($excludeCourse) {
            $query->where('course', '!=', $excludeCourse);
        }

        // ── Subscription gate ──────────────────────────────────────────────
        if (! $isPremium) {
            $query->where('profile_visibility', 'public')
                  ->select(['id', 'name', 'profile_picture', 'course', 'student_id', 'graduation_year']);
        } else {
            $query->whereIn('profile_visibility', ['public', 'connections_only'])
                  ->select(['id', 'name', 'profile_picture', 'course', 'student_id',
                             'graduation_year', 'motto', 'profile_visibility']);
        }

        // ── Filters ────────────────────────────────────────────────────────

        // Department filter
        if (! empty($filters['department'])) {
            $courses = collect(self::DEPARTMENT_MAP)
                ->filter(fn ($d) => $d === $filters['department'])
                ->keys()->toArray();
            $query->whereIn('course', $courses);
        }

        // Specific course filter (within cross-program)
        if (! empty($filters['course'])) {
            $query->where('course', $filters['course']);
        }

        // Graduation year
        if (! empty($filters['year'])) {
            $query->where('graduation_year', (int) $filters['year']);
        }

        // Server-side search fallback (Fuse.js handles client fuzzy)
        if (! empty($filters['search'])) {
            $term = $filters['search'];
            $query->where(fn ($q) =>
                $q->where('name',       'like', "%{$term}%")
                  ->orWhere('student_id', 'like', "%{$term}%")
            );
        }

        return $query->orderBy('course')->orderBy('graduation_year', 'desc')->orderBy('name')
                     ->paginate($perPage);
    }

    /**
     * Stats for Cross-Program discovery header.
     */
    public function getCrossProgramStats(User $viewer): array
    {
        $base = User::where('role', 'student')
            ->where('id', '!=', $viewer->id)
            ->where('course', '!=', $viewer->course)
            ->where('profile_visibility', '!=', 'private');

        return [
            'total_students' => $base->count(),
            'total_programs' => (clone $base)->distinct('course')->count('course'),
            'departments'    => array_unique(array_values(self::DEPARTMENT_MAP)),
        ];
    }

    // ── Existing helpers ───────────────────────────────────────────────────

    public function getByDepartment(User $viewer, string $department): Collection
    {
        $isPremium = $viewer->is_premium;
        $courses   = collect(self::DEPARTMENT_MAP)->filter(fn ($d) => $d === $department)->keys()->toArray();

        $query = User::where('role', 'student')
            ->where('id', '!=', $viewer->id)
            ->whereIn('course', $courses)
            ->where('profile_visibility', '!=', 'private');

        if (! $isPremium) {
            $query->where('profile_visibility', 'public')
                  ->select(['id', 'name', 'profile_picture', 'course', 'student_id', 'graduation_year']);
        } else {
            $query->whereIn('profile_visibility', ['public', 'connections_only'])
                  ->select(['id', 'name', 'profile_picture', 'course', 'student_id',
                             'graduation_year', 'motto', 'profile_visibility']);
        }

        return $query->orderBy('course')->orderBy('graduation_year')->get()->groupBy('course');
    }

    public function getBatchesByDepartment(): Collection
    {
        return Batch::withCount('students')
            ->with('sections:id,batch_id,name')
            ->orderBy('department')->orderBy('graduation_year', 'desc')
            ->get()->groupBy('department');
    }

    public function getBatchStats(Batch $batch): array
    {
        return [
            'total_students'  => $batch->students()->count(),
            'public_profiles' => $batch->students()->where('profile_visibility', 'public')->count(),
            'sections'        => $batch->sections()->withCount('students')->get(['id', 'name']),
        ];
    }

    // ── Static helpers ─────────────────────────────────────────────────────

    public static function getDepartment(string $course): string
    {
        return self::DEPARTMENT_MAP[$course] ?? 'General Department';
    }

    public static function getCourseCode(string $course): string
    {
        return self::COURSE_CODE_MAP[$course] ?? strtoupper(substr($course, 0, 4));
    }

    public static function getAllDepartments(): array
    {
        return array_unique(array_values(self::DEPARTMENT_MAP));
    }
}