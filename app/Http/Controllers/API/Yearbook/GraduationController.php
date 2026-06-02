<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Yearbook;

use App\Contracts\FaceRecognition;
use App\Contracts\StorageServiceInterface;
use App\Exceptions\StorageLimitExceededException;
use App\Exceptions\StorageUploadException;
use App\Http\Controllers\API\Concerns\AutoTranscribesVideo;
use App\Http\Controllers\Controller;
use App\Jobs\AI\AnalyzePhotoFaces;
use App\Models\Album;
use App\Models\Transcript;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class GraduationController extends Controller
{
    use AutoTranscribesVideo;

    public function __construct(
        private readonly StorageServiceInterface $storage,
        private readonly FaceRecognition $faceRecognition,
    ) {}

    // ─────────────────────────────────────────────────────────────────────
    // LIST
    // ─────────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        try {
            $category = $request->query('category', 'photos');

            $albums = Album::where('type', 'graduation')
                ->where('category', $category)
                ->with(['photos' => fn ($q) => $q->latest()->limit(4)])
                ->withCount('photos')
                ->latest()
                ->get();

            return response()->json(['data' => $albums]);
        } catch (Throwable $e) {
            Log::error('[Graduation] index failed', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to load graduation content.'], 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // SHOW
    // ─────────────────────────────────────────────────────────────────────

    public function show(int $id): JsonResponse
    {
        try {
            $album = Album::where('type', 'graduation')->with('photos')->findOrFail($id);
            return response()->json($album);
        } catch (Throwable $e) {
            Log::error('[Graduation] show failed', ['id' => $id, 'message' => $e->getMessage()]);
            return response()->json(['message' => 'Album not found.'], 404);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // CREATE ALBUM
    // ─────────────────────────────────────────────────────────────────────

    public function createAlbum(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title'       => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'category'    => 'required|string|in:photos,toga,archive,videos,program,invitation,song,mass',
                'event_date'  => 'nullable|date',
            ]);

            $album = Album::create([
                'user_id'     => Auth::id(),
                'title'       => $validated['title'],
                'description' => $validated['description'] ?? null,
                'category'    => $validated['category'],
                'event_date'  => $validated['event_date'] ?? null,
                'type'        => 'graduation',
            ]);

            return response()->json(['data' => $album], 201);
        } catch (Throwable $e) {
            Log::error('[Graduation] createAlbum failed', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to create album: ' . $e->getMessage()], 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // UPLOAD PHOTO
    // ─────────────────────────────────────────────────────────────────────

    public function uploadPhoto(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'album_id' => 'required|integer|exists:albums,id',
                'photos'   => 'required|array|min:1',
                'photos.*' => 'required|file|mimes:jpg,jpeg,png,webp|max:51200',
            ]);

            $album  = Album::findOrFail($request->album_id);
            $userId = Auth::id() ?? $album->user_id ?? 1;
            $saved  = [];

            DB::transaction(function () use ($request, $album, $userId, &$saved) {
                foreach ($request->file('photos') as $file) {
                    $result = $this->storage->uploadPhoto(
                        $file, $userId, 'graduation/photos',
                        ['resource_type' => 'image']
                    );

                    $photo = $album->photos()->create([
                        'file_path'            => $result['secure_url'],
                        'cloudinary_public_id' => $result['public_id'] ?? null,
                        'ai_metadata'          => ['resource_type' => 'image'],
                    ]);

                    // ✅ Auto-index and analyze faces after upload
                    AnalyzePhotoFaces::dispatch($photo)->delay(now()->addSeconds(3));

                    $saved[] = $photo;
                }
            });

            return response()->json(['data' => $saved, 'message' => count($saved) . ' photo(s) uploaded.'], 201);

        } catch (StorageLimitExceededException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (StorageUploadException $e) {
            Log::error('[Graduation] uploadPhoto StorageUploadException', ['message' => $e->getMessage()]);
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::error('[Graduation] uploadPhoto failed', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Photo upload failed: ' . $e->getMessage()], 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // UPLOAD VIDEO
    // ─────────────────────────────────────────────────────────────────────

    public function uploadVideo(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'title'       => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'event_date'  => 'nullable|date',
                'video'       => 'required|file|mimes:mp4,mov,webm,avi,mkv|max:2097152',
            ]);

            $userId = Auth::id() ?? 1;

            $result = $this->storage->uploadPhoto(
                $request->file('video'), $userId, 'graduation/videos',
                ['resource_type' => 'video', 'skip_mime_check' => true, 'skip_size_check' => true, 'chunk_size' => 6000000]
            );

            $album = Album::create([
                'user_id'              => $userId,
                'title'                => $request->title,
                'description'          => $request->description,
                'event_date'           => $request->event_date,
                'type'                 => 'graduation',
                'category'             => 'videos',
                'media_url'            => $result['secure_url'],
                'cloudinary_public_id' => $result['public_id'] ?? null,
            ]);

            $this->maybeQueueTranscription(
                uploadResult: $result,
                title:        $request->title,
                userId:       $userId,
                albumId:      $album->id,
            );

            return response()->json(['data' => $album, 'message' => 'Video uploaded successfully.'], 201);

        } catch (StorageLimitExceededException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (StorageUploadException $e) {
            Log::error('[Graduation] uploadVideo StorageUploadException', ['message' => $e->getMessage()]);
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::error('[Graduation] uploadVideo failed', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Video upload failed: ' . $e->getMessage()], 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // UPLOAD PROGRAM
    // ─────────────────────────────────────────────────────────────────────

    public function uploadProgram(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'title'       => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'event_date'  => 'nullable|date',
                'program'     => 'required|file|mimes:pdf|max:20480',
            ]);

            $userId = Auth::id() ?? 1;

            $result = $this->storage->uploadPhoto(
                $request->file('program'), $userId, 'graduation/programs',
                ['resource_type' => 'raw', 'skip_mime_check' => true]
            );

            $album = Album::create([
                'user_id'              => $userId,
                'title'                => $request->title,
                'description'          => $request->description,
                'event_date'           => $request->event_date,
                'type'                 => 'graduation',
                'category'             => 'program',
                'media_url'            => $result['secure_url'],
                'cloudinary_public_id' => $result['public_id'] ?? null,
            ]);

            return response()->json(['data' => $album, 'message' => 'Program uploaded successfully.'], 201);

        } catch (StorageLimitExceededException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (StorageUploadException $e) {
            Log::error('[Graduation] uploadProgram StorageUploadException', ['message' => $e->getMessage()]);
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::error('[Graduation] uploadProgram failed', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Program upload failed: ' . $e->getMessage()], 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // UPLOAD INVITATION
    // ─────────────────────────────────────────────────────────────────────

    public function uploadInvitation(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'title'       => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'event_date'  => 'nullable|date',
                'file'        => 'required|file|mimes:pdf,jpg,jpeg,png,webp|max:20480',
            ]);

            $userId = Auth::id() ?? 1;
            $file   = $request->file('file');
            $mime   = $file->getMimeType() ?? '';

            $resourceType = match (true) {
                str_contains($mime, 'pdf')   => 'raw',
                str_contains($mime, 'image') => 'image',
                default                      => 'raw',
            };

            $result = $this->storage->uploadPhoto(
                $file, $userId, 'graduation/invitations',
                ['resource_type' => $resourceType, 'skip_mime_check' => true]
            );

            $album = Album::create([
                'user_id'              => $userId,
                'title'                => $request->title,
                'description'          => $request->description,
                'event_date'           => $request->event_date,
                'type'                 => 'graduation',
                'category'             => 'invitation',
                'media_url'            => $result['secure_url'],
                'cloudinary_public_id' => $result['public_id'] ?? null,
            ]);

            return response()->json(['data' => $album, 'message' => 'Invitation uploaded successfully.'], 201);

        } catch (StorageLimitExceededException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (StorageUploadException $e) {
            Log::error('[Graduation] uploadInvitation StorageUploadException', ['message' => $e->getMessage()]);
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::error('[Graduation] uploadInvitation failed', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Invitation upload failed: ' . $e->getMessage()], 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // UPLOAD SONG
    // ─────────────────────────────────────────────────────────────────────

    public function uploadSong(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'title'       => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'event_date'  => 'nullable|date',
                'audio'       => 'required|file|mimes:mp3,wav,m4a,ogg,flac,webm,mp4,mov|max:512000',
            ]);

            $userId = Auth::id() ?? 1;

            $result = $this->storage->uploadPhoto(
                $request->file('audio'), $userId, 'graduation/songs',
                ['resource_type' => 'video', 'skip_mime_check' => true]
            );

            $album = Album::create([
                'user_id'              => $userId,
                'title'                => $request->title,
                'description'          => $request->description,
                'event_date'           => $request->event_date,
                'type'                 => 'graduation',
                'category'             => 'song',
                'media_url'            => $result['secure_url'],
                'cloudinary_public_id' => $result['public_id'] ?? null,
            ]);

            $this->maybeQueueTranscription(
                uploadResult: $result,
                title:        $request->title,
                userId:       $userId,
                albumId:      $album->id,
            );

            return response()->json(['data' => $album, 'message' => 'Song/video uploaded successfully.'], 201);

        } catch (StorageLimitExceededException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (StorageUploadException $e) {
            Log::error('[Graduation] uploadSong StorageUploadException', ['message' => $e->getMessage()]);
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::error('[Graduation] uploadSong failed', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Song upload failed: ' . $e->getMessage()], 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // UPLOAD MASS VIDEO
    // ─────────────────────────────────────────────────────────────────────

    public function uploadMass(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'title'       => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'event_date'  => 'nullable|date',
                'video'       => 'required|file|mimes:mp4,mov,webm,avi,mkv|max:2097152',
            ]);

            $userId = Auth::id() ?? 1;

            $result = $this->storage->uploadPhoto(
                $request->file('video'), $userId, 'graduation/mass',
                ['resource_type' => 'video', 'skip_mime_check' => true, 'skip_size_check' => true, 'chunk_size' => 6000000]
            );

            $album = Album::create([
                'user_id'              => $userId,
                'title'                => $request->title,
                'description'          => $request->description,
                'event_date'           => $request->event_date,
                'type'                 => 'graduation',
                'category'             => 'mass',
                'media_url'            => $result['secure_url'],
                'cloudinary_public_id' => $result['public_id'] ?? null,
            ]);

            $this->maybeQueueTranscription(
                uploadResult: $result,
                title:        $request->title,
                userId:       $userId,
                albumId:      $album->id,
            );

            return response()->json(['data' => $album, 'message' => 'Mass video uploaded successfully.'], 201);

        } catch (StorageLimitExceededException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (StorageUploadException $e) {
            Log::error('[Graduation] uploadMass StorageUploadException', ['message' => $e->getMessage()]);
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            Log::error('[Graduation] uploadMass failed', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Mass video upload failed: ' . $e->getMessage()], 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // DESTROY
    // ─────────────────────────────────────────────────────────────────────

    public function destroy(int $id): JsonResponse
    {
        try {
            $album = Album::where('type', 'graduation')->findOrFail($id);

            $transcript = Transcript::where('album_id', $album->id)->first();
            if ($transcript) {
                if ($transcript->public_id) {
                    try {
                        $this->storage->deletePhoto($transcript->public_id, 'video');
                    } catch (Throwable $e) {
                        Log::warning("[Graduation] destroy: could not delete Cloudinary asset [{$transcript->public_id}]: {$e->getMessage()}");
                    }
                }
                $transcript->delete();
            }

            if ($album->cloudinary_public_id) {
                try {
                    $this->storage->deletePhoto($album->cloudinary_public_id, 'video');
                } catch (Throwable $e) {
                    Log::warning("[Graduation] destroy: could not delete album Cloudinary asset [{$album->cloudinary_public_id}]: {$e->getMessage()}");
                }
            }

            $album->delete();

            return response()->json(['message' => 'Album deleted successfully.']);

        } catch (Throwable $e) {
            Log::error('[Graduation] destroy failed', ['id' => $id, 'message' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to delete album.'], 500);
        }
    }
}