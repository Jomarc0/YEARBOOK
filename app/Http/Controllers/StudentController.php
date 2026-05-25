<?php

namespace App\Http\Controllers\API\Student;

use App\Http\Controllers\Controller;
use App\Jobs\AI\ProcessFaceIndexing;
use App\Models\AuditLog;
use App\Models\Photo;
use App\Models\TaggedPhoto;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class StudentController extends Controller
{
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
    public function show(int $id): JsonResponse
    {
        return response()->json(User::with('section')->findOrFail($id));
    }

    // ── Update photo ──────────────────────────────────────────────────────────
    public function updatePhoto(Request $request): JsonResponse
    {
        $request->validate(['photo' => 'required|image|mimes:jpeg,png,jpg|max:5120']);

        $user = $request->user();

        if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
            Storage::disk('public')->delete($user->profile_picture);
        }

        $path = $request->file('photo')->store('profile_pics', 'public');
        $user->update(['profile_picture' => $path]);

        ProcessFaceIndexing::dispatch($user->fresh());

        AuditLog::record($request, 'API Update Photo', 'Updated profile photo for ' . $user->email);

        return response()->json([
            'message'         => 'Photo updated.',
            'profile_picture' => $path,
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
    public function achievements(int $id): JsonResponse
    {
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
    // FIX: now queries TaggedPhoto records that have photo_id (from ProfileController
    //      manual tagging), showing posts from OTHER users where this person was tagged.
    public function taggedPhotos(int $id): JsonResponse
    {
        User::findOrFail($id); // ensure user exists, 404 if not

        $tags = TaggedPhoto::where('user_id', $id)
            // Include both AI and manual tags
            ->whereIn('source', ['rekognition', 'manual'])
            // Only approved tags (manual = 'approved', AI may be null)
            ->where(function ($q) {
                $q->where('status', 'approved')
                  ->orWhereNull('status');
            })
            // Must be linked to a Photo record (manual tags always have photo_id)
            ->whereNotNull('photo_id')
            // Only show posts that are public so tagged person can see them
            ->whereHas('photo', fn($q) => $q->where('visibility', 'public')->where('is_profile_post', true))
            ->with([
                // The actual photo (posted by someone else)
                'photo:id,file_path,caption,user_id,visibility,created_at',
                // Who posted it
                'photo.user:id,name,profile_picture',
            ])
            ->orderByDesc('created_at')
            ->paginate(12);

        return response()->json([
            'success' => true,
            'data'    => collect($tags->items())->map(fn(TaggedPhoto $t) => [
                'tag_id'    => $t->id,
                'source'    => $t->source,
                'photo'     => $t->photo ? [
                    'id'        => $t->photo->id,
                    'file_path' => $t->photo->file_path,
                    'caption'   => $t->photo->caption,
                ] : null,
                // Who posted the photo (the person who tagged them)
                'posted_by' => $t->photo?->user ? [
                    'id'              => $t->photo->user->id,
                    'name'            => $t->photo->user->name,
                    'profile_picture' => $t->photo->user->profile_picture,
                ] : null,
                'created_at' => $t->created_at->diffForHumans(),
            ]),
            'meta' => [
                'current_page' => $tags->currentPage(),
                'last_page'    => $tags->lastPage(),
                'total'        => $tags->total(),
            ],
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