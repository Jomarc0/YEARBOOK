<?php

namespace App\Notifications;

use App\Jobs\Notification\SendTaggedEmail;
use App\Jobs\SendPushNotification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PhotoTaggedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public User    $tagger,       // the person who did the tagging
        public string  $photoUrl,     // thumbnail / direct URL of the photo
        public ?string $actionUrl = null,  // deep-link into the app / web view
    ) {}

    // -------------------------------------------------------------------------
    // Channels
    // -------------------------------------------------------------------------

    public function via(object $notifiable): array
    {
        // We handle delivery ourselves via jobs, so no built-in channels needed.
        return [];
    }

    // -------------------------------------------------------------------------
    // Dispatch helpers — call this instead of Notification::send()
    // -------------------------------------------------------------------------

    /**
     * Dispatch both push + email for a tagged user.
     *
     * Usage:
     *   PhotoTaggedNotification::dispatchFor($taggedUser, $tagger, $photoUrl, $actionUrl);
     */
    public static function dispatchFor(
        User    $tagged,
        User    $tagger,
        string  $photoUrl,
        ?string $actionUrl = null,
    ): void {
        $taggerName = $tagger->name ?? 'Someone';

        // 1. In-app + FCM push notification
        SendPushNotification::dispatch(
            userId: $tagged->id,
            title:  '📸 You were tagged in a photo!',
            body:   "{$taggerName} tagged you in a photo.",
            data:   [
                'type'       => 'photo_tagged',
                'tagger_id'  => (string) $tagger->id,
                'tagger_name'=> $taggerName,
                'photo_url'  => $photoUrl,
                'action_url' => $actionUrl ?? '',
            ],
            type: 'photo_tagged',
        );

        // 2. Email notification (only if the user has an email)
        if ($tagged->email) {
            SendTaggedEmail::dispatch(
                email:       $tagged->email,
                name:        $tagged->name ?? $tagged->email,
                taggedBy:    $taggerName,
                photoUrl:    $photoUrl,
                actionUrl:   $actionUrl,
                actionLabel: 'View Photo',
            );
        }
    }
}