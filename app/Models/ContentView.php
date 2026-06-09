<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentView extends Model
{
    protected $fillable = [
        'content_type',
        'content_id',
        'viewer_user_id',
        'viewer_ip',
        'title',
        'category',
        'url',
    ];
}
