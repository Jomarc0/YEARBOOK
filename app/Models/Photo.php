<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Photo extends Model
{
    protected $fillable = [
        'album_id',
        'user_id',
        'file_path',
        'public_id',
        'caption',
        'ai_metadata',
        'visibility',
        'is_profile_post',
    ];

    protected $casts = [
        'ai_metadata'     => 'array',
        'is_profile_post' => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

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

    // FIXED: now that photo_id exists in tagged_photos this works correctly
    public function taggedStudents(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tagged_photos', 'photo_id', 'user_id')
                    ->withPivot(['similarity', 'confidence', 'source', 'tagged_by'])
                    ->withTimestamps();
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