<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\Notification\SendAnnouncementEmail;
use App\Jobs\SendPushNotification;
use App\Models\Announcement;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    // ── GET /api/announcements ─────────────────────────────────────────────────

    public function index(): JsonResponse
    {
        $announcements = Announcement::with('creator:id,name')
            ->latest()
            ->paginate(20);

        return response()->json($announcements);
    }

    // ── GET /api/announcements/recipients/count ────────────────────────────────

    public function recipientCount(): JsonResponse
    {
        $count = User::whereNotNull('email')
            ->count();

        return response()->json(['count' => $count]);
    }

    // ── POST /api/announcements ────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'body'         => 'required|string',
            'type'         => 'nullable|in:event,reminder,urgent,information',
            'send_push'    => 'boolean',
            'send_email'   => 'boolean',
            'action_url'   => 'nullable|url|max:2048',
            'action_label' => 'nullable|string|max:80',
        ]);

        $announcement = Announcement::create([
            'title'      => $validated['title'],
            'body'       => $validated['body'],
            'type'       => $validated['type']      ?? 'information',
            'send_push'  => $validated['send_push'] ?? true,
            'created_by' => $request->user()->id,
        ]);

        $sendEmail = $validated['send_email'] ?? true;
        $sendPush  = $announcement->send_push;

        User::whereNotNull('email')
            ->select('id', 'name', 'email', 'fcm_token')
            ->chunkById(100, function ($users) use ($announcement, $validated, $sendEmail, $sendPush) {
                foreach ($users as $user) {

                    // 1. Queue email
                    if ($sendEmail) {
                        SendAnnouncementEmail::dispatch(
                            email:       $user->email,
                            name:        $user->name,
                            title:       $announcement->title,
                            body:        $announcement->body,
                            actionUrl:   $validated['action_url']   ?? null,
                            actionLabel: $validated['action_label'] ?? null,
                        )->onQueue('emails');
                    }

                    // 2. Queue push
                    if ($sendPush && $user->fcm_token) {
                        SendPushNotification::dispatch(
                            $user->id,
                            $announcement->title,
                            $announcement->body,
                            ['type' => 'announcement', 'id' => (string) $announcement->id],
                            'announcement',
                        )->onQueue('push');
                    }
                }
            });

        return response()->json([
            'message'      => 'Announcement published. Notifications are being sent.',
            'announcement' => $announcement->load('creator:id,name'),
        ], 201);
    }

    // ── DELETE /api/announcements/{id} ─────────────────────────────────────────

    public function destroy(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted.']);
    }
}
