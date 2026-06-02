<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds moderation columns to photos and post_media tables.
 * VoiceNote and TaggedPhoto already have status columns — no migration needed for them.
 *
 * Run: php artisan migrate
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── photos ────────────────────────────────────────────────────────────
        Schema::table('photos', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected'])
                  ->default('pending')
                  ->after('caption');
            $table->string('rejection_reason')->nullable()->after('status');
            $table->timestamp('approved_at')->nullable()->after('rejection_reason');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete()->after('approved_at');
            $table->timestamp('rejected_at')->nullable()->after('approved_by');
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete()->after('rejected_at');
        });

        // ── post_media ────────────────────────────────────────────────────────
        Schema::table('post_media', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected'])
                  ->default('pending')
                  ->after('resource_type');
            $table->string('rejection_reason')->nullable()->after('status');
            $table->timestamp('approved_at')->nullable()->after('rejection_reason');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete()->after('approved_at');
            $table->timestamp('rejected_at')->nullable()->after('approved_by');
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete()->after('rejected_at');
        });
    }

    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropForeign(['rejected_by']);
            $table->dropColumn(['status', 'rejection_reason', 'approved_at', 'approved_by', 'rejected_at', 'rejected_by']);
        });

        Schema::table('post_media', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropForeign(['rejected_by']);
            $table->dropColumn(['status', 'rejection_reason', 'approved_at', 'approved_by', 'rejected_at', 'rejected_by']);
        });
    }
};