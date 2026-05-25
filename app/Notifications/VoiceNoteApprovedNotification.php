<?php
// ── VoiceNoteApprovedNotification.php ──────────────────────────────────────────
// Sent to the RECIPIENT when admin approves a voice note

namespace App\Notifications;

use App\Models\VoiceNote;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VoiceNoteApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public VoiceNote $voiceNote) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $sender = $this->voiceNote->sender->name;

        return (new MailMessage)
            ->subject("{$sender} sent you a voice memory!")
            ->greeting("Hi {$notifiable->name}!")
            ->line("{$sender} recorded a voice memory for you.")
            ->line("Title: \"{$this->voiceNote->title}\"")
            ->action('Listen Now', url("/students/{$notifiable->id}#voice-notes"))
            ->line('This message was approved and is now on your profile.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'          => 'voice_note_received',
            'voice_note_id' => $this->voiceNote->id,
            'sender_id'     => $this->voiceNote->sender_id,
            'sender_name'   => $this->voiceNote->sender->name,
            'sender_avatar' => $this->voiceNote->sender->avatar_url,
            'title'         => $this->voiceNote->title,
            'message'       => "{$this->voiceNote->sender->name} sent you a voice memory!",
        ];
    }
}