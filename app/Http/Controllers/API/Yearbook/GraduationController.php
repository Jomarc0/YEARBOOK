<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Yearbook;

use App\Http\Controllers\Controller;
use App\Models\GraduationAlbum;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class GraduationController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────
    // LIST ALBUMS
    // ─────────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        try {
            $category = $request->query('category', 'photos');

            $albums = GraduationAlbum::published()
                ->ofCategory($category)
                ->with([
                    // Cover thumbnails for photo tabs
                    'photos' => fn ($q) => $q->images()->orderBy('sort_order')->limit(4),
                ])
                ->when(
                    // Only eager-load video files for video-based tabs
                    in_array($category, ['videos', 'mass']),
                    fn ($q) => $q->with([
                        'mediaFiles' => fn ($q) => $q->videos()->orderBy('sort_order'),
                    ])
                )
                ->withCount('photos')
                ->latest()
                ->get();

            return response()->json(['data' => $albums]);
        } catch (Throwable $e) {
            Log::error('[Graduation] index failed', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return response()->json(['message' => 'Failed to load graduation content.'], 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // SHOW ALBUM
    // ─────────────────────────────────────────────────────────────────────

    public function show(int $id): JsonResponse
    {
        try {
            $album = GraduationAlbum::published()
                ->with([
                    'photos' => fn ($q) => $q->orderBy('sort_order'),
                    'batch',
                ])
                ->findOrFail($id);

            return response()->json(['data' => $album]);
        } catch (Throwable $e) {
            Log::error('[Graduation] show failed', [
                'id'      => $id,
                'message' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Album not found.'], 404);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // LIST PHOTOS IN ALBUM
    // ─────────────────────────────────────────────────────────────────────

    public function photos(Request $request, int $id): JsonResponse
    {
        try {
            $album = GraduationAlbum::published()->findOrFail($id);

            $photos = $album->photos()
                ->when(
                    $request->query('type'),
                    fn ($q, $type) => $q->where('resource_type', $type)
                )
                ->orderBy('sort_order')
                ->paginate($request->integer('per_page', 24));

            return response()->json(['data' => $photos]);
        } catch (Throwable $e) {
            Log::error('[Graduation] photos failed', [
                'id'      => $id,
                'message' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Failed to load photos.'], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            GraduationAlbum::findOrFail($id)->delete();

            return response()->json(['message' => 'Graduation album moved to trash.']);
        } catch (Throwable $e) {
            Log::error('[Graduation] destroy failed', [
                'id'      => $id,
                'message' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Failed to delete graduation album.'], 500);
        }
    }
}
