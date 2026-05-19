<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'course',
        'batch_year',
        'adviser_id',
        'description',
    ];

    // One section has many students
    public function students()
    {
        return $this->hasMany(User::class, 'section_id');
    }

    // Alias so withCount
    public function users()
    {
        return $this->hasMany(User::class, 'section_id');
    }

    // Section adviser 
    public function adviser()
    {
        return $this->belongsTo(Faculty::class, 'adviser_id');
    }
}