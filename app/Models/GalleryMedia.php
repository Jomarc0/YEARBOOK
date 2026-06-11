<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class GalleryMedia extends Model
{
    use HasFactory;

    protected $table = 'gallery_media';

    protected $fillable = [
        'gallery_id',
        'file_path',
        'public_id',
        'resource_type',
        'bytes',
        'width',
        'height',
        'sort_order',
    ];

    protected $casts = [
        'bytes'      => 'integer',
        'width'      => 'integer',
        'height'     => 'integer',
        'sort_order' => 'integer',
    ];

    // Relationships

    public function gallery(): BelongsTo
    {
        return $this->belongsTo(Gallery::class);
    }

    // Helpers 

    public function isImage(): bool
    {
        return $this->resource_type === 'image';
    }

    public function isVideo(): bool
    {
        return $this->resource_type === 'video';
    }

    /**
     * Human-readable file size (e.g. "2.4 MB").
     */
    public function getHumanSizeAttribute(): string
    {
        $bytes = $this->bytes;
        foreach (['B', 'KB', 'MB', 'GB'] as $unit) {
            if ($bytes < 1024) {
                return round($bytes, 1) . ' ' . $unit;
            }
            $bytes /= 1024;
        }
        return round($bytes, 1) . ' TB';
    }
}