<?php

namespace App\Http\Controllers\API\AI;

use App\Http\Controllers\Controller;
use App\Http\Requests\VoiceNote\SendVoiceNoteRequest;
use App\Models\VoiceNote;
use App\Models\User;
use App\Notifications\VoiceNoteReceivedNotification;
use App\Services\Storage\CloudinaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoiceNoteController extends Controller
{
    // ── GET /voice-notes/inbox ─────────────────────────────────────────────────
    // Approved notes sent TO the authenticated user
    public function inbox(Request $request): JsonResponse
    {
        $notes = VoiceNote::with(['sender:id,name,avatar_url'])
            ->forRecipient($request->user()->id)
            ->approved()
            ->latest()
            ->get();

        return response()->json($notes);
    }

    // ── GET /voice-notes/outbox ────────────────────────────────────────────────
    // All notes the authenticated user has SENT (any status)
    public function outbox(Request $request): JsonResponse
    {
        $notes = VoiceNote::with(['recipient:id,name,avatar_url'])
            ->fromSender($request->user()->id)
            ->latest()
            ->get();

        return response()->json($notes);
    }

    // ── GET /voice-notes/profile/{userId} ─────────────────────────────────────
    // Approved notes on a student's public profile
    public function forProfile(Request $request, int $userId): JsonResponse
    {
        $notes = VoiceNote::with(['sender:id,name,avatar_url'])
            ->forRecipient($userId)
            ->approved()
            ->latest()
            ->get();

        return response()->json($notes);
    }

    // ── POST /voice-notes ──────────────────────────────────────────────────────
    // Send a voice note to a classmate
    public function store(SendVoiceNoteRequest $request): JsonResponse
    {
        $recipient = User::findOrFail($request->recipient_id);

        // Prevent sending to yourself
        if ($recipient->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot send a voice note to yourself.'], 422);
        }

        $cloudinary = app(CloudinaryService::class);
        $result     = $cloudinary->uploadAudio(
            $request->file('audio')->getRealPath(),
            $request->user()->id
        );

        $note = VoiceNote::create([
            'sender_id'            => $request->user()->id,
            'recipient_id'         => $recipient->id,
            'title'                => $request->title ?? 'Voice Memory',
            'audio_url'            => $result['secure_url'],
            'cloudinary_public_id' => $result['public_id'],
            'duration_seconds'     => $request->duration_seconds,
            'status'               => 'pending',
        ]);

        return response()->json([
            'message' => 'Voice note sent! It will be visible after admin review.',
            'data'    => $note->load('recipient:id,name,avatar_url'),
        ], 201);
    }

    // ── DELETE /voice-notes/{id} ───────────────────────────────────────────────
    // Sender can delete their own note
    public function destroy(Request $request, int $id): JsonResponse
    {
        $note = VoiceNote::where('sender_id', $request->user()->id)
                         ->findOrFail($id);

        if ($note->cloudinary_public_id) {
            app(CloudinaryService::class)->delete($note->cloudinary_public_id);
        }

        $note->delete();

        return response()->json(['message' => 'Voice note deleted.']);
    }
}