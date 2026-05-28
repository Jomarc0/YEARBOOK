<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostMedia extends Model
{
    protected $fillable = [
        'photo_id', 'file_path', 'public_id',
        'resource_type', 'bytes', 'width', 'height', 'sort_order',
    ];

    public function photo(): BelongsTo
    {
        return $this->belongsTo(Photo::class);
    }
}