<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        // Identity 
        'first_name',
        'last_name',
        'middle_name',
        'student_no',
        'email',

        // Photo
        'photo',
        'photo_public_id',

        // Personal 
        'birthday',
        'hometown',
        'nickname',

        // Academic 
        'course',
        'graduation_year',
        'honors',
        'organizations',
        'achievements',

        // Yearbook content
        'motto',
        'student_quote',
        'fondest_memory',
        'ambition',
        'future_plans',
        'message_to_batchmates',
        'message_to_parents',
        'most_likely_to',

        // Social links
        'facebook_url',
        'instagram_url',
        'linkedin_url',
        'github_url',

        //Relations 
        'section_id',
        'batch_id',
    ];

    protected $appends = ['photo_url'];

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo ?: null;
    }
    // Relationships 

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }

    /**
     * The registered user account linked to this student record.
     */
    public function userAccount(): HasOne
    {
        return $this->hasOne(User::class, 'student_record_id');
    }

    // Helpers 

    /**
     * Whether a user has registered and linked to this student record.
     */
    public function hasRegistered(): bool
    {
        return $this->userAccount()->exists();
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(\App\Models\User::class, 'student_record_id', 'id');
    }
}