<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ProfileView extends Model
{
    protected $fillable = ['viewed_user_id','viewer_id','ip_address'];

    public function viewedUser() { return $this->belongsTo(User::class, 'viewed_user_id'); }
    public function viewer()     { return $this->belongsTo(User::class, 'viewer_id'); }
}