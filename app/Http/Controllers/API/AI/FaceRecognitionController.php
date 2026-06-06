<?php

namespace App\Http\Controllers\API\AI;

use App\Contracts\FaceRecognition;
use Aws\Rekognition\RekognitionClient;
use App\Http\Controllers\Controller;
use App\Http\Resources\TaggedPhotoResource;
use App\Jobs\AI\AnalyzePhotoFaces;
use App\Models\AuditLog;
use App\Models\GalleryMedia;
use App\Models\GraduationPhoto;
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

            // Search Rekognition — returns ALL matches (student:X and photo:X)
            $rekognitionResult = $this->faceRecognition->searchIndexedFaces($file, 30, $threshold);

            $rawMatches   = collect($rekognitionResult['matches'] ?? []);
            $matches      = $rawMatches->filter(fn ($m) => filled($m['user_id']))->values()->all();
            $studentIds   = [];
            $photoIds     = [];
            $galleryMediaIds = [];
            $graduationPhotoIds = [];

            foreach ($rawMatches as $match) {
                $extId = (string) ($match['external_image_id'] ?? '');

                if (str_starts_with($extId, 'student:')) {
                    $studentIds[] = (int) substr($extId, strlen('student:'));
                } elseif (str_starts_with($extId, 'graduation_photo:')) {
                    $graduationPhotoIds[] = (int) substr($extId, strlen('graduation_photo:'));
                } elseif (str_starts_with($extId, 'gallery_media:')) {
                    $galleryMediaIds[] = (int) substr($extId, strlen('gallery_media:'));
                } elseif (str_starts_with($extId, 'photo:')) {
                    $photoIds[] = (int) substr($extId, strlen('photo:'));
                }
            }

            $studentIds = array_unique($studentIds);
            $photoIds   = array_unique($photoIds);
            $galleryMediaIds = array_unique($galleryMediaIds);
            $graduationPhotoIds = array_unique($graduationPhotoIds);

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

            $directGraduationPhotos = GraduationPhoto::whereIn('id', $graduationPhotoIds)
                ->with('album:id,title,event_date,category')
                ->get()
                ->map(fn ($p) => [
                    'photo_id' => $p->id,
                    'graduation_photo_id' => $p->id,
                    'file_path' => $p->file_path,
                    'caption' => null,
                    'album' => $p->album ? [
                        'id' => $p->album->id,
                        'title' => $p->album->title,
                        'event_date' => $p->album->event_date,
                        'category' => $p->album->category,
                    ] : null,
                    'source' => 'graduation_direct_match',
                ])
                ->values()
                ->all();

            $directGalleryMedia = GalleryMedia::whereIn('id', $galleryMediaIds)
                ->where('resource_type', 'image')
                ->with([
                    'gallery' => fn ($q) => $q
                        ->select(['id', 'album_id', 'user_id', 'caption', 'status', 'visibility'])
                        ->with('album:id,title,event_date,type'),
                ])
                ->get()
                ->filter(fn ($m) => $m->gallery?->status === 'approved' && $m->gallery?->visibility === 'public')
                ->map(fn ($m) => [
                    'photo_id' => $m->gallery_id,
                    'gallery_media_id' => $m->id,
                    'gallery_id' => $m->gallery_id,
                    'file_path' => $m->file_path,
                    'caption' => $m->gallery?->caption,
                    'album' => $m->gallery?->album ? [
                        'id' => $m->gallery->album->id,
                        'title' => $m->gallery->album->title,
                        'event_date' => $m->gallery->album->event_date,
                        'type' => $m->gallery->album->type,
                    ] : null,
                    'source' => 'gallery_media_direct_match',
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
            $allPhotos = collect(array_merge($directPhotos, $directGraduationPhotos, $directGalleryMedia, $taggedPhotos))
                ->unique(fn ($p) => ($p['graduation_photo_id'] ?? null)
                    ? 'graduation:' . $p['graduation_photo_id']
                    : (($p['gallery_media_id'] ?? null)
                        ? 'gallery_media:' . $p['gallery_media_id']
                        : 'photo:' . ($p['photo_id'] ?? '')))
                ->values()
                ->all();

            $status = count($matches) > 0 || count($allPhotos) > 0 ? 'matched' : 'no_matches';

            AuditLog::record($request, 'Face Search',
                'Students found: ' . count($matches) . ', photos found: ' . count($allPhotos)
            );

            return response()->json([
                'status'  => $status,
                'matches' => $matches,
                'photos'  => $allPhotos,
                'message' => $status === 'matched' ? null : 'No matching faces found.',
            ]);

        } catch (\Exception $e) {
            AuditLog::record($request, 'Face Search Error', $e->getMessage(), 'Warning');

            return response()->json([
                'status'  => 'error',
                'matches' => [],
                'photos'  => [],
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    // ── Return face tags for a single photo ───────────────────────────────

    public function photoTags(int $photo): JsonResponse
    {
        $photo = Photo::find($photo);

        if (! $photo) {
            return response()->json([
                'photo_id'    => null,
                'status'      => 'not_found',
                'face_count'  => 0,
                'analyzed_at' => null,
                'provider'    => 'aws-rekognition',
                'tags'        => [],
            ]);
        }

        $tags = $photo->taggedPhotos()
            ->with('user:id,name,profile_picture,student_record_id')
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
