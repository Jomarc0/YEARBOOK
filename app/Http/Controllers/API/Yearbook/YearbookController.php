<?php

namespace App\Http\Controllers\API\Yearbook;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\Batch;
use App\Models\Faculty;
use App\Models\Student;
use App\Models\User;
use App\Models\Yearbook;
use App\Models\YearbookBookmark;
use App\Services\Yearbook\PageResolverService;
use App\Support\PlatformSettings;
use App\Services\Yearbook\WatermarkService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class YearbookController extends Controller
{
    public function __construct(
        private WatermarkService    $watermark,
        private PageResolverService $pageResolver,
    ) {}

    // ── Existing methods — DO NOT TOUCH ──────────────────────────────────────

    public function exportStudentPdf(Request $request, int $userId)
    {
        $user = User::with(['section', 'achievements', 'taggedPhotos'])
            ->findOrFail($userId);

        $achievements = $user->achievements ?? collect();
        $photos       = ($user->taggedPhotos ?? collect())->take(6);

        $pdf = Pdf::loadView('pdf.student-profile', [
            'user'         => $user,
            'achievements' => $achievements,
            'photos'       => $photos,
        ])->setPaper('a4');

        return $pdf->download("profile-{$user->student_id}.pdf");
    }

    public function exportCertificate(Request $request)
    {
        $user = $request->user();

        $pdf = Pdf::loadView('pdf.graduation-certificate', [
            'user' => $user,
            'date' => now()->format('F j, Y'),
        ])->setPaper('a4', 'landscape');

        return $pdf->download("certificate-{$user->name}.pdf");
    }

    public function flipbookData(): JsonResponse
    {
        $students = Student::with('section:id,name')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get([
                'id',
                'first_name',
                'last_name',
                'student_no',
                'course',
                'student_quote',
                'motto',
                'photo',
                'section_id',
            ])
            ->map(fn ($student) => $this->mapStudent($student));

        return response()->json($students);
    }

    // ── New endpoints ─────────────────────────────────────────────────────────

    /**
     * GET /api/yearbooks/{batch}
     * Yearbook metadata for the cover.
     */
    public function show(Batch $batch): JsonResponse
    {
        $yearbook = Yearbook::where('batch_id', $batch->id)->first();

        return response()->json([
            'title'    => $yearbook?->title ?? PlatformSettings::get('yearbook_name'),
            'school'   => PlatformSettings::get('school_name'),
            'year'     => $batch->year ?? now()->year,
            'academic_year' => PlatformSettings::get('academic_year'),
            'graduation_date' => PlatformSettings::get('graduation_date'),
            'coverUrl' => $yearbook?->cover_url,
            'theme'    => PlatformSettings::get('graduation_theme') ?: ($yearbook?->theme ?? 'classic'),
            'status'   => $yearbook?->status ?? 'published',
            'pdfReady' => $yearbook?->pdf_path !== null,
        ]);
    }

    /**
     * GET /api/yearbooks/{batch}/pages
     * Returns the ordered page manifest consumed by FlipbookViewer.
     */
    public function pages(Batch $batch): JsonResponse
    {
        $sections = $batch->sections()
            ->with(['students' => function ($q) {
                $q->select(
                    'id',
                    'first_name',
                    'last_name',
                    'middle_name',
                    'student_no',
                    'email',
                    'photo',
                    'birthday',
                    'hometown',
                    'nickname',
                    'course',
                    'graduation_year',
                    'honors',
                    'organizations',
                    'achievements',
                    'motto',
                    'student_quote',
                    'fondest_memory',
                    'ambition',
                    'future_plans',
                    'message_to_batchmates',
                    'message_to_parents',
                    'most_likely_to',
                    'facebook_url',
                    'instagram_url',
                    'linkedin_url',
                    'github_url',
                    'section_id'
                )
                ->orderBy('last_name')
                ->orderBy('first_name');
            }, 'adviser:id,name'])
            ->get();

        $albums = Album::where('batch_id', $batch->id)
            ->with(['photos' => fn ($q) => $q->limit(6)])
            ->get();

        $faculty = Faculty::query()
            ->orderBy('name')
            ->get(['id', 'name', 'title', 'department', 'bio', 'image', 'email']);

        $allStudents = $sections->flatMap(fn ($s) => $s->students);
        $mappedStudents = $allStudents->map(fn ($student) => $this->mapStudent($student))->values();
        $stats = $this->buildYearbookStats($mappedStudents, $sections);

        $meta = [
            'title'  => PlatformSettings::get('yearbook_name') ?: 'Sinag-Bughaw Yearbook',
            'school' => PlatformSettings::get('school_name') ?: config('app.school_name', 'National University Lipa'),
            'year'   => $batch->year ?? now()->year,
            'theme'  => PlatformSettings::get('graduation_theme') ?: 'Legacy in Motion',
            'academic_year' => PlatformSettings::get('academic_year'),
            'graduation_date' => PlatformSettings::get('graduation_date'),
        ];

        $pages = [];

        // 1. Cover + opening editorial pages
        $pages[] = ['type' => 'cover',      'side' => 'left',  'meta' => $meta, 'stats' => $stats];
        $pages[] = ['type' => 'dedication', 'side' => 'right', 'meta' => $meta, 'stats' => $stats];

        // 2. TOC placeholders; populated after the manifest is assembled.
        $tocIndexes = [count($pages), count($pages) + 1];
        $pages[] = ['type' => 'toc', 'side' => 'left',  'toc' => []];
        $pages[] = ['type' => 'toc', 'side' => 'right', 'toc' => []];

        $pages[] = ['type' => 'welcome', 'side' => 'left', 'meta' => $meta, 'messageType' => 'university'];
        $pages[] = ['type' => 'welcome', 'side' => 'right', 'meta' => $meta, 'messageType' => 'dean'];
        $pages[] = ['type' => 'welcome', 'side' => 'left', 'meta' => $meta, 'messageType' => 'chair'];
        $pages[] = ['type' => 'program-overview', 'side' => 'right', 'meta' => $meta, 'stats' => $stats];
        $pages[] = ['type' => 'stats', 'side' => 'left', 'meta' => $meta, 'stats' => $stats, 'studentCount' => $allStudents->count(), 'sectionCount' => $sections->count()];
        $pages[] = ['type' => 'achievements', 'side' => 'right', 'meta' => $meta, 'students' => $this->featuredStudents($mappedStudents, 'achievements', 6), 'stats' => $stats];

        // 3. Section spreads with student profile/story pages.
        foreach ($sections as $section) {
            $pages[] = ['type' => 'section-header', 'side' => 'left',  'section' => $this->mapSection($section)];
            $pages[] = ['type' => 'section-header', 'side' => 'right', 'section' => $this->mapSection($section)];

            $students = $section->students
                ->map(fn ($student) => $this->mapStudent($student))
                ->values()
                ->toArray();

            foreach ($students as $student) {
                $pageNumber = count($pages) + 1;
                $pages[] = [
                    'type' => 'student-profile',
                    'side' => $pageNumber % 2 === 0 ? 'right' : 'left',
                    'profilePart' => 'portrait',
                    'student' => $student,
                    'section' => $this->mapSection($section),
                    'pageNum' => $pageNumber,
                ];

                $detailPageNumber = count($pages) + 1;
                $pages[] = [
                    'type' => 'student-profile',
                    'side' => $detailPageNumber % 2 === 0 ? 'right' : 'left',
                    'profilePart' => 'details',
                    'student' => $student,
                    'section' => $this->mapSection($section),
                    'pageNum' => $detailPageNumber,
                ];
            }
        }

        // 4. Album/gallery spreads
        foreach ($albums as $album) {
            $pages[] = ['type' => 'gallery', 'side' => 'left',  'gallery' => $this->mapAlbum($album)];
            $pages[] = ['type' => 'gallery', 'side' => 'right', 'gallery' => $this->mapAlbum($album)];
        }

        // 5. Senior editorial collections. Quotes now live inside each student profile.
        $pages[] = ['type' => 'organizations', 'side' => 'left', 'students' => $this->featuredStudents($mappedStudents, 'organizations', 8), 'meta' => $meta];
        $pages[] = ['type' => 'memories', 'side' => 'right', 'students' => $this->featuredStudents($mappedStudents, 'fondest_memory', 6), 'meta' => $meta];
        $pages[] = ['type' => 'aspirations', 'side' => 'left', 'students' => $this->featuredStudents($mappedStudents, 'future_plans', 6), 'meta' => $meta];

        // 6. Faculty
        if ($faculty->isNotEmpty()) {
            $facultyChunks = array_chunk($this->mapFaculty($faculty), 2);

            for ($i = 0; $i < count($facultyChunks); $i += 2) {
                $leftPage = count($pages) + 1;
                $pages[] = [
                    'type' => 'faculty',
                    'side' => 'left',
                    'faculty' => $facultyChunks[$i] ?? [],
                    'pageNum' => $leftPage,
                ];
                $pages[] = [
                    'type' => 'faculty',
                    'side' => 'right',
                    'faculty' => $facultyChunks[$i + 1] ?? [],
                    'pageNum' => $leftPage + 1,
                ];
            }
        }

        // 7. Directory + closing
        foreach (array_chunk($mappedStudents->toArray(), 18) as $i => $chunk) {
            $pages[] = ['type' => 'directory', 'side' => $i % 2 === 0 ? 'left' : 'right', 'students' => $chunk, 'meta' => $meta];
        }

        $pages[] = ['type' => 'closing', 'side' => 'right', 'meta' => $meta, 'stats' => $stats];
        $pages[] = ['type' => 'closing', 'side' => 'left',  'meta' => $meta];
        $pages[] = ['type' => 'back-cover', 'side' => 'right', 'meta' => $meta];

        // Pad to even count (react-pageflip requirement)
        if (count($pages) % 2 !== 0) {
            $pages[] = ['type' => 'blank', 'side' => 'right'];
        }

        $toc = $this->buildTableOfContents($pages);
        foreach ($tocIndexes as $index) {
            $pages[$index]['toc'] = $toc;
        }

        return response()->json([
            'meta'  => $meta,
            'pages' => $pages,
        ]);
    }

    /**
     * GET /api/yearbooks/{batch}/download  (premium only)
     */
    public function download(Batch $batch): StreamedResponse|JsonResponse
    {
        if ($denied = PlatformSettings::featureDisabled('enable_yearbook_pdf_download', 'Yearbook PDF download')) {
            return $denied;
        }

        if ($denied = PlatformSettings::featureDisabled('publish_yearbook', 'Published yearbook')) {
            return $denied;
        }

        $yearbook = Yearbook::where('batch_id', $batch->id)->first();

        if (!$yearbook?->pdf_path || !Storage::exists($yearbook->pdf_path)) {
            return response()->json(['message' => 'PDF not ready yet.'], 404);
        }

        $user            = Auth::user();
        $watermarkedPath = $this->watermark->apply(
            sourcePath: $yearbook->pdf_path,
            userName:   $user->name,
            userId:     $user->id,
        );

        $filename = "yearbook-{$batch->year}.pdf";

        return Storage::download($watermarkedPath, $filename, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * POST /api/yearbooks/{batch}/generate  (admin only)
     */
    public function generate(Batch $batch): JsonResponse
    {
        Gate::authorize('admin', $batch);

        $yearbook = Yearbook::where('batch_id', $batch->id)->firstOrFail();

        dispatch(new \App\Jobs\Yearbook\GenerateYearbookPdf($yearbook, $batch));
        $yearbook->update(['status' => 'generating']);

        return response()->json(['message' => 'PDF generation queued.', 'status' => 'generating'], 202);
    }

    /**
     * POST /api/yearbooks/{batch}/photos
     */
    public function uploadPhoto(Request $request, Batch $batch): JsonResponse
    {
        $request->validate(['photo' => 'required|image|max:10240']);

        return response()->json(['message' => 'Upload endpoint — wire to your CloudinaryService.'], 501);
    }

    // ── Bookmark endpoints ────────────────────────────────────────────────────

    /**
     * GET /api/yearbook/bookmarks/{batchId}
     */
    public function getBookmarks(int $batchId): JsonResponse
    {
        $bookmarks = YearbookBookmark::where('user_id', Auth::id())
            ->where('batch_id', $batchId)
            ->orderBy('page_index')
            ->get(['id', 'page_index as pageIndex', 'label']);

        return response()->json($bookmarks);
    }

    /**
     * POST /api/yearbook/bookmark
     */
    public function addBookmark(Request $request): JsonResponse
    {
        $data = $request->validate([
            'batchId'   => 'required|integer',
            'pageIndex' => 'required|integer|min:0',
            'label'     => 'required|string|max:120',
        ]);

        $bookmark = YearbookBookmark::updateOrCreate(
            ['user_id' => Auth::id(), 'batch_id' => $data['batchId'], 'page_index' => $data['pageIndex']],
            ['label'   => $data['label']],
        );

        return response()->json($bookmark, 201);
    }

    /**
     * DELETE /api/yearbook/bookmark/{bookmark}
     */
    public function removeBookmark(YearbookBookmark $bookmark): JsonResponse
    {
        if ($bookmark->user_id !== Auth::id()) {
            abort(403, 'Forbidden.');
        }

        $bookmark->delete();

        return response()->json(['deleted' => true]);
    }

    /**
     * GET /api/yearbook/search
     * ── Fixed: pageIndex now resolved via PageResolverService instead of hardcoded 0
     */
    public function search(Request $request): JsonResponse
    {
        $q       = trim($request->query('q', ''));
        $batchId = $request->query('batchId');

        if (!$q) return response()->json([]);

        $students = Student::with('section')
            ->when($batchId, fn ($query) =>
                $query->whereHas('section.batch', fn ($q2) => $q2->where('id', $batchId))
            )
            ->where(fn ($query) =>
                $query->where('first_name', 'LIKE', "%{$q}%")
                      ->orWhere('last_name', 'LIKE', "%{$q}%")
                      ->orWhere('student_no', 'LIKE', "%{$q}%")
                      ->orWhere('course', 'LIKE', "%{$q}%")
                      ->orWhere('student_quote', 'LIKE', "%{$q}%")
                      ->orWhere('motto', 'LIKE', "%{$q}%")
            )
            ->limit(20)
            ->get([
                'id',
                'first_name',
                'last_name',
                'student_no',
                'course',
                'student_quote',
                'motto',
                'section_id',
                'batch_id',
            ]);

        return response()->json($students->map(fn ($s) => [
            'label'     => trim("{$s->first_name} {$s->last_name}"),
            'excerpt'   => ($s->student_quote ?? $s->motto)
                ? mb_substr(($s->student_quote ?? $s->motto), 0, 80) . '...'
                : null,
            'type'      => 'student',
            'pageIndex' => $batchId
                ? $this->pageResolver->getPageIndex($s->id, (int) $batchId)
                : 0,
            'studentId' => $s->id,
        ]));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function mapSection($section): array
    {
        return [
            'id'           => $section->id,
            'name'         => $section->name,
            'strand'       => $section->course ?? $section->strand ?? null,
            'year'         => $section->batch?->graduation_year ?? $section->batch_year ?? null,
            'adviser'      => $section->adviser?->name,
            'studentCount' => $section->students?->count() ?? 0,
        ];
    }

    private function mapStudent(Student $student): array
    {
        $name = trim("{$student->first_name} {$student->last_name}");

        return [
            'id'              => $student->id,
            'name'            => $name,
            'student_id'      => $student->student_no,
            'student_no'      => $student->student_no,
            'course'          => $student->course,
            'bio'             => $student->student_quote ?? $student->motto,
            'motto'           => $student->motto,
            'student_quote'   => $student->student_quote,
            'middle_name'     => $student->middle_name,
            'email'           => $student->email,
            'birthday'        => $student->birthday
                ? date('F j, Y', strtotime((string) $student->birthday))
                : null,
            'hometown'        => $student->hometown,
            'nickname'        => $student->nickname,
            'graduation_year' => $student->graduation_year,
            'honors'          => $student->honors,
            'organizations'   => $student->organizations,
            'achievements'    => $student->achievements,
            'fondest_memory'  => $student->fondest_memory,
            'ambition'        => $student->ambition,
            'future_plans'    => $student->future_plans,
            'message_to_batchmates' => $student->message_to_batchmates,
            'message_to_parents'    => $student->message_to_parents,
            'most_likely_to'  => $student->most_likely_to,
            'facebook_url'    => $student->facebook_url,
            'instagram_url'   => $student->instagram_url,
            'linkedin_url'    => $student->linkedin_url,
            'github_url'      => $student->github_url,
            'profile_picture' => $student->photo,
            'photo'           => $student->photo,
            'section_id'      => $student->section_id,
        ];
    }

    private function mapAlbum($album): array
    {
        return [
            'id'     => $album->id,
            'name'   => $album->name ?? $album->title ?? 'Gallery',
            'photos' => ($album->photos ?? collect())->map(fn ($p) => [
                'url'     => $p->cloudinary_url ?? $p->url ?? null,
                'caption' => $p->caption ?? null,
            ])->toArray(),
        ];
    }

    private function mapFaculty($faculty): array
    {
        return $faculty->map(fn ($f) => [
            'id'    => $f->id,
            'name'  => $f->name,
            'role'  => $f->title ?? $f->department ?? 'Faculty',
            'title' => $f->title,
            'department' => $f->department,
            'bio' => $f->bio,
            'email' => $f->email,
            'photo' => $this->resolveFacultyImageUrl($f->image),
            'image' => $this->resolveFacultyImageUrl($f->image),
        ])->toArray();
}

    private function resolveFacultyImageUrl(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        if (str_starts_with($path, 'http')) {
            return $path;
        }

        if (str_starts_with($path, '/storage/')) {
            return url($path);
        }

        $clean = ltrim(preg_replace('#^(storage|public)/#', '', $path), '/');

        if (Storage::disk('public')->exists($clean)) {
            $baseUrl = rtrim(config('filesystems.disks.public.url', url('/storage')), '/');

            return "{$baseUrl}/{$clean}";
        }

        $cloudName = config('cloudinary.cloud_name');
        if ($cloudName) {
            return "https://res.cloudinary.com/{$cloudName}/image/upload/{$path}";
        }

        return url("/storage/{$clean}");
    }

    private function buildYearbookStats($students, $sections): array
    {
        $students = collect($students);

        return [
            'totalGraduates' => $students->count(),
            'sectionCount' => $sections->count(),
            'courseDistribution' => $students->pluck('course')->filter()->countBy()->sortDesc()->toArray(),
            'honorsDistribution' => $students->pluck('honors')->filter()->countBy()->sortDesc()->toArray(),
            'honorsCount' => $students->filter(fn ($s) => !empty($s['honors']))->count(),
            'achievementCount' => $students->filter(fn ($s) => !empty($s['achievements']))->count(),
            'organizationCount' => $students->filter(fn ($s) => !empty($s['organizations']))->count(),
            'quoteCount' => $students->filter(fn ($s) => !empty($s['student_quote']) || !empty($s['motto']))->count(),
        ];
    }

    private function featuredStudents($students, string $field, int $limit): array
    {
        return collect($students)
            ->filter(fn ($student) => !empty($student[$field]))
            ->take($limit)
            ->values()
            ->toArray();
    }

    private function buildTableOfContents(array $pages): array
    {
        $labels = [
            'cover' => 'Cover',
            'dedication' => 'Dedication',
            'welcome' => 'Welcome Messages',
            'program-overview' => 'Program Overview',
            'stats' => 'Class Statistics',
            'achievements' => 'Achievements',
            'section-header' => 'Class Sections',
            'student-profile' => 'Graduate Profiles',
            'gallery' => 'Memories',
            'organizations' => 'Organizations',
            'memories' => 'Campus Memories',
            'aspirations' => 'Future Aspirations',
            'faculty' => 'Faculty',
            'directory' => 'Graduate Directory',
            'closing' => 'Closing',
            'back-cover' => 'Back Cover',
        ];

        $toc = [];
        foreach ($pages as $index => $page) {
            $type = $page['type'] ?? null;
            if (!isset($labels[$type])) {
                continue;
            }

            $label = $type === 'section-header'
                ? ($page['section']['name'] ?? $labels[$type])
                : $labels[$type];

            if (collect($toc)->contains('label', $label)) {
                continue;
            }

            $toc[] = ['label' => $label, 'pageIndex' => $index];
        }

        return $toc;
    }
}
