<?php

namespace App\Services\AI;

use App\Models\Photo;
use App\Models\ProfileView;
use App\Models\User;
use App\Models\TaggedPhoto;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class MemoryRecommenderService
{

    public function buildDigest(User $user): array
    {
        $memories = array_values(array_filter([
            ...$this->onThisDayMemories($user),
            ...$this->appearedInPhotos($user),
            $this->profileViewedMemory($user),
        ]));

        return [
            'memories' => $memories,
            'items' => $memories,
            'recommendations' => $memories,
        ];
    }

    // Card 1: On This Day
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
                'photo_id'   => $p->id,
                'album_id'   => $p->album_id,
                'url'        => $p->file_path,
                'caption'    => $p->caption,
                'album'      => $p->album?->title,
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
                'photo_id'  => $t->photo_id,
                'album_id'  => $t->photo?->album_id,
                'url'       => $t->photo_url,   // uses your accessor
                'caption'   => $t->caption,
                'album'     => $t->photo?->album?->title,
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

    private function onThisDayMemories(User $user): array
    {
        $today = Carbon::now();

        return Photo::query()
            ->where('user_id', $user->id)
            ->whereMonth('created_at', $today->month)
            ->whereDay('created_at', $today->day)
            ->where('created_at', '<', $today->copy()->subYear())
            ->where(function ($query) {
                $query
                    ->whereNull('caption')
                    ->orWhere(function ($caption) {
                        $caption
                            ->where('caption', 'not like', '%Sample%')
                            ->where('caption', 'not like', '%Dashboard QA%')
                            ->where('caption', 'not like', '%QA%');
                    });
            })
            ->with('album')
            ->orderByDesc('created_at')
            ->take(3)
            ->get()
            ->map(fn (Photo $photo) => [
                'type' => 'on_this_day',
                'title' => $photo->caption ?: 'On this day',
                'subtitle' => $photo->album?->title ?: $photo->created_at->diffForHumans(),
                'link' => $photo->album_id ? '/gallery/album/' . $photo->album_id : '/gallery',
                'photo_id' => $photo->id,
                'album_id' => $photo->album_id,
                'thumbnail_url' => $this->photoThumbnail($photo),
                'timestamp' => $photo->created_at->diffForHumans(),
            ])
            ->all();
    }

    private function appearedInPhotos(User $user): array
    {
        return TaggedPhoto::query()
            ->where('user_id', $user->id)
            ->whereNotNull('photo_id')
            ->approved()
            ->whereHas('photo.album', function ($query) {
                $query
                    ->where(function ($album) {
                        $album->whereNull('type')->orWhere('type', '!=', 'profile');
                    })
                    ->where('title', 'not like', '%My Uploads%');
            })
            ->with(['photo.album'])
            ->orderByDesc('created_at')
            ->take(3)
            ->get()
            ->filter(fn (TaggedPhoto $tag) => $tag->photo !== null)
            ->map(function (TaggedPhoto $tag) {
                $photo = $tag->photo;

                return [
                    'type' => 'appeared_in_photo',
                    'title' => 'You appeared in a photo',
                    'subtitle' => $photo?->album?->title ?? 'Gallery',
                    'link' => $photo?->album_id ? '/gallery/album/' . $photo->album_id : '/gallery/photo/' . $photo?->id,
                    'photo_id' => $photo?->id,
                    'album_id' => $photo?->album_id,
                    'thumbnail_url' => $photo ? $this->photoThumbnail($photo) : $tag->photo_url,
                    'timestamp' => $tag->created_at->diffForHumans(),
                ];
            })
            ->values()
            ->all();
    }

    private function profileViewedMemory(User $user): ?array
    {
        $myViewCount = ProfileView::query()
            ->where('viewed_user_id', $user->id)
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        if ($myViewCount < 1) {
            return null;
        }

        return [
            'type' => 'profile_viewed',
            'title' => 'Your profile was viewed',
            'subtitle' => $myViewCount . ' ' . ($myViewCount === 1 ? 'time' : 'times') . ' in the last 30 days',
            'link' => '/analytics',
            'timestamp' => 'Last 30 days',
        ];
    }

    private function photoThumbnail(Photo $photo): ?string
    {
        return $photo->thumbnail_url
            ?? $photo->thumbnail
            ?? $photo->file_path
            ?? null;
    }

    // Card 2: You Appeared In These Photos 

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
                'photo_id'     => $t->photo_id,
                'album_id'     => $t->photo?->album_id,
                'url'          => $t->photo_url,
                'caption'      => $t->caption,
                'album'        => $t->photo?->album?->title,
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

    // Card 3: People You Interacted With Most 

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

        // Merge and score: messages weighted 2 , tags 1
        $allPeerIds = $messagePartners->keys()
            ->merge($tagPartners->keys())
            ->unique();

        $scored = $allPeerIds->map(fn ($peerId) => [
            'peer_id' => $peerId,
            'score'   => (((int) ($messagePartners->get($peerId)?->msg_count ?? 0)) * 2)
                       + ((int) ($tagPartners->get($peerId)?->tag_count ?? 0)),
        ])->sortByDesc('score')->take(5);

        // Hydrate User models
        $peers = User::whereIn('id', $scored->pluck('peer_id'))
            ->get()
            ->keyBy('id');

        $result = $scored->map(fn ($item) => [
            'user' => [
                'id'              => $item['peer_id'],
                'name'            => $peers->get($item['peer_id'])?->name,
                'profile_picture' => $peers->get($item['peer_id'])?->profile_picture,
                'course'          => $peers->get($item['peer_id'])?->course,
            ],
            'score'         => $item['score'],
            'shared_photos' => (int) ($tagPartners->get($item['peer_id'])?->tag_count ?? 0),
            'messages'      => (int) ($messagePartners->get($item['peer_id'])?->msg_count ?? 0),
        ])->values();

        return [
            'label'   => 'People You Interacted With Most',
            'peers'   => $result,
        ];
    }

    // Card 4: Graduation Memories

    public function graduationMemories(User $user): array
    {
        // Photos from graduation-type albums for the user's batch
        $batchId = $user->batch_id;

        $photos = \App\Models\Photo::query()
            ->whereHas('album', fn ($q) =>
                $q->where('batch_id', $batchId)
                  ->where(fn ($q2) => $q2
                      ->where('type', 'graduation')
                      ->orWhere('title', 'like', '%graduat%')
                      ->orWhere('title', 'like', '%ceremony%')
                      ->orWhere('description', 'like', '%graduat%')
                      ->orWhere('description', 'like', '%ceremony%')
                      ->orWhere('category', 'like', '%graduat%')
                      ->orWhere('category', 'like', '%ceremony%')
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
                'album'   => $p->album?->title,
            ]);

        return [
            'label'           => 'Your Graduation Memories',
            'graduation_year' => $user->graduation_year,
            'batch'           => $user->batch,
            'photos'          => $photos,
            'has_photos'      => $photos->isNotEmpty(),
        ];
    }

    // Card 5: Most Viewed Alumni Today 

    public function mostViewedToday(): array
    {
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
