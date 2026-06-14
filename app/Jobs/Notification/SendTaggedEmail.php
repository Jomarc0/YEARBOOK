<?php

namespace App\Jobs\Notification;

use App\Services\Notification\BrevoMailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTaggedEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $backoff = 10;

    public function __construct(
        public string  $email,
        public string  $name,
        public string  $taggedBy,
        public string  $photoUrl,
        public ?string $actionUrl   = null,
        public ?string $actionLabel = null,
    ) {}

    public function handle(BrevoMailService $mailer): void
    {
        $sent = $mailer->sendTaggedNotification(
            $this->email,
            $this->name,
            $this->taggedBy,
            $this->photoUrl,
            $this->actionUrl,
            $this->actionLabel,
        );

        if (! $sent) {
            Log::error("Tagged notification email failed for {$this->email}");
            if ($this->attempts() >= $this->tries) {
                $this->fail(new \RuntimeException("Failed after {$this->tries} attempts."));
            }
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::critical("SendTaggedEmail permanently failed for {$this->email}: " . $e->getMessage());
    }
}
