<?php

namespace App\Jobs\Notification;

use App\Services\Notification\BrevoMailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendSubscriptionConfirmedEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $backoff = 10;

    public function __construct(
        public string  $email,
        public string  $name,
        public string  $planName,
        public string  $expiryDate,
        public ?string $actionUrl = null,
    ) {}

    public function handle(BrevoMailService $mailer): void
    {
        $sent = $mailer->sendSubscriptionConfirmed(
            $this->email,
            $this->name,
            $this->planName,
            $this->expiryDate,
            $this->actionUrl,
        );

        if (! $sent) {
            Log::error("Subscription confirmed email failed for {$this->email}");
            if ($this->attempts() >= $this->tries) {
                $this->fail(new \RuntimeException("Failed after {$this->tries} attempts."));
            }
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::critical("SendSubscriptionConfirmedEmail permanently failed for {$this->email}: " . $e->getMessage());
    }
}
