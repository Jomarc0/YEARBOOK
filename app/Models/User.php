<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Scout\Searchable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, Searchable;

    protected $fillable = [
        'name','email','password','student_id',
        'profile_picture','course','bio',
        'fcm_token','is_premium','email_verified',
        'profile_visibility','motto','graduation_year',
        'batch','consent_accepted','google_id','avatar','profile_views',
    ];

    protected $hidden = ['password','remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_premium'        => 'boolean',
            'email_verified'    => 'boolean',
            'consent_accepted'  => 'boolean',
        ];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function consents(): HasMany
    {
        return $this->hasMany(Consent::class);
    }

    public function voiceNotes(): HasMany
    {
        return $this->hasMany(VoiceNote::class);
    }

    public function profileViews(): HasMany
    {
        return $this->hasMany(ProfileView::class, 'viewed_user_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(AlumniActivity::class);
    }

    public function subscription()
    {
        return $this->hasOne(Subscription::class)->latestOfMany();
    }

    public function isPremium(): bool
    {
        return $this->subscription?->isActive() ?? false;
    }

    public function toSearchableArray(): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'student_id'      => $this->student_id,
            'course'          => $this->course,
            'bio'             => $this->bio,
            'email'           => $this->email,
            'graduation_year' => $this->graduation_year,
            'batch'           => $this->batch,
        ];
    }

    public function shouldBeSearchable(): bool
    {
        return false; // set to true when Meilisearch is running
    }
}