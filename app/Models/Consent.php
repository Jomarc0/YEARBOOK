<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Consent extends Model
{
    protected $fillable = [
        'user_id','type','version',
        'accepted','ip_address','user_agent','accepted_at'
    ];
    protected $casts = [
        'accepted'    => 'boolean',
        'accepted_at' => 'datetime',
    ];
    public function user() { return $this->belongsTo(User::class); }
}