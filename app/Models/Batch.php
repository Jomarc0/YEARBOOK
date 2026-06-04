<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Batch extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'course',
        'course_code',
        'graduation_year',
        'department',
        'description',
        'is_archived',
    ];

    protected function casts(): array
    {
        return [
            'graduation_year' => 'integer',
            'is_archived'     => 'boolean',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────────

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    // ── Accessors ─────────────────────────────────────────────────────────

    public function getYearAttribute(): int
    {
        return $this->graduation_year;
    }

    // ── Scopes ────────────────────────────────────────────────────────────

    public function scopeByYear($query, int $year)
    {
        return $query->where('graduation_year', $year);
    }

    public function scopeByCourse($query, string $course)
    {
        return $query->where('course', $course);
    }

    public function scopeByDepartment($query, string $department)
    {
        return $query->where('department', $department);
    }
}