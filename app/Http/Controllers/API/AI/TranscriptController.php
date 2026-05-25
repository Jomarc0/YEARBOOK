<?php

namespace App\Http\Controllers\API\AI;

use App\Http\Controllers\Controller;
use App\Jobs\AI\GenerateTranscript;
use App\Models\Transcript;
use App\Services\AI\TranscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * TranscriptController
 * ─────────────────────────────────────────────────────────────
 * Premium-only. Routes gated by 'premium' middleware in api.php.
 *
 * GET    /api/transcripts                → index   (list + search)
 * POST   /api/transcripts               → store   (upload + queue)
 * GET    /api/transcripts/{id}          → show
 * DELETE /api/transcripts/{id}          → destroy
 * GET    /api/transcripts/{id}/subtitles → subtitles (SRT / VTT)
 * POST   /api/transcripts/{id}/notes    → regenerate speech notes
 */
class TranscriptController extends Controller
{
    public function __construct(
        private readonly TranscriptionService $transcriptionService
    ) {}

    // ── Feature: List + Searchable speeches ───────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = Transcript::where('uploaded_by', $request->user()->id)
            ->latest();

        // ── Searchable speeches ──────────────────────────────────────────
        // Search across title AND transcript_text (full-text LIKE search)
        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('transcript_text', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Filter by language (e.g. ?lang=en, ?lang=tl)
        if ($lang = $request->query('lang')) {
            $query->where('language', $lang);
        }

        // Filter by status
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $transcripts = $query->paginate(10);

        return response()->json($transcripts);
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

        $path = $request->file('audio')->store('transcripts', 'public');

        $transcript = Transcript::create([
            'title'       => $request->input('title'),
            'audio_path'  => $path,
            'status'      => 'pending',
            'uploaded_by' => $request->user()->id,
        ]);

        // Dispatch Groq Whisper job
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

    // ── Delete ────────────────────────────────────────────────────────────

    public function destroy(int $id, Request $request): JsonResponse
    {
        $transcript = Transcript::where('id', $id)
            ->where('uploaded_by', $request->user()->id)
            ->firstOrFail();

        if ($transcript->audio_path) {
            Storage::disk('public')->delete($transcript->audio_path);
        }

        $transcript->delete();

        return response()->json(['deleted' => true]);
    }

    // ── Feature: Subtitle generation ─────────────────────────────────────

    /**
     * Download subtitle file for a transcript.
     *
     * GET /api/transcripts/{id}/subtitles?format=srt
     * GET /api/transcripts/{id}/subtitles?format=vtt
     */
    public function subtitles(int $id, Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $transcript = Transcript::where('id', $id)
            ->where('uploaded_by', $request->user()->id)
            ->where('status', 'done')
            ->firstOrFail();

        $format   = in_array($request->query('format'), ['srt', 'vtt'])
            ? $request->query('format')
            : 'srt';

        $content  = $this->transcriptionService->generateSubtitles($transcript, $format);
        $mimeType = $format === 'vtt' ? 'text/vtt' : 'application/x-subrip';
        $filename = str($transcript->title)->slug()->append(".{$format}");

        return response($content, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    // ── Feature: Speech notes (regenerate) ───────────────────────────────

    /**
     * Re-generate AI speech notes for an existing transcript.
     * Useful if the first generation failed or user wants a refresh.
     *
     * POST /api/transcripts/{id}/notes
     */
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
            'notes'    => $notes,
            'message'  => 'Speech notes regenerated successfully.',
        ]);
    }
}