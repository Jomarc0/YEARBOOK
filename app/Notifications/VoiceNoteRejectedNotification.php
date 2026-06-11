<?php
namespace App\Notifications;

use App\Models\VoiceNote;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VoiceNoteRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public VoiceNote $voiceNote) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $recipient = $this->voiceNote->recipient->name;
        $reason    = $this->voiceNote->reject_reason
                     ?? 'It did not meet our community guidelines.';

        return (new MailMessage)
            ->subject('Your voice note was not approved')
            ->greeting("Hi {$notifiable->name},")
            ->line("Your voice note for {$recipient} (\"{$this->voiceNote->title}\") was not approved.")
            ->line("Reason: {$reason}")
            ->line('You may record a new message that follows our community guidelines.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'          => 'voice_note_rejected',
            'voice_note_id' => $this->voiceNote->id,
            'recipient_id'  => $this->voiceNote->recipient_id,
            'title'         => $this->voiceNote->title,
            'reason'        => $this->voiceNote->reject_reason,
            'message'       => "Your voice note for {$this->voiceNote->recipient->name} was not approved.",
        ];
    }
}