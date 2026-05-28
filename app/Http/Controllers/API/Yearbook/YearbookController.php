<?php

namespace App\Http\Controllers\API\Yearbook;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\Batch;
use App\Models\Faculty;
use App\Models\User;
use App\Models\Yearbook;
use App\Models\YearbookBookmark;
use App\Services\Yearbook\PageResolverService;
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
        $students = User::with('section')
            ->where('role', 'student')
            ->whereNotNull('student_id')
            ->orderBy('name')
            ->get(['id', 'name', 'student_id', 'course', 'bio', 'profile_picture']);

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
            'title'    => $yearbook?->title ?? 'Senior Yearbook',
            'school'   => config('app.school_name', 'National University Lipa'),
            'year'     => $batch->year ?? now()->year,
            'coverUrl' => $yearbook?->cover_url,
            'theme'    => $yearbook?->theme ?? 'classic',
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
                $q->select('id', 'name', 'student_id', 'course', 'bio', 'profile_picture', 'section_id')
                  ->orderBy('name');
            }])
            ->get();

        $albums = Album::where('batch_id', $batch->id)
            ->with(['photos' => fn ($q) => $q->limit(6)])
            ->get();

        $faculty = User::where('role', 'faculty')
            ->get(['id', 'name', 'profile_picture']);

        $meta = [
            'title'  => 'Senior Yearbook',
            'school' => config('app.school_name', 'National University Lipa'),
            'year'   => $batch->year ?? now()->year,
        ];

        $pages = [];

        // 1. Cover + Dedication
        $pages[] = ['type' => 'cover',      'side' => 'left',  'meta' => $meta];
        $pages[] = ['type' => 'dedication', 'side' => 'right', 'meta' => $meta];

        // 2. TOC placeholders
        $pages[] = ['type' => 'toc', 'side' => 'left',  'toc' => []];
        $pages[] = ['type' => 'toc', 'side' => 'right', 'toc' => []];

        // 3. Section spreads
        foreach ($sections as $section) {
            $pages[] = ['type' => 'section-header', 'side' => 'left',  'section' => $this->mapSection($section)];
            $pages[] = ['type' => 'section-header', 'side' => 'right', 'section' => $this->mapSection($section)];

            $chunks = array_chunk($section->students->toArray(), 4);
            foreach ($chunks as $chunk) {
                $leftPage = count($pages) + 1;
                $pages[]  = ['type' => 'student-grid',   'side' => 'left',  'students' => $chunk, 'section' => $this->mapSection($section), 'pageNum' => $leftPage];
                $pages[]  = ['type' => 'student-quotes', 'side' => 'right', 'students' => $chunk, 'section' => $this->mapSection($section), 'pageNum' => $leftPage + 1];
            }
        }

        // 4. Album/gallery spreads
        foreach ($albums as $album) {
            $pages[] = ['type' => 'gallery', 'side' => 'left',  'gallery' => $this->mapAlbum($album)];
            $pages[] = ['type' => 'gallery', 'side' => 'right', 'gallery' => $this->mapAlbum($album)];
        }

        // 5. Faculty
        if ($faculty->isNotEmpty()) {
            $pages[] = ['type' => 'faculty', 'side' => 'left',  'faculty' => $this->mapFaculty($faculty)];
            $pages[] = ['type' => 'faculty', 'side' => 'right', 'faculty' => $this->mapFaculty($faculty)];
        }

        // 6. Stats + closing
        $allStudents = $sections->flatMap(fn ($s) => $s->students);
        $pages[] = ['type' => 'stats',   'side' => 'left',  'meta' => $meta, 'studentCount' => $allStudents->count(), 'sectionCount' => $sections->count()];
        $pages[] = ['type' => 'closing', 'side' => 'right', 'meta' => $meta];
        $pages[] = ['type' => 'closing', 'side' => 'left',  'meta' => $meta];
        $pages[] = ['type' => 'closing', 'side' => 'right', 'meta' => $meta];

        // Pad to even count (react-pageflip requirement)
        if (count($pages) % 2 !== 0) {
            $pages[] = ['type' => 'blank', 'side' => 'right'];
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

        $students = User::with('section')
            ->where('role', 'student')
            ->when($batchId, fn ($query) =>
                $query->whereHas('section.batch', fn ($q2) => $q2->where('id', $batchId))
            )
            ->where(fn ($query) =>
                $query->where('name',    'LIKE', "%{$q}%")
                      ->orWhere('bio',   'LIKE', "%{$q}%")
                      ->orWhere('course','LIKE', "%{$q}%")
            )
            ->limit(20)
            ->get(['id', 'name', 'bio', 'section_id', 'batch_id']);

        return response()->json($students->map(fn ($s) => [
            'label'     => $s->name,
            'excerpt'   => $s->bio ? mb_substr($s->bio, 0, 80) . '…' : null,
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
            'strand'       => $section->strand ?? null,
            'studentCount' => $section->students?->count() ?? 0,
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
            'role'  => $f->position ?? 'Faculty',
            'photo' => $f->profile_picture ?? null,
        ])->toArray();
    }
}