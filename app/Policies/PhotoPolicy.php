<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Photo;
use App\Models\User;

class PhotoPolicy
{
    /**
     * Admins can delete any photo.
     * Users can delete photos they uploaded (user_id match).
     * Users can delete photos in albums they own (handles legacy photos with null user_id).
     */
    public function delete(User $user, Photo $photo): bool
    {
        // Admins can delete anything
        if ($user->role === 'admin') {
            return true;
        }

        // Photo was directly uploaded by this user
        if ($photo->user_id !== null && $photo->user_id === $user->id) {
            return true;
        }

        // Fallback: photo belongs to an album owned by this user
        // (covers legacy photos where user_id was not stamped)
        if ($photo->album && $photo->album->user_id === $user->id) {
            return true;
        }

        return false;
    }
}