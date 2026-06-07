<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();

                $table->string('first_name');
                $table->string('last_name');
                $table->string('name');
                $table->string('email')->unique();
                $table->string('password');
                $table->string('role')->default('student');
                $table->string('student_id')->nullable()->unique();

                $table->string('course')->nullable();
                $table->string('batch')->nullable();
                $table->integer('graduation_year')->nullable();
                $table->unsignedBigInteger('section_id')->nullable();

                $table->text('bio')->nullable();
                $table->string('avatar')->nullable();
                $table->string('profile_picture')->nullable();
                $table->string('motto')->nullable();
                $table->string('profile_visibility')->default('public');
                $table->unsignedInteger('profile_views')->default(0);

                $table->boolean('email_verified')->default(false);
                $table->timestamp('email_verified_at')->nullable();
                $table->boolean('consent_accepted')->default(false);
                $table->rememberToken();

                $table->string('google_id')->nullable()->unique();
                $table->text('google_token')->nullable();

                $table->timestamps();
            });
        }

        if (! Schema::hasTable('password_reset_tokens')) {
            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        }

        if (! Schema::hasTable('sessions')) {
            Schema::create('sessions', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->foreignId('user_id')->nullable()->index();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->longText('payload');
                $table->integer('last_activity')->index();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
