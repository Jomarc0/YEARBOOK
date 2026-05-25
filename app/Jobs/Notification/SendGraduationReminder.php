<?php

namespace App\Jobs\Notification;

use App\Services\Notification\PHPMailerService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendGraduationReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $backoff = 10;

    public function __construct(
        public string  $email,
        public string  $name,
        public string  $eventName,
        public string  $eventDate,
        public string  $eventVenue,
        public ?string $actionUrl = null,
    ) {}

    public function handle(PHPMailerService $mailer): void
    {
        $sent = $mailer->sendGraduationReminder(
            $this->email, $this->name,
            $this->eventName, $this->eventDate,
            $this->eventVenue, $this->actionUrl,
        );

        if (! $sent) {
            Log::error("Graduation reminder failed for {$this->email}");
            if ($this->attempts() >= $this->tries) {
                $this->fail(new \RuntimeException("Failed after {$this->tries} attempts."));
            }
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::critical("SendGraduationReminder permanently failed for {$this->email}: " . $e->getMessage());
    }
}