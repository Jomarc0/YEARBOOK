<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Photo;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * PhotoTaggedNotification
 *
 * Fired when a user is tagged in a photo (on upload or post edit).
 * Delivered via database (bell icon) + email (queued).
 */
class PhotoTaggedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Photo $photo,
        private readonly User  $tagger,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'          => 'photo_tagged',
            'message'       => "{$this->tagger->name} tagged you in a photo.",
            'photo_id'      => $this->photo->id,
            'photo_url'     => $this->photo->file_path,
            'tagger_id'     => $this->tagger->id,
            'tagger_name'   => $this->tagger->name,
            'tagger_avatar' => $this->tagger->profile_picture,
            'album_id'      => $this->photo->album_id,
            'url'           => "/profile/{$notifiable->id}?tab=tagged",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("{$this->tagger->name} tagged you in a photo — Sinag-Bughaw")
            ->greeting("Hello, {$notifiable->name}!")
            ->line("{$this->tagger->name} tagged you in a photo on Sinag-Bughaw.")
            ->action('View Tagged Photo', url("/profile/{$notifiable->id}?tab=tagged"))
            ->line('You can remove the tag anytime from your profile.')
            ->salutation('The Sinag-Bughaw Team');
    }
}