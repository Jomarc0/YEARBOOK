<?php

namespace App\Http\Controllers\API\Search;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\Faculty;
use App\Models\User;
use App\Support\PlatformSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    private const PER_PAGE = 20;
    private const SUGGEST_LIMIT = 6;

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
            $results['students'] = User::whereIn('role', PlatformSettings::directoryRoles())
                ->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                      ->orWhere('email', 'like', "%{$query}%")
                      ->orWhereHas('studentRecord', function ($student) use ($query) {
                          $student->where('student_no', 'like', "%{$query}%")
                              ->orWhere('course', 'like', "%{$query}%")
                              ->orWhere('first_name', 'like', "%{$query}%")
                              ->orWhere('last_name', 'like', "%{$query}%");
                      });
                })
                ->when(!$viewer, fn($q) =>
                    $q->where('profile_visibility', 'public')
                )
                ->when($viewer, fn($q) =>
                    $q->where(function ($inner) use ($viewer) {
                        $inner->where('profile_visibility', 'public')
                              ->orWhere(function ($batchmates) use ($viewer) {
                                  $batchmates->whereIn('profile_visibility', ['batchmates', 'alumni_only'])
                                      ->where(function ($sameBatch) use ($viewer) {
                                          $hasBatchScope = false;

                                          if ($viewer->batch_id) {
                                              $sameBatch->orWhere('batch_id', $viewer->batch_id);
                                              $hasBatchScope = true;
                                          }

                                          $viewerYear = $viewer->graduation_year ?? $viewer->batch;
                                          if ($viewerYear) {
                                              $sameBatch
                                                  ->orWhere('graduation_year', $viewerYear)
                                                  ->orWhere('batch', (string) $viewerYear)
                                                  ->orWhereHas('studentRecord', fn($student) =>
                                                      $student->where('graduation_year', $viewerYear)
                                                  );
                                              $hasBatchScope = true;
                                          }

                                          if (! $hasBatchScope) {
                                              $sameBatch->whereRaw('1 = 0');
                                          }
                                      });
                              })
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
        if ($denied = PlatformSettings::featureDisabled('enable_student_directory_search', 'Student directory search')) {
            return $denied;
        }

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

            $builder->whereIn('role', PlatformSettings::directoryRoles());

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
            ->whereIn('role', PlatformSettings::directoryRoles())
            ->when($query !== '', function ($q) use ($query) {
                $q->where(function ($sub) use ($query) {
                    $sub->where('name', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%")
                        ->orWhereHas('studentRecord', function ($student) use ($query) {
                            $student->where('student_no', 'like', "%{$query}%")
                                ->orWhere('course', 'like', "%{$query}%")
                                ->orWhere('first_name', 'like', "%{$query}%")
                                ->orWhere('last_name', 'like', "%{$query}%");
                        });
                });
            })
            ->when($course,      fn($q) => $q->whereHas('studentRecord', fn($s) => $s->where('course', $course)))
            ->when($courseShort, fn($q) => $q->whereHas('studentRecord', fn($s) => $s->where('course', array_search($courseShort, User::COURSE_SHORT, true) ?: $courseShort)))
            ->when($batchYear,   fn($q) => $q->whereHas('studentRecord', fn($s) => $s->where('graduation_year', $batchYear)))
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
                    ->whereIn('role', PlatformSettings::directoryRoles())
                    ->take(self::SUGGEST_LIMIT)
                    ->get();
            } else {
                throw new \RuntimeException('Scout not available');
            }
        } catch (\Throwable) {
            $results = User::whereIn('role', PlatformSettings::directoryRoles())
                ->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                      ->orWhere('email', 'like', "%{$query}%")
                      ->orWhereHas('studentRecord', fn($student) => $student->where('student_no', 'like', "%{$query}%"));
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
        $courses = \App\Models\Student::query()
            ->whereNotNull('course')
            ->select('course')
            ->distinct()
            ->orderBy('course')
            ->pluck('course')
            ->map(fn($c) => ['label' => $this->shortCourse($c), 'value' => $c]);

        $batchYears = \App\Models\Student::query()
            ->whereNotNull('graduation_year')
            ->pluck('graduation_year')
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
        return User::COURSE_SHORT[$course] ?? $course ?? 'Student';
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
