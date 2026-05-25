<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Yearbook;

use App\Contracts\StorageServiceInterface;
use App\Exceptions\StorageLimitExceededException;
use App\Exceptions\StorageUploadException;
use App\Http\Controllers\Controller;
use App\Models\Album;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GraduationController extends Controller
{
    public function __construct(
        private readonly StorageServiceInterface $storage
    ) {}

    // ── List ──────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = Album::with('photos')
            ->withCount('photos')
            ->graduation();

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->latest('event_date')->get(),
        ]);
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function show(int $id): JsonResponse
    {
        $album = Album::with('photos')->graduation()->findOrFail($id);

        return response()->json(['success' => true, 'data' => $album]);
    }

    // ── Create Album (generic) ────────────────────────────────────────────────

    public function createAlbum(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category'    => ['required', 'in:photos,archive,videos,program,toga,invitation,song,mass'],
            'event_date'  => ['nullable', 'date'],
        ]);

        $album = Album::create([
            ...$validated,
            'type'    => 'graduation',
            'user_id' => Auth::id(),
        ]);

        return response()->json(['success' => true, 'data' => $album], 201);
    }

    // ── Upload Photo (photos / toga / archive albums) ─────────────────────────

    public function uploadPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'album_id' => ['required', 'exists:albums,id'],
            'photos'   => ['required', 'array', 'max:50'],
            'photos.*' => ['image', 'mimes:jpeg,png,webp,heic', 'max:51200'],
        ]);

        $album  = Album::graduation()->findOrFail($request->album_id);
        $saved  = [];
        $failed = 0;

        foreach ($request->file('photos') as $file) {
            try {
                $result  = $this->storage->uploadPhoto(
                    file:   $file,
                    userId: Auth::id(),
                    folder: "graduation/{$album->id}/photos",
                );
                $saved[] = $album->photos()->create([
                    'file_path'   => $result['secure_url'],
                    'public_id'   => $result['public_id'],
                    'user_id'     => Auth::id(),
                    'caption'     => null,
                    'ai_metadata' => [
                        'resource_type' => $result['resource_type'],
                        'bytes'         => $result['bytes'],
                    ],
                ]);
            } catch (StorageLimitExceededException $e) {
                return $this->error($e->getMessage(), $e->toArray(), 422);
            } catch (StorageUploadException) {
                $failed++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => count($saved) . ' photo(s) uploaded, ' . $failed . ' failed.',
            'data'    => $saved,
        ], 201);
    }

    // ── Upload Video (videos category) ────────────────────────────────────────

    public function uploadVideo(Request $request): JsonResponse
    {
        $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'video'       => ['required', 'file', 'mimes:mp4,mov,avi,webm', 'max:2097152'],
            'event_date'  => ['nullable', 'date'],
        ]);

        try {
            $result = $this->storage->uploadPhoto(
                file:   $request->file('video'),
                userId: Auth::id(),
                folder: 'graduation/videos',
            );

            $album = Album::create([
                'user_id'              => Auth::id(),
                'title'                => $request->title,
                'description'          => $request->description,
                'type'                 => 'graduation',
                'category'             => 'videos',
                'media_url'            => $result['secure_url'],
                'cloudinary_public_id' => $result['public_id'],
                'event_date'           => $request->event_date,
            ]);

            return response()->json(['success' => true, 'data' => $album], 201);

        } catch (StorageLimitExceededException $e) {
            return $this->error($e->getMessage(), $e->toArray(), 422);
        } catch (StorageUploadException $e) {
            return $this->error($e->getMessage(), [], 500);
        }
    }

    // ── Upload Program (PDF) ──────────────────────────────────────────────────

    public function uploadProgram(Request $request): JsonResponse
    {
        $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'program'     => ['required', 'file', 'mimes:pdf', 'max:20480'],
            'event_date'  => ['nullable', 'date'],
        ]);

        try {
            $result = $this->storage->uploadPhoto(
                file:   $request->file('program'),
                userId: Auth::id(),
                folder: 'graduation/programs',
            );

            $album = Album::create([
                'user_id'              => Auth::id(),
                'title'                => $request->title,
                'description'          => $request->description,
                'type'                 => 'graduation',
                'category'             => 'program',
                'media_url'            => $result['secure_url'],
                'cloudinary_public_id' => $result['public_id'],
                'event_date'           => $request->event_date,
            ]);

            return response()->json(['success' => true, 'data' => $album], 201);

        } catch (StorageLimitExceededException $e) {
            return $this->error($e->getMessage(), $e->toArray(), 422);
        } catch (StorageUploadException $e) {
            return $this->error($e->getMessage(), [], 500);
        }
    }

    // ── Upload Invitation (PDF / image) ───────────────────────────────────────

    public function uploadInvitation(Request $request): JsonResponse
    {
        $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'file'        => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:20480'],
            'event_date'  => ['nullable', 'date'],
        ]);

        try {
            $result = $this->storage->uploadPhoto(
                file:   $request->file('file'),
                userId: Auth::id(),
                folder: 'graduation/invitations',
            );

            $album = Album::create([
                'user_id'              => Auth::id(),
                'title'                => $request->title,
                'description'          => $request->description,
                'type'                 => 'graduation',
                'category'             => 'invitation',
                'media_url'            => $result['secure_url'],
                'cloudinary_public_id' => $result['public_id'],
                'event_date'           => $request->event_date,
            ]);

            return response()->json(['success' => true, 'data' => $album], 201);

        } catch (StorageLimitExceededException $e) {
            return $this->error($e->getMessage(), $e->toArray(), 422);
        } catch (StorageUploadException $e) {
            return $this->error($e->getMessage(), [], 500);
        }
    }

    // ── Upload Graduation Song (audio) ────────────────────────────────────────

    public function uploadSong(Request $request): JsonResponse
    {
        $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'audio'       => ['required', 'file', 'mimes:mp3,wav,m4a,ogg,flac,webm', 'max:51200'],
            'event_date'  => ['nullable', 'date'],
        ]);

        try {
            $result = $this->storage->uploadPhoto(
                file:   $request->file('audio'),
                userId: Auth::id(),
                folder: 'graduation/songs',
            );

            $album = Album::create([
                'user_id'              => Auth::id(),
                'title'                => $request->title,
                'description'          => $request->description,
                'type'                 => 'graduation',
                'category'             => 'song',
                'media_url'            => $result['secure_url'],
                'cloudinary_public_id' => $result['public_id'],
                'event_date'           => $request->event_date,
            ]);

            return response()->json(['success' => true, 'data' => $album], 201);

        } catch (StorageLimitExceededException $e) {
            return $this->error($e->getMessage(), $e->toArray(), 422);
        } catch (StorageUploadException $e) {
            return $this->error($e->getMessage(), [], 500);
        }
    }

    // ── Upload Baccalaureate Mass (video) ─────────────────────────────────────

    public function uploadMass(Request $request): JsonResponse
    {
        $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'video'       => ['required', 'file', 'mimes:mp4,mov,avi,webm', 'max:2097152'],
            'event_date'  => ['nullable', 'date'],
        ]);

        try {
            $result = $this->storage->uploadPhoto(
                file:   $request->file('video'),
                userId: Auth::id(),
                folder: 'graduation/mass',
            );

            $album = Album::create([
                'user_id'              => Auth::id(),
                'title'                => $request->title,
                'description'          => $request->description,
                'type'                 => 'graduation',
                'category'             => 'mass',
                'media_url'            => $result['secure_url'],
                'cloudinary_public_id' => $result['public_id'],
                'event_date'           => $request->event_date,
            ]);

            return response()->json(['success' => true, 'data' => $album], 201);

        } catch (StorageLimitExceededException $e) {
            return $this->error($e->getMessage(), $e->toArray(), 422);
        } catch (StorageUploadException $e) {
            return $this->error($e->getMessage(), [], 500);
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public function destroy(int $id): JsonResponse
    {
        $album = Album::graduation()->findOrFail($id);

        try {
            if ($album->cloudinary_public_id) {
                $resourceType = in_array($album->category, ['videos', 'mass'])
                    ? 'video'
                    : (in_array($album->category, ['song']) ? 'video' : 'raw');

                $this->storage->deletePhoto(
                    publicId:     $album->cloudinary_public_id,
                    resourceType: $resourceType,
                );
            }
        } catch (StorageUploadException) {
            // Log but don't block deletion
        }

        $album->delete();

        return response()->json(['success' => true, 'message' => 'Deleted successfully.']);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function error(string $message, array $errors = [], int $status = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
        ], $status);
    }
}