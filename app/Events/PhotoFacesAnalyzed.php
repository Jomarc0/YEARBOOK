<?php

namespace App\Events;

use App\Contracts\AnalyzablePhoto;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * PhotoFacesAnalyzed
 * ─────────────────────────────────────────────────────────────
 * Fired by AnalyzePhotoFaces job when Rekognition completes.
 * Broadcasts on a public 'photos' channel so the React frontend
 * can update photo cards in real-time without a page refresh.
 *
 * Frontend (Laravel Echo + Pusher/Soketi):
 *   window.Echo.channel('photos')
 *     .listen('PhotoFacesAnalyzed', ({ photo_id, face_count, matches }) => {
 *       // update your local state for that photo card
 *     });
 */
class PhotoFacesAnalyzed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int    $photo_id;
    public int    $face_count;
    public string $status;
    public array  $matches;

    /**
     * @param \Illuminate\Database\Eloquent\Model&AnalyzablePhoto $photo
     */
    public function __construct(
        public readonly AnalyzablePhoto $photo,
        array $result,
    ) {
        $this->photo_id   = $photo->getKey();
        $this->face_count = $result['face_count'] ?? 0;
        $this->status     = $result['status']     ?? 'analyzed';
        $this->matches    = collect($result['matches'] ?? [])
            ->map(fn ($m) => [
                'user_id'    => data_get($m, 'user_id'),
                'name'       => data_get($m, 'name', 'Unknown'),
                'similarity' => data_get($m, 'similarity', 0),
            ])
            ->all();
    }

    public function broadcastOn(): Channel
    {
        return new Channel('photos');
    }

    public function broadcastAs(): string
    {
        return 'PhotoFacesAnalyzed';
    }

    public function broadcastWith(): array
    {
        return [
            'photo_id'   => $this->photo_id,
            'face_count' => $this->face_count,
            'status'     => $this->status,
            'matches'    => $this->matches,
        ];
    }
}