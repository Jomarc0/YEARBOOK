<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\Notification\SendAnnouncementEmail;
use App\Jobs\SendPushNotification;
use App\Models\Announcement;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

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
        $count = $this->emailRecipients()->count();

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

        $emailQueued = 0;

        if ($sendEmail) {
            $this->emailRecipients()->each(function (array $recipient) use ($announcement, $validated, &$emailQueued) {
                SendAnnouncementEmail::dispatch(
                    email:       $recipient['email'],
                    name:        $recipient['name'],
                    title:       $announcement->title,
                    body:        $announcement->body,
                    actionUrl:   $validated['action_url']   ?? null,
                    actionLabel: $validated['action_label'] ?? null,
                )->onQueue('emails');

                $emailQueued++;
            });
        }

        if ($sendPush) {
            User::whereNotNull('fcm_token')
                ->select('id', 'fcm_token')
                ->chunkById(100, function ($users) use ($announcement) {
                    foreach ($users as $user) {
                        SendPushNotification::dispatch(
                            $user->id,
                            $announcement->title,
                            $announcement->body,
                            ['type' => 'announcement', 'id' => (string) $announcement->id],
                            'announcement',
                        )->onQueue('push');
                    }
                });
        }

        return response()->json([
            'message'            => $sendEmail
                ? 'Announcement published. Email notifications were queued.'
                : 'Announcement published.',
            'announcement'       => $announcement->load('creator:id,name'),
            'email_queued_count' => $emailQueued,
        ], 201);
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'body'         => 'required|string',
            'type'         => 'nullable|in:event,reminder,urgent,information',
            'send_push'    => 'boolean',
        ]);

        $announcement->update([
            'title'     => $validated['title'],
            'body'      => $validated['body'],
            'type'      => $validated['type'] ?? $announcement->type,
            'send_push' => $validated['send_push'] ?? $announcement->send_push,
        ]);

        return response()->json([
            'message'      => 'Announcement updated.',
            'announcement' => $announcement->fresh()->load('creator:id,name'),
        ]);
    }

    // ── DELETE /api/announcements/{id} ─────────────────────────────────────────

    public function destroy(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted.']);
    }

    private function emailRecipients(): Collection
    {
        $users = User::whereNotNull('email')
            ->get(['name', 'email'])
            ->map(fn (User $user) => [
                'email' => strtolower(trim((string) $user->email)),
                'name'  => $user->name ?: $user->email,
            ]);

        $students = Student::whereNotNull('email')
            ->get(['first_name', 'last_name', 'email'])
            ->map(fn (Student $student) => [
                'email' => strtolower(trim((string) $student->email)),
                'name'  => trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')) ?: $student->email,
            ]);

        return $users
            ->concat($students)
            ->filter(fn (array $recipient) => filter_var($recipient['email'], FILTER_VALIDATE_EMAIL))
            ->unique('email')
            ->values();
    }
}
