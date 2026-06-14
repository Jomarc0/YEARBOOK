<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class DownloadLog extends Model
{
    protected $fillable = [
        'actor_type',
        'actor_id',
        'event_type',
        'resource_type',
        'resource_id',
        'filename',
        'ip_address',
        'user_agent',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function actor(): MorphTo
    {
        return $this->morphTo();
    }
}
