<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\UserNotification;
use App\Services\FirebaseService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendPushNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public int    $userId,
        public string $title,
        public string $body,
        public array  $data = [],
        public string $type = 'system'
    ) {}

    public function handle(FirebaseService $firebase): void
    {
        $user = User::find($this->userId);
        if (! $user) {
            return;
        }

        UserNotification::create([
            'user_id' => $this->userId,
            'type'    => $this->type,
            'title'   => $this->title,
            'body'    => $this->body,
            'data'    => $this->data,
        ]);

        if (! $user->fcm_token) {
            return;
        }

        try {
            $firebase->sendToDevice($user->fcm_token, $this->title, $this->body, $this->data);
        } catch (\Throwable $e) {
            Log::warning("FCM failed for user {$this->userId}: " . $e->getMessage());
        }
    }
}
