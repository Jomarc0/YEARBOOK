<?php

namespace App\Http\Controllers\API\AI;

use App\Contracts\FaceRecognition;
use Aws\Rekognition\RekognitionClient;
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
            $threshold = (float) Setting::getValue('face_recognition_threshold', '75');
            $file      = $request->file('face_image');
            $bytes     = file_get_contents($file->getRealPath());

            // Search Rekognition — returns ALL matches (student:X and photo:X)
            $rekognitionResult = $this->faceRecognition->searchUploadedFace($file, 20, $threshold);

            $matches      = $rekognitionResult['matches'] ?? [];
            $studentIds   = [];
            $photoIds     = [];

            // Also directly search by photo:X from raw Rekognition result
            // We need to call searchFacesByImage ourselves to get photo:X hits
            $client = new \Aws\Rekognition\RekognitionClient([
                'version'     => 'latest',
                'region'      => config('services.rekognition.region'),
                'credentials' => [
                    'key'    => config('services.rekognition.key'),
                    'secret' => config('services.rekognition.secret'),
                ],
            ]);

            try {
                $raw = $client->searchFacesByImage([
                    'CollectionId'       => config('services.rekognition.collection'),
                    'Image'              => ['Bytes' => $bytes],
                    'FaceMatchThreshold' => $threshold,
                    'MaxFaces'           => 20,
                    'QualityFilter'      => 'AUTO',
                ]);

                foreach ($raw['FaceMatches'] ?? [] as $match) {
                    $extId = data_get($match, 'Face.ExternalImageId');
                    if (str_starts_with($extId, 'student:')) {
                        $studentIds[] = (int) substr($extId, 8);
                    } elseif (str_starts_with($extId, 'photo:')) {
                        $photoIds[] = (int) substr($extId, 6);
                    }
                }
            } catch (\Exception $e) {
                // no face detected or error
            }

            $studentIds = array_unique($studentIds);
            $photoIds   = array_unique($photoIds);

            // Get photos directly matched by face
            $directPhotos = Photo::whereIn('id', $photoIds)
                ->with('album:id,title,event_date')
                ->get()
                ->map(fn ($p) => [
                    'photo_id'  => $p->id,
                    'file_path' => $p->file_path,
                    'caption'   => $p->caption,
                    'album'     => $p->album ? [
                        'id'         => $p->album->id,
                        'title'      => $p->album->title,
                        'event_date' => $p->album->event_date,
                    ] : null,
                    'source' => 'direct_match',
                ])
                ->values()
                ->all();

            // Get photos from tagged_photos for matched students
            $taggedPhotos = [];
            if (!empty($studentIds)) {
                $taggedPhotos = TaggedPhoto::whereIn('user_id', $studentIds)
                    ->with(['photo:id,file_path,caption,album_id', 'photo.album:id,title,event_date'])
                    ->get()
                    ->map(fn ($t) => [
                        'photo_id'  => $t->photo_id,
                        'file_path' => $t->photo?->file_path,
                        'caption'   => $t->photo?->caption,
                        'album'     => $t->photo?->album ? [
                            'id'         => $t->photo->album->id,
                            'title'      => $t->photo->album->title,
                            'event_date' => $t->photo->album->event_date,
                        ] : null,
                        'source' => 'tagged',
                    ])
                    ->values()
                    ->all();
            }

            // Merge and deduplicate
            $allPhotos = collect(array_merge($directPhotos, $taggedPhotos))
                ->unique('photo_id')
                ->values()
                ->all();

            $status = count($allPhotos) > 0 ? 'matched' : 'no_matches';

            AuditLog::record($request, 'Face Search',
                'Photos found: ' . count($allPhotos)
            );

            return response()->json([
                'status'  => $status,
                'photos'  => $allPhotos,
                'message' => count($allPhotos) > 0 ? null : 'No matching photos found.',
            ]);

        } catch (\Exception $e) {
            AuditLog::record($request, 'Face Search Error', $e->getMessage(), 'Warning');

            return response()->json([
                'status'  => 'error',
                'photos'  => [],
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