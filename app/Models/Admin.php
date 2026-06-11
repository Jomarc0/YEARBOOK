<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasFactory, HasApiTokens;

    // Role constants 
    const ROLE_ADMIN       = 'admin';
    const ROLE_SUPER_ADMIN = 'super_admin';

    protected $fillable = [
        'name',
        'username',
        'password',
        'role',
        'is_active',
        'created_by',
        'last_login_at',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'is_active'     => 'boolean',
        'password'      => 'hashed',
        'last_login_at' => 'datetime',
    ];

    // Role helpers 

    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    // Query scopes

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSuperAdmins($query)
    {
        return $query->where('role', self::ROLE_SUPER_ADMIN);
    }

    public function scopeRegularAdmins($query)
    {
        return $query->where('role', self::ROLE_ADMIN);
    }

    // Relationships 

    /** The super admin who created this account */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }

    /** All admin accounts created by this super admin */
    public function createdAdmins(): HasMany
    {
        return $this->hasMany(Admin::class, 'created_by');
    }
}