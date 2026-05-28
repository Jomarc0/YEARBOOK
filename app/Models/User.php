<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Scout\Searchable;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, Searchable;

    protected $fillable = [
        'first_name', 'last_name', 'name',
        'email', 'password',
        'role', 'student_id',
        'course', 'batch', 'graduation_year', 'section_id', 'batch_id',  // ← added batch_id
        'bio', 'avatar', 'profile_picture',
        'motto', 'profile_visibility', 'profile_views',
        'email_verified', 'consent_accepted',
        'google_id', 'google_token',
    ];

    protected $hidden = ['password', 'remember_token', 'google_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'email_verified'    => 'boolean',
            'consent_accepted'  => 'boolean',
            'profile_views'     => 'integer',
            'graduation_year'   => 'integer',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────────

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    /** The graduation batch this student belongs to. */
    public function batchRecord(): BelongsTo
    {
        return $this->belongsTo(Batch::class, 'batch_id');
    }

    public function consents(): HasMany
    {
        return $this->hasMany(Consent::class);
    }

    /** All subscriptions (active and historical). */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /** Convenience: the current active, non-expired subscription. */
    public function activeSubscription()
    {
        return $this->subscriptions()
            ->where('status', 'active')
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->latest()
            ->first();
    }

    /** Photos uploaded by this user. */
    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class);
    }

    /** Tagged photos where this user is tagged. */
    public function taggedPhotos(): HasMany
    {
        return $this->hasMany(TaggedPhoto::class);
    }

    // ── Accessors ──────────────────────────────────────────────────────────

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /** True if user has an active premium subscription. */
    public function getIsPremiumAttribute(): bool
    {
        $sub = $this->activeSubscription();
        return $sub !== null && $sub->plan === 'premium';
    }

    public function isSsoUser(): bool
    {
        return ! is_null($this->google_id);
    }
    
    public function careerProfile(): HasOne
    {
        return $this->hasOne(CareerProfile::class);
    }

    // ── Meilisearch ────────────────────────────────────────────────────────

    public function searchableAs(): string { return 'users'; }

    public function toSearchableArray(): array
    {
        $shortMap = [
            'Bachelor of Science in Computer Science'       => 'BSCS',
            'Bachelor of Science in Information Technology' => 'BSIT',
            'Bachelor of Science in Civil Engineering'      => 'BSCE',
            'Bachelor of Science in Mechanical Engineering' => 'BSME',
            'Bachelor of Science in Nursing'                => 'Nursing',
            'Bachelor of Science in Accountancy'            => 'Accountancy',
            'Bachelor of Science in Psychology'             => 'Psychology',
            'Bachelor of Education'                         => 'Education',
        ];

        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'student_id'      => $this->student_id,
            'email'           => $this->email,
            'course'          => $this->course,
            'course_short'    => $shortMap[$this->course] ?? $this->course,
            'section'         => $this->section?->name,
            'batch'           => $this->batch,
            'batch_id'        => $this->batch_id,                                                          // ← added
            'department'      => \App\Services\Student\BatchService::getDepartment($this->course ?? ''),   // ← added
            'graduation_year' => $this->graduation_year,
            'profile_picture' => $this->profile_picture,
            'avatar'          => $this->avatar,
            'role'            => $this->role ?? 'student',
            'created_at'      => $this->created_at?->timestamp,
        ];
    }

    public function shouldBeSearchable(): bool { return $this->role === 'student'; }
}