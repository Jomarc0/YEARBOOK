<?php

namespace App\Http\Controllers\API\Student;

use App\Contracts\StorageServiceInterface;
use App\Http\Controllers\Controller;
use App\Jobs\AI\ProcessFaceIndexing;
use App\Models\AuditLog;
use App\Models\TaggedPhoto;
use App\Models\User;
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

    // ── List ──────────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $viewer    = $request->user();
        $viewerKey = $viewer ? $viewer->id : 'guest';

        $key = 'students.api.' . $viewerKey . '.' . md5(serialize($request->only(['section_id', 'course', 'q', 'page'])));

        return Cache::remember($key, 300, function () use ($request, $viewer) {
            return User::with('section')
                ->when(!$viewer, fn($q) =>
                    $q->where('profile_visibility', 'public')
                )
                ->when($viewer, fn($q) =>
                    $q->where(function ($inner) use ($viewer) {
                        $inner->whereIn('profile_visibility', ['public', 'alumni_only'])
                              ->orWhere('id', $viewer->id);
                    })
                )
                ->when($request->section_id, fn($q) => $q->where('section_id', $request->section_id))
                ->when($request->course,     fn($q) => $q->where('course', $request->course))
                ->when($request->q, fn($q) => $q->where(function ($sub) use ($request) {
                    $sub->where('name', 'like', "%{$request->q}%")
                        ->orWhere('student_id', 'like', "%{$request->q}%");
                }))
                ->orderBy('name')
                ->paginate(20);
        });
    }

    // ── Show ──────────────────────────────────────────────────────────────────
    public function show(Request $request, int $id): JsonResponse
    {
        $student      = User::with('section')->findOrFail($id);
        $isSubscribed = $request->attributes->get('viewer_is_subscribed', false);
        $isOwner      = $request->user()?->id === $id;

        if ($isOwner) {
            return response()->json(array_merge(
                $student->toArray(),
                ['is_subscribed_viewer' => true]
            ));
        }

        if (! $isSubscribed) {
            return response()->json([
                'id'                   => $student->id,
                'name'                 => $student->name,
                'profile_picture'      => $student->profile_picture,
                'is_premium'           => $student->is_premium,
                'is_subscribed_viewer' => false,
            ]);
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

        if ($user->profile_picture_public_id) {
            try {
                $this->storage->deletePhoto($user->profile_picture_public_id, 'image');
            } catch (\Throwable) {}
        }

        if (
            $user->profile_picture &&
            !str_starts_with($user->profile_picture, 'http') &&
            Storage::disk('public')->exists($user->profile_picture)
        ) {
            Storage::disk('public')->delete($user->profile_picture);
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

        ProcessFaceIndexing::dispatch($user->fresh());

        AuditLog::record($request, 'API Update Photo', 'Updated profile photo for ' . $user->email);

        return response()->json([
            'message'         => 'Photo updated.',
            'profile_picture' => $result['secure_url'],
        ]);
    }

    // ── Update bio ────────────────────────────────────────────────────────────
    public function updateBio(Request $request): JsonResponse
    {
        $request->validate(['bio' => 'nullable|string|max:255']);
        $request->user()->update(['bio' => $request->bio]);
        AuditLog::record($request, 'API Update Bio', 'Updated bio for ' . $request->user()->email);
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

        $request->user()->update(['password' => Hash::make($request->password)]);

        AuditLog::record($request, 'API Update Password', 'Changed password for ' . $request->user()->email);

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

    // ── Tagged photos (add) ───────────────────────────────────────────────────
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

        // Notify the tagged user via push + email
        $taggedUser = User::find($request->user_id);
        if ($taggedUser) {
            PhotoTaggedNotification::dispatchFor(
                tagged:   $taggedUser,
                tagger:   $request->user(),
                photoUrl: $photo->photo_url,
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Photo tagged successfully.',
            'data'    => [
                'id'          => $photo->id,
                'photo_url'   => $photo->photo_url,
                'caption'     => $photo->caption,
                'uploaded_by' => ['id' => $request->user()->id, 'name' => $request->user()->name],
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