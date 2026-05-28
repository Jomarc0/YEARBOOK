<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProfileView extends Model
{
    protected $fillable = [
        'viewed_user_id',
        'viewer_user_id',
        'viewer_ip',
    ];

    public function viewedUser()
    {
        return $this->belongsTo(User::class, 'viewed_user_id');
    }

    public function viewerUser()
    {
        return $this->belongsTo(User::class, 'viewer_user_id');
    }
}