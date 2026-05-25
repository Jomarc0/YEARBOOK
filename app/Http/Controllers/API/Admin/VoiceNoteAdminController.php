<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\VoiceNote;
use App\Notifications\VoiceNoteApprovedNotification;
use App\Notifications\VoiceNoteRejectedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoiceNoteAdminController extends Controller
{
    // ── GET /admin/voice-notes?status=pending ──────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'pending');

        $notes = VoiceNote::with([
                'sender:id,name,avatar_url',
                'recipient:id,name,avatar_url',
                'reviewer:id,name',
            ])
            ->where('status', $status)
            ->latest()
            ->paginate(20);

        return response()->json($notes);
    }

    // ── POST /admin/voice-notes/{id}/approve ───────────────────────────────────
    public function approve(Request $request, int $id): JsonResponse
    {
        $note = VoiceNote::with(['sender', 'recipient'])->findOrFail($id);

        if (! $note->isPending()) {
            return response()->json(['message' => 'This note has already been reviewed.'], 422);
        }

        $note->update([
            'status'      => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        // Notify the recipient
        $note->recipient->notify(new VoiceNoteApprovedNotification($note));

        return response()->json([
            'message' => 'Voice note approved and delivered to recipient.',
            'data'    => $note,
        ]);
    }

    // ── POST /admin/voice-notes/{id}/reject ────────────────────────────────────
    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $note = VoiceNote::with(['sender', 'recipient'])->findOrFail($id);

        if (! $note->isPending()) {
            return response()->json(['message' => 'This note has already been reviewed.'], 422);
        }

        $note->update([
            'status'        => 'rejected',
            'reject_reason' => $request->reason,
            'reviewed_by'   => $request->user()->id,
            'reviewed_at'   => now(),
        ]);

        // Notify the sender their note was rejected
        $note->sender->notify(new VoiceNoteRejectedNotification($note));

        return response()->json([
            'message' => 'Voice note rejected. Sender has been notified.',
            'data'    => $note,
        ]);
    }

    // ── GET /admin/voice-notes/stats ──────────────────────────────────────────
    public function stats(): JsonResponse
    {
        return response()->json([
            'pending'  => VoiceNote::pending()->count(),
            'approved' => VoiceNote::approved()->count(),
            'rejected' => VoiceNote::rejected()->count(),
            'total'    => VoiceNote::count(),
        ]);
    }
}