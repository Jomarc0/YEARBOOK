<?php

namespace App\Http\Controllers\API\AI;

use App\Contracts\FaceRecognition;
use App\Http\Controllers\Controller;
use App\Http\Resources\TaggedPhotoResource;
use App\Jobs\AI\AnalyzePhotoFaces;
use App\Models\AuditLog;
use App\Models\Photo;
use App\Models\Setting;
use App\Models\TaggedPhoto;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FaceRecognitionController extends Controller
{
    public function __construct(
        private readonly FaceRecognition $faceRecognition,
    ) {}

    // ── Sync all student profile pictures into Rekognition ────────────────

    public function syncStudents(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        try {
            $students = User::whereNotNull('profile_picture')->get();
            $result   = $this->faceRecognition->syncStudents($students);

            AuditLog::record(
                $request,
                'Sync Faces',
                "Indexed: {$result['indexed']}, Skipped: {$result['skipped']}"
            );

            return response()->json([
                'success' => true,
                'indexed' => $result['indexed'],
                'skipped' => $result['skipped'],
                'errors'  => $result['errors'] ?? [],
            ]);
        } catch (\Exception $e) {
            AuditLog::record($request, 'Sync Faces Error', $e->getMessage(), 'Warning');

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // ── Search for a student by uploaded face photo ───────────────────────

    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'face_image' => 'required|image|max:5120',
        ]);

        try {
            $threshold    = (float) Setting::getValue('face_recognition_threshold', '90');
            $searchResult = $this->faceRecognition->searchUploadedFace(
                $request->file('face_image'),
                5,
                $threshold
            );

            // Enrich each matched student with their tagged gallery photos
            $studentPhotos = [];

            if (! empty($searchResult['matches'])) {
                $matchedIds = collect($searchResult['matches'])
                    ->pluck('user_id')
                    ->filter()
                    ->values()
                    ->all();

                if (! empty($matchedIds)) {
                    $studentPhotos = TaggedPhoto::whereIn('user_id', $matchedIds)
                        ->with([
                            'photo:id,file_path,caption,album_id',
                            'user:id,name,profile_picture',
                        ])
                        ->get()
                        ->groupBy('user_id')
                        ->map(fn ($tags, $userId) => [
                            'user_id' => $userId,
                            'photos'  => $tags->take(6)->map(fn ($t) => [
                                'photo_id'  => $t->photo_id,
                                'file_path' => $t->photo?->file_path,
                                'album_id'  => $t->photo?->album_id,
                                'caption'   => $t->photo?->caption,
                            ])->values()->all(),
                        ])
                        ->values()
                        ->all();
                }
            }

            AuditLog::record(
                $request,
                'Face Search',
                'Matches: ' . count($searchResult['matches'] ?? [])
            );

            return response()->json(array_merge($searchResult, [
                'student_photos' => $studentPhotos,
            ]));
        } catch (\Exception $e) {
            AuditLog::record($request, 'Face Search Error', $e->getMessage(), 'Warning');

            return response()->json([
                'status'  => 'error',
                'matches' => [],
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // ── Return face tags for a single photo ───────────────────────────────

    public function photoTags(Photo $photo): JsonResponse
    {
        $tags = $photo->taggedPhotos()
            ->with('user:id,name,student_id,course,profile_picture')
            ->orderByDesc('similarity')
            ->get();

        $meta = $photo->ai_metadata ?? [];

        return response()->json([
            'photo_id'    => $photo->id,
            'status' => data_get($meta, 'status', $tags->isEmpty() ? 'pending' : 'analyzed'),
            'face_count'  => data_get($meta, 'face_count', $tags->count()),
            'analyzed_at' => data_get($meta, 'analyzed_at'),
            'provider'    => data_get($meta, 'provider', 'aws-rekognition'),
            'tags'        => TaggedPhotoResource::collection($tags),
            
        ]);
    }

    // ── Admin: queue analysis for a single photo ──────────────────────────

    public function analyzePhoto(Request $request, Photo $photo): JsonResponse
    {
        $this->ensureAdmin($request);

        AnalyzePhotoFaces::dispatch($photo, force: true);
        AuditLog::record($request, 'Photo Analyze', "Queued Photo #{$photo->id}");

        return response()->json(['queued' => true, 'photo_id' => $photo->id]);
    }

    // ── Admin: bulk-queue analysis for every photo in an album ────────────
    // Staggers dispatch 2s apart to respect Rekognition TPS limits.

    public function analyzeAlbum(Request $request, int $albumId): JsonResponse
    {
        $this->ensureAdmin($request);

        $photos = Photo::where('album_id', $albumId)->get();
        $count  = 0;

        foreach ($photos as $index => $photo) {
            AnalyzePhotoFaces::dispatch($photo, force: true)
                ->delay(now()->addSeconds($index * 2));
            $count++;
        }

        AuditLog::record($request, 'Album Analyze', "Queued {$count} photos in Album #{$albumId}");

        return response()->json([
            'queued'   => $count,
            'album_id' => $albumId,
            'message'  => "Face analysis queued for {$count} photo(s).",
        ]);
    }

    // ── All gallery photos a student appears in ───────────────────────────

    public function studentPhotos(int $userId): JsonResponse
    {
        $tags = TaggedPhoto::where('user_id', $userId)
            // Include both AI and manual tags
            ->whereIn('source', ['rekognition', 'manual'])
            // Only show approved tags (manual tags now have status='approved')
            ->where(function ($q) {
                $q->where('status', 'approved')
                ->orWhereNull('status'); // keep backward compat for old AI tags
            })
            // Only tags that have a valid photo_id (manual tags use this)
            ->whereNotNull('photo_id')
            ->with([
                'photo:id,file_path,caption,album_id',
                'photo.album:id,title,event_date',
            ])
            ->orderByDesc('created_at') // more reliable than similarity for mixed sources
            ->paginate(24);

        return response()->json([
            'data' => collect($tags->items())->map(fn (TaggedPhoto $t) => [
                'tag_id'     => $t->id,
                'photo_id'   => $t->photo_id,
                'similarity' => $t->similarity,
                'confidence' => $t->confidence,
                'source'     => $t->source,
                'photo'      => $t->photo ? [
                    'file_path' => $t->photo->file_path,
                    'caption'   => $t->photo->caption,
                    'album'     => $t->photo->album ? [
                        'id'         => $t->photo->album->id,
                        'title'      => $t->photo->album->title,
                        'event_date' => $t->photo->album->event_date,
                    ] : null,
                ] : null,
            ]),
            'meta' => [
                'total'        => $tags->total(),
                'current_page' => $tags->currentPage(),
                'last_page'    => $tags->lastPage(),
            ],
        ]);
    }

    // ── Private ───────────────────────────────────────────────────────────

    /** Uses Sanctum — works with stateless Bearer token auth. */
    private function ensureAdmin(Request $request): void
    {
        if ($request->user()?->role !== 'admin') {
            abort(403, 'Unauthorized access.');
        }
    }
}