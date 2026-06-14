<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PostMedia extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'photo_id', 'file_path', 'public_id',
        'resource_type', 'bytes', 'width', 'height', 'sort_order',
        'is_reported',
    ];

    public function photo(): BelongsTo
    {
        return $this->belongsTo(Photo::class);
    }
}
