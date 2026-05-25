<?php

namespace App\Jobs\Notification;

use App\Models\User;
use App\Services\Notification\PHPMailerService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendOtpEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $backoff = 10;

    public function __construct(
        public string $email,
        public string $otp
    ) {}

    public function handle(PHPMailerService $mailer): void
    {
        $user = User::where('email', $this->email)->first();
        $name = $user?->name ?? $this->email;

        $sent = $mailer->sendOtp($this->email, $name, $this->otp);

        if (! $sent) {
            Log::error("OTP email failed for {$this->email} — attempt {$this->attempts()}");
            if ($this->attempts() >= $this->tries) {
                $this->fail(new \RuntimeException("PHPMailer failed after {$this->tries} attempts."));
            }
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::critical("SendOtpEmail permanently failed for {$this->email}: " . $e->getMessage());
    }
}