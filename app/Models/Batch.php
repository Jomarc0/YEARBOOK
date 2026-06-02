<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Batch extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'course',
        'course_code',
        'graduation_year',
        'department',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'graduation_year' => 'integer',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────────

    /** Sections that belong to this batch. */
    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    // In app/Models/Batch.php — fix students() relationship
    public function students(): HasMany
    {
        return $this->hasMany(Student::class);  // ← was User::class
    }

    // ── Accessors ─────────────────────────────────────────────────────────

    /**
     * `$batch->year` shorthand used by AlumniTrackerController
     * and YearbookController throughout the app.
     */
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