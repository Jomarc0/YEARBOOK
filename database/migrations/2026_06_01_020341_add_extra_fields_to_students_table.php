<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
    Schema::table('students', function (Blueprint $table) {
        if (!Schema::hasColumn('students', 'photo'))            $table->string('photo')->nullable();
        if (!Schema::hasColumn('students', 'photo_public_id'))  $table->string('photo_public_id')->nullable();
        if (!Schema::hasColumn('students', 'birthday'))         $table->date('birthday')->nullable();
        if (!Schema::hasColumn('students', 'hometown'))         $table->string('hometown')->nullable();
        if (!Schema::hasColumn('students', 'nickname'))         $table->string('nickname')->nullable();
        if (!Schema::hasColumn('students', 'course'))           $table->string('course')->nullable();
        if (!Schema::hasColumn('students', 'graduation_year'))  $table->unsignedSmallInteger('graduation_year')->nullable();
        if (!Schema::hasColumn('students', 'organizations'))    $table->text('organizations')->nullable();
        if (!Schema::hasColumn('students', 'student_quote'))    $table->string('student_quote', 500)->nullable();
        if (!Schema::hasColumn('students', 'future_plans'))     $table->text('future_plans')->nullable();
        if (!Schema::hasColumn('students', 'achievements'))     $table->text('achievements')->nullable();
        if (!Schema::hasColumn('students', 'facebook_url'))     $table->string('facebook_url')->nullable();
        if (!Schema::hasColumn('students', 'instagram_url'))    $table->string('instagram_url')->nullable();
        if (!Schema::hasColumn('students', 'linkedin_url'))     $table->string('linkedin_url')->nullable();
        if (!Schema::hasColumn('students', 'github_url'))       $table->string('github_url')->nullable();
    });
}

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'photo_public_id', 'birthday', 'hometown', 'nickname',
                'course', 'graduation_year', 'organizations', 'student_quote',
                'future_plans', 'achievements', 'facebook_url', 'instagram_url',
                'linkedin_url', 'github_url',
            ]);
        });
    }
};
