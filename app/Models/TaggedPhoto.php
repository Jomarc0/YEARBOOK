<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaggedPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'photo_id',
        'user_id',
        'uploaded_by',
        'photo_path',
        'caption',
        'similarity',
        'confidence',
        'tagged_by',
        'source',
        'status',
    ];

    protected $casts = [
        'similarity' => 'float',
        'confidence' => 'float',
    ];

    // ── Relationships ─────────────────────────────────────────────────────

    public function photo(): BelongsTo
    {
        return $this->belongsTo(Photo::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function tagger(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tagged_by');
    }

    // ── Accessors ─────────────────────────────────────────────────────────

    public function getPhotoUrlAttribute(): string
    {
        // Use Cloudinary URL if photo_path looks like a full URL,
        // otherwise build a storage URL
        if ($this->photo_path && str_starts_with($this->photo_path, 'http')) {
            return $this->photo_path;
        }

        return $this->photo_path
            ? asset('storage/' . $this->photo_path)
            : '';
    }

    // ── Scopes ────────────────────────────────────────────────────────────

    public function scopeAuto($query)
    {
        return $query->where('source', 'rekognition');
    }

    public function scopeManual($query)
    {
        return $query->where('source', 'manual');
    }

    public function scopeAboveThreshold($query, float $threshold = 80.0)
    {
        return $query->where('similarity', '>=', $threshold);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
}