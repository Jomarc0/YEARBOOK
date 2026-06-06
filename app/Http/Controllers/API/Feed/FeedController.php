<?php

namespace App\Http\Controllers\API\Feed;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FeedController extends Controller
{
    /**
     * GET /api/feed
     *
     * filter = all | public | batchmates | mine
     */
    public function index(Request $request): JsonResponse
    {
        $user    = $request->user();
        $filter  = $request->query('filter', 'all');
        $search  = trim((string) $request->query('q', ''));
        $perPage = (int) $request->query('per_page', 10);

        $query = Photo::query()
            ->with([
                'user:id,name,profile_picture,batch_id,student_record_id',
                'user.studentRecord:id,course,photo',
                'taggedStudents:id,name,student_record_id',
                'taggedStudents.studentRecord:id,course,photo',
                'media',
            ])
            // ⭐ Single withCount() - load all counts at once
            ->withCount([
                'user as user_posts_count' => fn($q) => $q->where('status', 'approved'),
                'user as user_tagged_count' => fn($q) => $q->where('status', 'approved'),
            ])
            ->where('status', 'approved');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('caption', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhereHas('studentRecord', function ($studentQuery) use ($search) {
                                $studentQuery->where('student_no', 'like', "%{$search}%")
                                    ->orWhere('course', 'like', "%{$search}%")
                                    ->orWhere('first_name', 'like', "%{$search}%")
                                    ->orWhere('last_name', 'like', "%{$search}%");
                            });
                    })
                    ->orWhereHas('taggedStudents', function ($studentQuery) use ($search) {
                        $studentQuery->where('name', 'like', "%{$search}%")
                            ->orWhereHas('studentRecord', function ($recordQuery) use ($search) {
                                $recordQuery->where('student_no', 'like', "%{$search}%")
                                    ->orWhere('course', 'like', "%{$search}%")
                                    ->orWhere('first_name', 'like', "%{$search}%")
                                    ->orWhere('last_name', 'like', "%{$search}%");
                            });
                    });
            });
        }

        match ($filter) {

            // ── Public filter ─────────────────────────────────────────────
            'public' => $query->where('visibility', 'public'),

            // ── Batchmates filter ─────────────────────────────────────────
            'batchmates' => $query
                ->where('visibility', 'friends')
                ->whereHas('user', fn ($q) =>
                    $q->where('batch_id', $user->batch_id)
                ),

            // ── Mine filter ───────────────────────────────────────────────
            'mine' => $query->where('user_id', $user->id),

            // ── All filter (default) ──────────────────────────────────────
            default => $query->where(fn ($q) => $q
                ->where('visibility', 'public')
                ->orWhere('user_id', $user->id)
                ->orWhere(fn ($q2) => $q2
                    ->where('visibility', 'friends')
                    ->whereHas('user', fn ($q3) =>
                        $q3->where('batch_id', $user->batch_id)
                    )
                )
            ),
        };

        $paginator = $query
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json([
            'data' => $paginator->map(fn (Photo $photo) =>
                $this->formatPost($photo, $user)
            ),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    private function formatPost(Photo $photo, User $authUser): array
    {
        // ── Media handling ──────────────────────────────────────────────
        $media = $photo->media->isNotEmpty()
            ? $photo->media->map(fn ($m) => [
                'id'            => $m->id,
                'file_path'     => $m->file_path,
                'resource_type' => $m->resource_type,
                'width'         => $m->width,
                'height'        => $m->height,
            ])->values()->toArray()
            : ($photo->file_path ? [[
                'id'            => null,
                'file_path'     => $photo->file_path,
                'resource_type' => $photo->ai_metadata['resource_type'] ?? 'image',
                'width'         => null,
                'height'        => null,
            ]] : []);

        // ── User data (includes counts) ────────────────────────────────
        $userData = $photo->user
            ? [
                'id'              => $photo->user->id,
                'name'            => $photo->user->name,
                'course'          => $photo->user->course,
                'profile_picture' => $photo->user->profile_picture,
                // ⭐ Counts from withCount()
                'posts_count'     => (int) ($photo->user_posts_count ?? 0),
                'tagged_count'    => (int) ($photo->user_tagged_count ?? 0),
            ]
            : null;

        // ── Tagged students ─────────────────────────────────────────────
        $taggedStudents = $photo->taggedStudents->map(fn ($s) => [
            'id'              => $s->id,
            'name'            => $s->name,
            'course'          => $s->course,
            'profile_picture' => $s->profile_picture,
        ])->values()->toArray();

        return [
            'id'              => $photo->id,
            'caption'         => $photo->caption,
            'visibility'      => $photo->visibility === 'friends' ? 'batchmates' : $photo->visibility,
            'is_profile_post' => $photo->is_profile_post,
            'views_count'     => $photo->views_count ?? 0,
            'time_ago'        => $photo->created_at?->diffForHumans() ?? '',
            'created_at'      => $photo->created_at?->toIso8601String(),

            'user_id' => $photo->user_id,
            'user'   => $userData,

            'media'           => $media,

            'tagged_students' => $taggedStudents,
        ];
    }
}
