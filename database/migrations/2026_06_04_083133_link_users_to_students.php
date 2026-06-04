<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // ── Columns to remove from users (all now owned by students table) ────────
    private array $redundantColumns = [
        'student_id',               // string version — replaced by student_record_id FK
        'course',
        'batch',
        'graduation_year',
        'nickname',
        'birthday',
        'hometown',
        'honors',
        'organizations',
        'achievements',
        'ambition',
        'future_plans',
        'fondest_memory',
        'most_likely_to',
        'message_to_batchmates',
        'message_to_parents',
        'motto',
        'profile_picture',
        'profile_picture_public_id',
        'facebook_url',
        'instagram_url',
        'linkedin_url',
        'github_url',
    ];

    // ─────────────────────────────────────────────────────────────────────────

    public function up(): void
    {
        // ── STEP 1: Add the new FK column ─────────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('student_record_id')
                  ->nullable()
                  ->after('id')
                  ->comment('FK → students.id — null means browse/unlinked account');

            $table->foreign('student_record_id')
                  ->references('id')
                  ->on('students')
                  ->nullOnDelete();
        });

        // ── STEP 2: Backfill student_record_id from the old string student_id ─
        // Matches on student_no + first_name + last_name (same logic as register)
        DB::statement("
            UPDATE users u
            INNER JOIN students s
                ON  LOWER(TRIM(s.student_no))  = LOWER(TRIM(u.student_id))
                AND LOWER(TRIM(s.first_name))  = LOWER(TRIM(u.first_name))
                AND LOWER(TRIM(s.last_name))   = LOWER(TRIM(u.last_name))
            SET u.student_record_id = s.id
            WHERE u.student_id IS NOT NULL
              AND u.deleted_at IS NULL
        ");

        // ── STEP 3: Drop redundant columns ────────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            // Only drop columns that actually exist (safe for partial migrations)
            $existing = array_filter(
                $this->redundantColumns,
                fn($col) => Schema::hasColumn('users', $col)
            );

            if (! empty($existing)) {
                $table->dropColumn(array_values($existing));
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────────────

    public function down(): void
    {
        // ── Remove FK + column ────────────────────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['student_record_id']);
            $table->dropColumn('student_record_id');
        });

        // ── Restore dropped columns ───────────────────────────────────────────
        // NOTE: Data is NOT restored — this only restores the schema.
        // Restore from a DB backup if you need the data back.
        Schema::table('users', function (Blueprint $table) {
            $table->string('student_id')->nullable()->after('role');
            $table->string('course')->nullable();
            $table->string('batch')->nullable();
            $table->integer('graduation_year')->nullable();
            $table->string('nickname')->nullable();
            $table->date('birthday')->nullable();
            $table->string('hometown')->nullable();
            $table->string('honors')->nullable();
            $table->text('organizations')->nullable();
            $table->text('achievements')->nullable();
            $table->text('ambition')->nullable();
            $table->text('future_plans')->nullable();
            $table->text('fondest_memory')->nullable();
            $table->text('most_likely_to')->nullable();
            $table->text('message_to_batchmates')->nullable();
            $table->text('message_to_parents')->nullable();
            $table->string('motto')->nullable();
            $table->string('profile_picture')->nullable();
            $table->string('profile_picture_public_id')->nullable();
            $table->string('facebook_url')->nullable();
            $table->string('instagram_url')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('github_url')->nullable();
        });
    }
};