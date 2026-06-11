<?php

namespace App\Http\Controllers\API\AI;

use App\Http\Controllers\Controller;
use App\Jobs\AI\GenerateTranscript;
use App\Models\Transcript;
use App\Services\AI\TranscriptionService;
use App\Services\Storage\CloudinaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TranscriptController extends Controller
{
    public function __construct(
        private readonly TranscriptionService $transcriptionService,
        private readonly CloudinaryService    $cloudinary,
    ) {}

    // List

    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $query = Transcript::visibleTo($userId)->latest();

        // filter by specific graduation video 
        if ($photoId = $request->query('graduation_photo_id')) {
            $query->byPhoto((int) $photoId);
        }

        // filter by album
        elseif ($albumId = $request->query('album_id')) {
            $query->byAlbum((int) $albumId);
        }

        // Other filters 
        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('title',            'like', "%{$search}%")
                  ->orWhere('transcript_text', 'like', "%{$search}%")
                  ->orWhere('notes',           'like', "%{$search}%");
            });
        }

        if ($lang   = $request->query('lang'))   $query->where('language', $lang);
        if ($status = $request->query('status')) $query->where('status',   $status);
        if ($source = $request->query('source')) $query->where('source',   $source);

        return response()->json($query->paginate(10));
    }

    // Manual upload

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'audio'                => [
                'required', 'file',
                'mimes:mp3,wav,m4a,ogg,flac,webm,mp4,mpeg,mpga',
                'max:25600',
            ],
            'title'                => 'required|string|max:255',
            'album_id'             => 'nullable|integer|exists:albums,id',
            'graduation_photo_id'  => 'nullable|integer|exists:graduation_photos,id',
        ]);

        $uploaded = $this->cloudinary->uploadAudio(
            $request->file('audio'),
            $request->user()->id,
        );

        $transcript = Transcript::create([
            'title'               => $request->input('title'),
            'audio_path'          => $uploaded['secure_url'],
            'public_id'           => $uploaded['public_id'],
            'status'              => 'pending',
            'source'              => 'manual',
            'uploaded_by'         => $request->user()->id,
            'album_id'            => $request->input('album_id'),
            'graduation_photo_id' => $request->input('graduation_photo_id'),
        ]);

        GenerateTranscript::dispatch($transcript);

        return response()->json($transcript, 201);
    }

    // Show 

    public function show(int $id, Request $request): JsonResponse
    {
        $transcript = Transcript::visibleTo($request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        return response()->json($transcript);
    }

    //Delete 

    public function destroy(int $id, Request $request): JsonResponse
    {
        $transcript = Transcript::where('id', $id)
            ->where('uploaded_by', $request->user()->id)
            ->firstOrFail();

        if ($transcript->public_id && $transcript->source === 'manual') {
            try {
                $this->cloudinary->deletePhoto($transcript->public_id, 'video');
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning(
                    "Could not delete Cloudinary audio [{$transcript->public_id}]: {$e->getMessage()}"
                );
            }
        }

        $transcript->delete();

        return response()->json(['deleted' => true]);
    }

    // Subtitles 

    public function subtitles(int $id, Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $transcript = Transcript::visibleTo($request->user()->id)
            ->where('id', $id)
            ->where('status', 'done')
            ->firstOrFail();

        $format = in_array($request->query('format'), ['srt', 'vtt'])
            ? $request->query('format') : 'srt';

        $content  = $this->transcriptionService->generateSubtitles($transcript, $format);
        $mimeType = $format === 'vtt' ? 'text/vtt' : 'application/x-subrip';
        $filename = str($transcript->title)->slug()->append(".{$format}");

        return response($content, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    // Regenerate notes 

    public function regenerateNotes(int $id, Request $request): JsonResponse
    {
        $transcript = Transcript::visibleTo($request->user()->id)
            ->where('id', $id)
            ->where('status', 'done')
            ->firstOrFail();

        if (blank($transcript->transcript_text)) {
            return response()->json([
                'error' => 'No transcript text available to generate notes from.',
            ], 422);
        }

        $notes = $this->transcriptionService->generateNotes(
            $transcript->transcript_text,
            $transcript->title
        );

        $transcript->update(['notes' => $notes]);

        return response()->json([
            'notes'   => $notes,
            'message' => 'Speech notes regenerated successfully.',
        ]);
    }
}