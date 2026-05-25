<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Yearbook;

use App\Contracts\StorageServiceInterface;
use App\Exceptions\StorageLimitExceededException;
use App\Exceptions\StorageUploadException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Yearbook\BulkUploadRequest;
use App\Http\Requests\Yearbook\UploadVideoRequest;
use App\Http\Resources\MediaResource;
use App\Models\Album;
use App\Models\Photo;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class MediaController extends Controller
{
    public function __construct(
        private readonly StorageServiceInterface $storage
    ) {}

    // =========================================================================

    /**
     * POST /api/media/bulk-upload
     */
    public function bulkUpload(BulkUploadRequest $request): JsonResponse
    {
        $album = Album::findOrFail($request->validated('album_id'));

        try {
            $results = $this->storage->uploadBulk(
                files:  $request->file('photos'),
                userId: Auth::id(),
                folder: "albums/{$album->id}",
            );

            $uploaded = collect($results)->filter(fn ($r) => $r['success']);
            $failed   = collect($results)->filter(fn ($r) => ! $r['success']);

            $uploaded->map(function ($result) use ($album) {
                return $album->photos()->create([
                    'file_path'   => $result['secure_url'],
                    'public_id'   => $result['public_id'],
                    'caption'     => null,
                    'ai_metadata' => [
                        'resource_type' => $result['resource_type'],
                        'bytes'         => $result['bytes'],
                        'width'         => $result['width'],
                        'height'        => $result['height'],
                    ],
                ]);
            });

            return $this->success(
                message: "{$uploaded->count()} photo(s) uploaded, {$failed->count()} failed.",
                data: [
                    'uploaded' => MediaResource::collection($uploaded->values()),
                    'failed'   => $failed->values(),
                ],
                status: 201
            );

        } catch (StorageLimitExceededException $e) {
            return $this->error(message: $e->getMessage(), errors: $e->toArray(), status: 422);
        } catch (StorageUploadException $e) {
            return $this->error(message: $e->getMessage(), status: 500);
        }
    }

    // =========================================================================

    /**
     * POST /api/media/upload-video
     */
    public function uploadVideo(UploadVideoRequest $request): JsonResponse
    {
        $album = Album::findOrFail($request->validated('album_id'));

        try {
            $result = $this->storage->uploadPhoto(
                file:   $request->file('video'),
                userId: Auth::id(),
                folder: "albums/{$album->id}/videos",
            );

            $album->photos()->create([
                'file_path'   => $result['secure_url'],
                'public_id'   => $result['public_id'],
                'caption'     => $request->validated('caption'),
                'ai_metadata' => [
                    'resource_type' => 'video',
                    'public_id'     => $result['public_id'],
                    'bytes'         => $result['bytes'],
                    'duration'      => $result['duration'],
                ],
            ]);

            return $this->success(
                message: 'Video uploaded successfully.',
                data:    new MediaResource($result),
                status:  201
            );

        } catch (StorageLimitExceededException $e) {
            return $this->error(message: $e->getMessage(), errors: $e->toArray(), status: 422);
        } catch (StorageUploadException $e) {
            return $this->error(message: $e->getMessage(), status: 500);
        }
    }

    // =========================================================================

    /**
     * DELETE /api/media/photo/{id}
     */
    public function deletePhoto(int $id): JsonResponse
    {
        $photo = Photo::findOrFail($id);

        Gate::authorize('delete', $photo);

        try {
            if ($photo->public_id) {
                $this->storage->deletePhoto(
                    publicId:     $photo->public_id,
                    resourceType: $photo->ai_metadata['resource_type'] ?? 'image',
                );
            }

            $photo->delete();

            return $this->success(message: 'Photo deleted successfully.');

        } catch (StorageUploadException $e) {
            return $this->error(message: $e->getMessage(), status: 500);
        }
    }

    // =========================================================================

    /**
     * GET /api/media/storage-usage
     *
     * Returns used bytes, storage limit, and tier for the current user.
     * Used by the frontend StorageUsageBar component.
     */
   // Replace the entire storageUsage() method with this:

public function storageUsage(): JsonResponse
{
    $userId = Auth::id();
    
    $subscription = \App\Models\Subscription::where('user_id', $userId)
        ->where('status', 'active')
        ->first();

    // Direct from DB - no accessors
    $tier = $subscription?->tier ?? 'free';

    $limitBytes = match($tier) {
        'premium' => 50 * 1024 * 1024 * 1024,
        'premium_standard' => 10 * 1024 * 1024 * 1024,
        'standard' => 2 * 1024 * 1024 * 1024,
        default => 500 * 1024 * 1024,
    };

    $label = match($tier) {
        'premium' => 'Premium HD',
        'premium_standard' => 'Premium Standard',
        'standard' => 'Standard',
        default => 'Free',
    };

    return $this->success(data: [
        'used_bytes' => 0,
        'limit_bytes' => $limitBytes,
        'tier' => $tier,
        'label' => $label,
        'percent' => 0,
    ]);
}

    // =========================================================================
    // Response helpers
    // =========================================================================

    private function success(string $message = 'OK', mixed $data = [], int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    private function error(string $message, array $errors = [], int $status = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
        ], $status);
    }
}