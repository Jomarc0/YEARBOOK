<?php

namespace App\Notifications;

use App\Jobs\Notification\SendNewMessageEmail;
use App\Jobs\SendPushNotification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class NewMessageNotification extends Notification
{
    use Queueable;

    public function __construct(
        public User   $sender,
        public string $messagePreview,
        public ?string $actionUrl = null,
    ) {}

    public function via(object $notifiable): array
    {
        return [];
    }

    public static function dispatchFor(
        User    $recipient,
        User    $sender,
        string  $messagePreview,
        ?string $actionUrl = null,
    ): void {
        $senderName = $sender->name ?? 'Someone';

        // 1. In-app + FCM push
        SendPushNotification::dispatch(
            userId: $recipient->id,
            title:  "💬 New message from {$senderName}",
            body:   Str::limit($messagePreview, 80),
            data:   [
                'type'       => 'new_message',
                'sender_id'  => (string) $sender->id,
                'sender_name'=> $senderName,
                'action_url' => $actionUrl ?? '',
            ],
            type: 'new_message',
        );

        // 2. Email
        if ($recipient->email) {
            SendNewMessageEmail::dispatch(
                email:          $recipient->email,
                name:           $recipient->name ?? $recipient->email,
                senderName:     $senderName,
                messagePreview: $messagePreview,
                actionUrl:      $actionUrl,
            );
        }
    }
}