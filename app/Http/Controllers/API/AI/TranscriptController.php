<?php

namespace App\Http\Controllers\API\AI;

use App\Http\Controllers\Controller;
use App\Jobs\AI\GenerateTranscript;
use App\Models\Transcript;
use App\Services\AI\TranscriptionService;
use App\Services\Storage\CloudinaryService;   // ← direct, not interface
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * TranscriptController
 * ─────────────────────────────────────────────────────────────
 * Premium-only. Routes gated by 'premium' middleware in api.php.
 *
 * Audio is uploaded to Cloudinary (resource_type: video).
 * Groq Whisper fetches it from the Cloudinary URL.
 *
 * GET    /api/transcripts                → index   (list + searchable)
 * POST   /api/transcripts               → store   (upload to Cloudinary + queue Groq)
 * GET    /api/transcripts/{id}          → show
 * DELETE /api/transcripts/{id}          → destroy (also removes from Cloudinary)
 * GET    /api/transcripts/{id}/subtitles → subtitles (SRT / VTT download)
 * POST   /api/transcripts/{id}/notes    → regenerate speech notes
 */
class TranscriptController extends Controller
{
    public function __construct(
        private readonly TranscriptionService $transcriptionService,
        private readonly CloudinaryService    $cloudinary,   // ← for uploadAudio()
    ) {}

    // ── Feature: List + Searchable speeches ──────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = Transcript::where('uploaded_by', $request->user()->id)->latest();

        // Search across title, transcript text, and AI notes
        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('title',            'like', "%{$search}%")
                  ->orWhere('transcript_text', 'like', "%{$search}%")
                  ->orWhere('notes',           'like', "%{$search}%");
            });
        }

        if ($lang   = $request->query('lang'))   $query->where('language', $lang);
        if ($status = $request->query('status')) $query->where('status',   $status);

        return response()->json($query->paginate(10));
    }

    // ── Feature: Transcript generation ───────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'audio' => [
                'required',
                'file',
                // Groq supports: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm
                'mimes:mp3,wav,m4a,ogg,flac,webm,mp4,mpeg,mpga',
                'max:25600',   // 25 MB — Groq free tier limit
            ],
            'title' => 'required|string|max:255',
        ]);

        // ── Upload audio to Cloudinary ────────────────────────────────────
        // Uses uploadAudio() which sets resource_type: 'video' automatically
        $uploaded = $this->cloudinary->uploadAudio(
            $request->file('audio'),
            $request->user()->id,
        );

        // ── Create transcript record ──────────────────────────────────────
        $transcript = Transcript::create([
            'title'       => $request->input('title'),
            'audio_path'  => $uploaded['secure_url'],  // ← full Cloudinary HTTPS URL
            'public_id'   => $uploaded['public_id'],   // ← for deletion later
            'status'      => 'pending',
            'uploaded_by' => $request->user()->id,
        ]);

        // ── Dispatch Groq Whisper job ─────────────────────────────────────
        GenerateTranscript::dispatch($transcript);

        return response()->json($transcript, 201);
    }

    // ── Show ──────────────────────────────────────────────────────────────

    public function show(int $id, Request $request): JsonResponse
    {
        $transcript = Transcript::where('id', $id)
            ->where('uploaded_by', $request->user()->id)
            ->firstOrFail();

        return response()->json($transcript);
    }

    // ── Delete (removes from Cloudinary too) ──────────────────────────────

    public function destroy(int $id, Request $request): JsonResponse
    {
        $transcript = Transcript::where('id', $id)
            ->where('uploaded_by', $request->user()->id)
            ->firstOrFail();

        // Remove audio from Cloudinary
        if ($transcript->public_id) {
            try {
                $this->cloudinary->deletePhoto(
                    $transcript->public_id,
                    'video'   // audio stored as 'video' resource type
                );
            } catch (\Throwable $e) {
                // Log but don't block deletion of DB record
                \Illuminate\Support\Facades\Log::warning(
                    "Could not delete Cloudinary audio [{$transcript->public_id}]: {$e->getMessage()}"
                );
            }
        }

        $transcript->delete();

        return response()->json(['deleted' => true]);
    }

    // ── Feature: Subtitle generation ─────────────────────────────────────

    public function subtitles(int $id, Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $transcript = Transcript::where('id', $id)
            ->where('uploaded_by', $request->user()->id)
            ->where('status', 'done')
            ->firstOrFail();

        $format   = in_array($request->query('format'), ['srt', 'vtt'])
            ? $request->query('format') : 'srt';

        $content  = $this->transcriptionService->generateSubtitles($transcript, $format);
        $mimeType = $format === 'vtt' ? 'text/vtt' : 'application/x-subrip';
        $filename = str($transcript->title)->slug()->append(".{$format}");

        return response($content, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    // ── Feature: Speech notes ─────────────────────────────────────────────

    public function regenerateNotes(int $id, Request $request): JsonResponse
    {
        $transcript = Transcript::where('id', $id)
            ->where('uploaded_by', $request->user()->id)
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