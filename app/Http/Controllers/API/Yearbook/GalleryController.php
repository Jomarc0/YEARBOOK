<?php

namespace App\Http\Controllers\API\Yearbook;

use App\Contracts\FaceRecognition;
use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\Photo;
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
            'data'    => Album::with('photos')->findOrFail($id),
        ]);
    }

    public function faceSearch(Request $request): JsonResponse
    {
        $request->validate(['face_image' => 'required|image|max:5120']);

        $result = $this->faceRecognition->searchUploadedFace($request->file('face_image'), 5);

        $photos = [];
        if (! empty($result['matches'])) {
            $userIds = collect($result['matches'])->pluck('user_id')->filter()->values()->all();
            $photos  = Photo::query()
                ->where(function ($q) use ($userIds) {
                    foreach ($userIds as $id) {
                        $q->orWhereJsonContains('ai_metadata->matches', ['user_id' => (int) $id]);
                    }
                })
                ->latest()->limit(30)->get();
        }

        return response()->json([
            'status'  => $result['status'],
            'matches' => $result['matches'] ?? [],
            'photos'  => $photos,
        ]);
    }
}