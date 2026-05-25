<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Section extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'course',
        'batch_year',
        'batch_id',       
        'adviser_id',
        'description',
    ];

    // ── Relationships ──────────────────────────────────────────────────────

    /** Students enrolled in this section. */
    public function students(): HasMany
    {
        return $this->hasMany(User::class, 'section_id');
    }

    /** Alias for withCount('users'). */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'section_id');
    }

    /** Faculty adviser for this section. */
    public function adviser(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'adviser_id');
    }

    /** The graduation batch this section belongs to. */
    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }
}