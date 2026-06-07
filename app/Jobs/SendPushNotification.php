<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\FirebaseService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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

        DatabaseNotification::create([
            'id' => (string) Str::uuid(),
            'type' => $this->type,
            'notifiable_type' => User::class,
            'notifiable_id' => $this->userId,
            'data' => array_merge($this->data, [
                'type' => $this->type,
                'title' => $this->title,
                'body' => $this->body,
            ]),
            'read_at' => null,
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
