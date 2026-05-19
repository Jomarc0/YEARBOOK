<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transcript extends Model
{
    protected $fillable = [
        'title', 'audio_path', 'transcript_text',
        'segments', 'language', 'status', 'uploaded_by',
    ];
    protected $casts = ['segments' => 'array'];

    public function uploader() { return $this->belongsTo(User::class, 'uploaded_by'); }
}