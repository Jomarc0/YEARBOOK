<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserPresenceUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int    $userId,
        public readonly bool   $isOnline,
        public readonly string $lastSeenAt,
    ) {}

    /**
     * Broadcast on a public presence channel so ALL authenticated users
     * can track who is online. The channel is presence-based so Laravel
     * Reverb manages the member list automatically.
     */
    public function broadcastOn(): array
    {
        return [new PresenceChannel('online-users')];
    }

    public function broadcastAs(): string
    {
        return 'presence.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'user_id'      => $this->userId,
            'is_online'    => $this->isOnline,
            'last_seen_at' => $this->lastSeenAt,
        ];
    }
}