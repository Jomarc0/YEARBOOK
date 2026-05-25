<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * YearbookBookmark
 * app/Models/YearbookBookmark.php
 *
 * Stores a user's bookmarked yearbook page.
 */
class YearbookBookmark extends Model
{
    protected $fillable = [
        'user_id',
        'batch_id',
        'page_index',
        'label',
    ];

    protected $casts = [
        'page_index' => 'integer',
        'batch_id'   => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}