<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $redundantColumns = [
        'student_id',
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

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'student_record_id')) {
                $table->unsignedBigInteger('student_record_id')
                    ->nullable()
                    ->after('id')
                    ->comment('FK to students.id; null means browse/unlinked account');

                $table->foreign('student_record_id')
                    ->references('id')
                    ->on('students')
                    ->nullOnDelete();
            }
        });

        if (Schema::hasColumn('users', 'student_id')) {
            if (DB::getDriverName() === 'mysql') {
                DB::statement("
                    UPDATE users u
                    INNER JOIN students s
                        ON  LOWER(TRIM(s.student_no)) = LOWER(TRIM(u.student_id))
                        AND LOWER(TRIM(s.first_name)) = LOWER(TRIM(u.first_name))
                        AND LOWER(TRIM(s.last_name)) = LOWER(TRIM(u.last_name))
                    SET u.student_record_id = s.id
                    WHERE u.student_id IS NOT NULL
                      AND u.deleted_at IS NULL
                ");
            } elseif (DB::getDriverName() === 'pgsql') {
                DB::statement("
                    UPDATE users
                    SET student_record_id = students.id
                    FROM students
                    WHERE LOWER(TRIM(students.student_no)) = LOWER(TRIM(users.student_id))
                      AND LOWER(TRIM(students.first_name)) = LOWER(TRIM(users.first_name))
                      AND LOWER(TRIM(students.last_name)) = LOWER(TRIM(users.last_name))
                      AND users.student_id IS NOT NULL
                      AND users.deleted_at IS NULL
                ");
            }
        }

        // Keep legacy user columns because current registration/profile code still reads them.
        // Dropping them also breaks fresh SQLite migrations when indexed columns are removed.
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'student_record_id')) {
                $table->dropForeign(['student_record_id']);
                $table->dropColumn('student_record_id');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'student_id')) {
                $table->string('student_id')->nullable()->after('role');
            }
            if (! Schema::hasColumn('users', 'course')) {
                $table->string('course')->nullable();
            }
            if (! Schema::hasColumn('users', 'batch')) {
                $table->string('batch')->nullable();
            }
            if (! Schema::hasColumn('users', 'graduation_year')) {
                $table->integer('graduation_year')->nullable();
            }
            if (! Schema::hasColumn('users', 'nickname')) {
                $table->string('nickname')->nullable();
            }
            if (! Schema::hasColumn('users', 'birthday')) {
                $table->date('birthday')->nullable();
            }
            if (! Schema::hasColumn('users', 'hometown')) {
                $table->string('hometown')->nullable();
            }
            if (! Schema::hasColumn('users', 'honors')) {
                $table->string('honors')->nullable();
            }
            if (! Schema::hasColumn('users', 'organizations')) {
                $table->text('organizations')->nullable();
            }
            if (! Schema::hasColumn('users', 'achievements')) {
                $table->text('achievements')->nullable();
            }
            if (! Schema::hasColumn('users', 'ambition')) {
                $table->text('ambition')->nullable();
            }
            if (! Schema::hasColumn('users', 'future_plans')) {
                $table->text('future_plans')->nullable();
            }
            if (! Schema::hasColumn('users', 'fondest_memory')) {
                $table->text('fondest_memory')->nullable();
            }
            if (! Schema::hasColumn('users', 'most_likely_to')) {
                $table->text('most_likely_to')->nullable();
            }
            if (! Schema::hasColumn('users', 'message_to_batchmates')) {
                $table->text('message_to_batchmates')->nullable();
            }
            if (! Schema::hasColumn('users', 'message_to_parents')) {
                $table->text('message_to_parents')->nullable();
            }
            if (! Schema::hasColumn('users', 'motto')) {
                $table->string('motto')->nullable();
            }
            if (! Schema::hasColumn('users', 'profile_picture')) {
                $table->string('profile_picture')->nullable();
            }
            if (! Schema::hasColumn('users', 'profile_picture_public_id')) {
                $table->string('profile_picture_public_id')->nullable();
            }
            if (! Schema::hasColumn('users', 'facebook_url')) {
                $table->string('facebook_url')->nullable();
            }
            if (! Schema::hasColumn('users', 'instagram_url')) {
                $table->string('instagram_url')->nullable();
            }
            if (! Schema::hasColumn('users', 'linkedin_url')) {
                $table->string('linkedin_url')->nullable();
            }
            if (! Schema::hasColumn('users', 'github_url')) {
                $table->string('github_url')->nullable();
            }
        });
    }
};
