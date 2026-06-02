<?php

namespace App\Jobs\Notification;

use App\Services\Notification\PHPMailerService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendNewMessageEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $backoff = 10;

    public function __construct(
        public string  $email,
        public string  $name,
        public string  $senderName,
        public string  $messagePreview,
        public ?string $actionUrl = null,
    ) {}

    public function handle(PHPMailerService $mailer): void
    {
        $sent = $mailer->sendNewMessageNotification(
            $this->email,
            $this->name,
            $this->senderName,
            $this->messagePreview,
            $this->actionUrl,
        );

        if (! $sent) {
            Log::error("New message email failed for {$this->email}");
            if ($this->attempts() >= $this->tries) {
                $this->fail(new \RuntimeException("Failed after {$this->tries} attempts."));
            }
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::critical("SendNewMessageEmail permanently failed for {$this->email}: " . $e->getMessage());
    }
}