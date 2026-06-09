<?php

namespace App\Http\Controllers\API\Student;

use App\Contracts\StorageServiceInterface;
use App\Http\Controllers\Controller;
use App\Jobs\AI\ProcessFaceIndexing;
use App\Models\AuditLog;
use App\Models\Photo;
use App\Models\Student;
use App\Models\TaggedPhoto;
use App\Models\User;
use App\Models\UserNotification;
use App\Notifications\PhotoTaggedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class StudentController extends Controller
{
    public function __construct(
        private readonly StorageServiceInterface $storage
    ) {}

    private function notifyProfileUpdate(User $user, string $body): void
    {
        UserNotification::create([
            'user_id' => $user->id,
            'type' => 'profile_update',
            'title' => 'Profile updated',
            'body' => $body,
            'data' => [
                'type' => 'profile_update',
                'sender_name' => 'Sinag-Bughaw',
                'action_url' => '/profile',
            ],
        ]);
    }

    // ── List ──────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $viewer    = $request->user();
        $viewerKey = $viewer ? $viewer->id : 'guest';

        $key = 'students.api.' . $viewerKey . '.' . md5(serialize($request->only(['section_id', 'course', 'q', 'page'])));

        return Cache::remember($key, 300, function () use ($request, $viewer) {
            return User::with(['section', 'studentRecord'])
                ->where('role', 'student')
                ->when(! $viewer, fn($q) =>
                    $q->where('profile_visibility', 'public')
                )
                ->when($viewer, fn($q) =>
                    $q->where(function ($inner) use ($viewer) {
                        $inner->where('profile_visibility', 'public')
                              ->orWhere(function ($batchmates) use ($viewer) {
                                  $batchmates->whereIn('profile_visibility', ['batchmates', 'alumni_only'])
                                      ->where(function ($sameBatch) use ($viewer) {
                                          $hasBatchScope = false;

                                          if ($viewer->batch_id) {
                                              $sameBatch->orWhere('batch_id', $viewer->batch_id);
                                              $hasBatchScope = true;
                                          }

                                          $viewerYear = $viewer->graduation_year ?? $viewer->batch;
                                          if ($viewerYear) {
                                              $sameBatch
                                                  ->orWhere('graduation_year', $viewerYear)
                                                  ->orWhere('batch', (string) $viewerYear)
                                                  ->orWhereHas('studentRecord', fn($student) =>
                                                      $student->where('graduation_year', $viewerYear)
                                                  );
                                              $hasBatchScope = true;
                                          }

                                          if (! $hasBatchScope) {
                                              $sameBatch->whereRaw('1 = 0');
                                          }
                                      });
                              })
                              ->orWhere('id', $viewer->id);
                    })
                )
                ->when($request->section_id, fn($q) =>
                    $q->where('section_id', $request->section_id)
                )
                ->when($request->course, fn($q) =>
                    $q->whereHas('studentRecord', fn($s) => $s->where('course', $request->course))
                )
                ->when($request->q, fn($q) =>
                    $q->where(function ($sub) use ($request) {
                        $sub->where('name', 'like', "%{$request->q}%")
                            ->orWhereHas('studentRecord', fn($s) =>
                                $s->where('student_no', 'like', "%{$request->q}%")
                            );
                    })
                )
                ->orderBy('name')
                ->paginate(20);
        });
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function show(Request $request, int $id): JsonResponse
    {
        $student = User::with(['section', 'studentRecord'])->find($id);
        if (! $student) {
            $studentRecord = Student::with('userAccount')->find($id);
            if (! $studentRecord) {
                return response()->json([
                    'message' => 'Student profile is unavailable.',
                    'restricted' => true,
                    'visibility' => 'unavailable',
                    'student' => [
                        'id' => $id,
                        'name' => 'Unavailable Student',
                        'profile_picture' => null,
                    ],
                ], 200);
            }

            $student = $studentRecord->userAccount;

            if (! $student) {
                return response()->json([
                    'message' => 'This student has not registered a user account yet.',
                    'restricted' => true,
                    'visibility' => 'unregistered',
                    'student' => [
                        'id' => $studentRecord->id,
                        'name' => trim(($studentRecord->first_name ?? '') . ' ' . ($studentRecord->last_name ?? '')),
                        'profile_picture' => $studentRecord->photo,
                        'course' => $studentRecord->course,
                    ],
                ], 200);
            }
        }

        $isSubscribed = $request->attributes->get('viewer_is_subscribed', false);
        $isOwner      = $request->user()?->id === $student->id;

        if ($isOwner) {
            return response()->json(array_merge(
                $student->toArray(),
                ['is_subscribed_viewer' => true]
            ));
        }

        if (! $isSubscribed) {
            return response()->json([
                'message'    => 'Upgrade to Standard or Premium to view full student profiles.',
                'restricted' => true,
                'visibility' => 'subscription',
                'student'    => [
                    'id'              => $student->id,
                    'name'            => $student->name,
                    'profile_picture' => $student->profile_picture,
                ],
            ], 402);
        }

        return response()->json(array_merge(
            $student->toArray(),
            ['is_subscribed_viewer' => true]
        ));
    }

    // ── Update photo ──────────────────────────────────────────────────────────

    public function updatePhoto(Request $request): JsonResponse
    {
        $request->validate(['photo' => 'required|image|mimes:jpeg,png,jpg|max:5120']);

        $user = $request->user();

        if ($user->getRawOriginal('profile_picture_public_id') ?? $user->profile_picture_public_id) {
            try {
                $this->storage->deletePhoto(
                    $user->getRawOriginal('profile_picture_public_id'),
                    'image'
                );
            } catch (\Throwable) {}
        }

        if (
            $user->getRawOriginal('profile_picture') &&
            ! str_starts_with($user->getRawOriginal('profile_picture'), 'http') &&
            Storage::disk('public')->exists($user->getRawOriginal('profile_picture'))
        ) {
            Storage::disk('public')->delete($user->getRawOriginal('profile_picture'));
        }

        $result = $this->storage->uploadPhoto(
            file:   $request->file('photo'),
            userId: $user->id,
            folder: 'profile_pics',
        );

        $user->update([
            'profile_picture'           => $result['secure_url'],
            'profile_picture_public_id' => $result['public_id'] ?? null,
        ]);

        ProcessFaceIndexing::dispatch($user->fresh()->load('studentRecord'));

        AuditLog::record($request, 'API Update Photo', 'Updated profile photo for ' . $user->email);
        $this->notifyProfileUpdate($user, 'Your profile picture was updated successfully.');

        return response()->json([
            'message'         => 'Photo updated.',
            'profile_picture' => $result['secure_url'],
        ]);
    }

    // ── Update bio ────────────────────────────────────────────────────────────

    public function updateBio(Request $request): JsonResponse
    {
        $request->validate(['bio' => 'nullable|string|max:255']);
        $user = $request->user();
        $user->update(['bio' => $request->bio]);
        AuditLog::record($request, 'API Update Bio', 'Updated bio for ' . $user->email);
        $this->notifyProfileUpdate($user, 'Your profile bio was updated successfully.');
        return response()->json(['success' => true, 'new_bio' => $request->user()->bio]);
    }

    // ── Update password ───────────────────────────────────────────────────────

    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password'      => ['required', 'string', 'current_password'],
            'password'              => ['required', 'string', Password::min(8)->letters()->numbers(), 'confirmed'],
            'password_confirmation' => ['required'],
        ], [
            'current_password.current_password' => 'Your current password is incorrect.',
            'password.confirmed'                => 'Passwords do not match.',
        ]);

        $user = $request->user();
        $user->update(['password' => Hash::make($request->password)]);

        AuditLog::record($request, 'API Update Password', 'Changed password for ' . $user->email);
        $this->notifyProfileUpdate($user, 'Your password was updated successfully.');

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }

    // ── Achievements ──────────────────────────────────────────────────────────

    public function achievements(Request $request, int $id): JsonResponse
    {
        $isSubscribed = $request->attributes->get('viewer_is_subscribed', false);
        $isOwner      = $request->user()?->id === $id;

        if (! $isOwner && ! $isSubscribed) {
            return response()->json(['success' => false, 'restricted' => true, 'data' => []], 200);
        }

        $user = User::findOrFail($id);

        $achievements = $user->achievements()
            ->orderByDesc('date_awarded')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($a) => [
                'id'           => $a->id,
                'title'        => $a->title,
                'subtitle'     => $a->subtitle,
                'type'         => $a->type,
                'date_awarded' => $a->date_awarded?->format('M d, Y'),
            ]);

        return response()->json([
            'success' => true,
            'data'    => $achievements,
        ]);
    }

    // ── Tagged photos (list) ──────────────────────────────────────────────────

    public function taggedPhotos(Request $request, int $id): JsonResponse
    {
        $isSubscribed = $request->attributes->get('viewer_is_subscribed', false);
        $isOwner      = $request->user()?->id === $id;

        if (! $isOwner && ! $isSubscribed) {
            return response()->json(['success' => false, 'restricted' => true, 'data' => []], 200);
        }

        $user = User::findOrFail($id);

        $photos = $user->taggedPhotos()
            ->with('uploader:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($p) => [
                'id'          => $p->id,
                'photo_url'   => $p->photo_url,
                'caption'     => $p->caption,
                'status'      => $p->status,
                'uploaded_by' => $p->uploader
                    ? ['id' => $p->uploader->id, 'name' => $p->uploader->name]
                    : null,
                'created_at'  => $p->created_at->diffForHumans(),
            ]);

        return response()->json([
            'success' => true,
            'data'    => $photos,
        ]);
    }

    // ── Tag students on a feed post (batch tag: photo_id + student_ids) ───────
    //
    //  POST /api/students/profile/tagged-photos
    //  Body: { photo_id: int, student_ids: int[] }
    //
    //  Used by the DashboardPage TagModal. Replaces the old addTaggedPhoto()
    //  contract which expected a file upload.
    // ─────────────────────────────────────────────────────────────────────────

    public function tagStudentsOnPost(Request $request): JsonResponse
    {
        $request->validate([
            'photo_id'      => ['required', 'integer', 'exists:photos,id'],
            'student_ids'   => ['required', 'array', 'min:1'],
            'student_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $photo  = Photo::with(['user:id,batch_id', 'media'])->findOrFail($request->photo_id);
        $authId = $request->user()->id;

        // Only the photo owner or a batchmate may tag
        abort_unless(
            $photo->user_id === $authId ||
            $request->user()->batch_id === optional($photo->user)->batch_id,
            403,
            'You cannot tag students on this post.'
        );

        $studentIds = collect($request->student_ids)->unique()->values();

        $alreadyTaggedIds = $photo->taggedStudents()
            ->wherePivot('tagged_by', $authId)
            ->pluck('users.id');

        // Sync via the BelongsToMany pivot (tagged_photos table).
        // syncWithoutDetaching preserves existing AI-tagged rows.
        $photo->taggedStudents()->syncWithoutDetaching(
            $studentIds->mapWithKeys(fn (int $id) => [
                $id => [
                    'source'    => 'manual',
                    'tagged_by' => $authId,
                ],
            ])->all()
        );

        $newlyTagged = User::whereIn('id', $studentIds)
            ->whereNotIn('id', $alreadyTaggedIds)
            ->get();

        $photoUrl = $photo->media->first()?->file_path ?? $photo->file_path ?? '';

        foreach ($newlyTagged as $tagged) {
            try {
                $actionUrl = rtrim(config('app.frontend_url'), '/') . '/students/' . $photo->user_id . '?post=' . $photo->id;
                PhotoTaggedNotification::dispatchFor($tagged, $request->user(), $photoUrl, $actionUrl);
            } catch (\Throwable) {
                // Never let a notification failure break the response
            }
        }

        // Return the full, authoritative tagged-student list for this photo
        $tagged = $photo->taggedStudents()
            ->select('users.id', 'users.name', 'users.profile_picture')
            ->get()
            ->map(fn ($s) => [
                'id'              => $s->id,
                'name'            => $s->name,
                'profile_picture' => $s->profile_picture,
            ]);

        return response()->json([
            'success'         => true,
            'message'         => 'Students tagged successfully.',
            'tagged_students' => $tagged,
        ]);
    }

    // ── Tagged photos (upload a photo and tag a single user) ──────────────────
    //
    //  POST /api/students/profile/tagged-photos/upload
    //  Body: multipart — photo (file), user_id (int), caption (string|null)
    //
    //  Original endpoint kept intact under a new path so existing callers
    //  are not broken.
    // ─────────────────────────────────────────────────────────────────────────

    public function addTaggedPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo'   => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'user_id' => ['required', 'exists:users,id'],
            'caption' => ['nullable', 'string', 'max:160'],
        ]);

        $path = $request->file('photo')->store('tagged-photos', 'public');

        $photo = TaggedPhoto::create([
            'user_id'     => $request->user_id,
            'uploaded_by' => $request->user()->id,
            'photo_path'  => $path,
            'caption'     => $request->caption,
            'status'      => 'approved',
        ]);

        $taggedUser = User::find($request->user_id);
        if ($taggedUser) {
            try {
                PhotoTaggedNotification::dispatchFor($taggedUser, $request->user(), $photo->photo_url);
            } catch (\Throwable) {}
        }

        return response()->json([
            'success' => true,
            'message' => 'Photo tagged successfully.',
            'data'    => [
                'id'          => $photo->id,
                'photo_url'   => $photo->photo_url,
                'caption'     => $photo->caption,
                'uploaded_by' => [
                    'id'   => $request->user()->id,
                    'name' => $request->user()->name,
                ],
                'created_at'  => $photo->created_at->diffForHumans(),
            ],
        ], 201);
    }

    // ── Tagged photos (remove) ────────────────────────────────────────────────

    public function removeTaggedPhoto(Request $request, int $photoId): JsonResponse
    {
        $photo   = TaggedPhoto::findOrFail($photoId);
        $authId  = $request->user()->id;
        $isOwner = $photo->user_id     === $authId;
        $isUpler = $photo->uploaded_by === $authId;

        abort_unless($isOwner || $isUpler, 403, 'Unauthorized.');

        Storage::disk('public')->delete($photo->photo_path);
        $photo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Photo removed.',
        ]);
    }
}
