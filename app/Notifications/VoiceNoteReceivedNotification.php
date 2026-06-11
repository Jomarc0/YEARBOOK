<?php

namespace App\Notifications;

use App\Models\VoiceNote;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class VoiceNoteReceivedNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly VoiceNote $voiceNote) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'        => 'voice_note_received',
            'voice_note_id' => $this->voiceNote->id,
            'sender_id'   => $this->voiceNote->sender_id,
            'sender_name' => $this->voiceNote->sender->name ?? 'Someone',
            'sender_avatar' => $this->voiceNote->sender->profile_picture ?? $this->voiceNote->sender->avatar ?? null,
            'title'       => $this->voiceNote->title,
            'message'     => ($this->voiceNote->sender->name ?? 'Someone') . ' sent you a voice note!',
        ];
    }
}
