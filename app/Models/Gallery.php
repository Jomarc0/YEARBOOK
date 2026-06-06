<?php

namespace App\Models;

use App\Contracts\AnalyzablePhoto;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\Gallery
 *
 * Central upload model — one row per logical "photo/item".
 * Physical files live in gallery_media (has-many).
 *
 * @property int         $id
 * @property int         $album_id
 * @property int|null    $user_id
 * @property string|null $caption
 * @property string      $status            pending | approved | rejected
 * @property string      $visibility        public | private
 * @property array|null  $ai_metadata
 * @property int         $sort_order
 * @property string|null $rejection_reason
 * @property \Carbon\Carbon|null $approved_at
 * @property int|null    $approved_by
 * @property \Carbon\Carbon|null $rejected_at
 * @property int|null    $rejected_by
 */
class Gallery extends Model implements AnalyzablePhoto
{
    use HasFactory, SoftDeletes;

    protected $table = 'galleries';

    protected $fillable = [
        'album_id',
        'user_id',
        'caption',
        'status',
        'visibility',
        'ai_metadata',
        'sort_order',
        'rejection_reason',
        'approved_at',
        'approved_by',
        'rejected_at',
        'rejected_by',
    ];

    protected $casts = [
        'ai_metadata' => 'array',
        'sort_order'  => 'integer',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'approved_by' => 'integer',
        'rejected_by' => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    /**
     * All physical media files attached to this gallery item.
     */
    public function media(): HasMany
    {
        return $this->hasMany(GalleryMedia::class)->orderBy('sort_order');
    }

    public function primaryMedia(): HasMany
    {
        return $this->hasMany(GalleryMedia::class)
                    ->orderBy('sort_order')
                    ->limit(1);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', 'approved');
    }

    public function scopePublic(Builder $query): Builder
    {
        return $query->where('visibility', 'public');
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * Return the file_path of the first media file, or null.
     */
    public function getCoverAttribute(): ?string
    {
        return $this->media->first()?->file_path;
    }

    /**
     * Face-recognition matches stored in ai_metadata.
     *
     * @return array<array{user_id: int, similarity: float}>
     */
    public function getFaceMatchesAttribute(): array
    {
        return $this->ai_metadata['matches'] ?? [];
    }

    public function firstImagePath(): ?string
    {
        return $this->media()
            ->where('resource_type', 'image')
            ->orderBy('sort_order')
            ->value('file_path');
    }

    public function markAiQueued(): bool
    {
        $meta = $this->ai_metadata ?? [];
        $meta['status'] = 'queued';

        return $this->update(['ai_metadata' => $meta]);
    }

    public function markAiDone(array $results = []): bool
    {
        $meta = $this->ai_metadata ?? [];
        $meta['status'] = 'done';
        $meta = array_merge($meta, $results);

        return $this->update(['ai_metadata' => $meta]);
    }

    public function markAiError(string $message): bool
    {
        $meta = $this->ai_metadata ?? [];
        $meta['status'] = 'error';
        $meta['error'] = $message;
        $meta['analyzed_at'] = now()->toIso8601String();

        return $this->update(['ai_metadata' => $meta]);
    }
}
