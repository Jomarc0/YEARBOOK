<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Album extends Model
{
    /**
     * Ang mga attributes na pwedeng i-save (Mass Assignment).
     */
    protected $fillable = [
        'title',
        'description',
        'cover_image',
        'event_date',
    ];

    /**
     * Relasyon: Ang isang Album ay may maraming Photos.
     * Ito ang gagamitin natin para i-load ang lahat ng images sa loob ng album.
     */
    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class);
    }

    /**
     * Helper function para makuha ang bilang ng photos sa album.
     * Makakatulong ito sa badge na "124 photos" sa UI mo.
     */
    public function getPhotoCountAttribute()
    {
        return $this->photos()->count();
    }
}
