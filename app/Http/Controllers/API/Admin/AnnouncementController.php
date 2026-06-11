<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\Notification\SendAnnouncementEmail;
use App\Models\Announcement;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class AnnouncementController extends Controller
{
    //  GET /api/announcements 

    public function index(): JsonResponse
    {
        $announcements = Announcement::with('creator:id,name')
            ->latest()
            ->paginate(20);

        return response()->json($announcements);
    }

    // GET /api/announcements/recipients/count 

    public function recipientCount(): JsonResponse
    {
        $count = $this->emailRecipients()->count();

        return response()->json(['count' => $count]);
    }

    // POST /api/announcements

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'body'         => 'required|string',
            'type'         => 'nullable|in:graduation,event,reminder,urgent,information',
            'send_push'    => 'boolean',
            'send_email'   => 'boolean',
            'action_url'   => 'nullable|url|max:2048',
            'action_label' => 'nullable|string|max:80',
        ]);

        $announcement = Announcement::create([
            'title'      => $validated['title'],
            'body'       => $validated['body'],
            'type'       => $validated['type']      ?? $this->fallbackType($validated['title'], $validated['body']),
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
                );

                $emailQueued++;
            });
        }

        $pushNotificationCount = $sendPush
            ? $this->createInAppAnnouncementNotifications($announcement, $validated)
            : 0;

        return response()->json([
            'message'            => $sendEmail
                ? 'Announcement published. Email notifications were queued and push notifications are visible.'
                : 'Announcement published. Push notifications are visible.',
            'announcement'       => $announcement->load('creator:id,name'),
            'email_queued_count' => $emailQueued,
            'push_notification_count' => $pushNotificationCount,
        ], 201);
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'body'         => 'required|string',
            'type'         => 'nullable|in:graduation,event,reminder,urgent,information',
            'send_push'    => 'boolean',
        ]);

        $announcement->update([
            'title'     => $validated['title'],
            'body'      => $validated['body'],
            'type'      => $validated['type'] ?? $this->fallbackType($validated['title'], $validated['body'], $announcement->type),
            'send_push' => $validated['send_push'] ?? $announcement->send_push,
        ]);

        $pushNotificationCount = $announcement->send_push
            ? $this->createInAppAnnouncementNotifications($announcement->fresh(), $validated)
            : 0;

        return response()->json([
            'message'      => $pushNotificationCount > 0
                ? 'Announcement updated. Missing push notifications were created.'
                : 'Announcement updated.',
            'announcement' => $announcement->fresh()->load('creator:id,name'),
            'push_notification_count' => $pushNotificationCount,
        ]);
    }

    private function fallbackType(string $title, string $body, string $fallback = 'information'): string
    {
        return preg_match('/\b(graduation|commencement|baccalaureate)\b/i', "{$title} {$body}")
            ? 'graduation'
            : $fallback;
    }

    // DELETE /api/announcements/{id} 

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

    private function createInAppAnnouncementNotifications(Announcement $announcement, array $payload = []): int
    {
        $created = 0;

        User::select('id')->chunkById(100, function ($users) use ($announcement, $payload, &$created) {
            foreach ($users as $user) {
                $exists = DatabaseNotification::query()
                    ->where('notifiable_type', User::class)
                    ->where('notifiable_id', $user->id)
                    ->where('type', 'announcement')
                    ->where('data->id', (string) $announcement->id)
                    ->exists();

                if ($exists) {
                    continue;
                }

                DatabaseNotification::create([
                    'id' => (string) Str::uuid(),
                    'type' => 'announcement',
                    'notifiable_type' => User::class,
                    'notifiable_id' => $user->id,
                    'data' => [
                        'type' => 'announcement',
                        'id' => (string) $announcement->id,
                        'title' => $announcement->title,
                        'body' => $announcement->body,
                        'action_url' => $payload['action_url'] ?? '/announcements',
                        'action_label' => $payload['action_label'] ?? 'View Announcement',
                    ],
                    'read_at' => null,
                ]);

                $created++;
            }
        });

        return $created;
    }
}
