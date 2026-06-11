<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaggedPhoto extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'photo_id',
        'graduation_photo_id', 
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

    // Relationships 

    public function photo(): BelongsTo
    {
        return $this->belongsTo(Photo::class);
    }

    public function graduationPhoto(): BelongsTo
    {
        return $this->belongsTo(GraduationPhoto::class, 'graduation_photo_id');
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

    // Accessors 
    public function getPhotoUrlAttribute(): string
    {
        if ($this->photo_path && str_starts_with($this->photo_path, 'http')) {
            return $this->photo_path;
        }

        return $this->photo_path
            ? asset('storage/' . $this->photo_path)
            : '';
    }

    // copes 
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