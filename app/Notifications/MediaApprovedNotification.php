<?php

namespace App\Notifications;

use App\Models\Gallery;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MediaApprovedNotification extends Notification
{
    use Queueable;

    public function __construct(public Gallery $gallery) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $albumTitle = $this->gallery->album?->title ?? 'the gallery';

        return (new MailMessage)
            ->subject('Your uploaded media was approved')
            ->greeting("Hi {$notifiable->name}!")
            ->line("Your upload in {$albumTitle} has been approved.")
            ->line('It is now visible in the Sinag-Bughaw gallery.')
            ->action('View Gallery', url($this->actionUrl()));
    }

    public function toArray(object $notifiable): array
    {
        $media = $this->gallery->media->first();
        $albumTitle = $this->gallery->album?->title ?? 'Gallery';

        return [
            'type'       => 'media_approved',
            'title'      => 'Upload approved',
            'message'    => "Your upload in {$albumTitle} has been approved.",
            'gallery_id' => $this->gallery->id,
            'album_id'   => $this->gallery->album_id,
            'media_url'  => $media?->file_path,
            'action_url' => $this->actionUrl(),
        ];
    }

    private function actionUrl(): string
    {
        return $this->gallery->album_id
            ? "/gallery/{$this->gallery->album_id}"
            : '/gallery';
    }
}
