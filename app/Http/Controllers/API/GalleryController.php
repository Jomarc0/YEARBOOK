<?php

namespace App\Http\Controllers\Api;

use App\Contracts\FaceRecognition;
use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\Photo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class GalleryController extends Controller
{
    public function __construct(private readonly FaceRecognition $faceRecognition) {}

    public function index()
    {
        return Cache::remember('gallery.albums.api', 600, function () {
            return Album::withCount('photos')->latest('event_date')->paginate(15);
        });
    }

    public function show(int $id)
    {
        return response()->json(Album::with('photos')->findOrFail($id));
    }

    public function faceSearch(Request $request)
    {
        $request->validate(['face_image' => 'required|image|max:5120']);

        $result = $this->faceRecognition->searchUploadedFace($request->file('face_image'), 5);

        $photos = [];
        if (! empty($result['matches'])) {
            $userIds = collect($result['matches'])->pluck('user_id')->filter()->values()->all();
            $photos = Photo::query()
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