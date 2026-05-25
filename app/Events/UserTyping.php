<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int    $senderId,
        public readonly int    $receiverId,
        public readonly string $senderName,
        public readonly bool   $isTyping,
    ) {}

    public function broadcastOn(): array
    {
        // Broadcast to the recipient's private channel
        return [new PrivateChannel("chat.{$this->receiverId}")];
    }

    public function broadcastAs(): string
    {
        return 'user.typing';
    }

    public function broadcastWith(): array
    {
        return [
            'sender_id'   => $this->senderId,
            'sender_name' => $this->senderName,
            'is_typing'   => $this->isTyping,
        ];
    }
}