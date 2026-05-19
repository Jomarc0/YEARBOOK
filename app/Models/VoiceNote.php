<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class VoiceNote extends Model
{
    protected $fillable = [
        'user_id','title','audio_url',
        'cloudinary_public_id','duration_seconds'
    ];
    public function user() { return $this->belongsTo(User::class); }
}