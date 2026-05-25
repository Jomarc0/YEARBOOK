<?php

namespace App\Http\Controllers\API\Search;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\Faculty;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    private const PER_PAGE = 20;
    private const SUGGEST_LIMIT = 6;

    private const COURSE_SHORT = [
        'Bachelor of Science in Computer Science'       => 'BSCS',
        'Bachelor of Science in Information Technology' => 'BSIT',
        'Bachelor of Science in Civil Engineering'      => 'BSCE',
        'Bachelor of Science in Mechanical Engineering' => 'BSME',
        'Bachelor of Science in Nursing'                => 'Nursing',
        'Bachelor of Science in Accountancy'            => 'Accountancy',
        'Bachelor of Science in Psychology'             => 'Psychology',
        'Bachelor of Education'                         => 'Education',
    ];

    // ── Legacy search (kept for backward compatibility) ─────────────────────────
    public function search(Request $request)
    {
        $query  = $request->get('q', '');
        $type   = $request->get('type', 'all');
        $viewer = $request->user();

        if (strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        $results = [];

        if (in_array($type, ['students', 'all'])) {
            $results['students'] = User::where('role', 'student')
                ->where(function ($q) use ($query) {
                    $q->where('name',       'like', "%{$query}%")
                      ->orWhere('student_id', 'like', "%{$query}%")
                      ->orWhere('course',     'like', "%{$query}%");
                })
                ->when(!$viewer, fn($q) =>
                    $q->where('profile_visibility', 'public')
                )
                ->when($viewer, fn($q) =>
                    $q->where(function ($inner) use ($viewer) {
                        $inner->whereIn('profile_visibility', ['public', 'alumni_only'])
                              ->orWhere('id', $viewer->id);
                    })
                )
                ->take(10)
                ->get()
                ->map(fn($u) => [
                    'id'              => $u->id,
                    'name'            => $u->name,
                    'student_id'      => $u->student_id,
                    'course'          => $u->course,
                    'profile_picture' => $u->profile_picture,
                ]);
        }

        if (in_array($type, ['faculty', 'all'])) {
            $results['faculty'] = Faculty::where('name', 'like', "%{$query}%")
                ->take(5)->get();
        }

        if (in_array($type, ['albums', 'all'])) {
            $results['albums'] = Album::where('title', 'like', "%{$query}%")
                ->take(5)->get();
        }

        return response()->json(['results' => $results, 'query' => $query]);
    }

    // ── Student search — DB-based with Scout fallback ──────────────────────────
    public function students(Request $request): JsonResponse
    {
        $query       = trim($request->get('q', ''));
        $course      = $request->get('course');
        $courseShort = $request->get('course_short');
        $batchYear   = $request->get('batch_year');
        $section     = $request->get('section');
        $perPage     = min((int) $request->get('per_page', self::PER_PAGE), 100);

        // Use Scout only if it's properly configured and a query is present.
        // Otherwise fall back to Eloquent so the endpoint never 500s.
        if ($query !== '' && $this->scoutAvailable()) {
            return $this->studentsViaScout(
                $query, $course, $courseShort, $batchYear, $section, $perPage
            );
        }

        return $this->studentsViaDatabase(
            $query, $course, $courseShort, $batchYear, $section, $perPage
        );
    }

    // ── Scout path (only called when Meilisearch is reachable) ─────────────────
    private function studentsViaScout(
        string  $query,
        ?string $course,
        ?string $courseShort,
        ?string $batchYear,
        ?string $section,
        int     $perPage
    ): JsonResponse {
        try {
            $builder = User::search($query);

            if ($course)      $builder->where('course',       $course);
            if ($courseShort) $builder->where('course_short', $courseShort);
            if ($batchYear)   $builder->where('batch_year',   (int) $batchYear);
            if ($section)     $builder->where('section',      $section);

            $builder->where('role', 'student');

            $paginator = $builder->paginate($perPage);

            return response()->json([
                'data' => collect($paginator->items())
                            ->map(fn(User $u) => $this->formatStudent($u)),
                'meta' => [
                    'total'        => $paginator->total(),
                    'per_page'     => $paginator->perPage(),
                    'current_page' => $paginator->currentPage(),
                    'last_page'    => $paginator->lastPage(),
                    'query'        => $query,
                    'engine'       => 'scout',
                ],
            ]);
        } catch (\Throwable $e) {
            // Meilisearch went down mid-request — silently fall back to DB

            return $this->studentsViaDatabase(
                $query, $course, $courseShort, $batchYear, $section, $perPage
            );
        }
    }

    // ── Eloquent / DB path (always safe) ───────────────────────────────────────
    private function studentsViaDatabase(
        string  $query,
        ?string $course,
        ?string $courseShort,
        ?string $batchYear,
        ?string $section,
        int     $perPage
    ): JsonResponse {
        $builder = User::with('section')
            ->where('role', 'student')
            ->when($query !== '', function ($q) use ($query) {
                $q->where(function ($sub) use ($query) {
                    $sub->where('name',       'like', "%{$query}%")
                        ->orWhere('student_id', 'like', "%{$query}%")
                        ->orWhere('course',     'like', "%{$query}%");
                });
            })
            ->when($course,      fn($q) => $q->where('course', $course))
            ->when($courseShort, fn($q) => $q->where('course', array_search($courseShort, self::COURSE_SHORT) ?: $courseShort))
            ->when($batchYear,   fn($q) => $q->whereHas('section', fn($s) => $s->where('batch_year', $batchYear)))
            ->when($section,     fn($q) => $q->whereHas('section', fn($s) => $s->where('name', $section)))
            ->orderBy('name');

        $paginator = $builder->paginate($perPage);

        return response()->json([
            'data' => $paginator->through(fn(User $u) => $this->formatStudent($u))->items(),
            'meta' => [
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'query'        => $query,
                'engine'       => 'database',
            ],
        ]);
    }

    // ── Suggest ────────────────────────────────────────────────────────────────
    public function suggest(Request $request): JsonResponse
    {
        $query = trim($request->get('q', ''));

        if (strlen($query) < 1) {
            return response()->json(['suggestions' => []]);
        }

        // Prefer Scout if available, otherwise use DB LIKE
        try {
            if ($this->scoutAvailable()) {
                $results = User::search($query)
                    ->where('role', 'student')
                    ->take(self::SUGGEST_LIMIT)
                    ->get();
            } else {
                throw new \RuntimeException('Scout not available');
            }
        } catch (\Throwable) {
            $results = User::where('role', 'student')
                ->where(function ($q) use ($query) {
                    $q->where('name',       'like', "%{$query}%")
                      ->orWhere('student_id', 'like', "%{$query}%");
                })
                ->orderBy('name')
                ->take(self::SUGGEST_LIMIT)
                ->get();
        }

        return response()->json([
            'suggestions' => $results->map(fn(User $u) => [
                'id'              => $u->id,
                'name'            => $u->name,
                'student_id'      => $u->student_id,
                'course_short'    => $this->shortCourse($u->course),
                'profile_picture' => $u->profile_picture,
                'url'             => "/profile/{$u->id}",
            ]),
        ]);
    }

    // ── Filters ────────────────────────────────────────────────────────────────
    public function studentFilters(): JsonResponse
    {
        $courses = User::where('role', 'student')
            ->whereNotNull('course')
            ->select('course')
            ->distinct()
            ->orderBy('course')
            ->pluck('course')
            ->map(fn($c) => ['label' => $this->shortCourse($c), 'value' => $c]);

        $batchYears = User::where('role', 'student')
            ->whereHas('section', fn($q) => $q->whereNotNull('batch_year'))
            ->with('section:id,batch_year')
            ->get()
            ->pluck('section.batch_year')
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return response()->json([
            'courses'     => $courses,
            'batch_years' => $batchYears,
        ]);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    private function formatStudent(User $user): array
    {
        return [
            'id'              => $user->id,
            'name'            => $user->name,
            'student_id'      => $user->student_id,
            'email'           => $user->email,
            'course'          => $user->course,
            'course_short'    => $this->shortCourse($user->course),
            'section'         => $user->section?->name,
            'batch_year'      => $user->section?->batch_year,
            'profile_picture' => $user->profile_picture,
        ];
    }

    private function shortCourse(?string $course): string
    {
        return self::COURSE_SHORT[$course] ?? $course ?? 'Student';
    }

    // Returns true only when Scout/Meilisearch is configured and reachable.
    private function scoutAvailable(): bool
    {
        $driver = config('scout.driver');

        if (!$driver || $driver === 'null') {
            return false;
        }

        if ($driver === 'meilisearch') {
            try {
                /** @var \Meilisearch\Client $client */
                $client = app(\Laravel\Scout\Engines\MeilisearchEngine::class);
                // health() throws if the server is unreachable
                app('meilisearch')->health();
                return true;
            } catch (\Throwable) {
                return false;
            }
        }

        return true; // algolia, database driver, etc.
    }
}