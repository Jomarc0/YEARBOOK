<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use SoftDeletes;

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
