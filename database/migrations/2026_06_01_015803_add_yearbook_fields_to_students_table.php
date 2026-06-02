<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'photo'))                $table->string('photo')->nullable();
            if (!Schema::hasColumn('students', 'photo_public_id'))      $table->string('photo_public_id')->nullable();
            if (!Schema::hasColumn('students', 'birthday'))             $table->date('birthday')->nullable();
            if (!Schema::hasColumn('students', 'hometown'))             $table->string('hometown')->nullable();
            if (!Schema::hasColumn('students', 'nickname'))             $table->string('nickname')->nullable();
            if (!Schema::hasColumn('students', 'course'))               $table->string('course')->nullable();
            if (!Schema::hasColumn('students', 'graduation_year'))      $table->unsignedSmallInteger('graduation_year')->nullable();
            if (!Schema::hasColumn('students', 'honors'))               $table->string('honors')->nullable();
            if (!Schema::hasColumn('students', 'organizations'))        $table->text('organizations')->nullable();
            if (!Schema::hasColumn('students', 'motto'))                $table->string('motto', 500)->nullable();
            if (!Schema::hasColumn('students', 'student_quote'))        $table->string('student_quote', 500)->nullable();
            if (!Schema::hasColumn('students', 'fondest_memory'))       $table->text('fondest_memory')->nullable();
            if (!Schema::hasColumn('students', 'ambition'))             $table->string('ambition', 255)->nullable();
            if (!Schema::hasColumn('students', 'future_plans'))         $table->text('future_plans')->nullable();
            if (!Schema::hasColumn('students', 'message_to_batchmates'))$table->text('message_to_batchmates')->nullable();
            if (!Schema::hasColumn('students', 'message_to_parents'))   $table->text('message_to_parents')->nullable();
            if (!Schema::hasColumn('students', 'most_likely_to'))       $table->string('most_likely_to', 255)->nullable();
            if (!Schema::hasColumn('students', 'achievements'))         $table->text('achievements')->nullable();
            if (!Schema::hasColumn('students', 'facebook_url'))         $table->string('facebook_url')->nullable();
            if (!Schema::hasColumn('students', 'instagram_url'))        $table->string('instagram_url')->nullable();
            if (!Schema::hasColumn('students', 'linkedin_url'))         $table->string('linkedin_url')->nullable();
            if (!Schema::hasColumn('students', 'github_url'))           $table->string('github_url')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'photo', 'photo_public_id', 'birthday', 'hometown', 'nickname',
                'course', 'graduation_year', 'organizations', 'motto', 'student_quote',
                'fondest_memory', 'ambition', 'future_plans', 'message_to_batchmates',
                'message_to_parents', 'most_likely_to', 'achievements',
                'facebook_url', 'instagram_url', 'linkedin_url', 'github_url',
            ]);
        });
    }
};