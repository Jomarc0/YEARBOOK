<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name', 'last_name', 'middle_name', 'student_no', 'email',
        'photo', 'photo_public_id', 'birthday', 'hometown', 'nickname',
        'course', 'graduation_year', 'honors', 'organizations', 'motto',
        'student_quote', 'fondest_memory', 'ambition', 'future_plans',
        'message_to_batchmates', 'message_to_parents', 'most_likely_to',
        'achievements', 'facebook_url', 'instagram_url', 'linkedin_url',
        'github_url', 'section_id', 'batch_id',
    ];

    protected $appends = ['photo_url'];

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo ?: null;
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }
}