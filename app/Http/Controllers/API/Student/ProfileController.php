<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Student;

use App\Contracts\StorageServiceInterface;
use App\Exceptions\StorageLimitExceededException;
use App\Exceptions\StorageUploadException;
use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\Photo;
use App\Models\TaggedPhoto;
use App\Models\User;
use App\Notifications\PhotoTaggedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    public function __construct(
        private readonly StorageServiceInterface $storage
    ) {}

    // =========================================================================
    // GET /api/students/{id}/posts
    // =========================================================================

    public function getPosts(int $id): JsonResponse
    {
        $isOwner = Auth::id() === $id;

        $photos = Photo::where('user_id', $id)
            ->where('is_profile_post', true)
            ->when(! $isOwner, fn ($q) => $q->where('visibility', 'public'))
            ->with([
                'user:id,name,profile_picture',
                'taggedStudents:id,name,profile_picture',
            ])
            ->latest()
            ->paginate(12);

        return response()->json(['success' => true, 'data' => $photos]);
    }

    // =========================================================================
    // POST /api/profile/upload
    // =========================================================================

    public function uploadMedia(Request $request): JsonResponse
    {
        $request->validate([
            'file'             => ['required', 'file', 'mimes:jpeg,png,webp,heic,gif,mp4,mov', 'max:51200'],
            'caption'          => ['nullable', 'string', 'max:255'],
            'visibility'       => ['nullable', 'in:public,friends,private'],
            'tagged_user_ids'  => ['nullable', 'array'],
            'tagged_user_ids.*'=> ['integer', 'exists:users,id'],
        ]);

        $user = Auth::user();

        // ── Subscription tier gate ─────────────────────────────────────────
        $subscription = \App\Models\Subscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->latest()
            ->first();

        if (! $subscription || $subscription->plan === 'free') {
            return response()->json([
                'success' => false,
                'message' => 'Uploading photos requires a Premium subscription.',
                'code'    => 'UPGRADE_REQUIRED',
            ], 403);
        }

        try {
            $result = $this->storage->uploadPhoto(
                file:   $request->file('file'),
                userId: $user->id,
                folder: 'profile',
            );

            $album = Album::firstOrCreate(
                ['user_id' => $user->id, 'title' => 'My Uploads'],
                ['type' => 'profile', 'event_date' => now()->toDateString()]
            );

            $photo = Photo::create([
                'album_id'        => $album->id,
                'user_id'         => $user->id,
                'file_path'       => $result['secure_url'],
                'public_id'       => $result['public_id'],
                'caption'         => $request->caption,
                'visibility'      => $request->input('visibility', 'public'),
                'is_profile_post' => true,
                'ai_metadata'     => [
                    'bytes'         => $result['bytes']         ?? 0,
                    'resource_type' => $result['resource_type'] ?? 'image',
                    'width'         => $result['width']         ?? null,
                    'height'        => $result['height']        ?? null,
                ],
            ]);

            // ── Tag people + send notifications ────────────────────────────
            if ($request->filled('tagged_user_ids')) {
                $this->tagUsersAndNotify(
                    $photo,
                    $request->input('tagged_user_ids', []),
                    $user
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Photo uploaded successfully.',
                'data'    => [
                    'id'           => $photo->id,
                    'file_path'    => $photo->file_path,
                    'caption'      => $photo->caption,
                    'visibility'   => $photo->visibility,
                    'tagged_users' => $photo->taggedStudents()->get(['users.id', 'users.name', 'users.profile_picture']),
                    'created_at'   => $photo->created_at,
                ],
            ], 201);

        } catch (StorageLimitExceededException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors'  => $e->toArray(),
                'code'    => 'STORAGE_LIMIT_EXCEEDED',
            ], 422);

        } catch (StorageUploadException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed. Please try again.',
                'code'    => 'UPLOAD_FAILED',
            ], 500);
        }
    }

    // =========================================================================
    // PATCH /api/profile/posts/{photoId}
    // =========================================================================

    public function updatePost(Request $request, int $photoId): JsonResponse
    {
        $photo = Photo::where('id', $photoId)
            ->where('user_id', Auth::id())
            ->where('is_profile_post', true)
            ->firstOrFail();

        $validated = $request->validate([
            'caption'          => ['nullable', 'string', 'max:255'],
            'visibility'       => ['nullable', 'in:public,friends,private'],
            'tagged_user_ids'  => ['nullable', 'array'],
            'tagged_user_ids.*'=> ['integer', 'exists:users,id'],
        ]);

        $photo->update([
            'caption'    => $validated['caption']    ?? $photo->caption,
            'visibility' => $validated['visibility'] ?? $photo->visibility,
        ]);

        // ── Sync tags + notify newly added users ───────────────────────────
        if (array_key_exists('tagged_user_ids', $validated)) {
            $newIds = $validated['tagged_user_ids'] ?? [];

            // Find who was NOT previously tagged (to send notifications only to new tags)
            $existingIds = TaggedPhoto::where('photo_id', $photo->id)
                ->where('source', 'manual')
                ->pluck('user_id')
                ->toArray();

            $addedIds = array_values(array_diff($newIds, $existingIds));

            // Remove old manual tags
            TaggedPhoto::where('photo_id', $photo->id)
                ->where('source', 'manual')
                ->delete();

            // Re-create all manual tags
            $this->tagUsersAndNotify(
                $photo,
                $newIds,
                Auth::user(),
                $addedIds  
            );
        }

        $fresh = $photo->fresh()->load('taggedStudents:id,name,profile_picture');

        return response()->json([
            'success' => true,
            'message' => 'Post updated.',
            'data'    => [
                ...$fresh->toArray(),
                'tagged_users' => $fresh->taggedStudents->map(fn($u) => [
                    'id'              => $u->id,
                    'name'            => $u->name,
                    'profile_picture' => $u->profile_picture,
                ])->values(),
            ],
        ]);
    }

    // =========================================================================
    // GET /api/profile/storage-usage
    // =========================================================================

    public function storageUsage(): JsonResponse
    {
        $user = Auth::user();

        $subscription = \App\Models\Subscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->latest()
            ->first();

        $tierKey    = $subscription?->tier ?? 'free';
        $tierConfig = config("cloudinary.tiers.{$tierKey}");

        if (! is_array($tierConfig)) {
            $tierConfig = config('cloudinary.tiers.free');
        }
        if (! is_array($tierConfig)) {
            $tierConfig = [
                'storage_limit_bytes' => 500 * 1024 * 1024,
                'hd_enabled'          => false,
            ];
        }

        $usedBytes = $this->storage->getUserStorageUsed($user->id);

        return response()->json([
            'success' => true,
            'data'    => [
                'used_bytes'  => $usedBytes,
                'limit_bytes' => $tierConfig['storage_limit_bytes'],
                'tier'        => $tierKey,
                'tier_label'  => ucfirst($tierKey),
                'hd_enabled'  => $tierConfig['hd_enabled'],
            ],
        ]);
    }

    // =========================================================================
    // DELETE /api/profile/posts/{photoId}
    // =========================================================================

    public function deletePost(int $photoId): JsonResponse
    {
        $photo = Photo::where('id', $photoId)
            ->where('user_id', Auth::id())
            ->where('is_profile_post', true)
            ->firstOrFail();

        try {
            if ($photo->public_id) {
                $resourceType = $photo->ai_metadata['resource_type'] ?? 'image';
                $this->storage->deletePhoto(
                    publicId:     $photo->public_id,
                    resourceType: $resourceType,
                );
            }
        } catch (StorageUploadException) {}

        // Remove all tags before deleting
        TaggedPhoto::where('photo_id', $photo->id)->delete();
        $photo->delete();

        return response()->json(['success' => true, 'message' => 'Post deleted.']);
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Create TaggedPhoto records and send PhotoTaggedNotification
     * to each tagged user (excluding the tagger themselves).
     *
     * @param  Photo    $photo       The photo being tagged
     * @param  array    $userIds     All user IDs to tag
     * @param  User     $tagger      Who is doing the tagging
     * @param  array    $notifyIds   Subset to notify (null = notify all)
     */
    private function tagUsersAndNotify(
        Photo $photo,
        array $userIds,
        User  $tagger,
        ?array $notifyIds = null
    ): void {
        $notifyIds = $notifyIds ?? $userIds;

        foreach ($userIds as $userId) {
            // Don't tag yourself
            if ($userId === $tagger->id) continue;

            TaggedPhoto::create([
                'photo_id'   => $photo->id,
                'user_id'    => $userId,
                'tagged_by'  => $tagger->id,
                'source'     => 'manual',
                'similarity' => 100,
                'confidence' => 100,
                'status'     => 'approved', 
            ]);

            // Send notification only to newly tagged users
            if (in_array($userId, $notifyIds)) {
                $taggedUser = User::find($userId);
                if ($taggedUser) {
                    $taggedUser->notify(
                        new PhotoTaggedNotification($photo, $tagger)
                    );
                }
            }
        }
    }
}