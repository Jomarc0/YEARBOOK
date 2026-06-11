<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Message extends Model
{
    protected $fillable = [
        'sender_id',
        'receiver_id',
        'body',
        'image_path',
        'is_read',
        'read_at',
    ];

    protected $appends = [
        'image_url',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    // Relationships 

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_path) {
            return null;
        }

        if (str_starts_with($this->image_path, 'http://') || str_starts_with($this->image_path, 'https://')) {
            return $this->image_path;
        }

        $baseUrl = rtrim((string) config('filesystems.disks.public.url', url('/storage')), '/');
        $path = ltrim($this->image_path, '/');

        return "{$baseUrl}/{$path}";
    }

    //  Scopes 
    /**
     * Messages in a thread between two users (either direction).
     */
    public function scopeThread(Builder $q, int $userA, int $userB): Builder
    {
        return $q->where(function ($q) use ($userA, $userB) {
            $q->where('sender_id', $userA)->where('receiver_id', $userB);
        })->orWhere(function ($q) use ($userA, $userB) {
            $q->where('sender_id', $userB)->where('receiver_id', $userA);
        });
    }

    /**
     * Unread messages for a given receiver.
     */
    public function scopeUnreadFor(Builder $q, int $receiverId): Builder
    {
        return $q->where('receiver_id', $receiverId)->where('is_read', false);
    }
}
