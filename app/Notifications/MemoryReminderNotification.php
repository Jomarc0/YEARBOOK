<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MemoryReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly array $digest) {}

    public function via(object $notifiable): array
    {
        // Always broadcast (Reverb); mail only if they have verified email
        $channels = ['database', 'broadcast'];

        if ($notifiable->email_verified) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    // ── In-app / DB ───────────────────────────────────────────────────────

    public function toArray(object $notifiable): array
    {
        $onThisDay = $this->digest['on_this_day'];

        return [
            'type'        => 'memory_reminder',
            'title'       => $onThisDay['has_memories']
                ? "You have memories from {$onThisDay['date']}!"
                : 'Your daily memory digest is ready',
            'body'        => $this->buildBody(),
            'digest'      => $this->digest,
            'action_url'  => '/dashboard',
        ];
    }

    // ── Broadcast (Reverb → NotificationBell.jsx) ─────────────────────────

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    // ── Mail ──────────────────────────────────────────────────────────────

    public function toMail(object $notifiable): MailMessage
    {
        $onThisDay = $this->digest['on_this_day'];
        $firstName = explode(' ', $notifiable->name)[0];

        return (new MailMessage)
            ->subject("Your memories for {$onThisDay['date']}, {$firstName}!")
            ->greeting("Mabuhay, {$firstName}!")
            ->line($this->buildBody())
            ->action('View Your Memories', url('/dashboard'))
            ->line('These memories are waiting for you on your Pioneer Yearbook dashboard.');
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private function buildBody(): string
    {
        $parts = [];
        $onThisDay = $this->digest['on_this_day'];

        $photoCount = count($onThisDay['uploaded'] ?? [])
                    + count($onThisDay['tagged'] ?? []);

        if ($photoCount > 0) {
            $parts[] = "{$photoCount} photo " . ($photoCount === 1 ? 'memory' : 'memories') . " from {$onThisDay['date']}";
        }

        if (! empty($this->digest['tagged_photos']['count'])) {
            $parts[] = "{$this->digest['tagged_photos']['count']} photos you appeared in";
        }

        if (! empty($this->digest['top_interactions']['peers'])) {
            $parts[] = 'your most frequent connections';
        }

        if (empty($parts)) {
            return 'Check your daily memory digest on your dashboard.';
        }

        return 'Today we found: ' . implode(', ', $parts) . '.';
    }
}