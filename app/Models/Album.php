<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Album extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'albums';

    protected $fillable = [
        'title',
        'description',
        'type',
        'category',
        'event_date',
        'cover_photo_url',
        'media_url',
        'is_published',
        'sort_order',
        'user_id',
    ];

    protected $casts = [
        'event_date'   => 'date',
        'is_published' => 'boolean',
        'sort_order'   => 'integer',
    ];

    // Relationships

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(Gallery::class)
                    ->where('status', 'approved')
                    ->where('visibility', 'public')
                    ->orderBy('sort_order');
    }

    public function galleries(): HasMany
    {
        return $this->hasMany(Gallery::class)->orderBy('sort_order');
    }

    // Scopes 

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function scopeGeneral(Builder $query): Builder
    {
        return $query->where('type', 'general');
    }

    public function scopeGraduation(Builder $query): Builder
    {
        return $query->where('type', 'graduation');
    }

    public function scopeOfCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }
}