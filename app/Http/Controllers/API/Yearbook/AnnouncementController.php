<?php

namespace App\Http\Controllers\API\Yearbook;

use App\Http\Controllers\Controller;
use App\Jobs\SendPushNotification;
use App\Models\Announcement;
use App\Models\Student;
use App\Models\User;
use App\Services\Notification\BrevoMailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AnnouncementController extends Controller
{
    public function index(): JsonResponse
    {
        $announcements = Announcement::with('creator:id,name')
            ->latest()
            ->paginate(20);

        return response()->json($announcements);
    }

    public function recipientCount(): JsonResponse
    {
        return response()->json(['count' => $this->announcementRecipients()->count()]);
    }

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
            'type'       => $validated['type'] ?? 'information',
            'send_push'  => $validated['send_push'] ?? true,
            'created_by' => $request->user()->id,
        ]);

        $sendEmail = $validated['send_email'] ?? true;
        $sendPush  = $announcement->send_push;

        $emailCount = 0;

        if ($sendEmail) {
            $mailer = app(BrevoMailService::class);

            $this->announcementRecipients()
                ->chunk(100)
                ->each(function ($recipients) use ($announcement, $validated, $mailer, &$emailCount) {
                    foreach ($recipients as $recipient) {
                        $sent = $mailer->sendAnnouncement(
                            $recipient['email'],
                            $recipient['name'],
                            $announcement->title,
                            $announcement->body,
                            $validated['action_url'] ?? null,
                            $validated['action_label'] ?? null,
                        );

                        if ($sent) {
                            $emailCount++;
                        } else {
                            Log::warning('Announcement email failed.', [
                                'announcement_id' => $announcement->id,
                                'recipient' => $recipient['email'],
                            ]);
                        }
                    }
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
            'message'      => 'Announcement published. Notifications are being sent.',
            'announcement' => $announcement->load('creator:id,name'),
            'email_count'  => $emailCount,
        ], 201);
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted.']);
    }

    private function announcementRecipients()
    {
        $users = User::whereNotNull('email')
            ->get(['name', 'email'])
            ->map(fn ($user) => [
                'email' => strtolower(trim($user->email)),
                'name'  => $user->name ?: $user->email,
            ]);

        $students = Student::whereNotNull('email')
            ->get(['first_name', 'last_name', 'email'])
            ->map(fn ($student) => [
                'email' => strtolower(trim($student->email)),
                'name'  => trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')) ?: $student->email,
            ]);

        return $users
            ->concat($students)
            ->filter(fn ($recipient) => filter_var($recipient['email'], FILTER_VALIDATE_EMAIL))
            ->unique('email')
            ->values();
    }
}
