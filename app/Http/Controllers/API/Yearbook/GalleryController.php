<?php

namespace App\Http\Controllers\API\Yearbook;

use App\Contracts\FaceRecognition;
use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\Photo;
use App\Models\GraduationPhoto;
use App\Models\GraduationAlbum;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class GalleryController extends Controller
{
    public function __construct(private readonly FaceRecognition $faceRecognition) {}

    public function index(Request $request): JsonResponse
    {
        $type     = $request->query('type', 'general');
        $category = $request->query('category');
        $cacheKey = "gallery.albums.api.{$type}." . ($category ?? 'all');

        $result = Cache::remember($cacheKey, 300, function () use ($type, $category) {
            $query = Album::withCount('photos')->latest('event_date');

            if ($type === 'graduation') {
                $query->graduation();
                if ($category) {
                    $query->where('category', $category);
                }
            } else {
                $query->general();
            }

            return $query->get();
        });

        return response()->json([
            'success' => true,
            'data'    => $result,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => Album::with([
                'photos' => fn($q) => $q->select([
                    'id', 'album_id', 'user_id',  // ← user_id must be here
                    'file_path', 'caption', 'status', 'ai_metadata', 'created_at'
                ])
            ])->findOrFail($id),
        ]);
    }

    public function faceSearch(Request $request): JsonResponse
    {
        $request->validate(['face_image' => 'required|image|max:5120']);

        $type     = $request->input('type', 'general');
        $category = $request->input('category');

        $result = $this->faceRecognition->searchUploadedFace($request->file('face_image'), 5);

        $photos = [];

        if (!empty($result['matches'])) {
            $similarityMap = collect($result['matches'])
                ->keyBy('user_id')
                ->map(fn($m) => $m['similarity'] ?? 0);

            $userIds = $similarityMap->keys()->all();

            if ($type === 'graduation') {
                // ── Graduation: match via ai_metadata only (no user_id column) ──
                $photos = GraduationPhoto::query()
                    ->whereHas('album', function ($q) use ($category) {
                        $q->published();
                        if ($category) {
                            $q->ofCategory($category);
                        }
                    })
                    ->where('resource_type', 'image')
                    ->where(function ($q) use ($userIds) {
                        foreach ($userIds as $uid) {
                            $q->orWhereJsonContains('ai_metadata->matches', ['user_id' => (int) $uid]);
                        }
                    })
                    ->with(['album:id,title,category'])
                    ->select([
                        'id',
                        'graduation_album_id',
                        'file_path',
                        'resource_type',
                        'ai_metadata',
                    ])
                    ->latest()
                    ->limit(30)
                    ->get()
                    ->map(function ($photo) use ($similarityMap) {
                        // Pull similarity from ai_metadata matches
                        $aiMatches = $photo->ai_metadata['matches'] ?? [];
                        $topMatch  = collect($aiMatches)
                            ->whereIn('user_id', $similarityMap->keys()->toArray())
                            ->sortByDesc('similarity')
                            ->first();

                        $photo->similarity = $topMatch['similarity'] ?? 0;
                        $photo->album_id   = $photo->graduation_album_id;
                        return $photo;
                    });

            } else {
                // ── General gallery: match via user_id ───────────────────────────
                $photos = Photo::query()
                    ->where('status', 'approved')
                    ->where('visibility', '!=', 'private')
                    ->whereHas('album', fn($q) => $q->where('type', 'general'))
                    ->where(function ($q) use ($userIds) {
                        foreach ($userIds as $uid) {
                            $q->orWhereJsonContains('ai_metadata->matches', ['user_id' => (int) $uid]);
                        }
                    })
                    ->with([
                        'album:id,title',
                        'user:id,name,profile_picture',
                    ])
                    ->select(['id', 'album_id', 'user_id', 'file_path', 'caption', 'ai_metadata'])
                    ->latest()
                    ->limit(30)
                    ->get()
                    ->map(function ($photo) use ($similarityMap) {
                        $photo->similarity      = $similarityMap->get($photo->user_id, 0);
                        $photo->name            = $photo->user?->name;
                        $photo->profile_picture = $photo->user?->profile_picture;
                        return $photo;
                    });
            }
        }

        return response()->json([
            'status'  => $result['status'],
            'matches' => $result['matches'] ?? [],
            'photos'  => $photos,
        ]);
    }
}