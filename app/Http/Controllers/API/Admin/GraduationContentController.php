<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Admin;

use App\Contracts\FaceRecognition;
use App\Contracts\StorageServiceInterface;
use App\Exceptions\StorageLimitExceededException;
use App\Exceptions\StorageUploadException;
use App\Http\Controllers\API\Concerns\AutoTranscribesVideo;
use App\Http\Controllers\Controller;
use App\Jobs\AI\AnalyzePhotoFaces;
use App\Models\Admin;
use App\Models\GraduationAlbum;
use App\Models\GraduationPhoto;
use App\Models\Transcript;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class GraduationContentController extends Controller
{
    use AutoTranscribesVideo;

    private const FACE_TYPES = ['photos', 'toga', 'highlights'];

    private const TRANSCRIPT_TYPES = ['videos', 'songs', 'mass', 'speeches'];

    private const ALLOWED_TYPES = [
        'photos', 'videos', 'program', 'archive', 'toga',
        'invitations', 'songs', 'mass', 'speeches', 'messages', 'highlights',
    ];

    private const FOLDERS = [
        'photos'      => 'graduation/photos',
        'toga'        => 'graduation/toga',
        'highlights'  => 'graduation/highlights',
        'videos'      => 'graduation/videos',
        'songs'       => 'graduation/songs',
        'mass'        => 'graduation/mass',
        'speeches'    => 'graduation/speeches',
        'program'     => 'graduation/programs',
        'invitations' => 'graduation/invitations',
        'messages'    => 'graduation/messages',
        'archive'     => 'graduation/archive',
    ];

    public function __construct(
        private readonly StorageServiceInterface $storage,
        private readonly FaceRecognition         $faceRecognition,
    ) {}

    // STATS
    public function stats(): JsonResponse
    {
        try {
            $rows = GraduationAlbum::selectRaw('category, status, COUNT(*) as count')
                ->groupBy('category', 'status')
                ->get()
                ->groupBy('category');

            $result = [];
            foreach (self::ALLOWED_TYPES as $type) {
                $group         = $rows->get($type, collect());
                $result[$type] = [
                    'total'     => $group->sum('count'),
                    'published' => $group->firstWhere('status', 'published')?->count ?? 0,
                    'draft'     => $group->firstWhere('status', 'draft')?->count      ?? 0,
                    'archived'  => $group->firstWhere('status', 'archived')?->count   ?? 0,
                ];
            }

            return response()->json($result);
        } catch (Throwable $e) {
            Log::error('[GradContent] stats failed', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to load stats.'], 500);
        }
    }


    // INDEX
    public function index(Request $request): JsonResponse
    {
        try {
            $query = GraduationAlbum::with([
                'photos' => fn ($q) => $q->orderBy('sort_order')->limit(4),
                'batch:id,name,course,graduation_year',
                'user:id,first_name,last_name',
            ])
            ->withCount('photos')
            ->orderByDesc('created_at');

            if ($request->filled('type') && in_array($request->type, self::ALLOWED_TYPES)) {
                $query->where('category', $request->type);
            }

            if ($request->filled('batch_id')) {
                $query->where('batch_id', $request->batch_id);
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('search')) {
                $q = $request->search;
                $query->where(fn ($sub) =>
                    $sub->where('title',       'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%")
                );
            }

            return response()->json(
                $this->transformCollection($query->paginate($request->integer('per_page', 18)))
            );
        } catch (Throwable $e) {
            Log::error('[GradContent] index failed', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to load content.'], 500);
        }
    }

    // SHOW

    public function show(GraduationAlbum $album): JsonResponse
    {
        try {
            return response()->json(['data' => $album->load('photos')]);
        } catch (Throwable $e) {
            Log::error('[GradContent] show failed', ['id' => $album->id, 'message' => $e->getMessage()]);
            return response()->json(['message' => 'Album not found.'], 404);
        }
    }

    // STUDENT INDEX (published only)
    public function studentIndex(Request $request): JsonResponse
    {
        try {
            $user  = $request->user();
            $query = GraduationAlbum::published()
                ->with([
                    'photos' => fn ($q) => $q->orderBy('sort_order')->limit(4),
                    'batch:id,name,course,graduation_year',
                ])
                ->withCount('photos')
                ->orderByDesc('published_at');

            if ($request->filled('type') && in_array($request->type, self::ALLOWED_TYPES)) {
                $query->where('category', $request->type);
            }

            $batchId = $request->get('batch_id', $user->batch_id);
            if ($batchId) {
                $query->where('batch_id', $batchId);
            }

            return response()->json(
                $this->transformCollection($query->paginate($request->integer('per_page', 18)), studentView: true)
            );
        } catch (Throwable $e) {
            Log::error('[GradContent] studentIndex failed', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to load content.'], 500);
        }
    }

    // CREATE ALBUM
    public function createAlbum(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'type'        => 'required|in:' . implode(',', self::ALLOWED_TYPES),
            'description' => 'nullable|string|max:1000',
            'batch_id'    => 'nullable|exists:batches,id',
            'status'      => 'in:draft,published',
            'event_date'  => 'nullable|date',
        ]);

        $album = GraduationAlbum::create([
            'user_id'      => Auth::id(),
            'title'        => $data['title'],
            'description'  => $data['description']  ?? null,
            'batch_id'     => $data['batch_id']      ?? null,
            'event_date'   => $data['event_date']    ?? null,
            'category'     => $data['type'],
            'status'       => $data['status']        ?? 'draft',
            'published_at' => ($data['status'] ?? 'draft') === 'published' ? now() : null,
        ]);

        return response()->json(['data' => $album], 201);
    }

    // UPLOAD TO ALBUM
    public function uploadToAlbum(Request $request, GraduationAlbum $album): JsonResponse
    {
        $request->validate([
            'files'    => 'required|array|min:1',
            'files.*'  => 'required|file|max:2097152',
            'titles'   => 'nullable|array',      
            'titles.*' => 'nullable|string|max:255', 
        ]);

        $userId   = Auth::id();
        $category = $album->category;
        $titles   = $request->input('titles', []); 
        $saved    = [];

        try {
            DB::transaction(function () use ($request, $album, $userId, $category, &$saved) {
                foreach ($request->file('files') as $index => $file) {
                    $fileTitle = $titles[$index] ?? null; 
                    $mime    = $file->getMimeType() ?? '';
                    $this->assertFileAllowedForCategory($category, $mime);
                    $isImage = str_starts_with($mime, 'image/');
                    $isVideo = str_starts_with($mime, 'video/');
                    $isAudio = str_starts_with($mime, 'audio/');

                    $folder       = self::FOLDERS[$category] ?? 'graduation/archive';
                    $resourceType = match (true) {
                        $isImage             => 'image',
                        $isVideo || $isAudio => 'video',
                        default              => 'raw',
                    };

                    $options = ['resource_type' => $resourceType];
                    if ($isVideo || $isAudio) {
                        $options['skip_size_check'] = true;
                        $options['chunk_size']      = 6_000_000;
                    }

                    $result = $this->storage->uploadPhoto($file, $userId, $folder, $options);

                    $photo = $album->photos()->create([
                        'title'                => $fileTitle ?? $album->title,
                        'file_path'            => $result['secure_url'],
                        'cloudinary_public_id' => $result['public_id'] ?? null,
                        'resource_type'        => $resourceType,
                        'mime_type'            => $mime,
                        'ai_metadata'          => ['status' => 'pending'],
                        'sort_order'           => $album->photos()->count(),
                    ]);

                    if (! $album->media_url || $isImage) {
                        $album->update([
                            'media_url'            => $result['secure_url'],
                            'cloudinary_public_id' => $result['public_id'] ?? null,
                        ]);
                    }

                    if ($isImage && in_array($category, self::FACE_TYPES)) {
                        AnalyzePhotoFaces::dispatch($photo)->delay(now()->addSeconds(3));
                        $photo->markAiQueued();
                    }

                    if ($isImage && $category === 'archive') {
                        AnalyzePhotoFaces::dispatch($photo)->delay(now()->addSeconds(3));
                    }

                if (($isVideo || $isAudio) &&
                    (in_array($category, self::TRANSCRIPT_TYPES) || $category === 'archive')) {
                    $this->maybeQueueTranscription(
                        uploadResult:       $result,
                        title:              $fileTitle ?? $album->title,
                        userId:             $userId,
                        albumId:            $album->id,
                        graduationPhotoId:  $photo->id, 
                    );
                }

                    $type    = $isImage ? 'photo' : ($isVideo ? 'video' : ($isAudio ? 'audio' : 'document'));
                    $saved[] = ['type' => $type, 'url' => $result['secure_url'], 'photo_id' => $photo->id];
                }
            });

            return response()->json([
                'data'    => $album->fresh()->load('photos'),
                'files'   => $saved,
                'message' => count($saved) . ' file(s) added to "' . $album->title . '".',
            ], 201);

        } catch (StorageLimitExceededException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (StorageUploadException $e) {
            Log::error('[GradContent] uploadToAlbum StorageUploadException', ['message' => $e->getMessage()]);
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::error('[GradContent] uploadToAlbum failed', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Upload failed: ' . $e->getMessage()], 500);
        }
    }

    // UPLOAD HELPERS
    public function uploadContent(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => 'required|in:' . implode(',', self::ALLOWED_TYPES),
        ]);

        if ($request->hasFile('files')) {
            $album = $this->getOrCreateAlbum($request, $data['type']);

            return $this->uploadToAlbum($request, $album);
        }

        return match ($data['type']) {
            'photos'      => $this->uploadPhotos($request),
            'toga'        => $this->uploadToga($request),
            'highlights'  => $this->uploadHighlights($request),
            'videos'      => $this->uploadVideo($request),
            'songs'       => $this->uploadSong($request),
            'mass'        => $this->uploadMass($request),
            'speeches'    => $this->uploadSpeech($request),
            'program'     => $this->uploadProgram($request),
            'invitations' => $this->uploadInvitation($request),
            'messages'    => $this->uploadMessage($request),
            'archive'     => $this->uploadArchive($request),
        };
    }

    public function uploadPhotos(Request $request, string $type = 'photos'): JsonResponse
    {
        $type = in_array($type, self::FACE_TYPES) ? $type : 'photos';

        try {
            $request->validate([
                'title'       => 'required_without:album_id|string|max:255',
                'description' => 'nullable|string|max:1000',
                'batch_id'    => 'nullable|exists:batches,id',
                'status'      => 'in:draft,published',
                'event_date'  => 'nullable|date',
                'photos'      => 'required|array|min:1',
                'photos.*'    => 'required|file|mimes:jpg,jpeg,png,webp|max:51200',
            ]);

            $album = $this->getOrCreateAlbum($request, $type);

            $newRequest = new Request();
            $newRequest->files->set('files', $request->file('photos'));

            return $this->uploadToAlbum($newRequest, $album);

        } catch (StorageLimitExceededException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::error("[GradContent] uploadPhotos ({$type}) failed", ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Photo upload failed: ' . $e->getMessage()], 500);
        }
    }

    public function uploadToga(Request $request): JsonResponse
    {
        return $this->uploadPhotos($request, 'toga');
    }

    public function uploadHighlights(Request $request): JsonResponse
    {
        return $this->uploadPhotos($request, 'highlights');
    }

    public function uploadVideo(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'title'       => 'required_without:album_id|string|max:255',
                'description' => 'nullable|string|max:1000',
                'batch_id'    => 'nullable|exists:batches,id',
                'status'      => 'in:draft,published',
                'event_date'  => 'nullable|date',
                'video'       => 'required|file|mimes:mp4,mov,webm,avi,mkv|max:2097152',
            ]);

            $album      = $this->getOrCreateAlbum($request, 'videos');
            $newRequest = new Request();
            $newRequest->files->set('files', [$request->file('video')]);

            return $this->uploadToAlbum($newRequest, $album);
        } catch (Throwable $e) {
            Log::error('[GradContent] uploadVideo failed', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Video upload failed: ' . $e->getMessage()], 500);
        }
    }

    public function uploadSong(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'title'       => 'required_without:album_id|string|max:255',
                'description' => 'nullable|string|max:1000',
                'batch_id'    => 'nullable|exists:batches,id',
                'status'      => 'in:draft,published',
                'event_date'  => 'nullable|date',
                'audio'       => 'required|file|mimes:mp3,wav,m4a,ogg,flac,webm,mp4,mov|max:512000',
            ]);

            $album      = $this->getOrCreateAlbum($request, 'songs');
            $newRequest = new Request();
            $newRequest->files->set('files', [$request->file('audio')]);

            return $this->uploadToAlbum($newRequest, $album);
        } catch (Throwable $e) {
            Log::error('[GradContent] uploadSong failed', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Song upload failed: ' . $e->getMessage()], 500);
        }
    }

    public function uploadMass(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'title'       => 'required_without:album_id|string|max:255',
                'description' => 'nullable|string|max:1000',
                'batch_id'    => 'nullable|exists:batches,id',
                'status'      => 'in:draft,published',
                'event_date'  => 'nullable|date',
                'video'       => 'required|file|mimes:mp4,mov,webm,avi,mkv|max:2097152',
            ]);

            $album      = $this->getOrCreateAlbum($request, 'mass');
            $newRequest = new Request();
            $newRequest->files->set('files', [$request->file('video')]);

            return $this->uploadToAlbum($newRequest, $album);
        } catch (Throwable $e) {
            Log::error('[GradContent] uploadMass failed', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Mass video upload failed: ' . $e->getMessage()], 500);
        }
    }

    public function uploadSpeech(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'title'       => 'required_without:album_id|string|max:255',
                'description' => 'nullable|string|max:1000',
                'batch_id'    => 'nullable|exists:batches,id',
                'status'      => 'in:draft,published',
                'event_date'  => 'nullable|date',
                'media'       => 'required|file|mimes:mp4,mov,webm,avi,mkv,mp3,wav,m4a,ogg,flac|max:2097152',
            ]);

            $album      = $this->getOrCreateAlbum($request, 'speeches');
            $newRequest = new Request();
            $newRequest->files->set('files', [$request->file('media')]);

            return $this->uploadToAlbum($newRequest, $album);
        } catch (Throwable $e) {
            Log::error('[GradContent] uploadSpeech failed', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Speech upload failed: ' . $e->getMessage()], 500);
        }
    }

    public function uploadProgram(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'title'       => 'required_without:album_id|string|max:255',
                'description' => 'nullable|string|max:1000',
                'batch_id'    => 'nullable|exists:batches,id',
                'status'      => 'in:draft,published',
                'event_date'  => 'nullable|date',
                'program'     => 'required|file|mimes:pdf,jpg,jpeg,png,webp|max:20480',
            ]);

            $album      = $this->getOrCreateAlbum($request, 'program');
            $newRequest = new Request();
            $newRequest->files->set('files', [$request->file('program')]);

            return $this->uploadToAlbum($newRequest, $album);
        } catch (Throwable $e) {
            Log::error('[GradContent] uploadProgram failed', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Program upload failed: ' . $e->getMessage()], 500);
        }
    }

    public function uploadInvitation(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'title'       => 'required_without:album_id|string|max:255',
                'description' => 'nullable|string|max:1000',
                'batch_id'    => 'nullable|exists:batches,id',
                'status'      => 'in:draft,published',
                'event_date'  => 'nullable|date',
                'file'        => 'required|file|mimes:pdf,jpg,jpeg,png,webp|max:20480',
            ]);

            $album      = $this->getOrCreateAlbum($request, 'invitations');
            $newRequest = new Request();
            $newRequest->files->set('files', [$request->file('file')]);

            return $this->uploadToAlbum($newRequest, $album);
        } catch (Throwable $e) {
            Log::error('[GradContent] uploadInvitation failed', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Invitation upload failed: ' . $e->getMessage()], 500);
        }
    }

    public function uploadMessage(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'title'       => 'required_without:album_id|string|max:255',
                'description' => 'nullable|string|max:1000',
                'batch_id'    => 'nullable|exists:batches,id',
                'status'      => 'in:draft,published',
                'event_date'  => 'nullable|date',
                'file'        => 'required|file|mimes:pdf,jpg,jpeg,png,webp|max:20480',
            ]);

            $album      = $this->getOrCreateAlbum($request, 'messages');
            $newRequest = new Request();
            $newRequest->files->set('files', [$request->file('file')]);

            return $this->uploadToAlbum($newRequest, $album);
        } catch (Throwable $e) {
            Log::error('[GradContent] uploadMessage failed', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Message upload failed: ' . $e->getMessage()], 500);
        }
    }

    public function uploadArchive(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'title'       => 'required_without:album_id|string|max:255',
                'description' => 'nullable|string|max:1000',
                'batch_id'    => 'nullable|exists:batches,id',
                'status'      => 'in:draft,published',
                'event_date'  => 'nullable|date',
                'files'       => 'required|array|min:1',
                'files.*'     => 'required|file|max:524288',
            ]);

            $album = $this->getOrCreateAlbum($request, 'archive');

            return $this->uploadToAlbum($request, $album);
        } catch (Throwable $e) {
            Log::error('[GradContent] uploadArchive failed', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Archive upload failed: ' . $e->getMessage()], 500);
        }
    }

    // UPDATE
    public function update(Request $request, GraduationAlbum $album): JsonResponse
    {
        try {
            $data = $request->validate([
                'title'       => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'batch_id'    => 'nullable|exists:batches,id',
                'status'      => 'sometimes|in:draft,published,archived',
                'event_date'  => 'nullable|date',
            ]);

            if (isset($data['status']) &&
                $data['status'] === 'published' &&
                $album->status !== 'published') {
                $data['published_at'] = now();
            }

            $album->update($data);

            return response()->json(['message' => 'Content updated.', 'data' => $album->fresh()]);
        } catch (Throwable $e) {
            Log::error('[GradContent] update failed', ['id' => $album->id, 'message' => $e->getMessage()]);
            return response()->json(['message' => 'Update failed.'], 500);
        }
    }

    public function updatePhoto(Request $request, GraduationPhoto $photo): JsonResponse
    {
        try {
            $data = $request->validate([
                'title'      => 'nullable|string|max:255',
                'sort_order' => 'nullable|integer|min:0',
            ]);

            $photo->update($data);

            return response()->json([
                'message' => 'File updated.',
                'data'    => $photo->fresh(),
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            Log::error('[GradContent] updatePhoto failed', ['id' => $photo->id, 'message' => $e->getMessage()]);
            return response()->json(['message' => 'File update failed.'], 500);
        }
    }

    public function destroyPhoto(GraduationPhoto $photo): JsonResponse
    {
        try {
            $photo->delete();

            return response()->json(['message' => 'File moved to trash.']);
        } catch (Throwable $e) {
            Log::error('[GradContent] destroyPhoto failed', ['id' => $photo->id, 'message' => $e->getMessage()]);
            return response()->json(['message' => 'File delete failed.'], 500);
        }
    }

    // PUBLISH
    public function publish(GraduationAlbum $album): JsonResponse
    {
        try {
            $album->publish();
            return response()->json(['message' => 'Content published.']);
        } catch (Throwable $e) {
            Log::error('[GradContent] publish failed', ['id' => $album->id, 'message' => $e->getMessage()]);
            return response()->json(['message' => 'Publish failed.'], 500);
        }
    }

    // ARCHIVE
    public function archiveContent(GraduationAlbum $album): JsonResponse
    {
        try {
            $album->archive();
            return response()->json(['message' => 'Content archived.']);
        } catch (Throwable $e) {
            Log::error('[GradContent] archiveContent failed', ['id' => $album->id, 'message' => $e->getMessage()]);
            return response()->json(['message' => 'Archive failed.'], 500);
        }
    }

    // DESTROY — soft delete only
    public function destroy(GraduationAlbum $album): JsonResponse
    {
        try {
            $album->delete(); // soft delete — sets deleted_at

            return response()->json(['message' => 'Content moved to trash.']);
        } catch (Throwable $e) {
            Log::error('[GradContent] destroy failed', ['id' => $album->id, 'message' => $e->getMessage()]);
            return response()->json(['message' => 'Delete failed.'], 500);
        }
    }

    // PRIVATE HELPERS
    private function getOrCreateAlbum(Request $request, string $category): GraduationAlbum
    {
        if ($request->filled('album_id')) {
            return GraduationAlbum::findOrFail($request->album_id);
        }

        return GraduationAlbum::create([
            'user_id'      => Auth::id(),
            'title'        => $request->title,
            'description'  => $request->description,
            'batch_id'     => $request->batch_id,
            'event_date'   => $request->event_date,
            'category'     => $category,
            'status'       => $request->get('status', 'draft'),
            'published_at' => $request->get('status') === 'published' ? now() : null,
        ]);
    }

    private function transformCollection($paginator, bool $studentView = false): array
    {
        $paginator->getCollection()->transform(function (GraduationAlbum $a) use ($studentView) {
            $coverUrl = $a->cover_photo_url;

            $item = [
                'id'               => $a->id,
                'type'             => $a->category,
                'title'            => $a->title,
                'description'      => $a->description,
                'batch_id'         => $a->batch_id,
                'batch_name'       => $a->batch
                    ? "{$a->batch->name} — {$a->batch->course} {$a->batch->graduation_year}"
                    : null,
                'status'           => $a->status,
                'file_path'        => $a->media_url ?? $coverUrl,
                'thumbnail_url'    => $coverUrl,
                'cover_photo_url'  => $coverUrl,
                'photos'           => $a->photos,
                'file_count'       => $a->photos_count ?? $a->photos->count(),
                'mime_type'        => $this->inferMimeType($a->category),
                'event_date'       => $a->event_date?->format('Y-m-d'),
                'published_at'     => $a->published_at
                    ? Carbon::parse($a->published_at)->format('Y-m-d') : null,
                'created_at_human' => Carbon::parse($a->created_at)->diffForHumans(),
                'has_transcript'   => Transcript::whereIn('graduation_photo_id', $a->photos->pluck('id'))->exists(),
            ];

            if (! $studentView) {
                $admin = Admin::find($a->user_id);

                $item['uploaded_by'] = $admin?->name
                    ?? ($a->user ? trim("{$a->user->first_name} {$a->user->last_name}") : null)
                    ?? 'Unknown';
            }

            return $item;
        });

        return $paginator->toArray();
    }

    private function inferMimeType(string $category): string
    {
        return match ($category) {
            'photos', 'toga', 'invitations', 'messages' => 'image/jpeg',
            'videos', 'mass', 'highlights'              => 'video/mp4',
            'songs'                                      => 'audio/mpeg',
            'program'                                    => 'image/jpeg',
            default                                      => 'application/octet-stream',
        };
    }

    private function assertFileAllowedForCategory(string $category, string $mime): void
    {
        $allowed = match ($category) {
            'photos', 'toga', 'highlights', 'archive' => ['image/'],
            'videos' => ['video/'],
            'songs', 'mass', 'speeches', 'messages' => ['audio/', 'video/'],
            'program', 'invitations' => ['application/pdf', 'image/'],
            default => ['image/'],
        };

        foreach ($allowed as $prefix) {
            if (str_ends_with($prefix, '/') && str_starts_with($mime, $prefix)) {
                return;
            }
            if ($mime === $prefix) {
                return;
            }
        }

        throw ValidationException::withMessages([
            'files' => ["File type [{$mime}] is not allowed for {$category} content."],
        ]);
    }
}
