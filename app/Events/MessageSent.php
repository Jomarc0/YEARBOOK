<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class MessageSent implements ShouldBroadcastNow 
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public Message $message)
    {
        // Eager-load sender so name + profile_picture are in the payload
        $this->message = $message->loadMissing('sender');
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('chat.' . $this->message->receiver_id)];
    }

    public function broadcastAs(): string
    {
        return 'MessageSent';
    }

    public function broadcastWith(): array
    {
        // MessageModal does: const msg = e.message ?? e;
        return [
            'message' => [
                'id'          => $this->message->id,
                'body'        => $this->message->body,
                'sender_id'   => $this->message->sender_id,
                'receiver_id' => $this->message->receiver_id,
                'is_read'     => false,
                'created_at'  => $this->message->created_at->toISOString(),
                'sender'      => [
                    'id'              => $this->message->sender->id,
                    'name'            => $this->message->sender->name,
                    'profile_picture' => $this->message->sender->profile_picture ?? null,
                ],
            ],
        ];
    }
}