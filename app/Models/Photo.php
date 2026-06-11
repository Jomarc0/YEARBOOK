<?php

namespace App\Models;

use App\Contracts\AnalyzablePhoto;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Photo extends Model implements AnalyzablePhoto
{
    use SoftDeletes;

    protected $fillable = [
        'album_id', 'user_id', 'file_path', 'public_id',
        'caption', 'ai_metadata', 'visibility', 'is_profile_post',
        'status', 'rejection_reason',
        'approved_at', 'approved_by',
        'rejected_at', 'rejected_by',
    ];

    protected $casts = [
        'ai_metadata'     => 'array',
        'is_profile_post' => 'boolean',
    ];

    // Relationships

    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function taggedPhotos(): HasMany
    {
        return $this->hasMany(TaggedPhoto::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(PostMedia::class)->orderBy('sort_order');
    }

    public function taggedStudents(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tagged_photos', 'photo_id', 'user_id')
                    ->wherePivot('status', 'approved')
                    ->withPivot(['similarity', 'confidence', 'source', 'tagged_by', 'status'])
                    ->withTimestamps();
    }

    // ── AI Helpers ─────────────────────────────────────────────────────────

    public function markAiQueued(): bool
    {
        $meta           = $this->ai_metadata ?? [];
        $meta['status'] = 'queued';

        return $this->update(['ai_metadata' => $meta]);
    }

    public function markAiDone(array $results = []): bool
    {
        $meta           = $this->ai_metadata ?? [];
        $meta['status'] = 'done';
        $meta           = array_merge($meta, $results);

        return $this->update(['ai_metadata' => $meta]);
    }

    public function markAiError(string $message): bool
    {
        $meta                = $this->ai_metadata ?? [];
        $meta['status']      = 'error';
        $meta['error']       = $message;
        $meta['analyzed_at'] = now()->toIso8601String();

        return $this->update(['ai_metadata' => $meta]);
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeProfilePosts($query)
    {
        return $query->where('is_profile_post', true);
    }

    public function scopePublicVisible($query)
    {
        return $query->where('visibility', 'public');
    }
}