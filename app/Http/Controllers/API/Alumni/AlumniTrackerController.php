<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Alumni;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Yearbook\PageResolverService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AlumniTrackerController extends Controller
{
    public function __construct(
        private PageResolverService $pageResolver
    ) {}

    // ── List ──────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->with(['section', 'batchRecord', 'careerProfile'])
            ->where('role', 'student');

        if ($q = $request->string('q')->trim()->value()) {
            $query->where('name', 'like', "%{$q}%");
        }

        if ($batchId = $request->integer('batch_id', 0)) {
            $query->where('batch_id', $batchId);
        }

        if ($field = $request->string('field')->trim()->value()) {
            $query->whereHas('careerProfile', fn ($c) => $c->where('field', $field));
        }

        $alumni = $query->orderBy('name')->paginate(24);

        return response()->json([
            'success'      => true,
            'data'         => $alumni->map(fn (User $u) => $this->formatAlumni($u)),
            'total'        => $alumni->total(),
            'current_page' => $alumni->currentPage(),
            'last_page'    => $alumni->lastPage(),
        ]);
    }

    // ── Single ────────────────────────────────────────────────────────────────

    public function show(int $id): JsonResponse
    {
        $user = User::with(['section', 'batchRecord', 'careerProfile'])
            ->where('role', 'student')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $this->formatAlumni($user, detailed: true),
        ]);
    }

    // ── Own profile ───────────────────────────────────────────────────────────

    public function me(): JsonResponse
    {
        $user = User::with(['section', 'batchRecord', 'careerProfile'])
            ->findOrFail(Auth::id());

        return response()->json([
            'success' => true,
            'data'    => $this->formatAlumni($user, detailed: true),
        ]);
    }

    // ── Update career ─────────────────────────────────────────────────────────

    public function updateCareer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'job_title' => ['nullable', 'string', 'max:120'],
            'company'   => ['nullable', 'string', 'max:120'],
            'location'  => ['nullable', 'string', 'max:120'],
            'field'     => ['nullable', 'string', 'max:80'],
            'bio'       => ['nullable', 'string', 'max:400'],
        ]);

        /** @var User $user */
        $user = Auth::user();

        $user->careerProfile()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Career profile updated.',
        ]);
    }

    // ── By batch ──────────────────────────────────────────────────────────────

    public function byBatch(int $batchId): JsonResponse
    {
        $users = User::with(['section', 'batchRecord', 'careerProfile'])
            ->where('role', 'student')
            ->where('batch_id', $batchId)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $users->map(fn (User $u) => $this->formatAlumni($u)),
        ]);
    }

    // ── Search ────────────────────────────────────────────────────────────────

    public function search(Request $request): JsonResponse
    {
        $q = $request->string('q')->trim()->value();

        if (strlen($q) < 2) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $results = User::with(['section', 'batchRecord', 'careerProfile'])
            ->where('role', 'student')
            ->where('name', 'like', "%{$q}%")
            ->orderBy('name')
            ->limit(10)
            ->get()
            ->map(fn (User $u) => $this->formatAlumni($u));

        return response()->json(['success' => true, 'data' => $results]);
    }

    // ── DEEP LINK: Alumni Tracker → Yearbook ──────────────────────────────────

    public function yearbookEntry(int $id): JsonResponse
    {
        $user  = User::with('batchRecord')->findOrFail($id);
        $batch = $user->batchRecord;

        if (!$batch) {
            return response()->json([
                'success' => false,
                'message' => 'No yearbook entry found for this alumni.',
            ], 404);
        }

        $pageIndex = $this->pageResolver->getPageIndex($user->id, $batch->id);

        return response()->json([
            'success' => true,
            'data'    => [
                'batch_id'   => $batch->id,
                'batch_year' => $batch->year,
                'page_index' => $pageIndex,
                'user_id'    => $user->id,
                'name'       => $user->name,
                // Frontend builds: /yearbook/{batch_id}/view?page={page_index}
            ],
        ]);
    }

    // ── DEEP LINK: Yearbook → Alumni Tracker ──────────────────────────────────

    public function fromYearbookPage(Request $request): JsonResponse
    {
        $request->validate([
            'batch_id'   => ['required', 'integer'],
            'page_index' => ['required', 'integer', 'min:0'],
        ]);

        $batchId   = (int) $request->input('batch_id');
        $pageIndex = (int) $request->input('page_index');

        $user = $this->pageResolver->getUserAtPage($batchId, $pageIndex);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No alumni linked to this page.',
            ], 404);
        }

        $career = $user->careerProfile;

        return response()->json([
            'success' => true,
            'data'    => [
                'alumni_id'   => $user->id,
                'name'        => $user->name,
                'batch_year'  => $user->batchRecord?->year,
                'career'      => $career ? [
                    'job_title' => $career->job_title,
                    'company'   => $career->company,
                    'location'  => $career->location,
                    'field'     => $career->field,
                ] : null,
                'tracker_url' => "/alumni-tracker?batch_id={$batchId}&highlight={$user->id}",
            ],
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function formatAlumni(User $user, bool $detailed = false): array
    {
        $career  = $user->careerProfile;
        $batch   = $user->batchRecord;
        $section = $user->section;

        return [
            'id'              => $user->id,
            'name'            => $user->name,
            'email'           => $detailed ? $user->email : null,
            'profile_picture' => $user->profile_picture ?? $user->avatar,
            'batch_year'      => $batch?->year,
            'batch_id'        => $batch?->id,
            'section'         => $section?->name,
            'course'          => $user->course,
            'graduation_year' => $user->graduation_year,
            'is_verified'     => (bool) $user->email_verified_at,
            'career'          => $career ? [
                'job_title' => $career->job_title,
                'company'   => $career->company,
                'location'  => $career->location,
                'field'     => $career->field,
                'bio'       => $detailed ? $career->bio : null,
            ] : null,
        ];
    }
}