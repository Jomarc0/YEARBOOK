<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'plan',
        'tier',
        'status',
        'paymongo_payment_intent_id',
        'amount_paid',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    // =========================================================================
    // RELATIONSHIPS
    // =========================================================================

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // =========================================================================
    // YOUR EXISTING METHODS (unchanged)
    // =========================================================================

    public function isActive(): bool
    {
        return $this->status === 'active'
            && ($this->expires_at === null || $this->expires_at->isFuture());
    }

    public function isPremium(): bool
    {
        return $this->isActive() && $this->tier === 'premium';
    }

    public function isStandard(): bool
    {
        return $this->isActive() && in_array($this->tier, ['standard', 'premium']);
    }

    // =========================================================================
    // ADDED: Cloudinary storage tier resolution
    // =========================================================================

    /**
     * Resolves which config key in config/cloudinary.php tiers[] this
     * subscription maps to.
     *
     * plan=free,    tier=standard → 'free'
     * plan=premium, tier=standard → 'premium_standard'
     * plan=premium, tier=premium  → 'premium'
     *
     * @return string 'free' | 'premium_standard' | 'premium'
     */
    public function getStorageTierKeyAttribute(): string
    {
        if (! $this->isActive()) {
            return 'free';
        }

        return match (true) {
            $this->tier === 'premium'  => 'premium',
            $this->tier === 'standard' => 'premium_standard',
            default                    => 'free',
        };
    }

    /**
     * Human-readable label for the storage tier.
     * Use this in API responses or UI display.
     *
     * @return string 'Free' | 'Premium Standard' | 'Premium HD'
     */
    public function getStorageTierLabelAttribute(): string
    {
        return match ($this->storage_tier_key) {
            'premium'          => 'Premium HD',
            'premium_standard' => 'Premium Standard',
            default            => 'Free',
        };
    }

    /**
     * Storage limit in bytes for this subscription's tier.
     * Reads from config/cloudinary.php — no hardcoded values.
     *
     * @return int
     */
    public function getStorageLimitBytesAttribute(): int
    {
        return (int) config(
            "cloudinary.tiers.{$this->storage_tier_key}.storage_limit_bytes",
            500 * 1024 * 1024  // fallback: 500 MB
        );
    }

    /**
     * Whether HD uploads are allowed for this tier.
     *
     * @return bool
     */
    public function getHdEnabledAttribute(): bool
    {
        return (bool) config(
            "cloudinary.tiers.{$this->storage_tier_key}.hd_enabled",
            false
        );
    }

    /**
     * Max number of files allowed per bulk upload request.
     *
     * @return int
     */
    public function getBulkUploadLimitAttribute(): int
    {
        return (int) config(
            "cloudinary.tiers.{$this->storage_tier_key}.bulk_upload_limit",
            5
        );
    }
}
