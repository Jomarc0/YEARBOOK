<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // ── Identity ──────────────────────────────────────────────
            $table->string('first_name');
            $table->string('last_name');
            $table->string('name');                               // auto-concatenated on register
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('student');           // student | admin
            $table->string('student_id')->nullable()->unique();

            // ── Academic ──────────────────────────────────────────────
            $table->string('course')->nullable();
            $table->string('batch')->nullable();
            $table->integer('graduation_year')->nullable();
            $table->foreignId('section_id')->nullable()->constrained()->nullOnDelete();

            // ── Profile ───────────────────────────────────────────────
            $table->text('bio')->nullable();
            $table->string('avatar')->nullable();                 // Google profile photo
            $table->string('profile_picture')->nullable();        // Uploaded yearbook photo
            $table->string('motto')->nullable();
            $table->string('profile_visibility')->default('public'); // public | private
            $table->unsignedInteger('profile_views')->default(0);

            // ── Auth & Verification ───────────────────────────────────
            $table->boolean('email_verified')->default(false);
            $table->timestamp('email_verified_at')->nullable();
            $table->boolean('consent_accepted')->default(false);
            $table->rememberToken();

            // ── Google SSO ────────────────────────────────────────────
            $table->string('google_id')->nullable()->unique();
            $table->string('google_token')->nullable();

            $table->timestamps();
        });

        // ── Supporting tables ─────────────────────────────────────────
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};