<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Faculty extends Model
{
    use SoftDeletes;

    protected $table = 'faculties';

    protected $fillable = [
        'name',
        'title',
        'department',
        'bio',
        'image',
        'email',
    ];
}