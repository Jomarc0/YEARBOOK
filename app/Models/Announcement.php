<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'title','body','type',
        'send_push','created_by','scheduled_at'
    ];
    protected $casts = [
        'send_push'    => 'boolean',
        'scheduled_at' => 'datetime',
    ];
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}