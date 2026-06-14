<?php

namespace App\Jobs\Notification;

use App\Services\Notification\BrevoMailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendAnnouncementEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $backoff = 10;

    public function __construct(
        public string  $email,
        public string  $name,
        public string  $title,
        public string  $body,
        public ?string $actionUrl   = null,
        public ?string $actionLabel = null,
    ) {}

    public function handle(BrevoMailService $mailer): void
    {
        $sent = $mailer->sendAnnouncement(
            $this->email, $this->name,
            $this->title, $this->body,
            $this->actionUrl, $this->actionLabel,
        );

        if (! $sent) {
            Log::error("Announcement email failed for {$this->email}");
            if ($this->attempts() >= $this->tries) {
                $this->fail(new \RuntimeException("Failed after {$this->tries} attempts."));
            }
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::critical("SendAnnouncementEmail permanently failed for {$this->email}: " . $e->getMessage());
    }
}
