<?php

namespace App\Services\AI;

use App\Models\User;
use App\Models\TaggedPhoto;
use App\Models\Message;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MemoryRecommenderService
{
    /**
     * Build the full memory digest for a user.
     * Free users only get onThisDay; premium gets all five.
     */
    public function buildDigest(User $user): array
    {
        $digest = [
            'on_this_day' => $this->onThisDay($user),
        ];

        if ($user->is_premium) {
            $digest['tagged_photos']    = $this->taggedPhotos($user);
            $digest['top_interactions'] = $this->topInteractions($user);
            $digest['graduation']       = $this->graduationMemories($user);
            $digest['most_viewed']      = $this->mostViewedToday();
        }

        return $digest;
    }

    // ── Card 1: On This Day ───────────────────────────────────────────────

    public function onThisDay(User $user): array
    {
        $today = Carbon::now();

        // Photos uploaded by this user on this calendar day in past years
        $photos = $user->photos()
            ->whereMonth('created_at', $today->month)
            ->whereDay('created_at', $today->day)
            ->whereYear('created_at', '<', $today->year)
            ->with('album')
            ->orderBy('created_at', 'desc')
            ->take(6)
            ->get()
            ->map(fn ($p) => [
                'id'         => $p->id,
                'url'        => $p->file_path,
                'caption'    => $p->caption,
                'album'      => $p->album?->name,
                'years_ago'  => $today->year - $p->created_at->year,
                'taken_at'   => $p->created_at->toDateString(),
            ]);

        // Also grab photos where user was tagged on this day
        $taggedOnDay = TaggedPhoto::where('user_id', $user->id)
            ->whereMonth('created_at', $today->month)
            ->whereDay('created_at', $today->day)
            ->whereYear('created_at', '<', $today->year)
            ->approved()
            ->with('photo.album')
            ->take(4)
            ->get()
            ->map(fn ($t) => [
                'id'        => $t->photo_id,
                'url'       => $t->photo_url,   // uses your accessor
                'caption'   => $t->caption,
                'album'     => $t->photo?->album?->name,
                'years_ago' => $today->year - $t->created_at->year,
                'taken_at'  => $t->created_at->toDateString(),
            ]);

        return [
            'label'          => 'On This Day',
            'date'           => $today->format('F j'),
            'uploaded'       => $photos,
            'tagged'         => $taggedOnDay,
            'has_memories'   => $photos->isNotEmpty() || $taggedOnDay->isNotEmpty(),
        ];
    }

    // ── Card 2: You Appeared In These Photos ─────────────────────────────

    public function taggedPhotos(User $user): array
    {
        $tagged = TaggedPhoto::where('user_id', $user->id)
            ->approved()
            ->aboveThreshold(75.0)
            ->with('photo.album', 'uploader:id,name,profile_picture')
            ->orderBy('created_at', 'desc')
            ->take(8)
            ->get()
            ->map(fn ($t) => [
                'id'           => $t->photo_id,
                'url'          => $t->photo_url,
                'caption'      => $t->caption,
                'album'        => $t->photo?->album?->name,
                'similarity'   => round($t->similarity, 1),
                'source'       => $t->source,      // 'rekognition' or 'manual'
                'tagged_at'    => $t->created_at->diffForHumans(),
                'uploaded_by'  => [
                    'id'   => $t->uploader?->id,
                    'name' => $t->uploader?->name,
                ],
            ]);

        return [
            'label'  => 'You Appeared In These Photos',
            'photos' => $tagged,
            'count'  => $tagged->count(),
        ];
    }

    // ── Card 3: People You Interacted With Most ───────────────────────────

    public function topInteractions(User $user): array
    {
        // Count messages exchanged per peer
        $messagePartners = DB::table('messages')
            ->select(DB::raw('
                CASE
                    WHEN sender_id = ? THEN receiver_id
                    ELSE sender_id
                END as peer_id,
                COUNT(*) as msg_count
            '))
            ->addBinding($user->id, 'select')
            ->where(fn ($q) => $q
                ->where('sender_id', $user->id)
                ->orWhere('receiver_id', $user->id)
            )
            ->groupBy('peer_id')
            ->orderByDesc('msg_count')
            ->limit(5)
            ->get()
            ->keyBy('peer_id');

        // Count photos tagged together (same photo, both tagged)
        $tagPartners = DB::table('tagged_photos as a')
            ->join('tagged_photos as b', 'a.photo_id', '=', 'b.photo_id')
            ->select('b.user_id as peer_id', DB::raw('COUNT(*) as tag_count'))
            ->where('a.user_id', $user->id)
            ->where('b.user_id', '!=', $user->id)
            ->where('a.status', 'approved')
            ->where('b.status', 'approved')
            ->groupBy('b.user_id')
            ->orderByDesc('tag_count')
            ->limit(5)
            ->get()
            ->keyBy('peer_id');

        // Merge and score: messages weighted 2×, tags 1×
        $allPeerIds = $messagePartners->keys()
            ->merge($tagPartners->keys())
            ->unique();

        $scored = $allPeerIds->map(fn ($peerId) => [
            'peer_id' => $peerId,
            'score'   => (($messagePartners[$peerId]->msg_count ?? 0) * 2)
                       + ($tagPartners[$peerId]->tag_count ?? 0),
        ])->sortByDesc('score')->take(5);

        // Hydrate User models
        $peers = User::whereIn('id', $scored->pluck('peer_id'))
            ->get()
            ->keyBy('id');

        $result = $scored->map(fn ($item) => [
            'user' => [
                'id'              => $item['peer_id'],
                'name'            => $peers[$item['peer_id']]?->name,
                'profile_picture' => $peers[$item['peer_id']]?->profile_picture,
                'course'          => $peers[$item['peer_id']]?->course,
            ],
            'score'         => $item['score'],
            'shared_photos' => $tagPartners[$item['peer_id']]->tag_count ?? 0,
            'messages'      => $messagePartners[$item['peer_id']]->msg_count ?? 0,
        ])->values();

        return [
            'label'   => 'People You Interacted With Most',
            'peers'   => $result,
        ];
    }

    // ── Card 4: Graduation Memories ───────────────────────────────────────

    public function graduationMemories(User $user): array
    {
        // Photos from graduation-type albums for the user's batch
        $batchId = $user->batch_id;

        $photos = \App\Models\Photo::query()
            ->whereHas('album', fn ($q) =>
                $q->where('batch_id', $batchId)
                  ->where(fn ($q2) => $q2
                      ->where('type', 'graduation')
                      ->orWhere('name', 'like', '%graduat%')
                      ->orWhere('name', 'like', '%ceremony%')
                  )
            )
            ->with('album')
            ->inRandomOrder()
            ->take(6)
            ->get()
            ->map(fn ($p) => [
                'id'      => $p->id,
                'url'     => $p->file_path,
                'caption' => $p->caption,
                'album'   => $p->album?->name,
            ]);

        return [
            'label'           => 'Your Graduation Memories',
            'graduation_year' => $user->graduation_year,
            'batch'           => $user->batch,
            'photos'          => $photos,
            'has_photos'      => $photos->isNotEmpty(),
        ];
    }

    // ── Card 5: Most Viewed Alumni Today ─────────────────────────────────

    public function mostViewedToday(): array
    {
        // Relies on profile_views tracked via POST /students/{id}/view
        // Uses a simple daily ranking — swap for Redis if you add real-time counters
        $students = User::where('role', 'student')
            ->where('profile_visibility', 'public')
            ->orderByDesc('profile_views')
            ->take(5)
            ->get(['id', 'name', 'profile_picture', 'course', 'batch', 'graduation_year', 'profile_views'])
            ->map(fn ($u) => [
                'id'              => $u->id,
                'name'            => $u->name,
                'profile_picture' => $u->profile_picture,
                'course'          => $u->course,
                'batch'           => $u->batch,
                'graduation_year' => $u->graduation_year,
                'views'           => $u->profile_views,
            ]);

        return [
            'label'    => 'Most Viewed Alumni Today',
            'students' => $students,
        ];
    }
}