<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Photo extends Model
{
    protected $fillable = ['album_id', 'file_path', 'caption', 'ai_metadata'];

    // Metadata should be handled as an array/json
    protected $casts = [
        'ai_metadata' => 'array',
    ];

    // Relasyon: Ang photo ay pag-aari ng isang album
    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
    }
}
